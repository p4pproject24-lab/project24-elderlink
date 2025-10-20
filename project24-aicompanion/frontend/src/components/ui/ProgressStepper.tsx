import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './Text';
import { colors, spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number; // 1-based
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStep }) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isLast = stepNum === steps.length;
          return (
            <React.Fragment key={step}>
              <View style={styles.centered}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isCompleted || isCurrent ? palette.primary : palette.background,
                      borderColor: isCurrent ? palette.primary : palette.border,
                      borderWidth: isCurrent ? 3 : 1,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={20} color={palette.surface} />
                  ) : isCurrent ? (
                    <Text style={{ color: palette.surface, fontWeight: 'bold', fontSize: 18 }}>{stepNum}</Text>
                  ) : (
                    <Text style={{ color: palette.primary, fontWeight: 'bold', fontSize: 18 }}>{stepNum}</Text>
                  )}
                </View>
                {/* Label directly below the circle */}
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: isCurrent ? palette.primary : palette.textSecondary,
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      marginTop: 6,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {step}
                </Text>
              </View>
              {!isLast && (
                <View style={[styles.line, { backgroundColor: isCompleted ? palette.primary : palette.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 36;
const LINE_WIDTH = 40;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  line: {
    height: 4,
    width: LINE_WIDTH,
    marginHorizontal: spacing.sm,
    borderRadius: 2,
  },
  labelText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ProgressStepper; 