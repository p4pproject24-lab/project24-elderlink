import React, { useState, useRef } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { useColorScheme, View, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useTypography } from '../../theme/typography';
import { useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../../contexts/AuthContext';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  onBack: () => void;
  onNext?: () => void;
  onConnectionRequestSent?: () => void;
}

const CaregiverStage2: React.FC<Props> = ({ onBack, onNext, onConnectionRequestSent }) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const scanLock = useRef(false); // lock to prevent multiple triggers
  const navigation = useNavigation();
  const { user } = useAuthContext();
  const [permission, requestPermission] = useCameraPermissions();
  const { sendConnectionRequest } = useConnectionRequests();

  if (!permission) return <View style={styles.center}><Text>Loading permissions...</Text></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || scanLock.current) return;
    scanLock.current = true;
    setScanned(true);
    setScannedId(data);
    Alert.alert(
      'Connect to User',
      `You are connecting to user with ID: ${data}. Confirm?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { setScanned(false); setScannedId(null); scanLock.current = false; } },
        { text: 'Confirm', onPress: () => sendConnectionRequestToBackend(data) },
      ]
    );
  };

  const sendConnectionRequestToBackend = async (elderlyId: string) => {
    if (!user?.firebaseUid) return;
    setLoading(true);
    try {
      await sendConnectionRequest(user.firebaseUid, elderlyId);
      onConnectionRequestSent?.();
      // Don't call onNext() here - let the WebSocket response handle navigation
    } catch (err) {
      Alert.alert('Error', 'Failed to send connection request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl + 80, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ width: '100%', padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg }}>
          <Text style={[typography.heading2, { marginBottom: spacing.lg }]}>Scan Elderly User's QR Code</Text>
          <View style={{ width: spacing.xxl * 5.5, height: spacing.xxl * 5.5, backgroundColor: palette.border, borderRadius: metrics.cardRadius, marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <ActivityIndicator size="large" color={palette.primary} />
            ) : (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
            )}
          </View>
          {scanned && !loading && (
            <Button title="Tap to Scan Again" onPress={() => { setScanned(false); setScannedId(null); scanLock.current = false; }} />
          )}
          <Text style={{ marginBottom: spacing.lg, textAlign: 'center', color: palette.textSecondary }}>
            Scan the QR code shown by the elderly user to connect.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
});

export default CaregiverStage2; 