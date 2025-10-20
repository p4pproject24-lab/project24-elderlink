import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  useColorScheme,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/ui/Header';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, metrics, ThemeMode } from '../../theme';
// @ts-ignore: No types for react-native-communications
import Communications from 'react-native-communications';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';

const CaregiverHomeScreen: React.FC = () => {
  const { currentElderly, connectedElderly, setCurrentElderly, loading } = useCurrentElderly();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [showElderlySelector, setShowElderlySelector] = useState(false);
  const [showElderlyDetails, setShowElderlyDetails] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  // Debug logging
  console.log('[CaregiverHomeScreen] currentElderly:', currentElderly?.fullName);
  console.log('[CaregiverHomeScreen] connectedElderly count:', connectedElderly.length);
  console.log('[CaregiverHomeScreen] connectedElderly data:', connectedElderly.map(e => ({ name: e.fullName, email: e.email, id: e.firebaseUid })));
  console.log('[CaregiverHomeScreen] loading:', loading);
  console.log('[CaregiverHomeScreen] user role:', user?.role);
  
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];

  const handleElderlySwitch = (elderly: any) => {
    setCurrentElderly(elderly);
    setShowElderlySelector(false);
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
          backgroundColor: palette.primaryLight 
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

  const renderCurrentElderly = () => {
    if (loading) {
      return (
        <Card style={styles.currentElderlyCard}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
              Loading elderly user information...
            </Text>
          </View>
        </Card>
      );
    }

    if (!currentElderly) {
      return (
        <Card style={styles.currentElderlyCard}>
          <View style={styles.noElderlyContainer}>
            <Ionicons name="person-outline" size={48} color={palette.disabled} />
            <Text style={[styles.noElderlyTitle, { color: palette.textPrimary }]}>
              No Elderly User Assigned
            </Text>
            <Text style={[styles.noElderlySubtitle, { color: palette.textSecondary }]}>
              Connect with an elderly user to get started
            </Text>
            <Button
              title="Go to Settings"
              onPress={() => {/* Navigate to settings */}}
              variant="primary"
              style={styles.connectButton}
            />
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.currentElderlyCard}>
        <View style={styles.elderlyHeader}>
          <TouchableOpacity 
            style={styles.elderlyInfo}
            onPress={() => setShowElderlyDetails(true)}
            activeOpacity={0.7}
          >
            {renderProfilePicture(currentElderly.profileImageUrl, currentElderly.fullName, 60)}
            <View style={styles.elderlyDetails}>
              <Text style={[styles.elderlyName, { color: palette.textPrimary, marginBottom: spacing.xs }]}>
                {currentElderly.fullName}
              </Text>
              <Text style={[styles.elderlyEmail, { color: palette.textSecondary }]}>
                {currentElderly.email}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowElderlySelector(true)}
            style={[styles.switchButton, { 
              backgroundColor: palette.primary,
              shadowColor: palette.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4
            }]}
          >
            <Ionicons name="swap-horizontal" size={20} color={palette.surface} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.elderlyStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Age</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {currentElderly.dateOfBirth ? 
                `${new Date().getFullYear() - new Date(currentElderly.dateOfBirth).getFullYear()}` : 
                'N/A'
              }
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Phone</Text>
            <Text style={[styles.statValue, { color: palette.textPrimary }]}>
              {currentElderly.phoneNumber || 'N/A'}
            </Text>
          </View>
        </View>

        {currentElderly.address && (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={16} color={palette.textSecondary} />
            <Text style={[styles.addressText, { color: palette.textSecondary }]} numberOfLines={2}>
              {currentElderly.address}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  const renderElderlySelector = () => {
    return (
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
                  onPress={() => handleElderlySwitch(elderly)}
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
    );
  };

  const renderElderlyDetailsModal = () => {
    if (!currentElderly) return null;
    
    return (
      <Modal
        visible={showElderlyDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowElderlyDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Elderly User Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  {currentElderly.fullName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowElderlyDetails(false)}>
                <Ionicons name="close" size={24} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailsList}>
              <View style={styles.detailSection}>
                <View style={styles.detailHeader}>
                  {renderProfilePicture(currentElderly.profileImageUrl, currentElderly.fullName, 80)}
                  <View style={styles.detailHeaderInfo}>
                    <Text style={[styles.detailName, { color: palette.textPrimary }]}>
                      {currentElderly.fullName}
                    </Text>
                    <Text style={[styles.detailEmail, { color: palette.textSecondary }]}>
                      {currentElderly.email}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={[styles.detailSectionTitle, { color: palette.textPrimary }]}>
                  Personal Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>Age</Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    {currentElderly.dateOfBirth ? 
                      `${new Date().getFullYear() - new Date(currentElderly.dateOfBirth).getFullYear()}` : 
                      'N/A'
                    }
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>Phone</Text>
                  <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                    {currentElderly.phoneNumber || 'N/A'}
                  </Text>
                </View>
                {currentElderly.address && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>Address</Text>
                    <Text style={[styles.detailValue, { color: palette.textPrimary }]} numberOfLines={3}>
                      {currentElderly.address}
                    </Text>
                  </View>
                )}
              </View>

              {currentElderly.coreInformation && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: palette.textPrimary }]}>
                    Core Information
                  </Text>
                  <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                    {currentElderly.coreInformation}
                  </Text>
                </View>
              )}

              {currentElderly.dailyLife && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: palette.textPrimary }]}>
                    Daily Life
                  </Text>
                  <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                    {currentElderly.dailyLife}
                  </Text>
                </View>
              )}

              {currentElderly.medicalNeeds && (
                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: palette.textPrimary }]}>
                    Medical Needs
                  </Text>
                  <Text style={[styles.detailText, { color: palette.textSecondary }]}>
                    {currentElderly.medicalNeeds}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Close"
                onPress={() => setShowElderlyDetails(false)}
                variant="secondary"
                style={styles.cancelButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <Header 
        title="Caregiver Home" 
        right={
          <CurrentElderlyButton 
            onPress={() => setShowElderlySelector(true)}
            size={36}
          />
        }
      />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          isTablet && { paddingHorizontal: spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentElderly()}
        
        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                if (currentElderly?.phoneNumber) {
                  Communications.text(currentElderly.phoneNumber, '');
                } else {
                  Alert.alert('No Phone Number', 'This elderly user does not have a phone number configured.');
                }
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: palette.primary + '15' }]}>
                <Ionicons name="chatbubbles-outline" size={24} color={palette.primary} />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                if (currentElderly?.phoneNumber) {
                  Communications.phonecall(currentElderly.phoneNumber, false);
                } else {
                  Alert.alert('No Phone Number', 'This elderly user does not have a phone number configured.');
                }
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <Ionicons name="call" size={24} color="#4CAF50" />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.navigate("Reminders" as never)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E91E63' + '15' }]}>
                <Ionicons name="notifications" size={24} color="#E91E63" />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Reminders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                if (currentElderly) {
                  navigation.navigate('Location' as never);
                } else {
                  Alert.alert('No Elderly User Selected', 'Please select an elderly user to view their location.');
                }
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FF9800' + '15' }]}>
                <Ionicons name="location" size={24} color="#FF9800" />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => {
                navigation.navigate('Insights' as never);
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: palette.textSecondary + '15' }]}>
                <Ionicons name="document-text" size={24} color={palette.textSecondary} />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Reports
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {renderElderlySelector()}
      {renderElderlyDetailsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  tabletScrollContent: {
    paddingHorizontal: spacing.xxl,
  },
  currentElderlyCard: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
  },
  noElderlyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noElderlyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  noElderlySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  connectButton: {
    marginTop: spacing.md,
  },
  elderlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  elderlyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md, // Add margin to prevent overlap
  },
  elderlyDetails: {
    marginLeft: spacing.md,
    flex: 1,
    marginRight: spacing.sm, // Add margin to prevent overlap
  },
  elderlyName: {
    fontSize: 18,
    fontWeight: '600',
    flexShrink: 1, // Allow text to shrink if needed
  },
  chosenBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: metrics.borderRadius,
  },
  chosenText: {
    fontSize: 12,
    fontWeight: '500',
  },
  elderlyEmail: {
    fontSize: 14,
  },
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm, // Add margin to ensure separation
  },
  elderlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    marginLeft: spacing.xs,
    flex: 1,
  },
  profileImage: {
    overflow: 'hidden',
  },
  profileInitial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitialText: {
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  elderlyProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  elderlyProfileInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elderlyProfileInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  elderlyItemInfo: {
    flex: 1,
  },
  elderlyItemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  elderlyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: metrics.borderRadius,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  elderlyItemEmail: {
    fontSize: 14,
  },
  modalFooter: {
    marginTop: 24,
  },
  cancelButton: {
    width: '100%',
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
  detailsList: {
    flex: 1,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  detailHeaderInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  detailEmail: {
    fontSize: 16,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    flex: 2,
    textAlign: 'right',
  },
  detailText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default CaregiverHomeScreen; 