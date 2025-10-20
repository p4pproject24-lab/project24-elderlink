import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { colors, spacing, metrics } from '../theme';
import { useGames } from '../hooks/useGames';
import Card from './ui/Card';
import Button from './ui/Button';
import Text from './ui/Text';
import type { GameSession, GamePreview } from '../types/Game';
import { Ionicons } from '@expo/vector-icons';

interface GamesSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onGameSelected: (gameSession: GameSession) => void;
}

const GamesSelectionModal: React.FC<GamesSelectionModalProps> = ({
  visible,
  onClose,
  onGameSelected,
}) => {
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

  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [customGameDescription, setCustomGameDescription] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<GamePreview | null>(null);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible, loadSessions]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

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
      onGameSelected(session);
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
      onGameSelected(session);
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
    onGameSelected(session);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={palette.textPrimary} />
          </TouchableOpacity>
          <Text variant="heading2" style={[styles.title, { color: palette.textPrimary }]}>
            Select a Brain Game
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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
                        title="Play This Game"
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

          {/* Existing Games Section */}
          {sessions.length > 0 && (
            <View style={styles.sessionsSection}>
              <Text variant="heading2" style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                Continue Previous Games
              </Text>
              
              {sessions.map((session) => (
                <Card key={session.id}>
                  <View style={styles.gameCard}>
                    <View style={styles.gameInfo}>
                      <Text variant="heading2" style={[styles.gameTitle, { color: palette.textPrimary }]}>
                        {session.title}
                      </Text>
                      <Text variant="body" style={[styles.gameDescription, { color: palette.textSecondary }]}>
                        {session.description}
                      </Text>
                      <Text variant="caption" style={[styles.gameDate, { color: palette.textSecondary }]}>
                        Last played: {new Date(session.lastActivityAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.gameActions}>
                      <TouchableOpacity
                        onPress={() => handlePlaySession(session)}
                        style={[styles.playButton, { backgroundColor: palette.primary }]}
                      >
                        <Ionicons name="play" size={20} color={palette.surface} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSession(session)}
                        style={[styles.deleteButton, { backgroundColor: palette.error }]}
                      >
                        <Ionicons name="trash" size={16} color={palette.surface} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholder: {
    width: 40, // Same width as close button for centering
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
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
  },
  formActions: {
    gap: spacing.sm,
  },
  sessionsSection: {
    marginTop: spacing.xl,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  gameTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  gameDescription: {
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  gameDate: {
    fontSize: 12,
  },
  gameActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GamesSelectionModal;
