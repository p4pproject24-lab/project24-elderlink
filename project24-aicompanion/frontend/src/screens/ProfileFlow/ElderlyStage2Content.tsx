import React, { useState } from 'react';
import { View } from 'react-native';
import TextInput from '../../components/ui/TextInput';
import { spacing, colors } from '../../theme';
import { useColorScheme } from 'react-native';

const ElderlyStage2Content: React.FC = () => {
  const [work, setWork] = useState('');
  const [relationships, setRelationships] = useState('');
  const [hobbies, setHobbies] = useState('');
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={{ width: '100%' }}>
      <TextInput placeholder="Work / Daily Life" value={work} onChangeText={setWork} style={{ marginBottom: spacing.md }} />
      <TextInput placeholder="Relationships" value={relationships} onChangeText={setRelationships} style={{ marginBottom: spacing.md }} />
      <TextInput placeholder="Hobbies" value={hobbies} onChangeText={setHobbies} style={{ marginBottom: spacing.lg }} />
    </View>
  );
};

export default ElderlyStage2Content; 