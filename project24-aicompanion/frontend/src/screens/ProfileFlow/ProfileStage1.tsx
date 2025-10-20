import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Card from '../../components/ui/Card';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'react-native';
import { useIconSizes } from '../../theme/iconSizes';
import { useTypography } from '../../theme/typography';

interface Props {
  onNext: () => void;
}

const ProfileStage1: React.FC<Props> = ({ onNext }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const iconSizes = useIconSizes('large');
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');
  const AVATAR_SIZE = iconSizes.xl * 2.2;
  const BADGE_SIZE = iconSizes.md * 1.5;

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

  const handleNext = () => {
    onNext();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={64}
    >
      <Card style={{ width: '100%', padding: spacing.lg, flex: 1, justifyContent: 'flex-start', marginTop: spacing.xs, marginBottom: spacing.md }}>
        {/* Page Title */}
        <Text style={[typography.heading2, { marginBottom: spacing.md, alignSelf: 'center', textAlign: 'center' }]}>Profile Information</Text>
        {/* Scrollable Avatar and Inputs */}
        <View style={{ flex: 1, width: '100%' }}>
          <ScrollView
            contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl + 80, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
            </View>
            {/* Email */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="john.doe@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
            {/* Address */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="123 Main St, City"
                value={address}
                onChangeText={setAddress}
                style={styles.input}
              />
            </View>
            {/* Date of Birth and Phone Row */}
            <View style={[styles.row, { marginTop: spacing.sm, marginBottom: spacing.md }]}>  
              <View style={[styles.inputContainer, { marginRight: spacing.md }]}>  
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  placeholder="1990-01-01"
                  value={dob}
                  onChangeText={setDob}
                  style={styles.input}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  placeholder="021 123 4567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>
            {/* No error message, required checks removed */}
          </ScrollView>
        </View>
      {/* Fixed Next Button at Bottom, outside Card */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: spacing.lg,
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          zIndex: 10,
        }}
      >
        <Button title="Next" onPress={handleNext} style={{ width: 320, maxWidth: '100%' }} />
      </View>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flex: 1,
    minHeight: 56,
    justifyContent: 'flex-start',
  },
  input: {
    width: '100%',
    minWidth: 0,
    marginBottom: 0,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.light.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
});

export default ProfileStage1; 