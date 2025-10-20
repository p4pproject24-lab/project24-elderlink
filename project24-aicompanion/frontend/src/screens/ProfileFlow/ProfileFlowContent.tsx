import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, FlatList, Pressable, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import TextInput from '../../components/ui/TextInput';
import Text from '../../components/ui/Text';
import { spacing, colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useFontSizes } from '../../theme/fontSizes';
import { useIconSizes } from '../../theme/iconSizes';
import Button from '../../components/ui/Button';
import { useGeoapifyAutocomplete } from '../../hooks/useGeoapifyAutocomplete';
import { fetchAddressSuggestions } from '../../services/geoapifyService';

interface FieldConfig {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  row?: boolean; // if true, render in a row with next field
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
  key?: string; // Add a key property for unique error mapping
  editable?: boolean; // Add editable property
}

interface Props {
  fields?: FieldConfig[];
  showAvatar?: boolean;
  avatarUri?: string | null;
  onPickAvatar?: () => void;
  onRemoveAvatar?: () => void;
  customContent?: React.ReactNode;
  style?: any;
  errors?: { [key: string]: string };
  onNext?: () => void;
}

const ProfileFlowContent: React.FC<Props> = ({
  fields = [],
  showAvatar = false,
  avatarUri,
  onPickAvatar,
  onRemoveAvatar,
  customContent,
  style,
  errors = {},
  onNext,
}) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const iconSizes = useIconSizes('large');
  const fontSizes = useFontSizes();
  const AVATAR_SIZE = iconSizes.xl * 2.2;
  const BADGE_SIZE = iconSizes.md * 1.5;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const { suggestions, loading } = useGeoapifyAutocomplete(addressInput);
  const ADDRESS_INPUT_HEIGHT = 56; // Ensure this is always a number
  const [modalVisible, setModalVisible] = useState(false);

  // Sync addressInput with the address field value (must be outside of fields.map)
  useEffect(() => {
    const addressField = fields.find(
      (field) => (field.key || field.label.toLowerCase().replace(/[^a-z0-9]/g, '')) === 'address'
    );
    if (addressField) {
      setAddressInput(addressField.value || '');
    }
  }, [fields]);

  // Remove all console.log statements

  return (
    <View style={[{ width: '100%' }, style]}>
      {showAvatar && (
        <TouchableOpacity
          onPress={avatarUri ? onRemoveAvatar : onPickAvatar}
          style={{
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            borderRadius: AVATAR_SIZE / 2,
            backgroundColor: palette.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing.xl,
            marginBottom: spacing.xl,
            borderWidth: 2,
            borderColor: palette.primary,
            alignSelf: 'center',
          }}
          accessibilityLabel={avatarUri ? 'Remove profile picture' : 'Add profile picture'}
        >
          {avatarUri ? (
            <>
              <Image
                source={{ uri: avatarUri }}
                style={{ width: AVATAR_SIZE - spacing.md, height: AVATAR_SIZE - spacing.md, borderRadius: (AVATAR_SIZE - spacing.md) / 2 }}
              />
              <View style={{
                position: 'absolute',
                right: -BADGE_SIZE / 2.5,
                top: -BADGE_SIZE / 2.5,
                backgroundColor: palette.error,
                borderRadius: BADGE_SIZE / 2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.surface,
              }}>
                <Ionicons name="remove" size={iconSizes.md} color={palette.surface} />
              </View>
            </>
          ) : (
            <>
              <Ionicons name="person" size={iconSizes.xl} color={palette.textSecondary} />
              <View style={{
                position: 'absolute',
                right: -BADGE_SIZE / 2.5,
                top: -BADGE_SIZE / 2.5,
                backgroundColor: palette.primary,
                borderRadius: BADGE_SIZE / 2,
                width: BADGE_SIZE,
                height: BADGE_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: palette.surface,
              }}>
                <Ionicons name="add" size={iconSizes.md} color={palette.surface} />
              </View>
            </>
          )}
        </TouchableOpacity>
      )}
      {/* Render fields, supporting row layout */}
      {fields.length > 0 && (
        <View style={{ width: '100%' }}>
          {fields.map((field, idx) => {
            const key = field.key || (field.label.toLowerCase().replace(/[^a-z0-9]/g, ''));
            const fieldError = errors[key] || '';
            // Address field with autocomplete
            if (key === 'address') {
              return (
                <View key={field.label} style={{ marginBottom: spacing.md, position: 'relative' }}>
                  <Text style={{ marginBottom: spacing.xs, color: '#000', fontWeight: '500', fontSize: 14 }}>{field.label}</Text>
                  <TextInput
                    placeholder={field.placeholder}
                    value={addressInput}
                    onChangeText={(text) => {
                      setAddressInput(text);
                      field.onChange(text);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    style={{ width: '100%' }}
                    error={fieldError}
                    editable={field.editable !== false}
                    placeholderTextColor={palette.textSecondary + '99'}
                  />
                  {/* Dropdown below input, scrollable, no FlatList */}
                  {showSuggestions && addressInput.length >= 3 && suggestions.length > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: ADDRESS_INPUT_HEIGHT,
                      left: 0,
                      right: 0,
                      backgroundColor: palette.surface,
                      borderWidth: 1,
                      borderColor: palette.border,
                      borderRadius: 8,
                      zIndex: 100,
                      maxHeight: 240,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 4,
                    }}>
                      <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                        {suggestions.map((item, i) => (
                          <Pressable
                            key={item.formatted + i}
                            onPress={() => {
                              setAddressInput(item.formatted);
                              field.onChange(item.formatted);
                              setShowSuggestions(false);
                            }}
                            style={({ pressed }) => ({
                              padding: spacing.md,
                              backgroundColor: pressed ? palette.primary + '11' : palette.surface,
                              borderBottomWidth: 1,
                              borderBottomColor: palette.border,
                            })}
                          >
                            <Text style={{ color: palette.textPrimary }}>{item.formatted}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              );
            }
            // If row, render this and next field in a row
            if (field.row && fields[idx + 1] && fields[idx + 1].row) {
              const next = fields[idx + 1];
              const nextKey = next.key || (next.label.toLowerCase().replace(/[^a-z0-9]/g, ''));
              const nextFieldError = errors[nextKey] || '';
              return (
                <View key={field.label + next.label} style={{ flexDirection: 'row', width: '100%', marginBottom: spacing.sm }}>
                  <View style={{ flex: 1, marginRight: spacing.md }}>
                    <Text style={{ marginBottom: spacing.xs, color: '#000', fontWeight: '500', fontSize: 14 }}>{field.label}</Text>
                    <TextInput
                      placeholder={field.placeholder}
                      value={field.value}
                      onChangeText={field.onChange}
                      keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
                      style={{ width: '100%' }}
                      error={fieldError}
                      editable={field.editable !== false}
                      placeholderTextColor={palette.textSecondary + '99'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ marginBottom: spacing.xs, color: '#000', fontWeight: '500', fontSize: 14 }}>{next.label}</Text>
                    <TextInput
                      placeholder={next.placeholder}
                      value={next.value}
                      onChangeText={next.onChange}
                      keyboardType={next.type === 'email' ? 'email-address' : next.type === 'phone' ? 'phone-pad' : 'default'}
                      style={{ width: '100%' }}
                      editable={next.editable !== false}
                      placeholderTextColor={palette.textSecondary + '99'}
                      error={nextFieldError}
                    />
                  </View>
                </View>
              );
            }
            // If previous was row, skip (already rendered)
            if (idx > 0 && fields[idx - 1].row && field.row) return null;
            // Otherwise, render single field
            return (
              <View key={field.label} style={{ marginBottom: spacing.xs * 0.1 }}>
                <Text style={{ marginBottom: spacing.xs, color: '#000', fontWeight: '500', fontSize: 14 }}>{field.label}</Text>
                <TextInput
                  placeholder={field.placeholder}
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
                  multiline={field.multiline}
                  numberOfLines={field.numberOfLines}
                  scrollEnabled={field.multiline ? true : undefined}
                  textAlignVertical={field.multiline ? 'top' : undefined}
                  style={{
                    width: '100%',
                    height: field.multiline ? 104 : undefined,
                    fontSize: fontSizes.input,
                    textAlignVertical: field.multiline ? 'top' : undefined,
                    opacity: field.editable === false ? 0.5 : 1,
                  }}
                  editable={field.editable !== false}
                  placeholderTextColor={palette.textSecondary + '99'}
                  error={fieldError}
                />
              </View>
            );
          })}
        </View>
      )}
      {/* Custom content for QR, etc. */}
      {customContent}
      {/* Only show Next button here if there are fields (not for sync step) */}
      {onNext && fields.length > 0 && (
        <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
          <Button title="Next" onPress={onNext} style={{ width: 200 }} />
        </View>
      )}
    </View>
  );
};

export default ProfileFlowContent; 