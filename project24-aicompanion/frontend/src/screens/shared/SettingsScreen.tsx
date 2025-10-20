import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Modal, TouchableOpacity, StyleSheet, Image, Alert, Linking, KeyboardAvoidingView, Platform, Pressable, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import Header from '../../components/ui/Header';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import TextInput from '../../components/ui/TextInput';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { getLinkedCaregiversForElderly, getConnectedElderlyForCaregiver, sendConnectionRequest } from '../../services/connectionService';
import { getFavorites, toggleFavorite as toggleFavoriteApi, updateUserProfile, convertImageToBase64 } from '../../services/userService';
import { colors, spacing, metrics, ThemeMode } from '../../theme';
import { UserResponse } from '../../types/UserResponse';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { useGeoapifyAutocomplete } from '../../hooks/useGeoapifyAutocomplete';
import { fetchAddressSuggestions } from '../../services/geoapifyService';
import api from '../../lib/api';
import { addCoreInformation } from '../../services/memoryService';
// @ts-ignore: No types for react-native-communications
import Communications from 'react-native-communications';
import * as ImagePicker from 'expo-image-picker';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import { TTSWrapper } from '../../components/TTSWrapper';

const AVATAR_SIZE = 100;
const BADGE_SIZE = 32;

const SettingsScreen: React.FC = () => {
  const { user, signOut, refresh } = useAuth();
  const { role } = useRole();
  const { currentElderly, connectedElderly, setCurrentElderly } = useCurrentElderly();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [userDetailModalVisible, setUserDetailModalVisible] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [showElderlySelector, setShowElderlySelector] = useState(false);
  
  // Inline edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileFields, setEditProfileFields] = useState({
    fullName: user?.fullName || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    bloodType: user?.bloodType || 'N/A',
    gender: user?.gender || 'N/A',
    profileImageUrl: user?.profileImageUrl || '',
  });
  const [editProfileErrors, setEditProfileErrors] = useState<{ [key: string]: string }>({});
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const { suggestions, loading: addressLoading } = useGeoapifyAutocomplete(addressInput);
  
  // Dropdown state
  const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  const bloodTypeOptions = [
    { label: 'N/A', value: 'N/A' },
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
  ];

  const genderOptions = [
    { label: 'N/A', value: 'N/A' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
  ];

  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];

  const isElderly = role === 'ELDERLY';

  // State for connected users from backend
  const [connectedUsers, setConnectedUsers] = useState<UserResponse[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [errorConnections, setErrorConnections] = useState<string | null>(null);

  // State for favorite (starred) users
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const autoFavoriteInProgress = useRef(false);

  // Add modal camera/qr state/hooks (move here from renderAddModal)
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const scanLock = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  // Memory input state
  const [memoryInput, setMemoryInput] = useState('');
  const [memoryType, setMemoryType] = useState<'core'>('core');
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [tempVoiceSpeed, setTempVoiceSpeed] = useState(0.95);

  // Sync addressInput with the address field value
  useEffect(() => {
    setAddressInput(user?.address || '');
  }, [user?.address]);

  // Initialize edit fields when user changes
  useEffect(() => {
    setEditProfileFields({
      fullName: user?.fullName || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
      bloodType: user?.bloodType || 'N/A',
      gender: user?.gender || 'N/A',
      profileImageUrl: user?.profileImageUrl || '',
    });
    setAddressInput(user?.address || '');
  }, [user]);

  // Fetch favorites from backend on mount and when user/role changes
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      try {
      const favs = await getFavorites(user.firebaseUid);
      console.log('[SettingsScreen] Fetched favorites:', favs);
        if (isElderly) setFavoriteIds(favs.favoriteCaregiverIds || []);
        else setFavoriteIds(favs.favoriteElderlyIds || []);
      } catch (e) {
        // ignore for now
      }
    };
    fetchFavorites();
  }, [user, isElderly]);

  // Helper to toggle favorite
  const toggleFavorite = async (targetUserId: string) => {
    if (!user) return;
    try {
      const type = isElderly ? 'caregiver' : 'elderly';
      const favs = await toggleFavoriteApi(user.firebaseUid, targetUserId, type);
      if (isElderly) setFavoriteIds(favs.favoriteCaregiverIds || []);
      else setFavoriteIds(favs.favoriteElderlyIds || []);
    } catch (e: any) {
      if (e?.response?.data?.message?.includes('limit')) {
        Alert.alert('Limit reached', 'You can only favorite up to 2 profiles.');
      }
    }
  };

  // Compute starred and unstarred users
  const starredUsers = connectedUsers.filter(u => favoriteIds.includes(u.firebaseUid));
  const unstarredUsers = connectedUsers.filter(u => !favoriteIds.includes(u.firebaseUid));
  const topUsers = [...starredUsers, ...unstarredUsers].slice(0, 2);
  const hasMore = connectedUsers.length > 2;

  useEffect(() => {
    console.log('[SettingsScreen] Fetch connections useEffect triggered - user:', !!user, 'isElderly:', isElderly);
    const fetchConnections = async () => {
      if (!user) return;
      setLoadingConnections(true);
      setErrorConnections(null);
      try {
        if (isElderly) {
          const caregivers = await getLinkedCaregiversForElderly(user.firebaseUid);
          console.log('[SettingsScreen] Fetched caregivers:', caregivers);
          setConnectedUsers(caregivers);
        } else {
          const elderlyUsers = await getConnectedElderlyForCaregiver(user.firebaseUid);
          console.log('[SettingsScreen] Fetched elderly users:', elderlyUsers);
          setConnectedUsers(elderlyUsers);
        }
      } catch (e: any) {
        console.error('[SettingsScreen] Error fetching connections:', e);
        setErrorConnections(e.message || 'Failed to fetch linked users');
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchConnections();
  }, [user, isElderly]);

  // Auto-set first connected user/caregiver as favourite if none is set and at least one is connected
  useEffect(() => {
    console.log('[SettingsScreen] Auto-favorite useEffect - connectedUsers.length:', connectedUsers.length, 'favoriteIds.length:', favoriteIds.length, 'user:', !!user, 'autoFavoriteInProgress:', autoFavoriteInProgress.current);
    if (connectedUsers.length > 0 && favoriteIds.length === 0 && user && !loadingConnections && !autoFavoriteInProgress.current) {
      console.log('[SettingsScreen] Auto-favorite triggered - setting first user as favorite');
      autoFavoriteInProgress.current = true;
      const type = isElderly ? 'caregiver' : 'elderly';
      (async () => {
        try {
          await toggleFavoriteApi(user.firebaseUid, connectedUsers[0].firebaseUid, type);
          const favs = await getFavorites(user.firebaseUid);
        if (isElderly) setFavoriteIds(favs.favoriteCaregiverIds || []);
        else setFavoriteIds(favs.favoriteElderlyIds || []);
        } catch (error) {
          console.error('[SettingsScreen] Auto-favorite failed:', error);
        } finally {
          autoFavoriteInProgress.current = false;
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedUsers.length, favoriteIds.length, user?.firebaseUid, isElderly, loadingConnections]);

  const handleShowAll = () => setShowAllModal(true);
  const handleCloseAllModal = () => setShowAllModal(false);

  const connectionType = isElderly ? 'My Linked Caregivers' : 'My Linked Users';
  const addButtonText = isElderly ? 'Add New Caregiver' : 'Add New Elderly User';

  const handleAddConnection = () => {
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
  };

  const handleUserPress = (user: UserResponse) => {
    setSelectedUser(user);
    setUserDetailModalVisible(true);
  };

  const handleCloseUserModal = () => {
    setUserDetailModalVisible(false);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setEditProfileFields({
      fullName: user?.fullName || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
      bloodType: user?.bloodType || 'N/A',
      gender: user?.gender || 'N/A',
      profileImageUrl: user?.profileImageUrl || '',
    });
    setAddressInput(user?.address || '');
    setEditProfileErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditProfileFields({
      fullName: user?.fullName || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
      bloodType: user?.bloodType || 'N/A',
      gender: user?.gender || 'N/A',
      profileImageUrl: user?.profileImageUrl || '',
    });
    setAddressInput(user?.address || '');
    setEditProfileErrors({});
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditProfileFields(prev => ({ ...prev, profileImageUrl: result.assets[0].uri }));
    }
  };

  const handleRemoveImage = () => {
    setEditProfileFields(prev => ({ ...prev, profileImageUrl: '' }));
  };

  const validateEditProfile = () => {
    const errors: { [key: string]: string } = {};
    
    if (!editProfileFields.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    
    if (!editProfileFields.address.trim()) {
      errors.address = 'Address is required.';
    }
    
    if (!editProfileFields.dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(editProfileFields.dateOfBirth)) {
      errors.dateOfBirth = 'Date of birth must be in YYYY-MM-DD format.';
    }
    
    setEditProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditProfile()) return;
    
    setEditProfileLoading(true);
    try {
      await updateUserProfile({
        fullName: editProfileFields.fullName,
        address: editProfileFields.address,
        dateOfBirth: editProfileFields.dateOfBirth,
        phoneNumber: user?.phoneNumber || '',
        profileImageUrl: editProfileFields.profileImageUrl,
        bloodType: editProfileFields.bloodType,
        gender: editProfileFields.gender,
      });
      
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditingProfile(false);
      // Refresh user data
      await refresh();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setEditProfileLoading(false);
    }
  };

  // Memory handling functions
  const handleAddMemory = () => {
    setShowMemoryModal(true);
  };



  const handleSaveMemory = async () => {
    if (!memoryInput.trim()) {
      Alert.alert('Error', 'Please enter a memory to save.');
      return;
    }

    setMemoryLoading(true);
    try {
      const result = await addCoreInformation(memoryInput.trim());

      if (result.success) {
        Alert.alert(
          'Memory Saved', 
          result.message,
          [{ text: 'OK', onPress: handleCloseMemoryModal }]
        );
        

      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save memory. Please try again.');
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleCloseMemoryModal = () => {
    setShowMemoryModal(false);
    setMemoryInput('');
    setMemoryType('core');
  };



  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // The navigation will automatically handle the redirect to login
              // due to the user state change in RootNavigator
            } catch (error) {
              console.error('Logout error:', error);
              // Even if there's an error, we should still try to clear the state
              // The user will be redirected to login anyway
            }
          },
        },
      ]
    );
  };

  const renderProfilePicture = (imageUrl?: string, name?: string, size: number = 80) => {
    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.profileImage, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[
        styles.profileInitial,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: palette.card 
        }
      ]}>
        <Text style={[
          styles.profileInitialText,
          { 
            color: palette.primary,
            fontSize: size * 0.4,
            fontWeight: 'bold'
          }
        ]}>
          {name?.charAt(0) || '?'}
        </Text>
      </View>
    );
  };

  const renderUserInfo = () => (
    <Card style={[
      styles.userInfoCard, 
      { backgroundColor: palette.surface, borderColor: palette.border }
    ]} highlight> 
      <View style={styles.sectionTitleContainer}>
        <Text variant="heading2" style={[styles.sectionTitle, { color: palette.primary }]}>Profile Information</Text>
        {/* Edit button in top-right corner, only when not editing */}
        {!isEditingProfile && (
          <TouchableOpacity
            onPress={handleEditProfile}
            style={{ position: 'absolute', top: 0, right: spacing.sm, zIndex: 2, padding: spacing.sm }}
          >
            <Ionicons name="pencil" size={24} color={palette.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.profileTopSection}>
          {isEditingProfile ? (
            <TouchableOpacity
              onPress={editProfileFields.profileImageUrl ? handleRemoveImage : handlePickImage}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.primary,
                alignSelf: 'center',
                marginBottom: spacing.lg,
              }}
              accessibilityLabel={editProfileFields.profileImageUrl ? 'Remove profile picture' : 'Add profile picture'}
            >
              {editProfileFields.profileImageUrl ? (
                <>
                  <Image
                    source={{ uri: editProfileFields.profileImageUrl }}
                    style={{ width: AVATAR_SIZE - spacing.md, height: AVATAR_SIZE - spacing.md, borderRadius: (AVATAR_SIZE - spacing.md) / 2 }}
                  />
                  <View style={{
                    position: 'absolute',
                    right: -BADGE_SIZE / 2.5,
                    top: -BADGE_SIZE / 2.5,
                    backgroundColor: palette.error,
                    borderRadius: BADGE_SIZE / 2,
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: palette.surface,
                  }}>
                    <Ionicons name="remove" size={18} color={palette.surface} />
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="person" size={48} color={palette.textSecondary} />
                  <View style={{
                    position: 'absolute',
                    right: -BADGE_SIZE / 2.5,
                    top: -BADGE_SIZE / 2.5,
                    backgroundColor: palette.primary,
                    borderRadius: BADGE_SIZE / 2,
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: palette.surface,
                  }}>
                    <Ionicons name="add" size={18} color={palette.surface} />
                  </View>
                </>
              )}
            </TouchableOpacity>
          ) : (
            // View mode: show image or placeholder
            editProfileFields.profileImageUrl ? (
              <Image
                source={{ uri: editProfileFields.profileImageUrl }}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: palette.border,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.primary,
                alignSelf: 'center',
                marginBottom: spacing.lg,
              }}>
                <Ionicons name="person" size={48} color={palette.textSecondary} />
              </View>
            )
          )}
          
          {isEditingProfile ? (
            <View style={{ width: '100%', marginTop: spacing.lg }}>
              <TextInput
                placeholder="Enter your full name"
                value={editProfileFields.fullName}
                onChangeText={(text) => setEditProfileFields(prev => ({ ...prev, fullName: text }))}
                style={{ width: '100%', textAlign: 'center', fontSize: 18, fontWeight: '700' }}
                error={editProfileErrors.fullName}
                placeholderTextColor={palette.textSecondary + '99'}
              />
            </View>
          ) : (
            <Text variant="heading2" style={[styles.profileName, { color: palette.textPrimary, marginTop: spacing.lg, textAlign: 'center' }]}>{user?.fullName || 'Not available'}</Text>
          )}
          
          <Text variant="body" style={[styles.profileEmail, { color: palette.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>{user?.email || 'Not available'}</Text>
        </View>
        
        <View style={styles.userInfoGridClean}>
          <View style={styles.rowTwoCol}>
            <View style={styles.infoItemCleanHalf}>
              <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Phone Number</Text>
              <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{user?.phoneNumber || 'Not available'}</Text>
            </View>
            <View style={styles.infoItemCleanHalf}>
              <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Date of Birth</Text>
              {isEditingProfile ? (
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={editProfileFields.dateOfBirth}
                  onChangeText={(text) => setEditProfileFields(prev => ({ ...prev, dateOfBirth: text }))}
                  style={{ width: '100%' }}
                  error={editProfileErrors.dateOfBirth}
                  placeholderTextColor={palette.textSecondary + '99'}
                />
              ) : (
                <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{user?.dateOfBirth || 'Not available'}</Text>
              )}
            </View>
          </View>
          <View style={styles.infoItemClean}>
            <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Address</Text>
            {isEditingProfile ? (
              <View>
                <TextInput
                  placeholder="Enter your address"
                  value={addressInput}
                  onChangeText={(text) => {
                    setAddressInput(text);
                    setEditProfileFields(prev => ({ ...prev, address: text }));
                    setShowAddressSuggestions(true);
                  }}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                  style={{ width: '100%' }}
                  error={editProfileErrors.address}
                  placeholderTextColor={palette.textSecondary + '99'}
                />
                {/* Address Suggestions - now in normal flow */}
                {showAddressSuggestions && addressInput.length >= 3 && suggestions.length > 0 && (
                  <View style={{
                    backgroundColor: palette.surface,
                    borderWidth: 1,
                    borderColor: palette.border,
                    borderRadius: 8,
                    maxHeight: 200,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 10,
                    marginTop: 4,
                  }}>
                    <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                      {suggestions.map((item, i) => (
                        <Pressable
                          key={item.formatted + i}
                          onPress={() => {
                            setAddressInput(item.formatted);
                            setEditProfileFields(prev => ({ ...prev, address: item.formatted }));
                            setShowAddressSuggestions(false);
                          }}
                          style={{
                            padding: spacing.md,
                            backgroundColor: palette.surface,
                            borderBottomWidth: 1,
                            borderBottomColor: palette.border,
                          }}
                        >
                          <Text style={{ color: palette.textPrimary, fontSize: 14 }}>
                            {item.formatted}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{user?.address || 'Not available'}</Text>
            )}
          </View>
          <View style={styles.rowTwoCol}>
            <View style={styles.infoItemCleanHalf}>
              <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Blood Type</Text>
              {isEditingProfile ? (
                <View>
                  <TouchableOpacity
                    onPress={() => setShowBloodTypeDropdown((open) => !open)}
                    style={{
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 8,
                      backgroundColor: palette.surface,
                      padding: spacing.md,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: palette.textPrimary }}>{editProfileFields.bloodType}</Text>
                    <Ionicons name="chevron-down" size={20} color={palette.textSecondary} />
                  </TouchableOpacity>
                  {showBloodTypeDropdown && (
                    <View style={{
                      backgroundColor: palette.surface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 8,
                      maxHeight: 200,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 10,
                      marginTop: 4,
                    }}>
                      <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                        {bloodTypeOptions.map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setEditProfileFields(prev => ({ ...prev, bloodType: option.value }));
                              setShowBloodTypeDropdown(false);
                            }}
                            style={{
                              padding: spacing.md,
                              backgroundColor: palette.surface,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                            }}
                          >
                            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{user?.bloodType || 'N/A'}</Text>
              )}
            </View>
            <View style={styles.infoItemCleanHalf}>
              <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Gender</Text>
              {isEditingProfile ? (
                <View>
                  <TouchableOpacity
                    onPress={() => setShowGenderDropdown((open) => !open)}
                    style={{
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 8,
                      backgroundColor: palette.surface,
                      padding: spacing.md,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: palette.textPrimary }}>{editProfileFields.gender}</Text>
                    <Ionicons name="chevron-down" size={20} color={palette.textSecondary} />
                  </TouchableOpacity>
                  {showGenderDropdown && (
                    <View style={{
                      backgroundColor: palette.surface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 8,
                      maxHeight: 200,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 10,
                      marginTop: 4,
                    }}>
                      <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                        {genderOptions.map((option) => (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              setEditProfileFields(prev => ({ ...prev, gender: option.value }));
                              setShowGenderDropdown(false);
                            }}
                            style={{
                              padding: spacing.md,
                              backgroundColor: palette.surface,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                            }}
                          >
                            <Text style={{ color: palette.textPrimary, fontSize: 14 }}>
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{user?.gender || 'N/A'}</Text>
              )}
            </View>
          </View>
        </View>
        {/* Save/Cancel buttons at the bottom of the card in edit mode */}
        {isEditingProfile && (
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: spacing.xl,
            paddingHorizontal: spacing.sm
          }}>
            <Button
              title="Cancel"
              onPress={handleCancelEdit}
              variant="secondary"
              style={{ 
                flex: 1, 
                marginRight: spacing.sm,
                borderRadius: metrics.buttonRadius
              }}
            />
            <Button
              title={editProfileLoading ? 'Saving...' : 'Save'}
              onPress={handleSaveProfile}
              variant="primary"
              style={{ 
                flex: 1, 
                marginLeft: spacing.sm,
                borderRadius: metrics.buttonRadius
              }}
              disabled={editProfileLoading}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Card>
  );

  const renderConnectedUsers = () => {
    const favouritedId = favoriteIds[0];
    console.log('[SettingsScreen] Render connected users - connectedUsers:', connectedUsers);
    console.log('[SettingsScreen] Render connected users - favoriteIds:', favoriteIds);
    console.log('[SettingsScreen] Render connected users - favouritedId:', favouritedId);
    console.log('[SettingsScreen] Render connected users - starredUsers:', starredUsers);
    console.log('[SettingsScreen] Render connected users - topUsers:', topUsers);
    const favouritedUser = connectedUsers.find(u => u.firebaseUid === favouritedId);
    console.log('[SettingsScreen] Render connected users - favouritedUser:', favouritedUser);
    const sectionTitle = isElderly ? 'My Synced Caregivers' : 'My Synced Users';

    return (
      <Card style={[
        styles.connectedUsersCard, 
        { backgroundColor: palette.surface, borderColor: palette.border }
      ]} highlight>
        <View style={styles.sectionTitleContainerSingle}>
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.primary }]}>{sectionTitle}</Text>
        </View>
        {favouritedUser ? (
          <View style={[
            styles.favouritedUserCard, 
            { backgroundColor: palette.cardHighlight, borderColor: palette.border, borderWidth: 1 }
          ]}> 
            {/* Yellow heart at top-right */}
            <View style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
              <Ionicons name="heart" size={28} color={palette.accent} />
            </View>
            <View style={styles.profileTopSection}>
              {renderProfilePicture(favouritedUser.profileImageUrl, favouritedUser.fullName, 80)}
              <Text variant="heading2" style={[styles.profileName, { color: palette.textPrimary, marginTop: spacing.lg, textAlign: 'center' }]}>{favouritedUser.fullName || 'Not available'}</Text>
              <Text variant="body" style={[styles.profileEmail, { color: palette.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>{favouritedUser.email || 'Not available'}</Text>
            </View>
            <View style={styles.userInfoGridClean}>
              <View style={styles.rowTwoCol}>
                <View style={styles.infoItemCleanHalf}>
                  <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Phone Number</Text>
                  <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{favouritedUser.phoneNumber || 'Not available'}</Text>
                </View>
                <View style={styles.infoItemCleanHalf}>
                  <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Date of Birth</Text>
                  <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{favouritedUser.dateOfBirth || 'Not available'}</Text>
                </View>
              </View>
              <View style={styles.infoItemClean}>
                <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Address</Text>
                <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{favouritedUser.address || 'Not available'}</Text>
              </View>
              <View style={styles.rowTwoCol}>
                <View style={styles.infoItemCleanHalf}>
                  <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Blood Type</Text>
                  <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{favouritedUser.bloodType || 'N/A'}</Text>
                </View>
                <View style={styles.infoItemCleanHalf}>
                  <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Gender</Text>
                  <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{favouritedUser.gender || 'N/A'}</Text>
                </View>
              </View>
            </View>
            {/* Message, Phone, and Unsync buttons */}
            <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => {
                  if (favouritedUser.phoneNumber) {
                    Communications.text(favouritedUser.phoneNumber, '');
                  }
                }}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#4CAF50', 
                  height: 48,
                  borderRadius: metrics.borderRadius,
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={palette.surface} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (favouritedUser.phoneNumber) {
                    Communications.phonecall(favouritedUser.phoneNumber, false);
                  }
                }}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#2196F3', 
                  height: 48,
                  borderRadius: metrics.borderRadius,
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
              >
                <Ionicons name="call-outline" size={20} color={palette.surface} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => unsyncUser(favouritedUser.firebaseUid)}
                style={{ 
                  flex: 1, 
                  backgroundColor: palette.error, 
                  height: 48,
                  borderRadius: metrics.borderRadius,
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'row'
                }}
              >
                <Ionicons name="person-remove-outline" size={20} color={palette.surface} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ textAlign: 'center', marginVertical: spacing.lg, color: palette.textSecondary }}>
            {connectedUsers.length === 0
              ? `Sync with your first ${isElderly ? 'caregiver' : 'user'} to get started!`
              : null}
          </Text>
        )}
        {/* Overlay badge on top of View More button, only if 2 or more connected */}
        {connectedUsers.length >= 2 && (
          <View style={{ position: 'relative', alignItems: 'center' }}>
            <Button
              title="View More"
              onPress={handleShowAll}
              variant="primary"
              style={styles.viewMoreButtonCentered}
            />
          </View>
        )}
        <Button
          title={addButtonText}
          onPress={handleAddConnection}
          variant="secondary"
          style={[styles.addButton, { marginBottom: 0, marginTop: 0 }]}
          icon={<Ionicons name="add" size={20} color={palette.primary} style={{ marginRight: 8 }} />}
        />
      </Card>
    );
  };

  const renderUserDetailModal = () => (
    <Modal
      visible={userDetailModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCloseUserModal}
      onDismiss={() => setSelectedUser(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
          <View style={styles.modalHeader}>
            <Text variant="heading2" style={[styles.modalTitle, { color: palette.textPrimary }]}>User Details</Text>
            <TouchableOpacity onPress={handleCloseUserModal} style={styles.closeButton}>
              <Text variant="body" style={[styles.closeButtonText, { color: palette.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {selectedUser && (
            <View style={styles.userDetailContent}>
              {renderProfilePicture(selectedUser.profileImageUrl, selectedUser.fullName, 100)}
              <Text variant="heading2" style={[styles.detailName, { color: palette.textPrimary, marginTop: spacing.lg }]}>{selectedUser.fullName}</Text>
              <View style={styles.detailInfo}>
                <View style={styles.detailItem}>
                  <Text variant="caption" style={[styles.detailLabel, { color: palette.textSecondary }]}>Email</Text>
                  <Text variant="body" style={[styles.detailValue, { color: palette.textPrimary }]}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" style={[styles.detailLabel, { color: palette.textSecondary }]}>Phone</Text>
                  <Text variant="body" style={[styles.detailValue, { color: palette.textPrimary }]}>{selectedUser.phoneNumber}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" style={[styles.detailLabel, { color: palette.textSecondary }]}>Address</Text>
                  <Text variant="body" style={[styles.detailValue, { color: palette.textPrimary }]}>{selectedUser.address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" style={[styles.detailLabel, { color: palette.textSecondary }]}>Blood Type</Text>
                  <Text variant="body" style={[styles.detailValue, { color: palette.textPrimary }]}>{selectedUser.bloodType || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text variant="caption" style={[styles.detailLabel, { color: palette.textSecondary }]}>Gender</Text>
                  <Text variant="body" style={[styles.detailValue, { color: palette.textPrimary }]}>{selectedUser.gender || 'N/A'}</Text>
                </View>
              </View>
              {/* Communication buttons */}
              <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedUser.phoneNumber) {
                      Communications.text(selectedUser.phoneNumber, '');
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#4CAF50', 
                    height: 48,
                    borderRadius: metrics.borderRadius,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'row'
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={palette.surface} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedUser.phoneNumber) {
                      Communications.phonecall(selectedUser.phoneNumber, false);
                    }
                  }}
                  style={{ 
                    flex: 1, 
                    backgroundColor: '#2196F3', 
                    height: 48,
                    borderRadius: metrics.borderRadius,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'row'
                  }}
                >
                  <Ionicons name="call-outline" size={20} color={palette.surface} />
                </TouchableOpacity>
              </View>
              {/* Remove button with confirmation */}
              <Button
                title="Unsync"
                variant="primary"
                style={{
                  marginTop: spacing.md,
                  width: '100%',
                  backgroundColor: palette.error,
                  // The Button component uses palette.surface for text when variant is primary
                }}
                onPress={() => {
                  if (window.confirm) {
                    if (window.confirm('Are you sure you want to unsync this user?')) {
                      // TODO: Wire up actual delete logic here
                      handleCloseUserModal();
                    }
                  } else {
                    // fallback for React Native
                    Alert.alert('Unsync User', 'Are you sure you want to unsync this user?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Unsync', style: 'destructive', onPress: () => handleCloseUserModal() },
                    ]);
                  }
                }}
                accessibilityLabel="Unsync user"
              />
            </View>
          )}
          <View style={styles.modalFooter}>
            <Button
              title="Close"
              onPress={handleCloseUserModal}
              variant="secondary"
              style={styles.closeDetailButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAddModal = () => {
    // Handler for QR scan (caregiver)
    const handleBarCodeScanned = ({ data }: { data: string }) => {
      if (scanned || scanLock.current) return;
      scanLock.current = true;
      setScanned(true);
      setScannedId(data);
      
      // For caregivers scanning elderly QR codes
      if (!isElderly) {
      Alert.alert(
          'Connect to Elderly User',
          `You are connecting to elderly user with ID: ${data}. Confirm?`,
        [
            { 
              text: 'Cancel', 
              style: 'cancel', 
              onPress: () => { 
                setScanned(false); 
                setScannedId(null); 
                scanLock.current = false; 
              } 
            },
            { 
              text: 'Connect', 
              onPress: async () => {
                try {
                  setLoading(true);
                  await sendConnectionRequest(user!.firebaseUid, data);
                  Alert.alert('Connection Request Sent', 'Your connection request has been sent to the elderly user.');
                  handleCloseModal();
                } catch (error) {
                  Alert.alert('Error', 'Failed to send connection request.');
                } finally {
                  setLoading(false);
                  setScanned(false);
                  setScannedId(null);
                  scanLock.current = false;
                }
              }
            },
        ]
      );
      }
    };

    return (
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.surface, width: '90%', maxWidth: 400, maxHeight: '80%', borderRadius: 16, padding: 24 }]}> 
            <View style={styles.modalHeader}>
              <Text variant="heading2" style={[styles.modalTitle, { color: palette.textPrimary }]}> 
                {isElderly ? 'Add New Caregiver' : 'Add New Elderly User'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text variant="body" style={[styles.closeButtonText, { color: palette.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {isElderly ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <View style={styles.qrPlaceholder}>
                    {user?.firebaseUid ? (
                      <QRCode value={user.firebaseUid} size={180} />
                  ) : (
                      <Text style={styles.qrPlaceholderText}>No ID found</Text>
                  )}
                  </View>
                  <Text style={[styles.qrInstructions, { color: palette.textSecondary }]}>
                    Show this QR code to your caregiver so they can scan and connect with you.
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {!permission ? (
                    <Text>Loading permissions...</Text>
                  ) : !permission.granted ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text>We need your permission to show the camera</Text>
                      <Button onPress={requestPermission} title="Grant Permission" />
                    </View>
                  ) : (
                    <View style={{ width: 220, height: 220, backgroundColor: palette.border, borderRadius: metrics.cardRadius, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
                      <CameraView
                        style={{ width: 220, height: 220, borderRadius: metrics.cardRadius }}
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      />
                    </View>
                  )}
                  {scanned && !loading && (
                    <Button title="Tap to Scan Again" onPress={() => { setScanned(false); setScannedId(null); scanLock.current = false; }} />
                  )}
                  <Text style={{ marginBottom: spacing.lg, textAlign: 'center', color: palette.textSecondary }}>
                    Scan the QR code shown by the elderly user to connect.
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="secondary"
                style={styles.cancelButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const setAsActive = async (userId: string) => {
    if (!user) return;
    try {
      // Remove all other favourites, set only this one
      const type = isElderly ? 'caregiver' : 'elderly';
      // Remove all other favourites first
      for (const favId of favoriteIds) {
        if (favId !== userId) {
          await toggleFavoriteApi(user.firebaseUid, favId, type);
        }
      }
      // If not already favourite, add this one
      if (!favoriteIds.includes(userId)) {
        await toggleFavoriteApi(user.firebaseUid, userId, type);
      }
      // Refresh favourites
      const favs = await getFavorites(user.firebaseUid);
      if (isElderly) setFavoriteIds(favs.favoriteCaregiverIds || []);
      else setFavoriteIds(favs.favoriteElderlyIds || []);
    } catch (e) {
      // handle error
    }
  };

  const unsyncUser = async (targetUserId: string) => {
    if (!user) return;
    const isElderlyUser = isElderly;
    const caregiverId = isElderlyUser ? targetUserId : user.firebaseUid;
    const elderlyId = isElderlyUser ? user.firebaseUid : targetUserId;
    Alert.alert(
      'Unsync User',
      'Are you sure you want to unsync this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsync', style: 'destructive', onPress: async () => {
            try {
              const apiInstance = await api();
              await apiInstance.delete('/connections/unsync', { params: { caregiverId, elderlyId } });
              // Refresh connected users
              if (isElderlyUser) {
                const caregivers = await getLinkedCaregiversForElderly(user.firebaseUid);
                setConnectedUsers(caregivers);
              } else {
                const elderlyUsers = await getConnectedElderlyForCaregiver(user.firebaseUid);
                setConnectedUsers(elderlyUsers);
              }
              // Also refresh favorites
              const favs = await getFavorites(user.firebaseUid);
              if (isElderlyUser) setFavoriteIds(favs.favoriteCaregiverIds || []);
              else setFavoriteIds(favs.favoriteElderlyIds || []);
            } catch (e) {
              Alert.alert('Error', 'Failed to unsync user.');
            }
          }
        }
      ]
    );
  };

  // Modal to show all users
  const renderAllUsersModal = () => (
    <Modal
      visible={showAllModal}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCloseAllModal}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: palette.surface, maxHeight: '90%', minHeight: '70%' } // taller modal
        ]}> 
          <View style={styles.modalHeader}>
            <Text variant="heading2" style={[styles.modalTitle, { color: palette.textPrimary }]}>All {isElderly ? 'Caregivers' : 'Users'}</Text>
            <TouchableOpacity onPress={handleCloseAllModal} style={styles.closeButton}>
              <Text variant="body" style={[styles.closeButtonText, { color: palette.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ width: '100%' }} horizontal={false} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
            {connectedUsers.filter(u => u.firebaseUid !== favoriteIds[0]).map((connectedUser, idx) => (
              <View
                key={connectedUser.firebaseUid}
                style={[
                  styles.favouritedUserCard,
                  { backgroundColor: palette.surface, marginBottom: spacing.md, borderWidth: 1, borderColor: palette.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
                  idx === connectedUsers.length - 1 && styles.lastUserItem
                ]}
              >
                <View style={styles.profileTopSection}>
                  {renderProfilePicture(connectedUser.profileImageUrl, connectedUser.fullName, 60)}
                  <Text variant="heading2" style={[styles.profileName, { color: palette.textPrimary, marginTop: spacing.lg, textAlign: 'center' }]}>{connectedUser.fullName || 'Not available'}</Text>
                  <Text variant="body" style={[styles.profileEmail, { color: palette.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>{connectedUser.email || 'Not available'}</Text>
                </View>
                <View style={styles.userInfoGridClean}>
                  <View style={styles.rowTwoCol}>
                    <View style={styles.infoItemCleanHalf}>
                      <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Phone Number</Text>
                      <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{connectedUser.phoneNumber || 'Not available'}</Text>
                    </View>
                    <View style={styles.infoItemCleanHalf}>
                      <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Date of Birth</Text>
                      <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{connectedUser.dateOfBirth || 'Not available'}</Text>
                    </View>
                  </View>
                  <View style={styles.infoItemClean}>
                    <Text variant="caption" style={[styles.infoLabel, { color: palette.textSecondary }]}>Address</Text>
                    <Text variant="body" style={[styles.infoValue, { color: palette.textPrimary }]}>{connectedUser.address || 'Not available'}</Text>
                  </View>
                </View>
                {/* Action buttons */}
                <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.md }}>
                  <Button
                    title={isElderly ? 'Set as Favourited' : 'Set as Active'}
                    onPress={() => setAsActive(connectedUser.firebaseUid)}
                    variant="primary"
                    style={{ flex: 1, minWidth: 0, paddingHorizontal: 0 }}
                    disabled={favoriteIds[0] === connectedUser.firebaseUid}
                  />
                  <Button
                    title="Unsync"
                    onPress={() => unsyncUser(connectedUser.firebaseUid)}
                    variant="primary"
                    style={{ flex: 1, backgroundColor: palette.error, minWidth: 0, paddingHorizontal: 0 }}
                    disabled={false}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Close" onPress={handleCloseAllModal} variant="secondary" style={styles.closeDetailButton} />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMemorySection = () => (
    <TTSWrapper
      text="Help your AI assistant remember important things about you. This information will be used to provide more personalized responses."
      buttonSize={20}
      buttonColor={palette.primary}
      buttonPosition="top-right"
    >
      <Card style={[
      styles.memoryCard, 
      { backgroundColor: palette.surface, borderColor: palette.border }
    ]} highlight>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="bulb" size={24} color={palette.primary} />
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.primary, marginLeft: spacing.sm }]}>
            AI Memory
          </Text>
        </View>
        
        <Text variant="body" style={{ color: palette.textSecondary, marginBottom: spacing.lg, lineHeight: 20 }}>
          Help your AI assistant remember important things about you. This information will be used to provide more personalized responses.
        </Text>

        <Button
          title="Add Memory"
          onPress={handleAddMemory}
          variant="primary"
          fullWidth
          icon={<Ionicons name="add" size={20} color={palette.surface} />}
        />
      </Card>
    </TTSWrapper>
  );

  const renderMemoryModal = () => {
    // Only show memory modal for elderly users
    if (!isElderly) {
      return null;
    }

    return (
      <Modal
        visible={showMemoryModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMemoryModal}
      >
      <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[{
          width: '90%',
          maxWidth: 400,
          minHeight: 600,
          maxHeight: '90%',
          borderRadius: metrics.cardRadius,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }, { backgroundColor: palette.surface }]}>
          {/* Header */}
          <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1 }, { borderBottomColor: palette.border }]}>
            <Text variant="heading2" style={{ color: palette.textPrimary }}>
              Add Memory
            </Text>
            <TouchableOpacity onPress={handleCloseMemoryModal} style={{ padding: spacing.sm }}>
              <Ionicons name="close" size={24} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1, padding: spacing.xl }} showsVerticalScrollIndicator={false}>
            {/* Memory Type Selection */}
            <View style={styles.memoryTypeSection}>
              <Text variant="heading2" style={{ color: palette.textPrimary, marginBottom: spacing.sm }}>
                Memory Type
              </Text>
              
              <View style={styles.memoryTypeOptions}>
                <TouchableOpacity
                  style={[
                    styles.memoryTypeOption,
                    {
                      backgroundColor: palette.primary,
                      borderColor: palette.primary,
                    }
                  ]}
                  onPress={() => setMemoryType('core')}
                >
                  <Ionicons 
                    name="person" 
                    size={20} 
                    color={palette.surface} 
                  />
                  <Text 
                    variant="body" 
                    style={{ 
                      color: palette.surface,
                      marginLeft: spacing.sm,
                      fontWeight: '600'
                    }}
                  >
                    Core Information
                  </Text>
                </TouchableOpacity>
              </View>

              <Text variant="caption" style={{ color: palette.textSecondary, marginTop: spacing.sm }}>
                Core information includes permanent facts about you (age, occupation, hobbies, etc.)
              </Text>
            </View>

            {/* Memory Input */}
            <View style={styles.memoryInputSection}>
              <Text variant="heading2" style={{ color: palette.textPrimary, marginBottom: spacing.sm }}>
                Memory Details
              </Text>
              
              <TextInput
                placeholder="e.g., I'm 75 years old and love gardening"
                value={memoryInput}
                onChangeText={setMemoryInput}
                multiline
                scrollEnabled={true}
                style={[
                  styles.memoryTextInput,
                  {
                    backgroundColor: palette.background,
                    borderColor: palette.border,
                    color: palette.textPrimary,
                  }
                ]}
                placeholderTextColor={palette.textSecondary}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.memoryModalFooter, { borderTopColor: palette.border }]}>
            <Button
              title="Cancel"
              onPress={handleCloseMemoryModal}
              variant="secondary"
              style={styles.memoryModalButton}
              fullWidth={false}
            />
            <Button
              title="Save"
              onPress={handleSaveMemory}
              variant="primary"
              loading={memoryLoading}
              style={styles.memoryModalButton}
              fullWidth={false}
            />
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  const renderLogoutSection = () => (
    <Card style={[
      styles.logoutCard, 
      { backgroundColor: palette.surface, borderColor: palette.border }
    ]} highlight>
      <Button
        title="Logout"
        onPress={handleLogout}
        variant="primary"
        style={{ backgroundColor: palette.error }}
      />
    </Card>
  );

  const { subscribeElderlyConnectionRequests, approveConnection, rejectConnection } = useConnectionRequests();

  // WebSocket subscription for elderly QR modal - always active when elderly user is logged in
  useEffect(() => {
    if (!isElderly || !user?.firebaseUid) return;
    
    let client: any = null;
    
    const initWebSocket = async () => {
      try {
        client = await subscribeElderlyConnectionRequests(user.firebaseUid, (msg: any) => {
          Alert.alert(
            'Connection Request',
            `${msg.caregiverName || 'A caregiver'} wants to connect with you.`,
            [
              {
                text: 'Reject',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await rejectConnection(msg.connectionId);
                    Alert.alert('Connection Rejected', 'You have rejected the caregiver connection request.');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to reject connection.');
                  }
                },
                isPreferred: false,
              },
              {
                text: 'Accept',
                style: 'default',
                onPress: async () => {
                  try {
                    await approveConnection(msg.connectionId);
                    Alert.alert('Connection Approved', 'You have approved the caregiver connection request.');
                    // Refresh the connected users list
                    if (isElderly) {
                      const caregivers = await getLinkedCaregiversForElderly(user.firebaseUid);
                      setConnectedUsers(caregivers);
                    } else {
                      const elderlyUsers = await getConnectedElderlyForCaregiver(user.firebaseUid);
                      setConnectedUsers(elderlyUsers);
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to approve connection.');
                  }
                },
                isPreferred: true,
              },
            ],
            { cancelable: false }
          );
        });
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };
    
    initWebSocket();
    
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isElderly, user?.firebaseUid, subscribeElderlyConnectionRequests, approveConnection, rejectConnection]);

  return (
    <ScreenContainer>
      <Header 
        title="Settings" 
        right={
          !isElderly && (
            <CurrentElderlyButton 
              onPress={() => setShowElderlySelector(true)}
              size={36}
            />
          )
        }
      />
      <>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        >
          {renderUserInfo()}
          {renderConnectedUsers()}
          {renderMemorySection()}
          {renderLogoutSection()}
          {renderAddModal()}
          {renderAllUsersModal()}
          {renderMemoryModal()}
        </ScrollView>
        {renderUserDetailModal()}
        
        {/* Elderly Selector Modal for Caregivers */}
        {!isElderly && (
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
                      Choose an elderly user to view their daily summaries
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
        )}
      </>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  userInfoCard: {
    marginBottom: spacing.xl,
  },
  connectedUsersCard: {
    marginBottom: spacing.xl,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  sectionTitle: {
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    right: 0,
    top: -spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: metrics.buttonRadius,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontWeight: '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  profileTopSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileImage: {
    marginBottom: 0,
  },
  profileInitial: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  profileInitialText: {
    textAlign: 'center',
  },
  profileName: {
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  userInfoGridClean: {
    marginTop: spacing.md,
    gap: 0,
  },
  infoItemClean: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '600',
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: metrics.buttonRadius,
    marginTop: spacing.xs,
  },
  roleText: {
    fontWeight: '600',
  },
  addButton: {
    marginBottom: spacing.lg,
  },
  usersList: {
    gap: spacing.sm,
  },
  connectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: metrics.borderRadius,
    ...metrics.shadow.light,
  },
  lastUserItem: {
    marginBottom: 0,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 12,
  },
  removeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: metrics.borderRadius,
  },
  removeText: {
    fontWeight: '500',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: spacing.xl,
  },
  qrCodePlaceholder: {
    alignItems: 'center',
  },
  qrCodeContainer: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: metrics.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  qrCodeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  qrCodeIconText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrCodeTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  qrCodeSubtitle: {
    textAlign: 'center',
  },
  cameraPlaceholder: {
    alignItems: 'center',
  },
  cameraContainer: {
    width: 250,
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: metrics.cardRadius,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cameraIconText: {
    fontSize: 24,
  },
  cameraTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cameraSubtitle: {
    textAlign: 'center',
  },
  modalDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  modalFooter: {
    marginTop: spacing.lg,
  },
  cancelButton: {
    width: '100%',
  },
  modalButton: {
    width: '100%',
  },
  connectButton: {
    flex: 1,
  },
  // User detail modal styles
  userDetailContent: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  detailName: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  detailInfo: {
    width: '100%',
    gap: spacing.md,
  },
  detailItem: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  detailValue: {
    fontWeight: '600',
  },
  closeDetailButton: {
    width: '100%',
  },
  rowTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  infoItemCleanHalf: {
    flex: 1,
    marginRight: spacing.md,
  },
  sectionTitleContainerSingle: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  favouritedUserCard: { borderRadius: metrics.buttonRadius, padding: spacing.lg, marginBottom: spacing.lg, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  countBadgeAboveButtonContainer: { alignItems: 'center', marginBottom: spacing.sm },
  viewMoreButtonCentered: { alignSelf: 'center', marginBottom: spacing.lg },
  editProfileButtonContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  editProfileButton: {
    width: '100%',
  },
  logoutCard: {
    marginTop: spacing.lg,
  },
      memoryCard: {
      marginBottom: spacing.xl,
    },


  memoryTypeSection: {
    marginBottom: spacing.xxl,
  },
  memoryTypeOptions: {
    gap: spacing.sm,
  },
  memoryTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: metrics.cardRadius,
    borderWidth: 1,
  },
  memoryInputSection: {
    marginBottom: spacing.xl,
  },
  memoryTextInput: {
    borderWidth: 1,
    borderRadius: metrics.cardRadius,
    padding: spacing.lg,
    textAlignVertical: 'top',
    height: 120,
  },
  memoryModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  memoryModalButton: {
    flex: 1,
    minWidth: 100,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  qrPlaceholderText: {
    fontSize: 60,
    marginBottom: 15,
  },
  qrInstructions: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  elderlyItemImage: {
    marginRight: spacing.md,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
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

});

export default SettingsScreen; 