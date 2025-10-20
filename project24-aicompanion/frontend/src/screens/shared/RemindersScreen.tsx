import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserRoleContext } from "../../contexts/UserRoleContext";
import { useAuth } from "../../hooks/useAuth";
import { useFirebaseAuth } from "../../hooks/useFirebaseAuth";
import { useCurrentElderly } from "../../contexts/CurrentElderlyContext";
import IconButton from "../../components/IconButton";
import Button from "../../components/ui/Button";
import ReminderFormModal from "../../components/ReminderFormModal";
import {
  reminderService,
  Reminder,
  ReminderStatus,
  ReminderTag,
} from "../../services/reminderService";
import Card from '../../components/ui/Card';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, metrics, ThemeMode } from '../../theme';
import { useColorScheme } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';

const TABS = [
  { 
    label: "Upcoming", 
    icon: "calendar-outline", 
    color: "#60A5FA", 
    status: ReminderStatus.INCOMPLETE,
    count: 0
  },
  { 
    label: "Missed", 
    icon: "alert-circle-outline", 
    color: "#EF4444", 
    status: ReminderStatus.MISSED,
    count: 0
  },
  { 
    label: "Completed", 
    icon: "checkmark-done-outline", 
    color: "#22C55E", 
    status: ReminderStatus.COMPLETE,
    count: 0
  },
];

const getTagIcon = (tag: ReminderTag) => {
  switch (tag) {
    case ReminderTag.MEDICATION:
      return <Ionicons name="medkit-outline" size={24} color="#5EBFB5" />;
    case ReminderTag.APPOINTMENT:
      return <Ionicons name="calendar-outline" size={24} color="#A78BFA" />;
    case ReminderTag.EVENT:
      return <Ionicons name="star-outline" size={24} color="#60A5FA" />;
    case ReminderTag.TASK:
      return <Ionicons name="checkmark-done-outline" size={24} color="#F9A826" />;
    case ReminderTag.HEALTH:
      return <Ionicons name="heart-outline" size={24} color="#34D399" />;
    case ReminderTag.WORK:
      return <Ionicons name="briefcase-outline" size={24} color="#F472B6" />;
    case ReminderTag.FINANCE:
      return <Ionicons name="cash-outline" size={24} color="#FBBF24" />;
    case ReminderTag.TRAVEL:
      return <Ionicons name="airplane-outline" size={24} color="#38BDF8" />;
    case ReminderTag.SOCIAL:
      return <Ionicons name="people-outline" size={24} color="#F472B6" />;
    case ReminderTag.EDUCATION:
      return <Ionicons name="school-outline" size={24} color="#818CF8" />;
    case ReminderTag.LEISURE:
      return <Ionicons name="game-controller-outline" size={24} color="#FCD34D" />;
    case ReminderTag.PERSONAL:
      return <Ionicons name="person-outline" size={24} color="#F59E42" />;
    default:
      return <Ionicons name="alert-circle-outline" size={24} color="#A1A1AA" />;
  }
};

const RemindersScreen = () => {
  const navigation = useNavigation();
  const { role: userRole } = useUserRoleContext();
  const { user } = useAuth();
  const { user: firebaseUser } = useFirebaseAuth();
  const { currentElderly, connectedElderly, setCurrentElderly } = useCurrentElderly();
  const { width } = useWindowDimensions();
  const [reminderFormVisible, setReminderFormVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<{
    id: string;
    title: string;
    timestamp: string;
    description?: string;
    tags: ReminderTag[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showElderlySelector, setShowElderlySelector] = useState(false);

  // Determine target user ID based on role
  const targetUserId = userRole === "elderly" ? firebaseUser?.uid : currentElderly?.firebaseUid;

  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];


  // Enhanced Action Button Component
  const ActionButton = ({ title, icon, onPress, variant = "primary", style }: any) => (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8}
      style={[
        styles.actionButton,
        variant === "primary" && { backgroundColor: palette.primary },
        variant === "secondary" && { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 },
        style
      ]}
    >
      <View style={styles.actionButtonContent}>
        {icon && <View style={styles.actionButtonIcon}>{icon}</View>}
        <Text style={[
          styles.actionButtonText,
          variant === "primary" && { color: palette.surface },
          variant === "secondary" && { color: palette.textPrimary }
        ]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Enhanced Tab Component
  const TabButton = ({ label, active, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.tabButton,
        active && styles.tabButtonActive,
        { backgroundColor: active ? palette.primary : palette.surface }
      ]}
    >
      <Text style={[
        styles.tabButtonText,
        { color: active ? palette.surface : palette.textSecondary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced Reminder Card Component
  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const isUpcoming = reminder.status === ReminderStatus.INCOMPLETE;
    const isMissed = reminder.status === ReminderStatus.MISSED;
    const isCompleted = reminder.status === ReminderStatus.COMPLETE;

    const getStatusColor = () => {
      if (isCompleted) return "#22C55E";
      if (isMissed) return "#EF4444";
      return "#60A5FA";
    };

    const getStatusIcon = () => {
      if (isCompleted) return "checkmark-circle";
      if (isMissed) return "alert-circle";
      return "time";
    };

    const getStatusText = () => {
      if (isCompleted) return "Completed";
      if (isMissed) return "Missed";
      return "Upcoming";
    };

    return (
      <Card style={[
        styles.reminderCard, 
        { backgroundColor: palette.surface, borderColor: palette.border }
      ]} highlight>
        <View style={styles.reminderCardHeader}>
          <View style={styles.reminderCardLeft}>
            <View style={[
              styles.reminderIconContainer,
              { backgroundColor: getStatusColor() + '15' }
            ]}>
              {reminder.tags && reminder.tags.length > 0 ? getTagIcon(reminder.tags[0]) : getTagIcon(ReminderTag.OTHER)}
            </View>
            <View style={styles.reminderContent}>
              <Text style={[styles.reminderTitle, { color: palette.textPrimary }]}>
                {reminder.title}
              </Text>
              <Text style={[styles.reminderTime, { color: palette.textSecondary }]}>
                {formatDateTime(reminder.timestamp)}
              </Text>
              {reminder.description && (
                <Text style={[styles.reminderDescription, { color: palette.textSecondary }]}>
                  {reminder.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.reminderStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() + '15' }
            ]}>
              <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </View>

        {reminder.tags && reminder.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {reminder.tags.map((tag, index) => (
              <View key={index} style={[
                styles.tagChip,
                { backgroundColor: getTagColor(tag) }
              ]}>
                <Text style={[styles.tagText, { color: palette.textPrimary }]}>
                  {tag.charAt(0) + tag.slice(1).toLowerCase()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.reminderActions}>
          {isUpcoming && (
            <>
              <TouchableOpacity
                style={[styles.actionIconButton, { backgroundColor: "#22C55E" + '15' }]}
                onPress={() => handleStatusChange(reminder, ReminderStatus.COMPLETE)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconButton, { backgroundColor: "#EF4444" + '15' }]}
                onPress={() => handleStatusChange(reminder, ReminderStatus.MISSED)}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: palette.primary + '15' }]}
            onPress={() => handleEditReminder(reminder)}
          >
            <Ionicons name="pencil" size={20} color={palette.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionIconButton, { backgroundColor: "#EF4444" + '15' }]}
            onPress={() => handleDeleteReminder(reminder)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  // Enhanced Empty State Component
  const EmptyState = ({ tab }: { tab: string }) => {
    const getEmptyStateConfig = () => {
      switch (tab) {
        case "Upcoming":
          return {
            icon: "calendar-outline",
            title: "No upcoming reminders",
            subtitle: "You're all caught up! Add a new reminder to stay organized.",
            color: "#60A5FA"
          };
        case "Missed":
          return {
            icon: "checkmark-circle-outline",
            title: "No missed reminders",
            subtitle: "Great job staying on top of your tasks!",
            color: "#22C55E"
          };
        case "Completed":
          return {
            icon: "checkmark-done-outline" as any,
            title: "No completed reminders",
            subtitle: "Complete some tasks to see your progress here.",
            color: "#F59E0B"
          };
        default:
          return {
            icon: "calendar-outline",
            title: "No reminders",
            subtitle: "Start by adding your first reminder.",
            color: palette.primary
          };
      }
    };

    const config = getEmptyStateConfig();

    return (
      <View style={styles.emptyState}>
        <View style={[
          styles.emptyStateIcon,
          { backgroundColor: config.color + '15' }
        ]}>
          <Ionicons name={config.icon} size={48} color={config.color} />
        </View>
        <Text style={[styles.emptyStateTitle, { color: palette.textPrimary }]}>
          {config.title}
        </Text>
        <Text style={[styles.emptyStateSubtitle, { color: palette.textSecondary }]}>
          {config.subtitle}
        </Text>
      </View>
    );
  };

  const loadReminders = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setCurrentPage(0);
      setHasMore(true);
    }
    if (!hasMore && !reset) return;
    setLoading(true);
    try {
      const page = reset ? 0 : currentPage;
      console.log(`Loading reminders for user ${targetUserId}, page ${page}, reset: ${reset}`);
      const response = await reminderService.getReminders(page);
      console.log('Reminders response:', response);
      if (reset) {
        setReminders(response.reminders);
      } else {
        setReminders(prev => [...prev, ...response.reminders]);
      }
      setHasMore(response.hasMore);
      setCurrentPage(response.currentPage);
      console.log(`Loaded ${response.reminders.length} reminders, hasMore: ${response.hasMore}`);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId, hasMore, currentPage]);

  useEffect(() => {
    if (targetUserId) {
      reminderService.setUserId(targetUserId);
      // Note: loadReminders will be called by useFocusEffect, so we don't need to call it here
        setCurrentPage(0);
        setReminders([]);
        setHasMore(true);
        setLoading(true);
        loadReminders(true);
    }
  }, [targetUserId]);


  // Poll for new reminders every 30 seconds when screen is focused (less frequent since we have immediate refresh on focus)
  useEffect(() => {
    if (!targetUserId) return;
    
    const interval = setInterval(() => {
      loadReminders(true);
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [targetUserId, loadReminders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders(true);
  };

  const handleAddReminderManually = () => {
    setEditingReminder(null);
    setReminderFormVisible(true);
  };

  const handleAddReminderWithClara = () => navigation.navigate("AI" as never);

  const handleSaveReminder = async (reminderData: any) => {
    try {
      if (editingReminder) {
        const updatedReminder = await reminderService.updateReminder(editingReminder.id!, reminderData);
        setReminders(prev => prev.map(r => r.id === editingReminder.id ? updatedReminder : r));
      } else {
        const newReminder = await reminderService.createReminder({
          ...reminderData,
          userId: targetUserId || '',
        });
        setReminders(prev => [newReminder, ...prev]);
      }
      setReminderFormVisible(false);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error saving reminder:', error);
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    if (reminder.id) {
      setEditingReminder({
        id: reminder.id,
        title: reminder.title,
        timestamp: reminder.timestamp,
        description: reminder.description,
        tags: reminder.tags,
      });
      setReminderFormVisible(true);
    }
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.deleteReminder(reminder.id!);
              setReminders(prev => prev.filter(r => r.id !== reminder.id));
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', 'Failed to delete reminder. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleStatusChange = async (reminder: Reminder, newStatus: ReminderStatus) => {
    try {
      let updatedReminder: Reminder;
      switch (newStatus) {
        case ReminderStatus.COMPLETE:
          updatedReminder = await reminderService.markAsCompleted(reminder.id!);
          break;
        case ReminderStatus.MISSED:
          updatedReminder = await reminderService.markAsMissed(reminder.id!);
          break;
        case ReminderStatus.INCOMPLETE:
          updatedReminder = await reminderService.markAsIncomplete(reminder.id!);
          break;
        default:
          return;
      }
      setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r));
    } catch (error) {
      console.error('Error updating reminder status:', error);
      Alert.alert('Error', 'Failed to update reminder status. Please try again.');
    }
  };

  const filteredReminders = reminders.filter((r) => {
    const activeTabData = TABS.find(tab => tab.label === activeTab);
    return activeTabData ? r.status === activeTabData.status : true;
  });

  // Calculate counts for each tab
  const tabCounts = TABS.map(tab => ({
    ...tab,
    count: reminders.filter(r => r.status === tab.status).length
  }));

  const getTagColor = (tag: ReminderTag) => {
    switch (tag) {
      case ReminderTag.MEDICATION: return "#FFE0E0";
      case ReminderTag.APPOINTMENT: return "#E8E0FF";
      case ReminderTag.EVENT: return "#D0F0FF";
      case ReminderTag.TASK: return "#FFF4D6";
      case ReminderTag.HEALTH: return "#E0F0E0";
      case ReminderTag.WORK: return "#F0E0F0";
      case ReminderTag.FINANCE: return "#FFF0E0";
      case ReminderTag.TRAVEL: return "#E0F0FF";
      case ReminderTag.SOCIAL: return "#FFE0F0";
      case ReminderTag.EDUCATION: return "#F0FFE0";
      case ReminderTag.LEISURE: return "#E0FFF0";
      case ReminderTag.PERSONAL: return "#F0E0FF";
      default: return "#E0E0E0";
    }
  };

  const formatDateTime = (timestamp: string) => {
    // Parse as local time, ignoring the Z/UTC
    const localTimestamp = timestamp.replace('Z', '');
    const date = new Date(localTimestamp);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffDays === 0) {
      return `Today at ${timeString}`;
    } else if (diffDays === 1) {
      return `Tomorrow at ${timeString}`;
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${date.toLocaleDateString([], { weekday: 'long' })} at ${timeString}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeString}`;
    }
  };

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
                  Connected Elderly Users
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  Tap to switch between elderly users
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowElderlySelector(false)}>
                <Ionicons name="close" size={24} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.elderlyList}>
              {connectedElderly.length === 0 ? (
                <View style={styles.emptyListContainer}>
                  <Text style={[styles.emptyListText, { color: palette.textSecondary }]}>
                    No connected elderly users found
                  </Text>
                </View>
              ) : (
                connectedElderly.map((elderly) => (
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
                ))
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowElderlySelector(false)}
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
    <ScreenContainer>
      <Header 
        title="My Reminders" 
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={palette.primary} />
          </TouchableOpacity>
        }
        right={
          userRole === "caregiver" && (
            <CurrentElderlyButton onPress={() => setShowElderlySelector(true)} />
          )
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              if (hasMore && !loading) {
                loadReminders();
              }
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Action Buttons Section */}
          <View style={styles.actionButtonsSection}>
            {userRole === "elderly" ? (
              <>
                <ActionButton
                  title="Add Reminder Manually"
                  icon={<Ionicons name="add" size={20} color={palette.surface} />}
                  onPress={handleAddReminderManually}
                  variant="primary"
                  style={styles.addButton}
                />
                <ActionButton
                  title="Add with AI Assistant"
                  icon={<Ionicons name="chatbubble-outline" size={20} color={palette.textPrimary} />}
                  onPress={handleAddReminderWithClara}
                  variant="secondary"
                  style={styles.aiButton}
                />
              </>
            ) : (
              <ActionButton
                title="Add New Reminder"
                icon={<Ionicons name="add" size={20} color={palette.surface} />}
                onPress={handleAddReminderManually}
                variant="primary"
                style={styles.addButton}
              />
            )}
          </View>

          {/* Tabs Section */}
          <View style={styles.tabsSection}>
            {tabCounts.map((tab) => (
              <View key={tab.label} style={styles.tabContainer}>
                <TabButton
                  label={tab.label}
                  active={activeTab === tab.label}
                  onPress={() => setActiveTab(tab.label)}
                />
                {tab.count > 0 && (
                  <View style={[
                    styles.tabCountBadge,
                    { backgroundColor: '#F59E0B' }
                  ]}>
                    <Text style={[
                      styles.tabCountText,
                      { color: '#FFFFFF' }
                    ]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Reminders List */}
          {filteredReminders.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            <View style={styles.remindersList}>
              {filteredReminders.map((reminder) => (
                <ReminderCard key={reminder.id} reminder={reminder} />
              ))}
            </View>
          )}

          {/* Loading More Indicator */}
          {loading && hasMore && (
            <View style={styles.loadingMore}>
              <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
                Loading more reminders...
              </Text>
            </View>
          )}
        </ScrollView>
        <ReminderFormModal
          visible={reminderFormVisible}
          onClose={() => {
            setReminderFormVisible(false);
            setEditingReminder(null);
          }}
          onSave={handleSaveReminder}
          editingReminder={editingReminder}
        />
        {renderElderlySelector()}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: { 
    flex: 1 
  },
  scrollContent: { 
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2 
  },
  
  // Action Buttons Section
  actionButtonsSection: {
    marginBottom: spacing.xl,
  },
  actionButton: {
    borderRadius: metrics.buttonRadius,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginRight: spacing.sm,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    marginBottom: spacing.sm,
  },
  aiButton: {
    marginBottom: 0,
  },

  // Tabs Section
  tabsSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: metrics.buttonRadius,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tabContainer: {
    flex: 1,
    position: 'relative',
  },
  tabButton: {
    flex: 1,
    borderRadius: metrics.buttonRadius - 2,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabCountBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tabCountText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Reminders List
  remindersList: {
    gap: spacing.md,
  },

  // Reminder Card
  reminderCard: {
    borderRadius: metrics.cardRadius,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  reminderCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  reminderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  reminderTime: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  reminderDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reminderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: metrics.buttonRadius,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: metrics.buttonRadius,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Actions
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xl,
  },

  // Loading
  loadingMore: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
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
  closeButton: {
    padding: 4,
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
  elderlyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
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
  modalButton: {
    width: '100%',
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Profile picture styles
  profileImage: {
    overflow: 'hidden',
  },
  profileInitial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitialText: {
    fontWeight: 'bold',
  },
});

export default RemindersScreen; 