import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/ui/Card';
import Text from '../../components/ui/Text';
import Button from '../../components/ui/Button';
import { spacing, colors, metrics } from '../../theme';
import { useColorScheme, View, ScrollView, Alert, Dimensions, StyleSheet } from 'react-native';
import { useTypography } from '../../theme/typography';
import QRCode from 'react-native-qrcode-svg';
import { useAuthContext } from '../../contexts/AuthContext';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

const { width } = Dimensions.get('window');

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const ElderlyStage3: React.FC<Props> = ({ onBack, onNext }) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');
  const { user } = useAuthContext();
  const elderlyId = user?.firebaseUid || '';
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { subscribeElderlyConnectionRequests, approveConnection, rejectConnection } = useConnectionRequests();

  const handleApprove = useCallback(async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      await approveConnection(connectionId);
      Alert.alert('Connection Approved', 'You have approved the caregiver connection request.');
    } catch (e) {
      Alert.alert('Error', 'Failed to approve connection.');
    } finally {
      setActionLoading(null);
    }
  }, [approveConnection]);

  const handleReject = useCallback(async (connectionId: string) => {
    setActionLoading(connectionId);
    try {
      await rejectConnection(connectionId);
      Alert.alert('Connection Rejected', 'You have rejected the caregiver connection request.');
    } catch (e) {
      Alert.alert('Error', 'Failed to reject connection.');
    } finally {
      setActionLoading(null);
    }
  }, [rejectConnection]);

  useEffect(() => {
    if (!elderlyId) return;
    
    let client: any = null;
    
    const initWebSocket = async () => {
      try {
        client = await subscribeElderlyConnectionRequests(elderlyId, (msg: any) => {
          Alert.alert(
            'Connection Request',
            `${msg.caregiverName || 'A caregiver'} wants to connect with you.`,
            [
              {
                text: 'Reject',
                style: 'destructive',
                onPress: () => handleReject(msg.connectionId),
                isPreferred: false,
              },
              {
                text: 'Accept',
                style: 'default',
                onPress: () => handleApprove(msg.connectionId),
                isPreferred: true,
              },
            ],
            { cancelable: false }
          );
        });
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };
    
    initWebSocket();
    
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [elderlyId, subscribeElderlyConnectionRequests, handleApprove, handleReject]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl + 80, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ width: '100%', padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg }}>
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              {elderlyId ? (
                <QRCode value={elderlyId} size={width * 0.6} />
              ) : (
                <Text style={styles.qrPlaceholderText}>No ID found</Text>
              )}
            </View>
            <Text style={styles.qrInstructions}>
              Show this QR code to your caregiver so they can scan and connect with you.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrPlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  qrPlaceholderText: {
    fontSize: 60,
    marginBottom: 15,
  },
  qrInstructions: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
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

export default ElderlyStage3; 