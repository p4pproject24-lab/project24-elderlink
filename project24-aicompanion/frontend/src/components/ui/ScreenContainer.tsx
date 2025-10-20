import React from 'react';
import { View, ScrollView, StyleProp, ViewStyle, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, ThemeMode } from '../../theme';

interface Props {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  header?: React.ReactNode;
}

const ScreenContainer: React.FC<Props> = ({ children, scrollable = false, style, header }) => {
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'left', 'right']}>
      {header}
      {scrollable ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[{ flex: 1, padding: spacing.lg }, style]}>
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, padding: spacing.lg }, style]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

export default ScreenContainer; 