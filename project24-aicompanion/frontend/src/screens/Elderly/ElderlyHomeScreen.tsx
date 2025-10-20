import React from "react"
import { View, StyleSheet, ScrollView, Image, useWindowDimensions, TouchableOpacity, useColorScheme } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation, useIsFocused, CommonActions, useNavigationContainerRef } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import Card from "../../components/ui/Card"
import DailySummaries from "../../components/DailySummaries"
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { colors, spacing, metrics, ThemeMode } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLinkedCaregiversForElderly } from '../../services/connectionService';
import { reminderService, ReminderStatus } from '../../services/reminderService';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const ElderlyHomeScreen = () => {
  const navigation = useNavigation<any>()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const { user } = useAuth();
  const displayName = user?.fullName || 'there';
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string>('');
  const [favoriteCaregiver, setFavoriteCaregiver] = React.useState<any>(null);
  const [loadingCaregivers, setLoadingCaregivers] = React.useState(false);
  const [upcomingRemindersCount, setUpcomingRemindersCount] = React.useState(0);
  const isFocused = useIsFocused();

  // Load avatar preview URL from AsyncStorage
  React.useEffect(() => {
    const loadAvatarPreview = async () => {
      try {
        const storedPreviewUrl = await AsyncStorage.getItem('avatarPreviewUrl');
        if (storedPreviewUrl) {
          setAvatarPreviewUrl(storedPreviewUrl);
        }
      } catch (error) {
        console.error('Failed to load avatar preview URL:', error);
      }
    };
    
    loadAvatarPreview();
  }, [isFocused]); // Reload when screen comes into focus

  // Load favorite caregiver
  React.useEffect(() => {
    const loadFavoriteCaregiver = async () => {
      if (!user?.firebaseUid) return;
      
      try {
        setLoadingCaregivers(true);
        const caregivers = await getLinkedCaregiversForElderly(user.firebaseUid);
        if (caregivers && caregivers.length > 0) {
          // For now, just use the first caregiver as "favorite"
          // In the future, you could implement actual favorite logic
          setFavoriteCaregiver(caregivers[0]);
        }
      } catch (error) {
        console.error('Failed to load caregivers:', error);
      } finally {
        setLoadingCaregivers(false);
      }
    };
    
    loadFavoriteCaregiver();
  }, [user?.firebaseUid, isFocused]);

  // Fetch upcoming reminders count
  React.useEffect(() => {
    const fetchRemindersCount = async () => {
      if (!user?.firebaseUid) return;
      
      try {
        reminderService.setUserId(user.firebaseUid);
        const response = await reminderService.getReminders(0);
        const upcomingCount = response.reminders.filter(
          reminder => reminder.status === ReminderStatus.INCOMPLETE
        ).length;
        setUpcomingRemindersCount(upcomingCount);
      } catch (error) {
        console.error('Error fetching reminders count:', error);
        setUpcomingRemindersCount(0);
      }
    };

    fetchRemindersCount();
  }, [user?.firebaseUid, isFocused]);

  // Poll for reminder count updates every 15 seconds when screen is focused
  React.useEffect(() => {
    if (!user?.firebaseUid || !isFocused) return;
    
    const interval = setInterval(() => {
      const fetchRemindersCount = async () => {
        try {
          reminderService.setUserId(user.firebaseUid);
          const response = await reminderService.getReminders(0);
          const upcomingCount = response.reminders.filter(
            reminder => reminder.status === ReminderStatus.INCOMPLETE
          ).length;
          setUpcomingRemindersCount(upcomingCount);
        } catch (error) {
          console.error('Error fetching reminders count (polling):', error);
        }
      };
      fetchRemindersCount();
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(interval);
  }, [user?.firebaseUid, isFocused]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          isTablet && { paddingHorizontal: spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileSection}>
            <View style={styles.profileLeft}>
              <View style={[styles.profileImageContainer, { backgroundColor: palette.primary + '20' }]}>
                {user?.profileImageUrl ? (
                  <Image 
                    source={{ uri: user.profileImageUrl }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={[styles.profilePlaceholder, { backgroundColor: palette.primary }]}>
                    <Ionicons name="person" size={32} color={palette.surface} />
                  </View>
                )}
              </View>
              <View style={styles.profileTextContainer}>
                <Text variant="heading1" style={[styles.greeting, { color: palette.textPrimary }]}>
                  {getGreeting()}, {displayName}
                </Text>
                <Text variant="heading2" style={[styles.userName, { color: palette.textSecondary }]}>
                  {loadingCaregivers ? (
                    'Loading caregiver...'
                  ) : favoriteCaregiver ? (
                    `Caregiver: ${favoriteCaregiver.fullName}`
                  ) : (
                    'No caregiver synced yet'
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickActionsSection}>
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.getParent()?.navigate("Assistant")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: palette.primary + '15' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color={palette.primary} />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Chat with Companion
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.navigate("DailyCheckin")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' + '15' }]}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Daily Check-in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.getParent()?.navigate("Assistant", { initialMode: "game" })}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FF9800' + '15' }]}>
                <Ionicons name="bulb" size={24} color="#FF9800" />
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Brain Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
              onPress={() => navigation.navigate("Reminders")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E91E63' + '15' }]}>
                <Ionicons name="notifications" size={24} color="#E91E63" />
                {upcomingRemindersCount > 0 && (
                  <View style={[styles.taskBadge, { backgroundColor: '#E91E63' }]}>
                    <Text style={[styles.taskBadgeText, { color: palette.surface }]}>
                      {upcomingRemindersCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text variant="body" style={[styles.quickActionTitle, { color: palette.textPrimary }]}>
                Reminders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Companion Card */}
        <Card highlight style={[styles.aiCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={styles.aiCardContent}>
            <View style={styles.aiCardLeft}>
              <Text variant="heading2" style={[styles.aiCardTitle, { color: palette.textPrimary }]}>
                Your AI Companion
              </Text>
              <Text variant="body" style={[styles.aiCardDescription, { color: palette.textSecondary }]}>
                Ready to help you with daily tasks, conversations, and activities
              </Text>
              <Button
                title="Start Chat"
                onPress={() => navigation.getParent()?.navigate("Assistant")}
                icon={<Ionicons name="arrow-forward" size={16} color={palette.surface} />}
                variant="primary"
                style={styles.aiChatButton}
                fullWidth={false}
              />
            </View>
            <View style={styles.aiCardRight}>
              {avatarPreviewUrl ? (
                <Image 
                  source={{ uri: avatarPreviewUrl }} 
                  style={styles.aiAvatarImage} 
                />
              ) : (
                <View style={[styles.aiAvatarContainer, { backgroundColor: palette.primary + '10' }]}>
                  <Ionicons name="person-circle" size={48} color={palette.primary} />
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Daily Summaries Section */}
        <Card highlight style={[styles.summariesCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <DailySummaries />
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

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
  headerSection: {
    marginBottom: spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  taskBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profilePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
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
  aiCard: {
    borderRadius: 20,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiCardLeft: {
    flex: 1,
    marginRight: spacing.lg,
  },
  aiCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  aiCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  aiChatButton: {
    alignSelf: 'flex-start',
  },
  aiCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarImage: {
    width: 80,
    height: 100, // 80 * 1.25 = 100 for 4:5 aspect ratio like in settings modal
    borderRadius: 12,
    resizeMode: 'cover',
    marginTop: spacing.sm,
  },
  summariesCard: {
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
})

export default ElderlyHomeScreen 