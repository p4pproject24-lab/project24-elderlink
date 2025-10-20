import '@testing-library/jest-native/extend-expect';

// Mock react-native-reanimated (jest-expo also provides this, but keep explicit for stability)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock SafeAreaContext metrics to avoid layout issues
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, left: 0, right: 0, bottom: 0 };
  return {
    useSafeAreaInsets: () => inset,
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => React.createElement(View, { style }, children),
  };
});

// Mock expo-av minimal
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    setAudioModeAsync: jest.fn(async () => {}),
    Recording: {
      createAsync: jest.fn(async () => ({ recording: { stopAndUnloadAsync: jest.fn(), getURI: () => 'file://dummy.wav' } })),
    },
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
    Sound: jest.fn().mockImplementation(() => ({
      loadAsync: jest.fn(async () => {}),
      playAsync: jest.fn(async () => {}),
      unloadAsync: jest.fn(async () => {}),
      setOnPlaybackStatusUpdate: jest.fn(() => {}),
    })),
  },
}));

// Force TTS availability by mocking dynamic import used in TTSButton
jest.mock('../src/services/ttsService', () => ({
  ttsService: {
    getCurrentLanguage: jest.fn(async () => 'en-US'),
  },
}), { virtual: true });

// Provide stable color scheme
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ default: () => 'light' }));

// Minimal mocks for Expo icons and linear-gradient
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

// Virtual mock to satisfy RN testing libs expecting this helper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Basic mock for gesture-handler used by navigators/components
jest.mock('react-native-gesture-handler', () => ({}), { virtual: true });

// Soften React Navigation to avoid native internals during tests
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    NavigationContainer: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Note: Avoid mocking RN NativeAnimatedHelper unless present; many setups don't require it

// Silence console noise in tests
/* eslint-disable no-console */
console.log = jest.fn();
console.warn = jest.fn();
const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = String(args[0] || '');
  if (msg.includes('not wrapped in act')) return;
  // By default, silence error logs to keep output clean
  // If needed for debugging, comment the next line to re-enable
  return;
  // originalError(...args as any);
};


