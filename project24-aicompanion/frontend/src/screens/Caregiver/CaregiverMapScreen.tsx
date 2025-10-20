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
  useColorScheme,
  Image,
  ScrollView
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import { mapService } from '../../services/mapService';
import { reverseGeocode } from '../../services/geoapifyService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { colors, spacing, metrics } from '../../theme';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';
import Header from '../../components/ui/Header';

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

const CaregiverMapScreen = () => {
  const { currentElderly, connectedElderly, setCurrentElderly } = useCurrentElderly();
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [elderlyCurrentLocation, setElderlyCurrentLocation] = useState<LocationWithAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithAddress | null>(null);
  const [showPastLocations, setShowPastLocations] = useState(false);
  const [pastLocationsLoading, setPastLocationsLoading] = useState(false);
  const [pastLocations, setPastLocations] = useState<LocationWithAddress[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreLocations, setHasMoreLocations] = useState(true);
  const [showElderlySelector, setShowElderlySelector] = useState(false);
  const mapRef = useRef<MapView>(null);

  const LOCATIONS_PER_PAGE = 10;

  // Function to get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const address = await reverseGeocode(latitude, longitude);
      return address;
    } catch (error) {
      console.error('Error getting address:', error);
      return `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
    }
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
    if (elderlyCurrentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: elderlyCurrentLocation.latitude,
        longitude: elderlyCurrentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  };

  // Function to load elderly user's current location
  const loadElderlyCurrentLocation = async () => {
    if (!currentElderly?.firebaseUid) return;
    
    try {
      setLoading(true);
      // Get the most recent location (current location)
      const data = await mapService.getLocations(currentElderly.firebaseUid, 0, 1);
      
      if (data && data.length > 0) {
        const currentLocation = await getLocationAddress(data[0]);
        setElderlyCurrentLocation(currentLocation);
      } else {
        setElderlyCurrentLocation(null);
      }
    } catch (error) {
      console.error('Error loading elderly current location:', error);
      setElderlyCurrentLocation(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to load past locations with pagination and addresses
  const loadPastLocations = async (page: number = 0, append: boolean = false) => {
    if (!currentElderly?.firebaseUid) return;
    
    try {
      setPastLocationsLoading(true);
      const data = await mapService.getLocations(currentElderly.firebaseUid, page, LOCATIONS_PER_PAGE);
      
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

  // Load elderly user's current location when component mounts or elderly changes
  useEffect(() => {
    loadElderlyCurrentLocation();
  }, [currentElderly?.firebaseUid]);

  // Center map on elderly current location when it changes
  useEffect(() => {
    if (elderlyCurrentLocation && mapRef.current && !selectedLocation) {
      mapRef.current.animateToRegion({
        latitude: elderlyCurrentLocation.latitude,
        longitude: elderlyCurrentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
    }
  }, [elderlyCurrentLocation, selectedLocation]);

  // Show message if no elderly user is selected
  if (!currentElderly) {
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
          Getting {currentElderly.fullName}'s location...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <Header 
        title={`${currentElderly.fullName}'s Location`}
        right={
          <CurrentElderlyButton 
            onPress={() => setShowElderlySelector(true)}
            size={36}
          />
        }
        style={{ marginBottom: 0 }}
      />
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: elderlyCurrentLocation?.latitude || 37.78825,
            longitude: elderlyCurrentLocation?.longitude || -122.4324,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* Show elderly current location marker */}
          {elderlyCurrentLocation && (
            <Marker
              coordinate={{
                latitude: elderlyCurrentLocation.latitude,
                longitude: elderlyCurrentLocation.longitude,
              }}
              title={`${currentElderly.fullName}'s Current Location`}
              description={elderlyCurrentLocation.address || `Last updated: ${new Date(elderlyCurrentLocation.timestamp).toLocaleString()}`}
              pinColor={palette.primary}
            />
          )}

          {/* Show selected location marker */}
          {selectedLocation && selectedLocation.id !== elderlyCurrentLocation?.id && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Selected Location"
              description={selectedLocation.address || `Time: ${new Date(selectedLocation.timestamp).toLocaleString()}`}
              pinColor={palette.accent}
            />
          )}
        </MapView>

        {/* Elderly current location info card */}
        {elderlyCurrentLocation && (
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
                  {currentElderly.fullName}'s Current Location
                </Text>
                <Text style={[styles.currentLocationAddress, { color: palette.textSecondary }]}>
                  {elderlyCurrentLocation.address || 'Location coordinates'}
                </Text>
                <Text style={[styles.currentLocationTime, { color: palette.textSecondary }]}>
                  Last updated: {new Date(elderlyCurrentLocation.timestamp).toLocaleString()}
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
            bottom: 80
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
              bottom: 80
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
                  {currentElderly.fullName}'s Location History
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  {currentElderly.fullName}'s recent locations
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
                          {item.address || 'Location coordinates'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Card>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="location-outline" size={48} color={palette.disabled} />
                <Text style={[styles.emptyText, { color: palette.textPrimary }]}>
                  No location history found
                </Text>
                <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>
                  {currentElderly.fullName} hasn't been tracked yet
                </Text>
              </View>
            }
                         ListFooterComponent={
               hasMoreLocations ? (
                 <View style={styles.loadingContainer}>
                   <ActivityIndicator size="small" color={palette.primary} />
                   <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
                     Loading more locations...
                   </Text>
                 </View>
               ) : null
             }
            onEndReached={loadMoreLocations}
            onEndReachedThreshold={0.1}
          />
        </SafeAreaView>
      </Modal>

      {/* Elderly Selector Modal */}
      <Modal
        visible={showElderlySelector}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowElderlySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Select Elderly User
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  Choose an elderly user to view their location
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowElderlySelector(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.elderlyList} showsVerticalScrollIndicator={false}>
              {connectedElderly.map((elderly) => (
                <TouchableOpacity
                  key={elderly.firebaseUid}
                  style={[
                    styles.elderlyItem,
                    currentElderly?.firebaseUid === elderly.firebaseUid && {
                      borderColor: palette.primary,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => {
                    setCurrentElderly(elderly);
                    setShowElderlySelector(false);
                  }}
                >
                  <View style={styles.elderlyItemContent}>
                    <View style={styles.elderlyItemLeft}>
                      {elderly.profileImageUrl ? (
                        <Image
                          source={{ uri: elderly.profileImageUrl }}
                          style={styles.elderlyProfileImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.elderlyProfileInitial, { backgroundColor: palette.primaryLight }]}>
                          <Text style={[styles.elderlyProfileInitialText, { color: palette.primary }]}>
                            {elderly.fullName?.charAt(0) || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.elderlyItemInfo}>
                        <Text style={[styles.elderlyItemName, { color: palette.textPrimary }]}>
                          {elderly.fullName}
                        </Text>
                        <Text style={[styles.elderlyItemEmail, { color: palette.textSecondary }]}>
                          {elderly.email}
                        </Text>
                      </View>
                    </View>
                    {currentElderly?.firebaseUid === elderly.firebaseUid && (
                      <Ionicons name="checkmark-circle" size={24} color={palette.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowElderlySelector(false)}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
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
    marginTop: spacing.md,
    fontSize: 16,
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
  currentLocationTime: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    marginTop: 2,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  elderlyList: {
    maxHeight: 300,
  },
  elderlyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  elderlyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elderlyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  elderlyItemProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  elderlyProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  elderlyItemInitial: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderlyProfileInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderlyItemInitialText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  elderlyProfileInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  elderlyItemInfo: {
    flex: 1,
  },
  elderlyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  elderlyItemEmail: {
    fontSize: 14,
  },
  cancelButton: {
    width: '100%',
  },
  modalButton: {
    width: '100%',
  },
  modalFooter: {
    marginTop: 24,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CaregiverMapScreen; 