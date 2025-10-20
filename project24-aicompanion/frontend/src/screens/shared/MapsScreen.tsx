import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  SafeAreaView, 
  Alert, 
  TouchableOpacity, 
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  useColorScheme
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../contexts/AuthContext';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import { useRole } from '../../hooks/useRole';
import { mapService } from '../../services/mapService';
import Card from '../../components/ui/Card';
import { colors } from '../../theme';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Type for a location entry from backend
interface UserLocation {
  id?: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Extended interface with address information
interface LocationWithAddress extends UserLocation {
  address?: string;
  isLoadingAddress?: boolean;
}

const MapScreen = () => {
  const { user } = useAuthContext();
  const { user: firebaseUser } = useFirebaseAuth();
  const { currentElderly } = useCurrentElderly();
  const { role } = useRole();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithAddress | null>(null);
  const [showPastLocations, setShowPastLocations] = useState(false);
  const [pastLocationsLoading, setPastLocationsLoading] = useState(false);
  const [pastLocations, setPastLocations] = useState<LocationWithAddress[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const mapRef = useRef<MapView>(null);

  // Determine which user ID to use for location tracking
  const targetUserId = role === 'CAREGIVER' && currentElderly ? currentElderly.firebaseUid : firebaseUser?.uid;

  const LOCATIONS_PER_PAGE = 10;

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ') || 'Unknown location';
      }
      
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  };

  // Function to get address for current location
  const getCurrentAddress = async (coords: Location.LocationObjectCoords) => {
    const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
    setCurrentAddress(address);
  };

  // Function to get address for a location and update it
  const getLocationAddress = async (location: UserLocation): Promise<LocationWithAddress> => {
    const locationWithAddress = location as LocationWithAddress;
    if (locationWithAddress.address) return locationWithAddress;
    
    const address = await getAddressFromCoordinates(location.latitude, location.longitude);
    return { ...location, address };
  };

  // Function to animate map to a specific location
  const animateToLocation = (location: LocationWithAddress) => {
    if (mapRef.current) {
      setSelectedLocation(location);
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000); // 1 second animation
    }
    // Close the past locations modal
    setShowPastLocations(false);
  };

  // Function to clear selected location and return to current location
  const clearSelectedLocation = () => {
    setSelectedLocation(null);
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  };

  // Function to load past locations with pagination and addresses
  const loadPastLocations = async (page: number = 0, append: boolean = false) => {
    if (!targetUserId) return;
    
    try {
      setPastLocationsLoading(true);
      const data = await mapService.getLocations(targetUserId, page, LOCATIONS_PER_PAGE);
      
      // Convert to LocationWithAddress and get addresses
      const locationsWithAddresses: LocationWithAddress[] = await Promise.all(
        data.map(async (location: UserLocation) => {
          const locationWithAddress = await getLocationAddress(location);
          return locationWithAddress;
        })
      );
      
      if (append) {
        setPastLocations(prev => [...prev, ...locationsWithAddresses]);
      } else {
        setPastLocations(locationsWithAddresses);
      }
      
      setHasMoreLocations(data && data.length === LOCATIONS_PER_PAGE);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading past locations:', error);
      Alert.alert('Error', 'Failed to load past locations');
    } finally {
      setPastLocationsLoading(false);
    }
  };

  // Function to open past locations modal
  const openPastLocations = async () => {
    setShowPastLocations(true);
    await loadPastLocations(0, false);
  };

  // Function to load more locations (pagination)
  const loadMoreLocations = async () => {
    if (!pastLocationsLoading && hasMoreLocations) {
      await loadPastLocations(currentPage + 1, true);
    }
  };

  // Fetch current location and send to backend
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access location was denied');
          setLoading(false);
          return;
        }
        
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setCurrentLocation(loc.coords);
        
        // Get address for current location
        await getCurrentAddress(loc.coords);
        
        // Note: Location tracking is now handled at app level by locationTrackingService
        // No need to manually send location here anymore
      } catch (error) {
        Alert.alert('Location Error', 'Failed to get your current location');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, targetUserId]);

  // Center map on current location when it changes
  useEffect(() => {
    if (currentLocation && mapRef.current && !selectedLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [currentLocation, selectedLocation]);

  // Show message if caregiver has no elderly user selected
  if (role === 'CAREGIVER' && !currentElderly) {
    return (
      <SafeAreaView style={[styles.mainLoadingContainer, { backgroundColor: palette.background }]}>
        <View style={styles.noElderlyContainer}>
          <Ionicons name="person-outline" size={48} color={palette.disabled} />
          <Text style={[styles.noElderlyTitle, { color: palette.textPrimary }]}>
            No Elderly User Selected
          </Text>
          <Text style={[styles.noElderlySubtitle, { color: palette.textSecondary }]}>
            Please select an elderly user to view their location
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.mainLoadingContainer, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={[styles.mainLoadingText, { color: palette.textSecondary }]}>
          {role === 'CAREGIVER' && currentElderly ? `Getting ${currentElderly.fullName}'s location...` : 'Getting your location...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation?.latitude || 37.78825,
            longitude: currentLocation?.longitude || -122.4324,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Selected Location"
              description={selectedLocation.address || `Lat: ${selectedLocation.latitude.toFixed(5)}, Lng: ${selectedLocation.longitude.toFixed(5)}`}
              pinColor={palette.primary}
            />
          )}
        </MapView>

        {/* Current location info card */}
        {currentLocation && (
          <View style={[styles.currentLocationCard, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)',
            borderColor: palette.primary,
            borderWidth: 1.5
          }]}>
            <View style={styles.currentLocationHeader}>
              <View style={[styles.currentLocationIcon, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="location" size={18} color={palette.primary} />
              </View>
              <View style={styles.currentLocationContent}>
                <Text style={[styles.currentLocationTitle, { color: palette.textPrimary }]}>
                  {role === 'CAREGIVER' && currentElderly ? `${currentElderly.fullName}'s Location` : 'Current Location'}
                </Text>
                <Text style={[styles.currentLocationAddress, { color: palette.textSecondary }]}>
                  {currentAddress || 'Getting address...'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Floating button to show past locations */}
        <TouchableOpacity
          style={[styles.floatingButton, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)',
            borderColor: palette.primary,
            borderWidth: 1.5,
            shadowColor: palette.primary,
            bottom: 80 // move up to avoid nav bar
          }]}
          onPress={openPastLocations}
          activeOpacity={0.8}
        >
          <View style={[styles.buttonInner, { backgroundColor: 'transparent', borderColor: palette.primary }] }>
            <Ionicons name="time-outline" size={22} color={palette.primary} />
          </View>
        </TouchableOpacity>

        {/* Clear selection button (only show when a location is selected) */}
        {selectedLocation && (
          <TouchableOpacity
            style={[styles.clearButton, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)',
              borderColor: palette.error,
              borderWidth: 1.5,
              shadowColor: palette.error,
              bottom: 80 // move up to avoid nav bar
            }]}
            onPress={clearSelectedLocation}
            activeOpacity={0.8}
          >
            <View style={[styles.buttonInner, { backgroundColor: 'transparent', borderColor: palette.error }] }>
              <Ionicons name="close" size={22} color={palette.error} />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Past Locations Modal */}
      <Modal
        visible={showPastLocations}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPastLocations(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: palette.background }]}>
          <View style={[styles.modalHeader, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)',
            borderBottomColor: palette.primaryLight,
            borderColor: palette.primary,
            borderBottomWidth: 1.5
          }]}>
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIconContainer, { backgroundColor: palette.primaryLight }]}>
                <Ionicons name="time" size={20} color={palette.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  {role === 'CAREGIVER' && currentElderly ? `${currentElderly.fullName}'s Location History` : 'Location History'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  {role === 'CAREGIVER' && currentElderly ? `${currentElderly.fullName}'s recent locations` : 'Your recent locations'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: palette.primaryLight }]}
              onPress={() => setShowPastLocations(false)}
            >
              <Ionicons name="close" size={20} color={palette.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={pastLocations}
            keyExtractor={(item, index) => item.id || index.toString()}
            style={[styles.listContainer, isTablet && styles.tabletListContainer]}
            renderItem={({ item }) => (
              <Card style={[
                styles.locationCard,
                selectedLocation?.id === item.id
                  ? { backgroundColor: palette.primary, borderColor: palette.primary }
                  : { backgroundColor: palette.cardHighlight, borderColor: palette.border }
              ]}>
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => animateToLocation(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.locationHeader}>
                    <View style={[styles.locationIcon, { 
                      backgroundColor: selectedLocation?.id === item.id ? palette.surface : palette.primaryLight
                    }]}> 
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color={selectedLocation?.id === item.id ? palette.surface : palette.primary} 
                      />
                    </View>
                    <View style={styles.locationContent}>
                      <Text style={[styles.locationText, { 
                        color: selectedLocation?.id === item.id ? palette.surface : palette.textPrimary
                      }]}> 
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                      <View style={styles.locationAddressContainer}>
                        <Ionicons 
                          name="location-outline" 
                          size={14} 
                          color={selectedLocation?.id === item.id ? palette.surface : palette.primary} 
                        />
                        <Text style={[styles.locationAddress, { 
                          color: selectedLocation?.id === item.id ? palette.surface : palette.textSecondary
                        }]}> 
                          {item.address || 'Getting address...'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            )}
            onEndReached={loadMoreLocations}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              pastLocationsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={palette.primary} />
                  <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading more...</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              !pastLocationsLoading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={palette.disabled} />
                  <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No past locations found</Text>
                  <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>Your location history will appear here</Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLoadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: { 
    flex: 1 
  },
  currentLocationCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  currentLocationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentLocationAddress: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  clearButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  tabletListContainer: {
    paddingHorizontal: 64,
  },
  locationCard: {
    marginBottom: 12,
  },
  locationItem: {
    padding: 8,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  locationAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationAddress: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  noElderlyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noElderlyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noElderlySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MapScreen; 