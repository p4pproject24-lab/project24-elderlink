import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Text from '../../components/ui/Text';
import { spacing, colors, metrics } from '../../theme';
import { useColorScheme, View, ActivityIndicator, Alert } from 'react-native';
import { useTypography } from '../../theme/typography';
import { useAuthContext } from '../../contexts/AuthContext';
import { useConnectionRequests } from '../../hooks/useConnectionRequests';

interface CaregiverPendingApprovalProps {
  onApproved?: () => void;
  onRejected?: () => void;
}

const CaregiverPendingApproval: React.FC<CaregiverPendingApprovalProps> = ({ onApproved, onRejected }) => {
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const typography = useTypography(colorScheme === 'dark' ? 'dark' : 'light');
  const { user } = useAuthContext();
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const { subscribeCaregiverConnectionApprovals } = useConnectionRequests();

  useEffect(() => {
    if (!user?.firebaseUid) return;
    
    let client: any = null;
    
    const initWebSocket = async () => {
      try {
        client = await subscribeCaregiverConnectionApprovals(user.firebaseUid, async (msg: any) => {
          if (msg.type === 'CONNECTION_APPROVED') {
            setApproved(true);
            Alert.alert('Connection Approved', 'The elderly user has approved your request!');
            onApproved?.();
          } else if (msg.type === 'CONNECTION_REJECTED') {
            setRejected(true);
            Alert.alert('Connection Denied', 'The user has denied your connection request.');
            onRejected?.();
          }
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
  }, [user, subscribeCaregiverConnectionApprovals, onApproved, onRejected]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
      <Card style={{ width: '90%', alignItems: 'center', padding: spacing.lg }}>
        <ActivityIndicator size="large" color={palette.primary} style={{ marginBottom: 24 }} />
        <Text style={[typography.heading2, { marginBottom: spacing.lg }]}>Waiting for elderly to approve...</Text>
        {approved && <Text style={{ color: palette.success, fontSize: 16, marginTop: 16 }}>Connection approved! Redirecting...</Text>}
        {rejected && <Text style={{ color: palette.error, fontSize: 16, marginTop: 16 }}>Connection denied by elderly.</Text>}
      </Card>
    </View>
  );
};

export default CaregiverPendingApproval; 