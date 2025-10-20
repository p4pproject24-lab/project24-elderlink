import React, { useState, useRef, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import ScreenContainer from '../../components/ui/ScreenContainer';
import ProgressStepper from '../../components/ui/ProgressStepper';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { useRole } from '../../hooks/useRole';
import { useColorScheme } from 'react-native';
import { useTypography } from '../../theme/typography';
import ProfileFlowContent from './ProfileFlowContent';
import { useUpdateUserProfile } from '../../hooks/useUpdateUserProfile';
import { useAuth } from '../../hooks/useAuth';
import { useProfileFlowStep } from '../../contexts/ProfileFlowStepContext';
import { convertImageToBase64, completeProfileFlow } from '../../services/userService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator'; // adjust path if needed
import ElderlyStage3 from './ElderlyStage3';
import CaregiverStage2 from './CaregiverStage2';
import CaregiverPendingApproval from './CaregiverPendingApproval';
import { useIntroduction } from '../../hooks/useIntroduction';

const stepsElderly = ['Profile', 'Extra', 'Sync'];
const stepsCaregiver = ['Profile', 'Sync'];
const titlesElderly = ['Profile Information', 'Extra Information', 'Sync with Caregiver'];
const titlesCaregiver = ['Profile Information', 'Sync with Elderly'];

const ProfileFlowScreen: React.FC = () => {
  const { role } = useRole();
  const { step, setStep, goBack, loading: stepLoading } = useProfileFlowStep();
  const { user } = useAuth(); // <-- move useAuth to top level
  const isElderly = role === 'ELDERLY';
  const steps = isElderly ? stepsElderly : stepsCaregiver;
  const titles = isElderly ? titlesElderly : titlesCaregiver;
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Add state for elderly extra info fields
  const [dailyLife, setDailyLife] = useState('');
  const [relationships, setRelationships] = useState('');
  const [medicalNeeds, setMedicalNeeds] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [anythingElse, setAnythingElse] = useState('');

  // Use custom hook for profile update
  const { fields, setField, updateProfile, loading, errors, success, setSuccess, fullName, setFullName } = useUpdateUserProfile();

  // Use introduction hook for elderly users
  const { generateIntroduction } = useIntroduction();

  // Add state for caregiver approval flow
  const [caregiverApprovalStatus, setCaregiverApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  // Advance to next step after successful profile update
  // Remove the useEffect that advances the step on success

  // Avatar handlers
  const handlePickImage = async () => {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const base64Image = await convertImageToBase64(result.assets[0].uri);
        setField('profileImageUrl', base64Image);
      } catch (error) {
        console.error('Error converting image to Base64:', error);
        // You might want to show an error message to the user here
      }
    }
  };
  const handleRemoveImage = () => setField('profileImageUrl', '');

  const goNext = async () => {
    const nextStep = Math.min(step + 1, steps.length);
    await setStep(nextStep);
    
    // If this is the final step, complete the profile flow and navigate to app
    if (nextStep === steps.length) {
      try {
        await completeProfileFlow();
        console.log('[ProfileFlowScreen] Profile flow completed');
      } catch (error) {
        console.error('[ProfileFlowScreen] Error completing profile flow:', error);
      }
      // Navigate to AppTabs - the RootNavigator will handle showing the appropriate screen
      navigation.navigate('AppTabs');
    }
  };
  
  const goBackToPreviousStep = async () => {
    const prevStep = Math.max(step - 1, 1);
    await goBack(prevStep);
    // Reset caregiver approval status when going back
    if (!isElderly) {
      setCaregiverApprovalStatus(null);
    }
  };

  // Check if any elderly stage 2 fields have content
  const hasElderlyStage2Content = () => {
    return dailyLife.trim() || relationships.trim() || medicalNeeds.trim() || hobbies.trim() || anythingElse.trim();
  };

  // QR/Sync custom content
  const qrContent = (isElderly && step === 3)
    ? <ElderlyStage3 onBack={goBackToPreviousStep} onNext={goNext} />
    : (!isElderly && step === 2)
      ? <CaregiverStage2 
          onBack={goBackToPreviousStep} 
          onNext={goNext} 
          onConnectionRequestSent={() => setCaregiverApprovalStatus('pending')}
        />
      : (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ width: spacing.xxl * 5.5, height: spacing.xxl * 5.5, backgroundColor: palette.border, borderRadius: metrics.cardRadius, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: palette.textSecondary }}>[QR Code/Scanner Here]</Text>
          </View>
          <Text style={{ marginBottom: spacing.lg, textAlign: 'center', color: palette.textSecondary }}>
            Use your camera to scan the QR code from the elderly user's device to sync.
          </Text>
        </View>
      );

  // Map fields for ProfileFlowContent
  const getFields = () => {
    if (step === 1) {
      return [
        // Full Name
        { key: 'fullName', label: 'Full Name', placeholder: 'e.g. John Doe', value: fullName, onChange: setFullName, type: 'text', error: errors.fullName },
        { key: 'email', label: 'Email', placeholder: 'e.g. john.doe@email.com', value: (user?.email || ''), onChange: () => {}, type: 'email', editable: false },
        // Date of Birth and Phone Number Row
        { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'e.g. 1990-01-01', value: fields.dateOfBirth, onChange: (v: string) => setField('dateOfBirth', v), type: 'text', row: true, error: errors.dateOfBirth, style: { flex: 0.8, minWidth: 120, maxWidth: 160 } },
        { key: 'phoneNumber', label: 'Phone Number', placeholder: 'e.g. 021 123 4567', value: fields.phoneNumber, onChange: (v: string) => setField('phoneNumber', v), type: 'phone', row: true, error: errors.phoneNumber, style: { flex: 1.2, minWidth: 140 } },
        { key: 'address', label: 'Address', placeholder: 'e.g. 123 Main St, City', value: fields.address, onChange: (v: string) => setField('address', v), type: 'text' },
      ];
    } else if (isElderly && step === 2) {
      return [
        {
          label: 'Your Daily Life & Routines',
          placeholder: 'E.g. retired, daily walks, morning coffee',
          value: dailyLife,
          onChange: setDailyLife,
          type: 'text',
          multiline: true,
          numberOfLines: 3,
        },
        {
          label: 'Relationships & Support Network',
          placeholder: 'E.g. married, 2 kids, close friends',
          value: relationships,
          onChange: setRelationships,
          type: 'text',
          multiline: true,
          numberOfLines: 3,
        },
        {
          label: 'Medical Needs & Medications',
          placeholder: 'E.g. diabetes, blood pressure meds',
          value: medicalNeeds,
          onChange: setMedicalNeeds,
          type: 'text',
          multiline: true,
          numberOfLines: 3,
        },
        {
          label: 'Hobbies & Interests',
          placeholder: 'E.g. painting, reading, jazz',
          value: hobbies,
          onChange: setHobbies,
          type: 'text',
          multiline: true,
          numberOfLines: 3,
        },
        {
          label: 'Anything Else You\'d Like to Share?',
          placeholder: 'Anything else to help us support you?',
          value: anythingElse,
          onChange: setAnythingElse,
          type: 'text',
          multiline: true,
          numberOfLines: 3,
        },
      ];
    }
    return [];
  };

  // Button logic
  let showBack = false;
  let showNext = false;
  if (step === 1) {
    showNext = true;
  } else if (isElderly && step === 2) {
    showBack = true;
    showNext = true;
  } else if (isElderly && step === 3) {
    showBack = true;
    showNext = true;
  } else if (!isElderly && step === 2 && !caregiverApprovalStatus) {
    showBack = true;
    // Don't show Next button for caregivers in step 2 - they need to scan QR code
    showNext = false;
  }

  let customContent = undefined;
  if ((isElderly && step === 3) || (!isElderly && step === 2 && !caregiverApprovalStatus)) {
    customContent = qrContent;
  }
  const contentProps = {
    fields: getFields(),
    showAvatar: step === 1,
    avatarUri: fields.profileImageUrl || undefined,
    onPickAvatar: handlePickImage,
    onRemoveAvatar: handleRemoveImage,
    customContent,
    errors,
    ...( ((isElderly && step === 3) || (!isElderly && step === 2 && !caregiverApprovalStatus)) && { onNext: goNext } ),
  };

  // Show loading state while step is being loaded
  if (stepLoading) {
    return (
      <ScreenContainer style={{ padding: 0 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Handle caregiver approval flow
  if (!isElderly && step === 2 && caregiverApprovalStatus) {
    return (
      <ScreenContainer style={{ padding: 0 }}>
        <CaregiverPendingApproval 
          onApproved={() => {
            setCaregiverApprovalStatus('approved');
            setTimeout(() => {
              navigation.navigate('AppTabs');
            }, 2000);
          }}
          onRejected={() => {
            setCaregiverApprovalStatus('rejected');
            setTimeout(() => {
              setCaregiverApprovalStatus(null);
              setStep(2); // Go back to QR scanning step
            }, 2000);
          }}
        />
      </ScreenContainer>
    );
  }

  console.log('[ProfileFlowScreen] render', { success, step, isElderly });
  return (
    <ScreenContainer style={{ padding: 0 }}>
      <View style={{ flex: 1 }}>
        <ProgressStepper steps={steps} currentStep={step} />
        {/* Fixed Title */}
        <View style={{ alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.md }}>
          <Text style={[typography.heading2, { textAlign: 'center' }]}>{titles[step - 1]}</Text>
        </View>
        {/* Optional message for elderly extra info step */}
        {isElderly && step === 2 && (
          <Text style={{ color: palette.textSecondary, marginBottom: spacing.lg, textAlign: 'center', marginHorizontal: spacing.lg }}>
            This section is <Text style={{ fontWeight: 'bold', color: palette.textSecondary }}>optional</Text>, but sharing a little more about yourself will help personalise your AI companion experience.
          </Text>
        )}
        {/* Error and Success Messages */}
        {/* General error (not field-specific) */}
        {errors.general && (
          <Text style={{ color: palette.error, marginBottom: spacing.md, textAlign: 'center' }}>{errors.general}</Text>
        )}
        {success && (
          <Text style={{ color: palette.primary, marginBottom: spacing.md, textAlign: 'center' }}>Profile updated successfully!</Text>
        )}
        {/* Scrollable, keyboard-avoiding content area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={64}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ProfileFlowContent {...contentProps} />
          </ScrollView>
        </KeyboardAvoidingView>
        {/* Fixed Button Bar at Bottom */}
        <View
          style={{
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            marginTop: spacing.xl,
            backgroundColor: 'transparent',
          }}
        >
          {showBack && showNext ? (
            <View style={{ flexDirection: 'row', width: 320, maxWidth: '100%', justifyContent: 'space-between' }}>
              <Button title="Back" onPress={goBackToPreviousStep} variant="secondary" style={{ width: 150, maxWidth: '48%' }} />
              <Button
                title={loading ? 'Saving...' : 
                  ((isElderly && step === 3) || (!isElderly && step === 2)) ? 'Skip' : 
                  (isElderly && step === 2) ? (hasElderlyStage2Content() ? 'Next' : 'Skip') : 
                  'Next'}
                onPress={() => {
                  if (isElderly && step === 3) {
                    goNext();
                    navigation.navigate('AppTabs');
                  } else if (isElderly && step === 2) {
                    // Update profile with ElderlyStage2 data
                    const updatedFields = {
                      ...fields,
                      dailyLife,
                      relationships,
                      medicalNeeds,
                      hobbies,
                      anythingElse,
                    };
                    updateProfile(goNext, updatedFields);
                  } else {
                    updateProfile(goNext);
                  }
                }}
                style={{ width: 150, maxWidth: '48%' }}
                disabled={loading}
              />
            </View>
          ) : showBack ? (
            <Button title="Back" onPress={goBackToPreviousStep} variant="secondary" style={{ width: 320, maxWidth: '100%' }} />
          ) : showNext ? (
            <Button
              title={loading ? 'Saving...' : 'Next'}
              onPress={() => updateProfile(goNext)}
              style={{ width: 320, maxWidth: '100%' }}
              disabled={loading}
            />
          ) : null}
        </View>
      </View>
    </ScreenContainer>
  );
};

export default ProfileFlowScreen; 