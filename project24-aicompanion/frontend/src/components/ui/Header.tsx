import React from 'react';
import { View } from 'react-native';
import Text from './Text';
import { spacing } from '../../theme';

const Header: React.FC<{ title: string; left?: React.ReactNode; right?: React.ReactNode; style?: any }> = ({
  title,
  left,
  right,
  style,
}) => (
  <View
    style={[
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing.sm,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
        position: 'relative',
      },
      style,
    ]}
  >
    {left && <View style={{ width: 40, alignItems: 'flex-start', zIndex: 1 }}>{left}</View>}
    <View style={{ 
      position: 'absolute', 
      left: 0, 
      right: 0, 
      alignItems: 'center', 
      justifyContent: 'center',
      zIndex: 0
    }}>
      <Text
        variant="heading2"
        style={{ textAlign: 'center' }}
      >
        {title}
      </Text>
    </View>
    {right && <View style={{ width: 40, alignItems: 'flex-end', zIndex: 1, marginLeft: 'auto' }}>{right}</View>}
  </View>
);

export default Header; 