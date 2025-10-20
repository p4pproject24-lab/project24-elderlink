import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentElderly } from '../contexts/CurrentElderlyContext';
import { colors, spacing, metrics } from '../theme';

interface CurrentElderlyButtonProps {
  onPress: () => void;
  size?: number;
}

const CurrentElderlyButton: React.FC<CurrentElderlyButtonProps> = ({ 
  onPress, 
  size = 40 
}) => {
  const { currentElderly } = useCurrentElderly();

  const renderProfilePicture = () => {
    if (currentElderly?.profileImageUrl) {
      return (
        <Image
          source={{ uri: currentElderly.profileImageUrl }}
          style={[styles.profileImage, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      );
    }
    
    return (
      <View style={[styles.profileInitial, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: colors.light.primaryLight 
      }]}>
        <Ionicons 
          name="person" 
          size={size * 0.4} 
          color={colors.light.primary} 
        />
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.7}
      testID="current-elderly-button"
    >
      {renderProfilePicture()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    overflow: 'hidden',
  },
  profileInitial: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CurrentElderlyButton; 