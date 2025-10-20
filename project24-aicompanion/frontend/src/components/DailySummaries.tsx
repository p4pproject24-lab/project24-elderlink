import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { dailySummaryService, DailySummary } from '../services/dailySummaryService';
import Card from './ui/Card';
import { colors, spacing, ThemeMode } from '../theme';

const DailySummaries = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { user: firebaseUser } = useFirebaseAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];
  
  const [recentSummaries, setRecentSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (firebaseUser?.uid) {
      loadRecentSummaries(firebaseUser.uid);
    }
  }, [firebaseUser]);

  const loadRecentSummaries = async (userId: string) => {
    try {
      setLoading(true);
      const summaries = await dailySummaryService.getAll(userId);
      setRecentSummaries(summaries.slice(0, 3)); // Show only the 3 most recent
    } catch (error) {
      console.error('Error loading recent summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    (navigation as any).navigate("Insights", { screen: "DailySummaries" });
  };

  const handleCreateNew = () => {
    (navigation as any).navigate("Insights", { screen: "DailySummaries" });
  };

  const handleViewSummary = (summary: DailySummary) => {
    (navigation as any).navigate('Insights', {
      screen: 'SummaryDetail',
      params: { summary }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return palette.success;
    if (score >= 6) return palette.accent;
    return palette.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getAverageScore = (scores: DailySummary['scores']) => {
    const values = Object.values(scores);
    return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="document-text" size={20} color={palette.primary} />
            <Text style={[styles.title, { color: palette.textPrimary }]}>Daily Summaries</Text>
          </View>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={[styles.viewAllText, { color: palette.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>Loading summaries...</Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="document-text" size={20} color={palette.primary} />
          <Text style={[styles.title, { color: palette.textPrimary }]}>Daily Summaries</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleCreateNew} style={[styles.createButton, { backgroundColor: palette.primaryLight }] }>
            <Ionicons name="add" size={16} color={palette.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewAll}>
            <Text style={[styles.viewAllText, { color: palette.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {recentSummaries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={32} color={palette.disabled} />
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No summaries yet</Text>
          <Text style={[styles.emptySubtext, { color: palette.textSecondary }]}>Create your first daily summary</Text>
          <TouchableOpacity style={[styles.createFirstButton, { backgroundColor: palette.primary }]} onPress={handleCreateNew}>
            <Text style={[styles.createFirstButtonText, { color: palette.surface }]}>Create Summary</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.summariesContainer}>
          {recentSummaries.map((summary) => {
            const averageScore = getAverageScore(summary.scores);
            return (
              <Card highlight style={styles.summaryItem} key={summary.id}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleViewSummary(summary)}
                  activeOpacity={0.8}
                >
                <View style={styles.summaryHeader}>
                  <Text style={[styles.summaryDate, { color: palette.textPrimary }]}>{formatDate(summary.date)}</Text>
                  <View style={styles.scoreContainer}>
                    <View style={[
                      styles.scoreDot,
                      { backgroundColor: getScoreColor(averageScore) }
                    ]} />
                    <Text style={[styles.scoreText, { color: getScoreColor(averageScore) }]}> 
                      {averageScore}/10
                    </Text>
                  </View>
                </View>
                <Text style={[styles.summaryText, { color: palette.textSecondary }]} numberOfLines={2}>
                  {summary.summary}
                </Text>
                <View style={styles.summaryFooter}>
                  <Ionicons name="chevron-forward" size={16} color={palette.primary} />
                </View>
                </TouchableOpacity>
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    marginTop: spacing.sm,
    marginBottom: 4,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  createFirstButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  createFirstButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  summariesContainer: {
    gap: 12,
  },
  summaryItem: {
    padding: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  summaryFooter: {
    alignItems: 'flex-end',
  },
});

export default DailySummaries; 