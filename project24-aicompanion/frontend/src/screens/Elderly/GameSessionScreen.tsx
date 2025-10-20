import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, metrics } from '../../theme';
import { useFontSizes } from '../../theme/fontSizes';
import { useGames } from '../../hooks/useGames';
import Text from '../../components/ui/Text';
import type { GameSession, GameMessage } from '../../types/Game';
import { Ionicons } from '@expo/vector-icons';

interface GameSessionScreenProps {
  route: {
    params: {
      sessionId: string;
    };
  };
  navigation: any;
}

const GameSessionScreen: React.FC<GameSessionScreenProps> = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const fontSizes = useFontSizes();
  
  const {
    currentSession,
    messages,
    loading,
    error,
    loadSession,
    loadMessages,
    sendMessage,
    clearError,
  } = useGames();

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSession(sessionId);
    loadMessages(sessionId);
  }, [sessionId, loadSession, loadMessages]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      await sendMessage(sessionId, message);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: GameMessage) => {
    const isUser = message.fromUser;
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: palette.primary + '20' }]}>
            <Ionicons name="game-controller" size={20} color={palette.primary} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userMessageBubble, { backgroundColor: palette.primary }]
              : [styles.aiMessageBubble, { backgroundColor: palette.card }],
          ]}
        >
          <Text
            variant="body"
            style={[
              styles.messageText,
              isUser
                ? { color: palette.surface }
                : { color: palette.textPrimary },
            ]}
          >
            {isUser ? message.text : message.text.replace(/^Assistant:\s*/i, '')}
          </Text>
          <Text
            variant="caption"
            style={[
              styles.messageTime,
              { color: isUser ? palette.surface : palette.textSecondary },
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatarContainer, { backgroundColor: palette.primary + '20' }]}>
            <Ionicons name="person" size={20} color={palette.primary} />
          </View>
        )}
      </View>
    );
  };

  if (!currentSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text variant="body" style={{ color: palette.textSecondary }}>
            Loading game...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

    return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: palette.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text variant="heading2" style={[styles.gameTitle, { color: palette.textPrimary }]}>
            {currentSession.title}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            Alert.alert(
              'Game Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'End Game',
                  style: 'destructive',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles" size={48} color={palette.textSecondary} />
            <Text variant="body" style={[styles.emptyText, { color: palette.textSecondary }]}>
              Start the game by sending a message!
            </Text>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
        
        {loading && (
          <View style={styles.loadingMessage}>
            <View style={[styles.aiMessageBubble, { backgroundColor: palette.card }]}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { backgroundColor: palette.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: palette.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: palette.textSecondary }]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inputContainer, { backgroundColor: palette.surface }]}>
          <View style={[styles.inputWrapper, { borderColor: palette.border }]}>
            <RNTextInput
              style={[
                styles.textInput,
                {
                  color: palette.textPrimary,
                  backgroundColor: palette.background,
                },
              ]}
              placeholder="Type your message..."
              placeholderTextColor={palette.textSecondary}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputMessage.trim() ? palette.primary : palette.disabled,
                },
              ]}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || sending}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputMessage.trim() ? palette.surface : palette.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  gameTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  gameDescription: {
    lineHeight: 16,
  },
  menuButton: {
    padding: spacing.sm,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 0,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 80, // Extra padding for bottom navigation
  },
  messageContainer: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: metrics.cardRadius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageBubble: {
    borderBottomRightRadius: spacing.xs,
  },
  aiMessageBubble: {
    borderBottomLeftRadius: spacing.xs,
  },
  messageText: {
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingMessage: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  inputContainer: {
    padding: spacing.lg,
    paddingBottom: 90, // Small padding to move input higher
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'white',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: metrics.inputRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'top',
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});

export default GameSessionScreen;
