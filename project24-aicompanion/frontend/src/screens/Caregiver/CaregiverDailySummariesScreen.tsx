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
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentElderly } from '../../contexts/CurrentElderlyContext';
import { useDailySummary } from '../../hooks/useDailySummary';
import { dailySummaryService, DailySummary } from '../../services/dailySummaryService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import CurrentElderlyButton from '../../components/CurrentElderlyButton';
import { colors } from '../../theme';

const CaregiverDailySummariesScreen = () => {
  const navigation = useNavigation();
  const { currentElderly, connectedElderly, setCurrentElderly, loading: elderlyLoading } = useCurrentElderly();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const colorScheme = useColorScheme();
  const palette = colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [allSummaries, setAllSummaries] = useState<DailySummary[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDateLoading, setIsDateLoading] = useState(false);
  const [canGenerateCache, setCanGenerateCache] = useState<{ [month: string]: { [date: string]: boolean } }>({});
  const [prevExists, setPrevExists] = useState(false);
  const [prevCanGenerate, setPrevCanGenerate] = useState(false);
  const [prevSelectedDate, setPrevSelectedDate] = useState<string>('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth());
  const [showElderlySelector, setShowElderlySelector] = useState(false);

  // For selected date - use current elderly user's ID
  const {
    summary,
    loading,
    error,
    canGenerate,
    exists,
    fetchSummary,
    generateSummary,
  } = useDailySummary(currentElderly?.firebaseUid, selectedDate);

  useFocusEffect(
    React.useCallback(() => {
      if (currentElderly?.firebaseUid) {
        loadAllSummaries();
      }
    }, [currentElderly])
  );

  const loadAllSummaries = async () => {
    if (!currentElderly?.firebaseUid) return;
    try {
      setLoadingAll(true);
      const data = await dailySummaryService.getAll(currentElderly.firebaseUid);
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
    (navigation as any).navigate('CaregiverSummaryDetail', { summary });
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
              await dailySummaryService.delete(currentElderly?.firebaseUid!, summary.date);
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
    if (!selectedDate || !canGenerate || !currentElderly?.firebaseUid) return;
    try {
      const newSummary = await generateSummary();
      Alert.alert(
        'Success!',
        'Daily summary generated successfully',
        [
          {
            text: 'View Summary',
            onPress: () => (navigation as any).navigate('CaregiverSummaryDetail', { summary: newSummary })
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
    if (!currentElderly?.firebaseUid) return {};
    const daysInMonth = getDaysInMonth(monthDate);
    const map: { [date: string]: boolean } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), i);
      const dateString = getDateString(date);
      if (date < new Date() && !allSummaries.find(s => s.date === dateString)) {
        try {
          const res = await dailySummaryService.canGenerate(currentElderly.firebaseUid, dateString);
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
  }, [currentMonth, allSummaries, currentElderly]);

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
    if (date > new Date()) return 'future';
    if (allSummaries.find(s => s.date === dateString)) return 'exists';
    return 'not_available';
  };

  const getDateColor = (date: Date) => {
    const dateString = getDateString(date);
    if (allSummaries.find(s => s.date === dateString)) return '#5EBFB5'; // Teal - Summary exists
    if (date > new Date()) return '#E5E7EB'; // Gray - Future date
    if (canGenerateMap[dateString]) return '#FF8C00'; // Orange - Can generate summary
    return '#EF4444'; // Red - No messages available
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  // Show loading state if elderly is loading or no elderly selected
  if (elderlyLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <Header title="Daily Summaries" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading elderly user information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentElderly) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <Header title="Daily Summaries" />
        <View style={styles.noElderlyContainer}>
          <Ionicons name="person-outline" size={64} color={palette.disabled} />
          <Text style={[styles.noElderlyTitle, { color: palette.textPrimary }]}>
            No Elderly User Selected
          </Text>
          <Text style={[styles.noElderlySubtitle, { color: palette.textSecondary }]}>
            Please select an elderly user to view their daily summaries
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <Header 
        title="Daily Summaries" 
        right={<CurrentElderlyButton onPress={() => setShowElderlySelector(true)} />}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Elderly User Info */}
        <Card style={[
          styles.elderlyInfoCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.elderlyInfoHeader}>
            <Ionicons name="person" size={24} color={palette.primary} />
            <Text style={[styles.elderlyInfoTitle, { color: palette.textPrimary }]}>
              {currentElderly.fullName}'s Daily Summaries
            </Text>
          </View>
          <Text style={[styles.elderlyInfoSubtitle, { color: palette.textSecondary }]}>
            View and generate daily summaries for {currentElderly.fullName}
          </Text>
        </Card>

        {/* Calendar */}
        <Card style={[
          styles.calendarCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={24} color={palette.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleOpenMonthPicker} style={styles.monthTitleContainer}>
              <Text style={[styles.monthTitle, { color: palette.textPrimary }]}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={palette.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color={palette.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarGrid}>
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={[styles.dayHeader, { color: palette.textSecondary }]}>
                {day}
              </Text>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                {day ? (
                  <TouchableOpacity
                    onPress={() => handleDateSelect(day)}
                    style={[
                      styles.dayButton,
                      { backgroundColor: getDateColor(day) },
                      selectedDate === getDateString(day) && {
                        borderColor: palette.primary,
                        borderWidth: 2,
                      }
                    ]}
                    disabled={getDateStatus(day) === 'future'}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: selectedDate === getDateString(day) ? palette.surface : '#FFFFFF' }
                    ]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emptyDay} />
                )}
              </View>
            ))}
          </View>

          {/* Color Legend */}
          <View style={styles.legendContainer}>
            <Text style={[styles.legendTitle, { color: palette.textPrimary }]}>Color Guide:</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FF8C00' }]} />
                <Text style={[styles.legendText, { color: palette.textSecondary }]}>Can generate summary</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#5EBFB5' }]} />
                <Text style={[styles.legendText, { color: palette.textSecondary }]}>Summary exists</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: palette.textSecondary }]}>No messages available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#E5E7EB' }]} />
                <Text style={[styles.legendText, { color: palette.textSecondary }]}>Future date</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Selected Date Summary */}
        {selectedDate && (
          <Card style={[
            styles.selectedDateCard,
            { backgroundColor: palette.surface, borderColor: palette.border }
          ]}>
            <View style={styles.selectedDateHeader}>
              <Ionicons 
                name="information-circle" 
                size={20} 
                color={exists ? "#5EBFB5" : canGenerate ? "#FF8C00" : "#EF4444"} 
              />
              <Text style={[styles.selectedDateTitle, { color: palette.textPrimary }]}>
                Selected Date
              </Text>
              {isDateLoading && <ActivityIndicator size="small" color={palette.primary} />}
            </View>
            <Text style={[styles.infoDate, { color: palette.textPrimary }]}>{formatDate(selectedDate)}</Text>
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
            {!isDateLoading && (
              <>
                {exists ? (
                  <Button
                    title="View Summary"
                    onPress={() => handleViewSummary(summary!)}
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
              </>
            )}
          </Card>
        )}

        {/* Recent Summaries */}
        <Card style={[
          styles.recentSummariesCard,
          { backgroundColor: palette.surface, borderColor: palette.border }
        ]}>
          <View style={styles.recentHeader}>
            <Ionicons name="time" size={20} color={palette.primary} />
            <Text style={[styles.recentTitle, { color: palette.textPrimary }]}>
              Recent Summaries
            </Text>
          </View>
          
          {loadingAll ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.primary} />
              <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
                Loading summaries...
              </Text>
            </View>
          ) : allSummaries.length === 0 ? (
            <Text style={[styles.noSummariesText, { color: palette.textSecondary }]}>
              No summaries found
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allSummaries.slice(0, 5).map((summary) => (
                <TouchableOpacity
                  key={summary.date}
                  style={styles.summaryCard}
                  onPress={() => handleViewSummary(summary)}
                >
                  <Text style={[styles.summaryDate, { color: palette.textPrimary }]}>
                    {formatDate(summary.date)}
                  </Text>
                  <View style={styles.summaryScores}>
                    {Object.entries(summary.scores).map(([category, score]) => (
                      <View key={category} style={styles.scoreIndicator}>
                        <View style={[styles.scoreDot, { backgroundColor: getScoreColor(score) }]} />
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
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
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                  Select Elderly User
                </Text>
                <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                  Choose an elderly user to view their daily summaries
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowElderlySelector(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.elderlyList} showsVerticalScrollIndicator={false}>
              {connectedElderly.map((elderly) => (
                <TouchableOpacity
                  key={elderly.firebaseUid}
                  style={[
                    styles.elderlyItem,
                    currentElderly?.firebaseUid === elderly.firebaseUid && {
                      borderColor: palette.primary,
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
                        <View style={[styles.elderlyProfileInitial, { backgroundColor: palette.primaryLight }]}>
                          <Text style={[styles.elderlyProfileInitialText, { color: palette.primary }]}>
                            {elderly.fullName?.charAt(0) || '?'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.elderlyItemInfo}>
                        <Text style={[styles.elderlyItemName, { color: palette.textPrimary }]}>
                          {elderly.fullName}
                        </Text>
                        <Text style={[styles.elderlyItemEmail, { color: palette.textSecondary }]}>
                          {elderly.email}
                        </Text>
                      </View>
                    </View>
                    {currentElderly?.firebaseUid === elderly.firebaseUid && (
                      <Ionicons name="checkmark-circle" size={24} color={palette.primary} />
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

      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMonthPicker}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseMonthPicker}>
          <View style={[styles.pickerModal, { backgroundColor: palette.surface }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: palette.textPrimary }]}>
                Select Month & Year
              </Text>
            </View>
            
            <View style={styles.pickerContent}>
              <View style={styles.yearPicker}>
                <TouchableOpacity onPress={() => setPickerYear(prev => prev - 1)}>
                  <Ionicons name="chevron-back" size={24} color={palette.primary} />
                </TouchableOpacity>
                <Text style={[styles.yearText, { color: palette.textPrimary }]}>
                  {pickerYear}
                </Text>
                <TouchableOpacity onPress={() => setPickerYear(prev => prev + 1)}>
                  <Ionicons name="chevron-forward" size={24} color={palette.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.monthGrid}>
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthOption,
                      selectedMonth === index && { backgroundColor: palette.primary }
                    ]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={[
                      styles.monthOptionText,
                      { color: selectedMonth === index ? palette.surface : palette.textPrimary }
                    ]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.pickerActions}>
              <Button
                title="Cancel"
                onPress={handleCloseMonthPicker}
                variant="secondary"
                style={styles.pickerButton}
              />
              <Button
                title="Select"
                onPress={handleSelectMonthYear}
                variant="primary"
                style={styles.pickerButton}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabletScrollContent: {
    paddingHorizontal: 64,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noElderlyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noElderlyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noElderlySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  elderlyInfoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  calendarCard: {
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayContainer: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  emptyDay: {
    width: 32,
    height: 32,
  },
  selectedDateCard: {
    marginBottom: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  generateButton: {
    width: '100%',
  },
  noSummaryText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  recentSummariesCard: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  noSummariesText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryCard: {
    width: 100,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  summaryDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryScores: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreIndicator: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    width: 300,
    borderRadius: 16,
    padding: 24,
  },
  pickerHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContent: {
    marginBottom: 24,
  },
  yearPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearText: {
    fontSize: 20,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthOption: {
    width: '30%',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  monthOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
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
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
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
  },
  elderlyProfileInitialText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  elderlyItemInfo: {
    flex: 1,
  },
  elderlyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  elderlyItemEmail: {
    fontSize: 14,
  },
  modalFooter: {
    marginTop: 24,
  },
  modalButton: {
    width: '100%',
  },
  // Legend styles
  legendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Selected date info styles
  infoDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoDetails: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewButton: {
    marginTop: 8,
  },
});

export default CaregiverDailySummariesScreen; 