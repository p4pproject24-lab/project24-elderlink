import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import Card from '../../components/ui/Card';
import ScreenContainer from '../../components/ui/ScreenContainer';
import Header from '../../components/ui/Header';
import { useAuthContext } from '../../contexts/AuthContext';
import { useWeather } from '../../hooks/useWeather';
import { colors, spacing, metrics } from '../../theme';
import { WeatherData } from '../../services/weatherService';
import Svg, { Circle } from 'react-native-svg';
import { TTSWrapper } from '../../components/TTSWrapper';
import { reminderService, ReminderStatus } from '../../services/reminderService';

const GLASS_CARD_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.35)',
  borderColor: 'rgba(139,92,246,0.18)',
  borderWidth: 1.5,
  borderRadius: 24,
  overflow: 'hidden' as 'hidden',
  marginBottom: 24,
};

// Circular Progress Component
const CircularProgress = ({ progress, size = 80, strokeWidth = 8, color = '#8b5cf6' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke="rgba(139,92,246,0.2)"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

// Weather Metric Component
const WeatherMetric = ({ icon, value, unit, label, color = '#8b5cf6' }: {
  icon: string;
  value: number;
  unit: string;
  label: string;
  color?: string;
}) => (
  <View style={styles.metricContainer}>
    <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={styles.metricContent}>
      <Text style={[styles.metricValue, { color }]}>{value}{unit}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  </View>
);

// Temperature Range Slider
const TemperatureRange = ({ current, feelsLike, min = 0, max = 40 }: {
  current: number;
  feelsLike: number;
  min?: number;
  max?: number;
}) => {
  const getTemperatureColor = (temp: number) => {
    if (temp < 10) return '#3b82f6'; // Cold - Blue
    if (temp < 20) return '#10b981'; // Cool - Green
    if (temp < 30) return '#f59e0b'; // Warm - Orange
    return '#ef4444'; // Hot - Red
  };

  const currentColor = getTemperatureColor(current);
  const feelsColor = getTemperatureColor(feelsLike);

  return (
    <View style={styles.temperatureContainer}>
      <View style={styles.temperatureHeader}>
        <Text style={[styles.temperatureLabel, { color: currentColor }]}>Temperature</Text>
        <View style={styles.temperatureRange}>
          <Text style={styles.rangeText}>{min}°</Text>
          <Text style={styles.rangeText}>{max}°</Text>
        </View>
      </View>
      <View style={styles.temperatureSlider}>
        <View style={[styles.sliderTrack, { backgroundColor: 'rgba(139,92,246,0.2)' }]}>
          <View 
            style={[
              styles.sliderFill, 
              { 
                width: `${((current - min) / (max - min)) * 100}%`,
                backgroundColor: currentColor 
              }
            ]} 
          />
        </View>
        <View style={[styles.temperatureIndicator, { left: `${((current - min) / (max - min)) * 100}%` }]}>
          <Text style={[styles.temperatureValue, { color: currentColor }]}>{current}°</Text>
        </View>
      </View>
      <View style={styles.feelsLikeContainer}>
        <Text style={[styles.feelsLikeText, { color: feelsColor }]}>
          Feels like {feelsLike}°
        </Text>
      </View>
    </View>
  );
};

const DailyCheckinScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthContext();
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const isTablet = width >= 768;

  const { weatherData, locationData, loading, error, refresh } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [upcomingRemindersCount, setUpcomingRemindersCount] = useState(0);

  useEffect(() => {
    refresh();
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timeInterval);
  }, [refresh]);

  // Fetch upcoming reminders count
  useEffect(() => {
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
  }, [user?.firebaseUid]);

  // Poll for reminder count updates every 15 seconds
  useEffect(() => {
    if (!user?.firebaseUid) return;
    
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
  }, [user?.firebaseUid]);

  const getWeatherTip = (weather: WeatherData) => {
    if (weather.temperature > 27) {
      return 'Stay hydrated and avoid prolonged sun exposure!';
    } else if (weather.temperature > 16) {
      return 'Perfect weather for outdoor activities!';
    } else if (weather.temperature > 4) {
      return 'Good weather for a brisk walk with a light jacket.';
    } else {
      return 'Bundle up and stay warm!';
    }
  };

  const getWellnessTip = (weather: WeatherData) => {
    if (weather.humidity > 70) {
      return 'High humidity today. Consider indoor activities to stay comfortable.';
    } else if (weather.temperature > 24) {
      return 'Great day for light exercise and staying active!';
    } else {
      return 'Perfect conditions for your daily wellness routine.';
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <ScreenContainer>
        <Header 
          title="Daily Check-in" 
          left={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={palette.primary} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Getting your daily information...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header 
        title="Daily Check-in" 
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={palette.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      > 
        <View style={styles.profileSection}>
          <Image source={{ uri: user?.profileImageUrl || 'https://via.placeholder.com/150' }} style={styles.profileImage} />
          <Text style={[styles.greeting, { color: palette.primary, fontWeight: '700', fontSize: 22 }]}>{getGreeting()}, {user?.fullName || 'Margaret'}!</Text>
          {locationData && (
            <>
              <Text style={[styles.locationText, { color: palette.textSecondary }]}>{locationData.city}, {locationData.region}, {locationData.country}</Text>
              <Text style={[styles.localtimeText, { color: palette.textSecondary }]}>Local time: {locationData.localtime}</Text>
            </>
          )}
        </View>

        {weatherData && locationData && (
          <Card highlight style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={{ position: 'relative' }}>
              {/* Weather Header */}
              <View style={styles.weatherHeader}>
                <View style={styles.weatherMain}>
                  <View style={[styles.iconContainer, { backgroundColor: palette.primaryLight }] }>
                    {weatherData.icon ? (
                      <Image source={{ uri: weatherData.icon }} style={styles.weatherIcon} />
                    ) : (
                      <Ionicons name="partly-sunny-outline" size={28} color={palette.primary} />
                    )}
                  </View>
                  <View style={styles.weatherInfoContainer}>
                    <Text style={[styles.weatherCondition, { color: palette.primary, fontWeight: '700' }]}>{weatherData.condition}</Text>
                    <Text style={[styles.weatherDescription, { color: palette.textPrimary, fontWeight: '500' }]}>{weatherData.description}</Text>
                  </View>
                </View>
                <View style={styles.temperatureDisplay}>
                  <Text style={[styles.temperatureLarge, { color: palette.primary, fontWeight: '700' }]}>{weatherData.temperature}°</Text>
                </View>
              </View>

              {/* Temperature Range Slider */}
              <TemperatureRange 
                current={weatherData.temperature} 
                feelsLike={weatherData.feelsLike}
              />

              {/* Weather Metrics Grid */}
              <View style={styles.metricsGrid}>
                <WeatherMetric 
                  icon="water-outline" 
                  value={weatherData.humidity} 
                  unit="%" 
                  label="Humidity" 
                  color="#3b82f6"
                />
                <WeatherMetric 
                  icon="airplane-outline" 
                  value={weatherData.windSpeed} 
                  unit=" km/h" 
                  label="Wind Speed" 
                  color="#10b981"
                />
                <WeatherMetric 
                  icon="speedometer-outline" 
                  value={weatherData.pressure} 
                  unit=" hPa" 
                  label="Pressure" 
                  color="#f59e0b"
                />
                <WeatherMetric 
                  icon="sunny-outline" 
                  value={weatherData.uv} 
                  unit="" 
                  label="UV Index" 
                  color="#ef4444"
                />
              </View>

              {/* Circular Progress Indicators */}
              <View style={styles.progressContainer}>
                <View style={styles.progressItem}>
                  <CircularProgress 
                    progress={weatherData.humidity} 
                    size={60} 
                    color="#3b82f6"
                  />
                  <Text style={styles.progressLabel}>Humidity</Text>
                </View>
                <View style={styles.progressItem}>
                  <CircularProgress 
                    progress={weatherData.cloud} 
                    size={60} 
                    color="#8b5cf6"
                  />
                  <Text style={styles.progressLabel}>Cloud Cover</Text>
                </View>
                <View style={styles.progressItem}>
                  <CircularProgress 
                    progress={Math.min(weatherData.uv * 10, 100)} 
                    size={60} 
                    color="#ef4444"
                  />
                  <Text style={styles.progressLabel}>UV Level</Text>
                </View>
              </View>

              <Text style={[styles.weatherTip, { color: palette.textSecondary, fontWeight: '500' }]}>{getWeatherTip(weatherData)}</Text>
              <Text style={[styles.weatherUpdated, { color: palette.textSecondary, fontSize: 12 }]}>Last updated: {weatherData.lastUpdated}</Text>
            </View>
          </Card>
        )}

        <TTSWrapper
          text={weatherData ? `${getWellnessTip(weatherData)} ${weatherData.temperature > 21 ? 'Perfect day for a 15-minute walk!' : 'Try some gentle indoor exercises.'}` : ''}
          buttonSize={24}
          buttonColor={palette.primary}
          buttonPosition="top-right"
        >
          <Card highlight style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={{ position: 'relative' }}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: palette.primaryLight }] }>
                  <Ionicons name="heart-outline" size={28} color={palette.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: palette.primary, fontWeight: '700' }]}>Wellness Tip</Text>
              </View>
              <Text style={[styles.tipText, { color: palette.textPrimary, fontWeight: '500', fontSize: 16 }]}> 
                {weatherData && getWellnessTip(weatherData)}
              </Text>
              <Text style={[styles.tipAction, { color: palette.textSecondary, fontWeight: '400' }] }>
                {weatherData && weatherData.temperature > 21 ? 'Perfect day for a 15-minute walk!' : 'Try some gentle indoor exercises.'}
              </Text>
            </View>
          </Card>
        </TTSWrapper>

        <TTSWrapper
          text={weatherData ? `${weatherData.temperature > 24
            ? 'Sunlight helps your body produce vitamin D, which is essential for bone health!'
            : 'Regular physical activity, even in cooler weather, can boost your mood and energy levels.'
          } ${weatherData.temperature > 24
            ? 'Consider spending 10-15 minutes outside today!'
            : 'Would you like to try some indoor exercises?'
          }` : ''}
          buttonSize={24}
          buttonColor={palette.primary}
          buttonPosition="top-right"
        >
          <Card highlight style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={{ position: 'relative' }}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: palette.primaryLight }] }>
                  <Ionicons name="bulb-outline" size={28} color={palette.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: palette.primary, fontWeight: '700' }]}>Did You Know?</Text>
              </View>
              <Text style={[styles.factText, { color: palette.textPrimary, fontWeight: '500', fontSize: 16 }] }>
                {weatherData && weatherData.temperature > 24
                  ? 'Sunlight helps your body produce vitamin D, which is essential for bone health!'
                  : 'Regular physical activity, even in cooler weather, can boost your mood and energy levels.'
                }
              </Text>
              <Text style={[styles.factQuestion, { color: palette.textSecondary, fontWeight: '400' }] }>
                {weatherData && weatherData.temperature > 24
                  ? 'Consider spending 10-15 minutes outside today!'
                  : 'Would you like to try some indoor exercises?'
                }
              </Text>
            </View>
          </Card>
        </TTSWrapper>

        <TTSWrapper
          text={`You have ${upcomingRemindersCount} upcoming reminder${upcomingRemindersCount !== 1 ? 's' : ''} today. Tap to view your reminders.`}
          buttonSize={24}
          buttonColor={palette.primary}
          buttonPosition="top-right"
        >
          <Card highlight style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={{ position: 'relative' }}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: palette.primaryLight }] }>
                  <Ionicons name="notifications-outline" size={28} color={palette.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: palette.primary, fontWeight: '700' }]}>Today's Reminders</Text>
              </View>
              <Text style={[styles.reminderText, { color: palette.textPrimary, fontWeight: '500', fontSize: 16 }]}>
                You have {upcomingRemindersCount} upcoming reminder{upcomingRemindersCount !== 1 ? 's' : ''} today
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Reminders' as never)}>
                <Text style={[styles.reminderAction, { color: palette.textSecondary, fontWeight: '400' }]}>Tap to view your reminders</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </TTSWrapper>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    paddingHorizontal: 64,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },
  localtimeText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    marginBottom: 2,
  },
  card: {
    marginBottom: spacing.xl,
    borderRadius: metrics.cardRadius,
    padding: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  weatherIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  weatherInfo: {
    marginBottom: 8,
  },
  weatherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weatherDetail: {
    fontSize: 14,
    fontWeight: '400',
  },
  weatherTip: {
    marginTop: 8,
    fontSize: 15,
  },
  weatherUpdated: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '400',
  },
  tipText: {
    marginBottom: 8,
  },
  tipAction: {
    fontSize: 14,
    marginTop: 2,
  },
  factText: {
    marginBottom: 8,
  },
  factQuestion: {
    fontSize: 14,
    marginTop: 2,
  },
  reminderText: {
    marginBottom: 8,
  },
  reminderAction: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  // New weather styles
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherInfoContainer: {
    flex: 1,
  },
  weatherCondition: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  weatherDescription: {
    fontSize: 14,
    opacity: 0.8,
  },
  temperatureDisplay: {
    alignItems: 'center',
  },
  temperatureLarge: {
    fontSize: 32,
    fontWeight: '700',
  },
  temperatureContainer: {
    marginBottom: 20,
  },
  temperatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  temperatureLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  temperatureRange: {
    flexDirection: 'row',
    gap: 20,
  },
  rangeText: {
    fontSize: 12,
    opacity: 0.6,
  },
  temperatureSlider: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  temperatureIndicator: {
    position: 'absolute',
    top: -10,
    transform: [{ translateX: -20 }],
  },
  temperatureValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  feelsLikeContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  feelsLikeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricContainer: {
    width: '49%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    flexShrink: 1,
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default DailyCheckinScreen; 