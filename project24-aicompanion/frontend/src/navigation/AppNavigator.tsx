import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '../hooks/useRole';
import { useColorScheme } from 'react-native';
import { colors } from '../theme';
import type { BottomTabNavigationOptions, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Shared screens
import RemindersScreen from '../screens/shared/RemindersScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import MapsScreen from '../screens/shared/MapsScreen';
import SummaryScreen from '../screens/shared/SummaryScreen';
// Elderly screens
import ElderlyHomeScreen from '../screens/Elderly/ElderlyHomeScreen';
import AiChatScreen from '../screens/Elderly/AiChatScreen';
import DailyCheckinScreen from '../screens/Elderly/DailyCheckinScreen';
import SummaryDetailScreen from '../screens/Elderly/SummaryDetailScreen';
import DailySummariesScreen from '../screens/Elderly/DailySummariesScreen';
import GamesScreen from '../screens/Elderly/GamesScreen';
import GameSessionScreen from '../screens/Elderly/GameSessionScreen';
// Wrap to satisfy navigator prop typing if the screen declares a different param list
const GameSessionScreenWrapper: React.FC<any> = (props) => (
  <GameSessionScreen {...props} />
);
// Caregiver screens
import CaregiverHomeScreen from '../screens/Caregiver/CaregiverHomeScreen';
import CaregiverMapScreen from '../screens/Caregiver/CaregiverMapScreen';
import CaregiverDailySummariesScreen from '../screens/Caregiver/CaregiverDailySummariesScreen';
import CaregiverSummaryDetailScreen from '../screens/Caregiver/CaregiverSummaryDetailScreen';
import { BlurView } from 'expo-blur';

type ElderlyStackParamList = {
  Home: undefined;
  DailyCheckin: undefined;
  Assistant: undefined;
  Games: undefined;
  // Use any for params if the screen expects route/navigation props with params
  GameSession: any;
};

const Tab = createBottomTabNavigator();
const ElderlyStack = createNativeStackNavigator<ElderlyStackParamList>();
const DailySummariesStack = createNativeStackNavigator();
const CaregiverDailySummariesStack = createNativeStackNavigator();

function DailySummariesStackNavigator() {
  return (
    <DailySummariesStack.Navigator screenOptions={{ headerShown: false }}>
      <DailySummariesStack.Screen name="DailySummaries" component={DailySummariesScreen} />
      <DailySummariesStack.Screen name="SummaryDetail" component={SummaryDetailScreen} />
    </DailySummariesStack.Navigator>
  );
}

function CaregiverDailySummariesStackNavigator() {
  return (
    <CaregiverDailySummariesStack.Navigator screenOptions={{ headerShown: false }}>
      <CaregiverDailySummariesStack.Screen name="CaregiverDailySummaries" component={CaregiverDailySummariesScreen} />
      <CaregiverDailySummariesStack.Screen name="CaregiverSummaryDetail" component={CaregiverSummaryDetailScreen} />
    </CaregiverDailySummariesStack.Navigator>
  );
}

function ElderlyStackNavigator() {
  return (
    <ElderlyStack.Navigator screenOptions={{ headerShown: false }}>
      <ElderlyStack.Screen name="Home" component={ElderlyHomeScreen} />
      <ElderlyStack.Screen name="DailyCheckin" component={DailyCheckinScreen} />
      <ElderlyStack.Screen name="Assistant" component={AiChatScreen} />
      <ElderlyStack.Screen name="Games" component={GamesScreen} />
      <ElderlyStack.Screen name="GameSession" component={GameSessionScreenWrapper} />
    </ElderlyStack.Navigator>
  );
}

const AppNavigator: React.FC = () => {
  const { role } = useRole();
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const isElderly = role === 'ELDERLY';

  console.log('[AppNavigator] Rendering with role:', role, 'isElderly:', isElderly);

  // Force re-render when role changes by using role as key
  return (
    <Tab.Navigator
      key={role} // This forces a complete re-render when role changes
      screenOptions={({ route }: { route: RouteProp<any> }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: { 
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={20} 
            tint={colorScheme === 'dark' ? 'dark' : 'light'} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
        ),
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          let iconName = 'home';
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Reminders':
              iconName = 'notifications';
              break;
            case 'Map':
              iconName = 'map';
              break;
            case 'Location':
              iconName = 'map';
              break;
            case 'Assistant':
              iconName = 'chatbubbles';
              break;
            case 'Insights':
              iconName = 'document-text';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      
      {isElderly ? (
        <>
          <Tab.Screen name="Home" component={ElderlyStackNavigator} />
          <Tab.Screen name="Reminders" component={RemindersScreen} />
          <Tab.Screen name="Map" component={MapsScreen} />
          <Tab.Screen name="Assistant" component={AiChatScreen} />
          <Tab.Screen name="Insights" component={DailySummariesStackNavigator} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Home" component={CaregiverHomeScreen} />
          <Tab.Screen name="Reminders" component={RemindersScreen} />
          <Tab.Screen name="Location" component={CaregiverMapScreen} />
          <Tab.Screen name="Insights" component={CaregiverDailySummariesStackNavigator} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Tab.Navigator>
  );
};

export default AppNavigator; 