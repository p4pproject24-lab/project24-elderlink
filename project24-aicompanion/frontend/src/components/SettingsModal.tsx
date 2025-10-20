import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './ui/Text';
import Button from './ui/Button';
import { colors, spacing, metrics } from '../theme';
import { useIconSizes } from '../theme/iconSizes';
import { useAvatarCache } from '../hooks/useAvatarCache';

export interface LanguageOption {
  label: string;
  value: string;
  flag?: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: '🇺🇸 English (US)', value: 'en-US' },
  { label: '🇬🇧 English (UK)', value: 'en-GB' },
  { label: '🇪🇸 Spanish', value: 'es-ES' },
  { label: '🇫🇷 French', value: 'fr-FR' },
  { label: '🇩🇪 German', value: 'de-DE' },
  { label: '🇮🇹 Italian', value: 'it-IT' },
  { label: '🇵🇹 Portuguese', value: 'pt-PT' },
  { label: '🇳🇱 Dutch', value: 'nl-NL' },
  { label: '🇷🇺 Russian', value: 'ru-RU' },
  { label: '🇯🇵 Japanese', value: 'ja-JP' },
  { label: '🇰🇷 Korean', value: 'ko-KR' },
  { label: '🇨🇳 Chinese (Simplified)', value: 'zh-CN' },
  { label: '🇹🇼 Chinese (Traditional)', value: 'zh-TW' },
  { label: '🇮🇳 Hindi', value: 'hi-IN' },
  { label: '🇧🇷 Portuguese (Brazil)', value: 'pt-BR' },
  { label: '🇨🇦 French (Canada)', value: 'fr-CA' },
  { label: '🇦🇺 English (Australia)', value: 'en-AU' },
  { label: '🇸🇪 Swedish', value: 'sv-SE' },
  { label: '🇳🇴 Norwegian', value: 'no-NO' },
  { label: '🇩🇰 Danish', value: 'da-DK' },
];

const DEFAULT_AVATAR_ID = 'June_HR_public';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  voiceSpeed?: number;
  onVoiceSpeedChange?: (speed: number) => void;
  selectedAvatarId?: string;
  onAvatarSelect?: (avatar: { id: string; gender: string; preview_image_url: string; default_voice?: string }) => void;
  isAvatarSessionLoading?: boolean;
  isAvatarSpeaking?: boolean;
  detectedLanguage?: string;
  getLanguageDisplayName?: (languageCode: string) => string;
  // New: Auto-start conversation toggle
  autoStartConversation?: boolean;
  onToggleAutoStartConversation?: (value: boolean) => void;
}

// Memoized avatar item component for better performance
const AvatarItem = React.memo(({ 
  item, 
  index, 
  isSelected, 
  isDisabled, 
  onSelect, 
  palette, 
  metrics, 
  spacing, 
  iconSizes,
  avatarItemWidth,
  avatarItemHeight,
  isLeftCol
}: {
  item: { id: string; gender: string; preview_image_url: string; default_voice?: string };
  index: number;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: (avatar: { id: string; gender: string; preview_image_url: string; default_voice?: string }) => void;
  palette: any;
  metrics: any;
  spacing: any;
  iconSizes: any;
  avatarItemWidth: number;
  avatarItemHeight: number;
  isLeftCol: boolean;
}) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedAnim] = useState(new Animated.Value(0));

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      // Animate selection
      Animated.sequence([
        Animated.timing(selectedAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(selectedAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      onSelect(item);
    }
  }, [isDisabled, onSelect, item, selectedAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: selectedAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.05],
        })}],
      }}
    >
      <TouchableOpacity
        testID={`avatar-${item.id}`}
        onPress={handlePress}
        style={{
          borderWidth: isSelected ? 4 : 1,
          borderColor: isSelected ? palette.primary : palette.border,
          borderRadius: metrics.cardRadius,
          overflow: 'hidden',
          width: avatarItemWidth,
          height: avatarItemHeight,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: palette.background,
          position: 'relative',
          marginBottom: spacing.lg,
          marginRight: isLeftCol ? spacing.md : 0,
          opacity: isDisabled ? 0.5 : 1,
        }}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: metrics.cardRadius * 0.8, 
          overflow: 'hidden', 
          backgroundColor: palette.surface, 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {!imageError ? (
            <>
              <Image
                source={{ uri: item.preview_image_url }}
                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <View style={{ 
                  ...StyleSheet.absoluteFillObject, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'rgba(255,255,255,0.6)' 
                }}>
                  <ActivityIndicator size="small" color={palette.primary} />
                </View>
              )}
            </>
          ) : (
            <Ionicons name="person" size={iconSizes.xl} color={palette.textSecondary} />
          )}
        </View>
        {isSelected && (
          <View style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            zIndex: 2,
          }}>
            <Ionicons name="checkmark-circle" size={iconSizes.lg} color={palette.primary} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  selectedLanguage,
  onLanguageSelect,
  voiceSpeed = 0.95,
  onVoiceSpeedChange,
  selectedAvatarId,
  onAvatarSelect,
  isAvatarSessionLoading = false,
  isAvatarSpeaking = false,
  detectedLanguage,
  getLanguageDisplayName,
  autoStartConversation = false,
  onToggleAutoStartConversation,
}) => {
  // Temporary state for voice speed changes
  const [tempVoiceSpeed, setTempVoiceSpeed] = useState(voiceSpeed);
  // Temporary state for auto-start toggle
  const [tempAutoStart, setTempAutoStart] = useState<boolean>(autoStartConversation);
  
  // Reset temp voice speed when modal opens
  useEffect(() => {
    if (visible) {
      setTempVoiceSpeed(voiceSpeed);
      setTempAvatarId(selectedAvatarId);
      setTempAutoStart(autoStartConversation);
    }
  }, [visible, voiceSpeed, selectedAvatarId, autoStartConversation]);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];

  const [refreshing, setRefreshing] = useState(false);
  
  // Use the optimized avatar cache hook
  const { avatars, loading: avatarLoading, error: avatarError, refresh, preloadImages } = useAvatarCache();
  
  // Preload images when modal opens
  useEffect(() => {
    if (visible && avatars.length > 0) {
      preloadImages();
    }
  }, [visible, avatars, preloadImages]);
  
  // Temporary state for avatar selection
  const [tempAvatarId, setTempAvatarId] = useState<string | undefined>(selectedAvatarId);
  const [tempAvatarPreviewUrl, setTempAvatarPreviewUrl] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (visible && selectedAvatarId && avatars.length > 0) {
      const found = avatars.find(a => a.id === selectedAvatarId);
      setTempAvatarPreviewUrl(found?.preview_image_url);
    } else if (visible) {
      setTempAvatarPreviewUrl(undefined);
    }
  }, [visible, selectedAvatarId, avatars]);

  // Combined loading state for both session loading and avatar speaking
  const isDisabled = isAvatarSessionLoading || isAvatarSpeaking;

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh(true); // Force refresh from API
    setRefreshing(false);
  }, [refresh]);

  // Filter out avatars with 'Professional', 'Shirt', 'Santa', or 'Suit' in the id
  const filteredAvatars = useMemo(() => 
    avatars.filter(a => !/Professional|Shirt|Santa|Suit/i.test(a.id)),
    [avatars]
  );

  // Keep original order for smooth selection, only reorder when modal opens
  const effectiveSelectedId = tempAvatarId || selectedAvatarId || DEFAULT_AVATAR_ID;
  const sortedAvatars = useMemo(() => {
    // Only reorder when modal first opens, not during selection
    if (!visible) return filteredAvatars;
    
    const idx = filteredAvatars.findIndex(a => a.id === effectiveSelectedId);
    if (idx === -1) return filteredAvatars;
    return [filteredAvatars[idx], ...filteredAvatars.slice(0, idx), ...filteredAvatars.slice(idx + 1)];
  }, [filteredAvatars, effectiveSelectedId, visible]);

  // Avatar grid render
  const { width: windowWidth } = useWindowDimensions();
  const iconSizes = useIconSizes('large');
  const avatarGridPadding = spacing.lg;
  const modalWidth = Math.min(windowWidth * 0.9, 400); // match modalContainer
  const avatarItemWidth = (modalWidth - (spacing.lg * 2) - spacing.md) / 2; // 2 columns, side paddings, and margin between
  const avatarItemHeight = avatarItemWidth * 1.25;

  const renderAvatarItem = useCallback(({ item, index }: { item: { id: string; gender: string; preview_image_url: string; default_voice?: string }, index: number }) => {
    const isLeftCol = index % 2 === 0;
    const isSelected = item.id === effectiveSelectedId;
    
    return (
      <AvatarItem
        item={item}
        index={index}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onSelect={(avatar) => {
          setTempAvatarId(avatar.id);
          setTempAvatarPreviewUrl(avatar.preview_image_url);
        }}
        palette={palette}
        metrics={metrics}
        spacing={spacing}
        iconSizes={iconSizes}
        avatarItemWidth={avatarItemWidth}
        avatarItemHeight={avatarItemHeight}
        isLeftCol={isLeftCol}
      />
    );
  }, [effectiveSelectedId, isDisabled, palette, metrics, spacing, iconSizes, avatarItemWidth, avatarItemHeight]);

  const keyExtractor = useCallback((item: { id: string }) => item.id, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: palette.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: palette.border }]}>
            <Text variant="heading2" style={{ color: palette.textPrimary }}>
              Settings
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Speech Recognition Section */}
            <View style={[styles.section, { borderBottomColor: palette.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={20} color={palette.primary} />
                <Text variant="heading2" style={{ color: palette.textPrimary, marginLeft: spacing.sm }}>
                  Speech Recognition
                </Text>
              </View>
              
              <Text variant="body" style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                Automatic language detection enabled. The AI will automatically detect and transcribe speech in any supported language.
                {detectedLanguage && getLanguageDisplayName && (
                  <Text style={{ color: palette.primary, fontWeight: '600' }}>
                    {'\n'}Current language: {getLanguageDisplayName(detectedLanguage)}
                  </Text>
                )}
              </Text>

              {/* Auto Detection Info */}
              <View style={[
                styles.dropdownButton,
                {
                  borderColor: palette.success,
                  backgroundColor: palette.success + '10',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                }
              ]}>
                <Ionicons name="checkmark-circle" size={20} color={palette.success} />
                <Text variant="body" style={{ color: palette.success, marginLeft: spacing.sm, fontWeight: '600' }}>
                  Auto Language Detection Active
                </Text>
              </View>
            </View>

            {/* Voice Settings Section */}
            {onVoiceSpeedChange && (
              <View style={[styles.section, { borderBottomColor: palette.border }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="volume-high" size={20} color={palette.primary} />
                  <Text variant="heading2" style={{ color: palette.textPrimary, marginLeft: spacing.sm }}>
                    Voice Settings
                  </Text>
                </View>
                
                <Text variant="body" style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                  Adjust the avatar's voice speed.
                  {isDisabled && (
                    <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                      {'\n'}Please wait for avatar to finish {isAvatarSessionLoading ? 'loading' : 'speaking'} before changing voice settings.
                    </Text>
                  )}
                </Text>

                {/* Voice Speed Slider */}
                <View style={[styles.settingItem, { opacity: isDisabled ? 0.5 : 1 }]}>
                  <View style={styles.settingLabel}>
                    <Text variant="body" style={{ color: palette.textPrimary }}>
                      Voice Speed
                    </Text>
                    <Text variant="caption" style={{ color: palette.textSecondary }}>
                      {tempVoiceSpeed.toFixed(2)}x
                    </Text>
                  </View>
                  <View style={[styles.sliderContainer, { backgroundColor: palette.background }]}>
                    <TouchableOpacity
                      testID="voice-dec"
                      style={[styles.sliderButton, { backgroundColor: palette.primary }]}
                      onPress={() => setTempVoiceSpeed(Math.max(0.5, Math.round((tempVoiceSpeed - 0.05) * 100) / 100))}
                      disabled={isDisabled}
                    >
                      <Ionicons name="remove" size={16} color={palette.surface} />
                    </TouchableOpacity>
                    <View style={styles.sliderTrack}>
                      <View 
                        style={[
                          styles.sliderFill, 
                          { 
                            backgroundColor: palette.primary,
                            width: `${((tempVoiceSpeed - 0.5) / 1.0) * 100}%`
                          }
                        ]} 
                      />
                    </View>
                    <TouchableOpacity
                      testID="voice-inc"
                      style={[styles.sliderButton, { backgroundColor: palette.primary }]}
                      onPress={() => setTempVoiceSpeed(Math.min(1.5, Math.round((tempVoiceSpeed + 0.05) * 100) / 100))}
                      disabled={isDisabled}
                    >
                      <Ionicons name="add" size={16} color={palette.surface} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

          {/* Conversation Settings Section */}
          <View style={[styles.section, { borderBottomColor: palette.border }]}> 
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbox-ellipses" size={20} color={palette.primary} />
              <Text variant="heading2" style={{ color: palette.textPrimary, marginLeft: spacing.sm }}>
                Conversation
              </Text>
            </View>
            <Text variant="body" style={[styles.sectionDescription, { color: palette.textSecondary }]}> 
              Choose how conversations start.
            </Text>
            <TouchableOpacity
              onPress={() => setTempAutoStart(!tempAutoStart)}
              style={[styles.dropdownButton, { borderColor: palette.border, backgroundColor: palette.background, justifyContent: 'space-between' }]}
              activeOpacity={0.7}
            >
              <Text variant="body" style={{ color: palette.textPrimary }}>
                {tempAutoStart ? 'AI starts automatically' : 'You start (press mic)'}
              </Text>
              <Ionicons name={tempAutoStart ? 'toggle' : 'toggle-outline'} size={28} color={palette.primary} />
            </TouchableOpacity>
          </View>

            {/* Avatar Selection Section */}
            <View style={[styles.section, { borderBottomColor: palette.border }]}> 
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle" size={20} color={palette.primary} />
                <Text variant="heading2" style={{ color: palette.textPrimary, marginLeft: spacing.sm }}>
                  Avatar
                </Text>
              </View>
              <Text variant="body" style={[styles.sectionDescription, { color: palette.textSecondary }]}>
                Choose your avatar companion.
                {tempAvatarId && tempAvatarId !== selectedAvatarId && (
                  <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600' }}>
                    {'\n'}New avatar selected - press "Done" to apply changes.
                  </Text>
                )}
                {isDisabled && (
                  <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                    {'\n'}Please wait for avatar to finish {isAvatarSessionLoading ? 'loading' : 'speaking'} before selecting a new avatar.
                  </Text>
                )}
              </Text>
              <FlatList
                data={sortedAvatars}
                renderItem={renderAvatarItem}
                keyExtractor={keyExtractor}
                numColumns={2}
                windowSize={3}
                initialNumToRender={6}
                maxToRenderPerBatch={4}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                  length: avatarItemHeight + spacing.lg,
                  offset: (avatarItemHeight + spacing.lg) * Math.floor(index / 2),
                  index,
                })}
                contentContainerStyle={{ 
                  alignItems: 'center', 
                  paddingBottom: spacing.xl, 
                  flexGrow: 1, 
                  justifyContent: 'center', 
                  paddingHorizontal: spacing.lg 
                }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                style={{ 
                  minHeight: avatarItemHeight * 2 + avatarGridPadding * 2, 
                  flexGrow: 1, 
                  width: '100%' 
                }}
                ListEmptyComponent={
                  avatarLoading ? (
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl }}>
                      <ActivityIndicator size="large" color={palette.primary} />
                      <Text style={{ textAlign: 'center', color: palette.textSecondary, marginTop: spacing.sm }}>
                        Loading avatars...
                      </Text>
                    </View>
                  ) : null
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[palette.primary]}
                    tintColor={palette.primary}
                  />
                }
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: palette.border }]}>
            <Button
              title={isDisabled ? (isAvatarSessionLoading ? "Loading..." : "Avatar Speaking...") : "Done"}
              onPress={() => {
                if (isDisabled) return; // Prevent action while loading or speaking
                
                // Apply voice speed changes when modal closes
                if (onVoiceSpeedChange && tempVoiceSpeed !== voiceSpeed) {
                  onVoiceSpeedChange(tempVoiceSpeed);
                }
                // Apply auto-start change
                if (onToggleAutoStartConversation && tempAutoStart !== autoStartConversation) {
                  onToggleAutoStartConversation(tempAutoStart);
                }
                // Apply avatar changes when modal closes
                if (
                  onAvatarSelect &&
                  tempAvatarId &&
                  tempAvatarId !== selectedAvatarId
                ) {
                  const found = avatars.find(a => a.id === tempAvatarId);
                  if (found) {
                    onAvatarSelect(found);
                  }
                }
                onClose();
              }}
              variant="primary"
              fullWidth={false}
              style={[styles.doneButton, { opacity: isDisabled ? 0.5 : 1 }]}
              disabled={isDisabled}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    height: '80%',
    maxHeight: 600,
    borderRadius: metrics.cardRadius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    marginBottom: spacing.lg,
  },
  dropdownContainer: {
    flex: 1,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
    flexShrink: 0,
  },
  dropdownList: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
    zIndex: 1001,
  },
  dropdownScrollView: {
    flex: 1,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  languageText: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
    flexShrink: 0,
  },
  doneButton: {
    minWidth: 100,
  },
  settingItem: {
    marginBottom: spacing.lg,
  },
  settingLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SettingsModal; 