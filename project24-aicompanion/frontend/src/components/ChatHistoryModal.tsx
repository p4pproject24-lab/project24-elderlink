import React, { useRef, useEffect } from 'react';
import { Modal, View, FlatList, StyleSheet, TouchableOpacity, Text as RNText, useWindowDimensions, ScrollView } from 'react-native';
import Text from './ui/Text';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessage {
  key: string;
  from: 'user' | 'ai';
  text: string;
  timestamp: number;
  type?: string; // 'date' for date separators
  date?: string;
}

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  chat: ChatMessage[];
  palette: any;
  metrics: any;
  spacing: any;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ visible, onClose, chat, palette, metrics, spacing }) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [visible, chat]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text variant="caption" style={{ color: palette.textSecondary, backgroundColor: palette.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 2 }}>
            {item.date}
          </Text>
        </View>
      );
    }
    const isUser = item.from === 'user';
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[styles.bubbleRow, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}> 
        <View>
          <View style={[
            styles.bubble,
            {
              backgroundColor: isUser ? palette.primary : palette.surface,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              borderTopRightRadius: isUser ? 0 : metrics.cardRadius,
              borderTopLeftRadius: isUser ? metrics.cardRadius : 0,
              borderBottomRightRadius: metrics.cardRadius,
              borderBottomLeftRadius: metrics.cardRadius,
              maxWidth: '75%',
            },
          ]}>
            <Text style={{ color: isUser ? palette.surface : palette.textPrimary }}>{item.text}</Text>
          </View>
          <RNText style={{ color: palette.textSecondary, fontSize: 12, alignSelf: 'center', marginTop: 2 }}>{time}</RNText>
        </View>
      </View>
    );
  };

  const window = useWindowDimensions();
  const modalWidth = Math.min(window.width * 0.9, 400);
  const modalHeight = Math.min(window.height * 0.8, 600);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: palette.surface,
            borderRadius: metrics.cardRadius,
            width: modalWidth,
            height: modalHeight,
            maxWidth: 400,
            maxHeight: 600,
          },
        ]}>
          <View style={[styles.header, { borderBottomColor: palette.border, padding: spacing.lg }]}> 
            <Text variant="heading2" style={{ color: palette.textPrimary }}>Chat History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={palette.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={chat}
              renderItem={renderItem}
              keyExtractor={item => item.key}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              onEndReachedThreshold={0.2}
              removeClippedSubviews={true}
              initialNumToRender={30}
              windowSize={5}
              maxToRenderPerBatch={10}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  closeButton: {
    padding: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 4,
    minWidth: 48,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
});

export default ChatHistoryModal; 