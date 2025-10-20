import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, metrics } from '../../theme';
import { useFontSizes } from '../../theme/fontSizes';
import { useGames } from '../../hooks/useGames';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import GameCard from '../../components/GameCard';
import type { GameSession, GamePreview } from '../../types/Game';
import { Ionicons } from '@expo/vector-icons';

const GamesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  
  const {
    sessions,
    loading,
    error,
    loadSessions,
    generatePreview,
    createSession,
    deleteSession,
    clearError,
  } = useGames();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [customGameDescription, setCustomGameDescription] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<GamePreview | null>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleGeneratePreview = async () => {
    const preview = await generatePreview();
    if (preview) {
      setGeneratedPreview(preview);
      setShowCreateOptions(true);
    }
  };

  const handleCreateGeneratedGame = async () => {
    if (!generatedPreview) return;
    
    const session = await createSession({
      gameType: 'generated',
      userDescription: `${generatedPreview.title}: ${generatedPreview.description}`,
    });
    
    if (session) {
      setShowCreateOptions(false);
      setGeneratedPreview(null);
      // Navigate to the new game session
      navigation.navigate('GameSession', { sessionId: session.id });
    }
  };

  const handleCreateCustomGame = async () => {
    if (!customGameDescription.trim()) {
      Alert.alert('Error', 'Please enter a game description');
      return;
    }

    const session = await createSession({
      gameType: 'custom',
      userDescription: customGameDescription.trim(),
    });

    if (session) {
      setShowCreateOptions(false);
      setCustomGameDescription('');
      // Navigate to the new game session
      navigation.navigate('GameSession', { sessionId: session.id });
    }
  };

  const handleDeleteSession = (session: GameSession) => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete "${session.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  };

  const handlePlaySession = (session: GameSession) => {
    navigation.navigate('GameSession', { sessionId: session.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="heading1" style={[styles.title, { color: palette.textPrimary }]}>
          Cognitive Games
        </Text>
        <Text variant="body" style={[styles.subtitle, { color: palette.textSecondary }]}>
          Keep your mind active with fun, engaging games
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Create New Game Section */}
        <Card highlight>
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Create New Game
          </Text>
          
          {!showCreateOptions ? (
            <View style={styles.createOptions}>
              <Button
                title="Generate Random Game"
                onPress={handleGeneratePreview}
                loading={loading}
                icon={<Ionicons name="dice" size={20} color={palette.surface} />}
              />
              <Button
                title="Create Custom Game"
                onPress={() => setShowCreateOptions(true)}
                variant="secondary"
                icon={<Ionicons name="create" size={20} color={palette.primary} />}
              />
            </View>
          ) : (
            <View style={styles.createForm}>
              {generatedPreview ? (
                <View style={styles.previewCard}>
                  <Text variant="heading2" style={[styles.previewTitle, { color: palette.textPrimary }]}>
                    {generatedPreview.title}
                  </Text>
                  <Text variant="body" style={[styles.previewDescription, { color: palette.textSecondary }]}>
                    {generatedPreview.description}
                  </Text>
                  <View style={styles.previewActions}>
                    <Button
                      title="Create This Game"
                      onPress={handleCreateGeneratedGame}
                      loading={loading}
                    />
                    <Button
                      title="Generate Another"
                      onPress={handleGeneratePreview}
                      variant="secondary"
                    />
                    <Button
                      title="Cancel"
                      onPress={() => {
                        setShowCreateOptions(false);
                        setGeneratedPreview(null);
                      }}
                      variant="secondary"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.customForm}>
                  <Text variant="body" style={[styles.formLabel, { color: palette.textPrimary }]}>
                    Describe the type of game you'd like to play:
                  </Text>
                  <RNTextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                        color: palette.textPrimary,
                      },
                    ]}
                    placeholder="e.g., A word association game about animals"
                    placeholderTextColor={palette.textSecondary}
                    value={customGameDescription}
                    onChangeText={setCustomGameDescription}
                    multiline
                    numberOfLines={3}
                  />
                  <View style={styles.formActions}>
                    <Button
                      title="Create Game"
                      onPress={handleCreateCustomGame}
                      loading={loading}
                    />
                    <Button
                      title="Cancel"
                      onPress={() => setShowCreateOptions(false)}
                      variant="secondary"
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Game Sessions Section */}
        <View style={styles.sessionsSection}>
          <Text variant="heading2" style={[styles.sectionTitle, { color: palette.textPrimary }]}>
            Your Games
          </Text>
          
          {sessions.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="game-controller" size={48} color={palette.textSecondary} />
                <Text variant="body" style={[styles.emptyText, { color: palette.textSecondary }]}>
                  No games yet. Create your first game to get started!
                </Text>
              </View>
            </Card>
          ) : (
            sessions.map((session) => (
              <GameCard
                key={session.id}
                session={session}
                onPlay={handlePlaySession}
                onDelete={handleDeleteSession}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + 80, // Extra padding for bottom navigation
  },
  sectionTitle: {
    marginBottom: spacing.lg,
  },
  createOptions: {
    gap: spacing.md,
  },
  createForm: {
    gap: spacing.lg,
  },
  previewCard: {
    gap: spacing.md,
  },
  previewTitle: {
    fontWeight: '600',
  },
  previewDescription: {
    lineHeight: 20,
  },
  previewActions: {
    gap: spacing.sm,
  },
  customForm: {
    gap: spacing.md,
  },
  formLabel: {
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: metrics.inputRadius,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  formActions: {
    gap: spacing.sm,
  },
  sessionsSection: {
    marginTop: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default GamesScreen;
