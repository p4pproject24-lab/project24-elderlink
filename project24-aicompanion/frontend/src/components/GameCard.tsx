import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, spacing, metrics } from '../theme';
import Card from './ui/Card';
import Text from './ui/Text';
import type { GameSession } from '../types/Game';
import { Ionicons } from '@expo/vector-icons';

interface GameCardProps {
  session: GameSession;
  onPlay: (session: GameSession) => void;
  onDelete: (session: GameSession) => void;
}

const GameCard: React.FC<GameCardProps> = ({ session, onPlay, onDelete }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card style={styles.card}>
      {/* Top row with title and action buttons */}
      <View style={styles.topRow}>
        <Text variant="heading2" style={[styles.title, { color: palette.textPrimary }]}>
          {session.title}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity testID="gamecard-button"
            style={[styles.actionButton, { backgroundColor: palette.primary }]}
            onPress={() => onPlay(session)}
          >
            <Ionicons name="play" size={20} color={palette.surface} />
          </TouchableOpacity>
          <TouchableOpacity testID="gamecard-button"
            style={[styles.actionButton, { backgroundColor: palette.error }]}
            onPress={() => onDelete(session)}
          >
            <Ionicons name="trash" size={20} color={palette.surface} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Description takes full width */}
      <Text variant="body" style={[styles.description, { color: palette.textSecondary }]}>
        {session.description}
      </Text>
      
      {/* Date at bottom */}
      <Text variant="caption" style={[styles.date, { color: palette.textSecondary }]}>
        Last played: {formatDate(session.lastActivityAt)}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  date: {
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GameCard;
