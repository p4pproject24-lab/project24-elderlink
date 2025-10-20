import { useState, useEffect } from 'react';
import { updateUserProfile, UpdateUserProfileDTO } from '../services/userService';
import { useAuth } from './useAuth';
import { ApiResponse } from '../types/ApiResponse';

export function useUpdateUserProfile() {
  const { user, refresh } = useAuth();
  // Use single fullName field instead of separate firstName and lastName
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [fields, setFields] = useState<UpdateUserProfileDTO>({
    fullName: user?.fullName || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    phoneNumber: user?.phoneNumber || '',
    profileImageUrl: user?.profileImageUrl || '',
    dailyLife: user?.dailyLife || '',
    relationships: user?.relationships || '',
    medicalNeeds: user?.medicalNeeds || '',
    hobbies: user?.hobbies || '',
    anythingElse: user?.anythingElse || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  // Sync fullName from user on mount/user change
  useEffect(() => {
    setFullName(user?.fullName || '');
    setFields({
      fullName: user?.fullName || '',
      address: user?.address || '',
      dateOfBirth: user?.dateOfBirth || '',
      phoneNumber: user?.phoneNumber || '',
      profileImageUrl: user?.profileImageUrl || '',
      dailyLife: user?.dailyLife || '',
      relationships: user?.relationships || '',
      medicalNeeds: user?.medicalNeeds || '',
      hobbies: user?.hobbies || '',
      anythingElse: user?.anythingElse || '',
    });
  }, [user]);

  // Keep fields.fullName in sync with fullName
  useEffect(() => {
    setFields((prev) => ({ ...prev, fullName }));
  }, [fullName]);

  const setField = (key: keyof UpdateUserProfileDTO, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  // Validate fullName
  const validate = (): { [key: string]: string } => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required.';
    if (!fields.address.trim()) errs.address = 'Address is required.';
    if (!fields.dateOfBirth.trim()) errs.dateOfBirth = 'Date of birth is required.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.dateOfBirth)) errs.dateOfBirth = 'Date of birth must be in YYYY-MM-DD format.';
    if (!fields.phoneNumber.trim()) errs.phoneNumber = 'Phone number is required.';
    else if (!/^\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}$/.test(fields.phoneNumber.replace(/\s|-/g, ''))) {
      errs.phoneNumber = 'Invalid phone number format.';
    }
    return errs;
  };

  const updateProfile = async (onSuccess?: () => void, additionalFields?: Partial<UpdateUserProfileDTO>) => {
    setLoading(true);
    setErrors({});
    setSuccess(false);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    try {
      const fieldsToSend = {
        ...fields,
        fullName: fullName.trim(),
        profileImageUrl: fields.profileImageUrl || undefined,
        ...additionalFields, // Include any additional fields passed in
      };
      
      console.log('[updateProfile] Sending fields:', fieldsToSend);
      const res: ApiResponse = await updateUserProfile(fieldsToSend);
      console.log('[updateProfile] Response:', res);
      if (res.status !== 200) {
        if (typeof res.message === 'object' && res.message !== null) {
          setErrors(res.message as { [key: string]: string });
        } else {
          // Try to map known format errors to fields
          const msg = typeof res.message === 'string' ? res.message : 'Failed to update profile';
          if (msg.toLowerCase().includes('date')) {
            setErrors({ dateOfBirth: msg });
          } else if (msg.toLowerCase().includes('phone')) {
            setErrors({ phoneNumber: msg });
          } else if (msg.toLowerCase().includes('address')) {
            setErrors({ address: msg });
          } else if (msg.toLowerCase().includes('name')) {
            setErrors({ fullName: msg });
          } else {
            setErrors({ general: msg });
          }
        }
        setSuccess(false);
      } else {
        setSuccess(true);
        console.log('[useUpdateUserProfile] setSuccess(true) called');
        if (onSuccess) onSuccess();
        console.log('[useUpdateUserProfile] Calling refresh to update user data');
        await refresh();
        console.log('[useUpdateUserProfile] Refresh completed');
      }
    } catch (e: any) {
      console.log('[updateProfile] Error:', e);
      const backendMsg = e?.response?.data?.message;
      if (typeof backendMsg === 'object' && backendMsg !== null) {
        setErrors(backendMsg as { [key: string]: string });
      } else {
        const msg = backendMsg || e.message || 'Failed to update profile';
        if (msg.toLowerCase().includes('date')) {
          setErrors({ dateOfBirth: msg });
        } else if (msg.toLowerCase().includes('phone')) {
          setErrors({ phoneNumber: msg });
        } else if (msg.toLowerCase().includes('address')) {
          setErrors({ address: msg });
        } else if (msg.toLowerCase().includes('name')) {
          setErrors({ fullName: msg });
        } else {
          setErrors({ general: msg });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return { fields, setField, updateProfile, loading, errors, success, setSuccess, fullName, setFullName };
} 