import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DailySummary } from '../../services/dailySummaryService';
import Card from '../../components/ui/Card';
import { TTSWrapper } from '../../components/TTSWrapper';
import Header from '../../components/ui/Header';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors, ThemeMode } from '../../theme';

const SummaryDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  const { summary } = route.params as { summary: DailySummary };

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
      />
      <ScrollView contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}>
        <View style={styles.dateHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={24} color="#5EBFB5" />
          </View>
          <Text style={styles.date}>{formatDate(summary.date)}</Text>
        </View>

        <TTSWrapper
          text={summary.summary}
          buttonSize={20}
          buttonColor="#5EBFB5"
          buttonPosition="top-right"
        >
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
        </TTSWrapper>

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

        <TTSWrapper
          text={summary.analysis}
          buttonSize={20}
          buttonColor="#5EBFB5"
          buttonPosition="top-right"
        >
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
        </TTSWrapper>

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
    backgroundColor: '#E5E7EB',
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
});

export default SummaryDetailScreen; 