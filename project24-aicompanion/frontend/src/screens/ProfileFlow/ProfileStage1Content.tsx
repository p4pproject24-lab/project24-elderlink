import React, { useState } from 'react';
import { View, TouchableOpacity, Image, ScrollView, FlatList, Pressable } from 'react-native';
import TextInput from '../../components/ui/TextInput';
import Text from '../../components/ui/Text';
import { spacing, colors } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'react-native';
import { useIconSizes } from '../../theme/iconSizes';
import { useTypography } from '../../theme/typography';
import { useGeoapifyAutocomplete } from '../../hooks/useGeoapifyAutocomplete';

const ProfileStage1Content: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const iconSizes = useIconSizes('large');
  const AVATAR_SIZE = iconSizes.xl * 2.2;
  const BADGE_SIZE = iconSizes.md * 1.5;

  const { suggestions, loading: suggestionsLoading } = useGeoapifyAutocomplete(address);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => setProfileImage(null);

  const handleAddressChange = (text: string) => {
    setAddress(text);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setAddress(suggestion);
    setShowSuggestions(false);
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      {/* Profile Picture Input */}
      <TouchableOpacity
        onPress={profileImage ? handleRemoveImage : handlePickImage}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          backgroundColor: palette.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xl,
          borderWidth: 2,
          borderColor: palette.primary,
          alignSelf: 'center',
        }}
        accessibilityLabel={profileImage ? 'Remove profile picture' : 'Add profile picture'}
      >
        {profileImage ? (
          <>
            <Image
              source={{ uri: profileImage }}
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
      {/* Full Name */}
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ marginBottom: spacing.xs, color: palette.textSecondary, fontWeight: '500', fontSize: 14 }}>Full Name</Text>
        <TextInput
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
          style={{ width: '100%' }}
        />
      </View>
      {/* Email */}
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ marginBottom: spacing.xs, color: palette.textSecondary, fontWeight: '500', fontSize: 14 }}>Email</Text>
        <TextInput
          placeholder="john.doe@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={{ width: '100%' }}
        />
      </View>
      {/* Address */}
      <View style={{ marginBottom: spacing.md, position: 'relative' }}>
        <Text style={{ marginBottom: spacing.xs, color: palette.textSecondary, fontWeight: '500', fontSize: 14 }}>Address</Text>
        <TextInput
          placeholder="123 Main St, City"
          value={address}
          onChangeText={handleAddressChange}
          style={{ width: '100%' }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <View style={{
            position: 'absolute',
            top: 56, // match TextInput height
            left: 0,
            right: 0,
            backgroundColor: palette.surface,
            borderColor: palette.border,
            borderWidth: 1,
            borderRadius: 8,
            zIndex: 100,
            maxHeight: 180,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((s, idx) => (
                <Pressable
                  key={s.formatted + idx}
                  onPress={() => handleSuggestionSelect(s.formatted)}
                  style={{ padding: 12, borderBottomWidth: idx !== suggestions.length - 1 ? 1 : 0, borderBottomColor: palette.border }}
                >
                  <Text style={{ color: palette.textPrimary }}>{s.formatted}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {/* Date of Birth and Phone Row */}
      <View style={{ flexDirection: 'row', width: '100%', marginTop: spacing.sm, marginBottom: spacing.md }}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={{ marginBottom: spacing.xs, color: palette.textSecondary, fontWeight: '500', fontSize: 14 }}>Date of Birth</Text>
          <TextInput
            placeholder="1990-01-01"
            value={dob}
            onChangeText={setDob}
            style={{ width: '100%' }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ marginBottom: spacing.xs, color: palette.textSecondary, fontWeight: '500', fontSize: 14 }}>Phone Number</Text>
          <TextInput
            placeholder="021 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </View>
  );
};

export default ProfileStage1Content; 