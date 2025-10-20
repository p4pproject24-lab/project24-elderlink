import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import TextInput from '../../components/ui/TextInput';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { spacing, colors } from '../../theme';
import { useColorScheme } from 'react-native';
import { useTypography } from '../../theme/typography';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const ElderlyStage2: React.FC<Props> = ({ onNext, onBack }) => {
  const [work, setWork] = useState('');
  const [relationships, setRelationships] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');

  const handleNext = () => {
    if (!work || !relationships || !hobbies) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    onNext();
  };

  return (
    <Card style={{ width: '100%', padding: spacing.lg }}>
      <Text style={[typography.heading2, { marginBottom: spacing.lg }]}>Extra Information</Text>
      <TextInput placeholder="Work / Daily Life" value={work} onChangeText={setWork} style={{ marginBottom: spacing.md }} />
      <TextInput placeholder="Relationships" value={relationships} onChangeText={setRelationships} style={{ marginBottom: spacing.md }} />
      <TextInput placeholder="Hobbies" value={hobbies} onChangeText={setHobbies} style={{ marginBottom: spacing.lg }} />
      {error ? <Text style={{ color: palette.error, marginBottom: spacing.md }}>{error}</Text> : null}
      <Button title="Back" onPress={onBack} variant="secondary" style={{ marginBottom: spacing.md }} />
      <Button title="Next" onPress={handleNext} />
    </Card>
  );
};

export default ElderlyStage2; 