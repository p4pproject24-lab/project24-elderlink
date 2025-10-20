import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Pressable,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '../../contexts/AuthContext';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useDailySummary } from '../../hooks/useDailySummary';
import { dailySummaryService, DailySummary } from '../../services/dailySummaryService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import ScreenContainer from '../../components/ui/ScreenContainer';
import { colors } from '../../theme';


const DailySummariesScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthContext();
  const { user: firebaseUser } = useFirebaseAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [allSummaries, setAllSummaries] = useState<DailySummary[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(false); // New: lock for date fetch
  const [canGenerateCache, setCanGenerateCache] = useState<{ [month: string]: { [date: string]: boolean } }>({});
  const [prevExists, setPrevExists] = useState(false);
  const [prevCanGenerate, setPrevCanGenerate] = useState(false);
  const [prevSelectedDate, setPrevSelectedDate] = useState<string>('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth());

  // For selected date
  const {
    summary,
    loading,
    error,
    canGenerate,
    exists,
    fetchSummary,
    generateSummary,
  } = useDailySummary(firebaseUser?.uid, selectedDate);

  useFocusEffect(
    React.useCallback(() => {
      if (firebaseUser?.uid) {
        loadAllSummaries();
      }
    }, [firebaseUser])
  );

  const loadAllSummaries = async () => {
    if (!firebaseUser?.uid) return;
    try {
      setLoadingAll(true);
      const data = await dailySummaryService.getAll(firebaseUser.uid);
      setAllSummaries(data);
    } catch (error) {
      console.error('Error loading daily summaries:', error);
      Alert.alert('Error', 'Failed to load daily summaries');
    } finally {
      setLoadingAll(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllSummaries();
  };

  const handleViewSummary = (summary: DailySummary) => {
    (navigation as any).navigate('SummaryDetail', { summary });
  };

  const handleDeleteSummary = (summary: DailySummary) => {
    Alert.alert(
      'Delete Summary',
      `Are you sure you want to delete the summary for ${summary.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dailySummaryService.delete(firebaseUser?.uid!, summary.date);
              await loadAllSummaries();
              if (selectedDate === summary.date) {
                fetchSummary();
              }
            } catch (error) {
              console.error('Error deleting summary:', error);
              Alert.alert('Error', 'Failed to delete summary');
            }
          },
        },
      ]
    );
  };

  const handleGenerateSummary = async () => {
    if (!selectedDate || !canGenerate) return;
    try {
      const newSummary = await generateSummary();
      Alert.alert(
        'Success!',
        'Daily summary generated successfully',
        [
          {
            text: 'View Summary',
            onPress: () => (navigation as any).navigate('SummaryDetail', { summary: newSummary })
          },
          {
            text: 'Back to List',
            onPress: () => {
              setSelectedDate('');
              loadAllSummaries();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', error?.message || 'Failed to generate summary');
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  // Memoize calendar days for performance
  const calendarDays = useMemo(() => getCalendarDays(), [currentMonth, allSummaries]);

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  // Helper to fetch canGenerateMap for a month
  const fetchMonthCanGenerateMap = async (monthDate: Date) => {
    if (!firebaseUser?.uid) return {};
    const daysInMonth = getDaysInMonth(monthDate);
    const map: { [date: string]: boolean } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), i);
      const dateString = getDateString(date);
      if (date < new Date() && !allSummaries.find(s => s.date === dateString)) {
        try {
          const res = await dailySummaryService.canGenerate(firebaseUser.uid, dateString);
          map[dateString] = res.canGenerate;
        } catch {
          map[dateString] = false;
        }
      }
    }
    return map;
  };

  // Effect to cache current and previous month
  useEffect(() => {
    const updateCache = async () => {
      const currentKey = getMonthKey(currentMonth);
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const prevKey = getMonthKey(prevMonth);
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      const nextKey = getMonthKey(nextMonth);
      const newCache = { ...canGenerateCache };
      if (!newCache[currentKey]) {
        newCache[currentKey] = await fetchMonthCanGenerateMap(currentMonth);
      }
      if (!newCache[prevKey]) {
        newCache[prevKey] = await fetchMonthCanGenerateMap(prevMonth);
      }
      if (!newCache[nextKey]) {
        newCache[nextKey] = await fetchMonthCanGenerateMap(nextMonth);
      }
      setCanGenerateCache(newCache);
    };
    updateCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, allSummaries, firebaseUser]);

  // Use the cached map for the current month
  const monthKey = getMonthKey(currentMonth);
  const canGenerateMap = canGenerateCache[monthKey] || {};

  // Ensure fetchSummary always uses latest selectedDate
  useEffect(() => {
    if (selectedDate) {
      const fetch = async () => {
        setIsDateLoading(true);
        await fetchSummary();
        setIsDateLoading(false);
      };
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (!isDateLoading && selectedDate) {
      setPrevExists(exists);
      setPrevCanGenerate(canGenerate);
      setPrevSelectedDate(selectedDate);
    }
  }, [isDateLoading, exists, canGenerate, selectedDate]);

  const handleDateSelect = (date: Date) => {
    if (isDateLoading) return; // Prevent double fetch
    const dateString = getDateString(date);
    setSelectedDate(dateString);
  };

  const getDateStatus = (date: Date): 'future' | 'exists' | 'not_available' => {
    const dateString = getDateString(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return 'future';
    }
    const existingSummary = allSummaries.find(s => s.date === dateString);
    if (existingSummary) {
      return 'exists';
    }
    return 'not_available';
  };

  const getDateColor = (date: Date) => {
    const dateString = getDateString(date);
    if (allSummaries.find(s => s.date === dateString)) return '#5EBFB5'; // Teal
    if (date > new Date()) return '#E5E7EB'; // Gray
    if (canGenerateMap[dateString]) return '#FF8C00'; // Orange
    return '#EF4444'; // Red
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#22C55E';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const handleOpenMonthPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setSelectedMonth(currentMonth.getMonth());
    setShowMonthPicker(true);
  };
  const handleCloseMonthPicker = () => setShowMonthPicker(false);
  const handleSelectMonthYear = () => {
    setCurrentMonth(new Date(pickerYear, selectedMonth, 1));
    setShowMonthPicker(false);
  };

  // Styles for the modal (must be inside the component to use palette)
  const modalStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    card: {
      backgroundColor: palette.cardHighlight,
      borderRadius: 20,
      padding: 24,
      minWidth: 320,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 12,
    },
    headerText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: palette.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    closeButton: {
      padding: 8,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 2,
    },
    monthsGridFixed: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 20,
      width: 280,
    },
    monthCell: {
      width: '30%',
      margin: '1.5%',
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: palette.cardHighlight,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    monthCellSelected: {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    },
    monthText: {
      fontSize: 17,
      color: palette.textPrimary,
      fontWeight: '600',
    },
    monthTextSelected: {
      color: palette.surface,
      fontWeight: 'bold',
    },
    modalButtonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 12,
      gap: 12,
    },
    modalButton: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: palette.primary,
    },
    modalButtonText: {
      color: palette.surface,
      fontWeight: 'bold',
      fontSize: 16,
    },
    modalButtonSecondary: {
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.primary,
    },
    modalButtonTextSecondary: {
      color: palette.primary,
    },
    arrowButton: {
      padding: 8,
    },
  });

  if (loadingAll) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5EBFB5" />
          <Text style={styles.loadingText}>Loading your daily summaries...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Daily Summaries" />
      <ScrollView contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}>

        {/* Calendar Section */}
        <Card highlight style={[
          styles.calendarCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color="#5EBFB5" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenMonthPicker}>
              <Text style={styles.monthTitle}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeMonth('next')}>
              <Ionicons name="chevron-forward" size={24} color="#5EBFB5" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
            {/* Calendar days */}
            {calendarDays.map((date, index) => (
              <View key={index} style={styles.calendarCell}>
                {date ? (
                  <TouchableOpacity
                    style={[
                      styles.calendarDateButton,
                      { backgroundColor: getDateColor(date) },
                      getDateString(date) === selectedDate && styles.selectedDate
                    ]}
                    onPress={() => handleDateSelect(date)}
                    activeOpacity={0.7}
                    disabled={isDateLoading} // Disable while loading
                  >
                    <Text
                      style={styles.calendarDateText}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyCell} />
                )}
              </View>
            ))}
          </View>

          {/* Color Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Color Guide:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF8C00' }]} />
                <Text style={styles.legendText}>Can generate summary</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#5EBFB5' }]} />
                <Text style={styles.legendText}>Summary exists</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>No messages available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#E5E7EB' }]} />
                <Text style={styles.legendText}>Future date</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Selected Date Info */}
        {selectedDate && (
          <Card highlight style={[
            styles.infoCard,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={styles.infoHeader}>
              <Ionicons 
                name="information-circle" 
                size={20} 
                color={exists ? "#5EBFB5" : canGenerate ? "#FF8C00" : "#EF4444"} 
              />
              <Text style={styles.infoTitle}>Selected Date</Text>
            </View>
            <Text style={styles.infoDate}>{formatDate(selectedDate)}</Text>
            <View style={styles.infoDetails}>
              <View style={styles.infoRow}>
                <Text style={[
                  styles.infoStatusText, 
                  { color: exists ? "#5EBFB5" : canGenerate ? "#FF8C00" : "#EF4444" }
                ]}>
                  {exists ? "Summary exists" : canGenerate ? "Summary available" : "Summary unavailable"}
                </Text>
              </View>
            </View>
            {exists ? (
              <Button
                title="View Summary"
                onPress={() => {
                  if (summary) {
                    (navigation as any).navigate('SummaryDetail', { summary });
                  }
                }}
                style={styles.viewButton}
                disabled={isDateLoading}
              />
            ) : canGenerate ? (
              <Button
                title="Generate Summary"
                onPress={handleGenerateSummary}
                variant="primary"
                style={{ backgroundColor: '#FF8C00' }}
                loading={loading || isDateLoading}
                disabled={loading || isDateLoading}
              />
            ) : null}
            {(loading || isDateLoading) && (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#5EBFB5" />
              </View>
            )}
          </Card>
        )}

        {/* Existing Summaries */}
        {allSummaries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No daily summaries yet!</Text>
            <Text style={styles.emptySubtext}>
              Create your first summary to see AI insights about your daily activities
            </Text>
          </View>
        ) : (
          <View style={styles.summariesContainer}>
            <Text style={styles.sectionTitle}>Your Summaries</Text>
            {allSummaries.map((summary) => (
              <Card highlight key={summary.id || summary.date} style={[
                styles.summaryCard,
                { backgroundColor: palette.surface, borderColor: palette.border }
              ]}>
                <TouchableOpacity
                  style={styles.summaryItem}
                  onPress={() => handleViewSummary(summary)}
                >
                  <View style={styles.summaryHeader}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar" size={16} color="#5EBFB5" />
                      <Text style={styles.dateText}>{formatDate(summary.date)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSummary(summary)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.summaryText} numberOfLines={3}>
                    {summary.summary}
                  </Text>
                  <View style={styles.scoresContainer}>
                    {Object.entries(summary.scores).map(([key, score]) => (
                      <View key={key} style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
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
                        <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}> {score}/10 </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.viewMoreContainer}>
                    <Text style={styles.viewMoreText}>Tap to view full analysis</Text>
                    <Ionicons name="chevron-forward" size={16} color="#5EBFB5" />
                  </View>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Month/Year Picker Modal */}
      {showMonthPicker && (
        <Modal transparent animationType="fade" onRequestClose={handleCloseMonthPicker}>
          <View style={modalStyles.overlay}>
            <View style={modalStyles.card}>
              {/* Header with year and arrows, visually grouped */}
              <View style={[modalStyles.headerRow, { backgroundColor: palette.card, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }] }>
                <Pressable onPress={() => setPickerYear(y => y - 1)} style={modalStyles.arrowButton} accessibilityLabel="Previous year">
                  <Ionicons name="chevron-back" size={24} color={palette.primary} />
                </Pressable>
                <Text style={modalStyles.headerText}>{pickerYear}</Text>
                <Pressable onPress={() => setPickerYear(y => y + 1)} style={modalStyles.arrowButton} accessibilityLabel="Next year">
                  <Ionicons name="chevron-forward" size={24} color={palette.primary} />
                </Pressable>
              </View>
              {/* Month grid: 3 columns x 4 rows, visually grouped */}
              <View style={{ backgroundColor: palette.card, borderRadius: 12, padding: 12, marginBottom: 20 }}>
                <View style={modalStyles.monthsGridFixed}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Pressable
                      key={i}
                      style={[
                        modalStyles.monthCell,
                        { backgroundColor: selectedMonth === i ? palette.primary : palette.card, borderColor: selectedMonth === i ? palette.primary : palette.border, borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedMonth(i)}
                      accessibilityLabel={`Select month ${new Date(0, i).toLocaleString('default', { month: 'long' })}`}
                    >
                      <Text style={[
                        modalStyles.monthText,
                        selectedMonth === i && modalStyles.monthTextSelected
                      ]}>
                        {new Date(0, i).toLocaleString('default', { month: 'short' })}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {/* Buttons, visually separated */}
              <View style={[modalStyles.modalButtonRow, { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 }] }>
                <Button
                  title="Done"
                  onPress={handleSelectMonthYear}
                  variant="primary"
                  style={{ flex: 1, marginHorizontal: 4, minWidth: 100 }}
                  fullWidth={false}
                />
                <Button
                  title="Cancel"
                  onPress={handleCloseMonthPicker}
                  variant="secondary"
                  style={{ flex: 1, marginHorizontal: 4, minWidth: 100 }}
                  fullWidth={false}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 24,
  },
  tabletScrollContent: {
    paddingHorizontal: 64,
  },

  calendarCard: {
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  calendarDateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDate: {
    borderWidth: 3,
    borderColor: '#000', // Black outline for selected date
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333', // Always the same color
  },
  selectedDateText: {
    fontWeight: 'bold',
  },
  emptyCell: {
    width: 32,
    height: 32,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  infoDate: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A6D8C',
    marginBottom: 12,
  },
  infoDetails: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#5EBFB5',
  },
  viewButton: {
    backgroundColor: '#5EBFB5',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  summariesContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryItem: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  scoresContainer: {
    marginBottom: 16,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    width: 60,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewMoreText: {
    fontSize: 12,
    color: '#5EBFB5',
    marginRight: 4,
  },
});

export default DailySummariesScreen; 