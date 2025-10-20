import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Modal,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DailySummary } from '../../services/dailySummaryService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, ThemeMode } from '../../theme';

const CaregiverSummaryDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const { summary } = route.params as { summary: DailySummary };
  const { currentElderly, connectedElderly, setCurrentElderly } = useCurrentElderly();
  const [showElderlySelector, setShowElderlySelector] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22C55E'; // Green
    if (score >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreIcon = (category: string) => {
    switch (category) {
      case 'health': return 'fitness';
      case 'exercise': return 'walk-outline';
      case 'mental': return 'person-add-outline';
      case 'social': return 'people';
      case 'productivity': return 'analytics';
      default: return 'star';
    }
  };

  return (
    <ScreenContainer>
      <Header 
        title="Daily Summary" 
        left={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={palette.primary} />
          </TouchableOpacity>
        }
        right={<CurrentElderlyButton onPress={() => setShowElderlySelector(true)} />}
      />
      
      <ScrollView contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}>
        {/* Elderly User Info */}
        {currentElderly && (
          <Card style={[
            styles.elderlyInfoCard,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={styles.elderlyInfoHeader}>
              <Ionicons name="person" size={20} color="#5EBFB5" />
              <Text style={styles.elderlyInfoTitle}>
                {currentElderly.fullName}'s Summary
              </Text>
            </View>
            <Text style={styles.elderlyInfoSubtitle}>
              {formatDate(summary.date)}
            </Text>
          </Card>
        )}

        <View style={styles.dateHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={24} color="#5EBFB5" />
          </View>
          <Text style={styles.date}>{formatDate(summary.date)}</Text>
        </View>

        <Card highlight style={[
          styles.summaryCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubble" size={20} color="#5EBFB5" />
            <Text style={styles.cardTitle}>Summary</Text>
          </View>
          <Text style={styles.summaryText}>{summary.summary}</Text>
        </Card>

        <Card highlight style={[
          styles.scoresCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bar-chart-outline" size={20} color="#5EBFB5" />
            <Text style={styles.cardTitle}>Daily Scores</Text>
          </View>
          
          {Object.entries(summary.scores).map(([category, score]) => (
            <View key={category} style={styles.scoreItem}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreIconContainer}>
                  <Ionicons 
                    name={getScoreIcon(category) as any} 
                    size={16} 
                    color={getScoreColor(score)} 
                  />
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreCategory}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.scoreLabel}>{getScoreLabel(score)}</Text>
                </View>
                <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}> {score}/10 </Text>
              </View>
              
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreFill, 
                    { 
                      width: `${(score / 10) * 100}%`,
                      backgroundColor: getScoreColor(score)
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </Card>

        <Card highlight style={[
          styles.analysisCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb" size={20} color="#5EBFB5" />
            <Text style={styles.cardTitle}>AI Analysis</Text>
          </View>
          <Text style={styles.analysisText}>{summary.analysis}</Text>
        </Card>

        <Card highlight style={[
          styles.metadataCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color="#5EBFB5" />
            <Text style={styles.cardTitle}>Summary Details</Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.metadataLabel}>Generated:</Text>
            <Text style={styles.metadataValue}>
              {new Date(summary.createdAt ?? '').toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.metadataRow}>
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.metadataLabel}>Last Updated:</Text>
            <Text style={styles.metadataValue}>
              {new Date(summary.updatedAt ?? '').toLocaleString()}
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Elderly Selector Modal */}
      <Modal
        visible={showElderlySelector}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowElderlySelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#FAF9F6' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>
                  Select Elderly User
                </Text>
                <Text style={styles.modalSubtitle}>
                  Choose an elderly user to view their daily summaries
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowElderlySelector(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.elderlyList} showsVerticalScrollIndicator={false}>
              {connectedElderly.map((elderly) => (
                <TouchableOpacity
                  key={elderly.firebaseUid}
                  style={[
                    styles.elderlyItem,
                    currentElderly?.firebaseUid === elderly.firebaseUid && {
                      borderColor: '#5EBFB5',
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => {
                    setCurrentElderly(elderly);
                    setShowElderlySelector(false);
                  }}
                >
                  <View style={styles.elderlyItemContent}>
                    <View style={styles.elderlyItemLeft}>
                      {elderly.profileImageUrl ? (
                        <Image
                          source={{ uri: elderly.profileImageUrl }}
                          style={styles.elderlyProfileImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.elderlyProfileInitial}>
                          <Text style={styles.elderlyProfileInitialText}>
                            {elderly.fullName?.charAt(0) || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.elderlyItemInfo}>
                        <Text style={styles.elderlyItemName}>
                          {elderly.fullName}
                        </Text>
                        <Text style={styles.elderlyItemEmail}>
                          {elderly.email}
                        </Text>
                      </View>
                    </View>
                    {currentElderly?.firebaseUid === elderly.firebaseUid && (
                      <Ionicons name="checkmark-circle" size={24} color="#5EBFB5" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowElderlySelector(false)}
                variant="secondary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
  },
  tabletScrollContent: {
    paddingHorizontal: 64,
  },
  elderlyInfoCard: {
    marginBottom: 16,
  },
  elderlyInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  elderlyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  elderlyInfoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: 24,
  },
  scoresCard: {
    marginBottom: 24,
  },
  analysisCard: {
    marginBottom: 24,
  },
  metadataCard: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  scoreItem: {
    marginBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  analysisText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
  elderlyList: {
    maxHeight: 300,
  },
  elderlyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  elderlyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elderlyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  elderlyProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  elderlyProfileInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5F3',
  },
  elderlyProfileInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5EBFB5',
  },
  elderlyItemInfo: {
    flex: 1,
  },
  elderlyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  elderlyItemEmail: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    marginTop: 24,
  },
  modalButton: {
    width: '100%',
  },
});

export default CaregiverSummaryDetailScreen; 