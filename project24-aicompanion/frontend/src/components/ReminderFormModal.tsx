"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  useColorScheme,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { ReminderTag } from "../services/reminderService"
import { colors, spacing, ThemeMode } from '../theme';
import { BlurView } from 'expo-blur';

type ReminderFormModalProps = {
  visible: boolean
  onClose: () => void
  onSave: (reminder: {
    title: string
    timestamp: string // ISO string
    description?: string
    tags: ReminderTag[]
  }) => void
  editingReminder?: {
    id: string
    title: string
    timestamp: string
    description?: string
    tags: ReminderTag[]
  } | null
}

const ReminderFormModal = ({ visible, onClose, onSave, editingReminder }: ReminderFormModalProps) => {
  const [title, setTitle] = useState(editingReminder?.title || "")
  const [dateTime, setDateTime] = useState(editingReminder ? new Date(editingReminder.timestamp) : new Date())
  const [description, setDescription] = useState(editingReminder?.description || "")
  const [selectedTags, setSelectedTags] = useState<ReminderTag[]>(editingReminder?.tags || [ReminderTag.OTHER])
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const colorScheme = useColorScheme();
  const theme: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = colors[theme];

  // Update form fields when editingReminder changes
  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title)
      setDateTime(new Date(editingReminder.timestamp))
      setDescription(editingReminder.description || "")
      setSelectedTags(editingReminder.tags)
    } else {
      // Reset form when not editing
      setTitle("")
      setDateTime(new Date())
      setDescription("")
      setSelectedTags([ReminderTag.OTHER])
    }
  }, [editingReminder])

  const handleSave = () => {
    if (title.trim()) {
      const timestamp = dateTime.toISOString()
      onSave({ 
        title: title.trim(), 
        timestamp, 
        description: description.trim() || undefined,
        tags: selectedTags
      })
      resetForm()
    }
  }

  const resetForm = () => {
    setTitle("")
    setDateTime(new Date())
    setDescription("")
    setSelectedTags([ReminderTag.OTHER])
    setShowDatePicker(false)
    setShowTimePicker(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Keep the time, update the date
      const newDate = new Date(dateTime);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDateTime(newDate);
    }
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Keep the date, update the time
      const newDate = new Date(dateTime);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      setDateTime(newDate);
    }
  };

  const reminderTags = Object.values(ReminderTag)
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  const GLASS_CARD_STYLE = {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: 'rgba(139,92,246,0.08)',
    borderWidth: 0.5,
    borderRadius: 24,
    overflow: 'hidden' as 'hidden',
    marginBottom: 24,
    padding: 28,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.07,
    shadowRadius: 16,
  };

  const GlassTagChip = ({ label, selected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{
      backgroundColor: selected ? palette.primaryLight : palette.surface,
      borderRadius: 9999,
      paddingVertical: 4,
      paddingHorizontal: 18,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: selected ? palette.primary : palette.border,
      alignSelf: 'flex-start',
      minHeight: 28,
      justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? palette.primary : palette.textPrimary, textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.cardHighlight, justifyContent: 'center', alignItems: 'center', flex: 1 }] }>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.keyboardAvoidingView, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}
        >
          <View style={[GLASS_CARD_STYLE, { width: '95%', maxWidth: 420, minWidth: 320, alignSelf: 'center', minHeight: 420, backgroundColor: palette.cardHighlight }] }>
            <BlurView intensity={30} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 24 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <TouchableOpacity onPress={handleClose} style={{ padding: 8, borderRadius: 20, backgroundColor: palette.surface, marginRight: 8 }}>
                <Ionicons name="close" size={24} color={palette.primary} />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: palette.primary, textAlign: 'center' }}>
                {editingReminder ? "Edit Reminder" : "Add New Reminder"}
              </Text>
              <View style={{ width: 32 }} />
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary, marginBottom: 6 }}>Title *</Text>
                <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 0.5, borderColor: palette.border, overflow: 'hidden' }}>
                  <BlurView intensity={10} tint="light" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
                  <TextInput
                    style={{ padding: 16, fontSize: 16, color: palette.textPrimary, minHeight: 44 }}
                    placeholder="Enter reminder title"
                    placeholderTextColor={palette.textSecondary}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary, marginBottom: 6 }}>Date *</Text>
                <TouchableOpacity style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 0.5, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 8 }} onPress={() => setShowDatePicker(true)}>
                  <BlurView intensity={10} tint="light" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
                  <Text style={{ fontSize: 16, color: palette.textPrimary }}>{dateTime.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
                  <Ionicons name="calendar-outline" size={20} color={palette.primary} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateTime}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={handleDateChange}
                  />
                )}
                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary, marginBottom: 6, marginTop: 8 }}>Time *</Text>
                <TouchableOpacity style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 0.5, borderColor: palette.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }} onPress={() => setShowTimePicker(true)}>
                  <BlurView intensity={10} tint="light" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
                  <Text style={{ fontSize: 16, color: palette.textPrimary }}>{dateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                  <Ionicons name="time-outline" size={20} color={palette.primary} />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={dateTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleTimeChange}
                  />
                )}
              </View>
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary, marginBottom: 6 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0 }}>
                  {reminderTags.map((t) => (
                    <GlassTagChip
                      key={t}
                      label={capitalize(t)}
                      selected={selectedTags.includes(t)}
                      onPress={() => {
                        if (selectedTags.includes(t)) {
                          setSelectedTags(selectedTags.filter(tag => tag !== t))
                        } else {
                          setSelectedTags([...selectedTags, t])
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: palette.primary, marginBottom: 6 }}>Description (Optional)</Text>
                <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 0.5, borderColor: palette.border, overflow: 'hidden' }}>
                  <BlurView intensity={10} tint="light" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 16 }} />
                  <TextInput
                    style={{ padding: 16, fontSize: 16, color: palette.textPrimary, minHeight: 80, textAlignVertical: 'top' }}
                    placeholder="Add any additional details"
                    placeholderTextColor={palette.textSecondary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  marginTop: 8,
                  marginBottom: 8,
                  backgroundColor: palette.primary,
                  shadowColor: palette.primary,
                  shadowOpacity: 0.10,
                  shadowRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BlurView intensity={20} tint="light" style={{ ...StyleSheet.absoluteFillObject, borderRadius: 18 }} />
                <Text style={{ color: palette.surface, fontWeight: '700', fontSize: 18, paddingVertical: 16, paddingHorizontal: 24 }}>
                  {editingReminder ? "Update Reminder" : "Save Reminder"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: { padding: spacing.sm },
  headerTitle: { fontSize: 20, fontWeight: "600" },
  placeholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.xl },
  formGroup: { marginBottom: spacing.lg },
  label: { fontSize: 16, fontWeight: "500", marginBottom: spacing.sm },
  input: {
    borderRadius: 12,
    padding: spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  dateTimeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
  },
  dateTimeText: { fontSize: 16 },
  typeContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  typeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedTypeButton: {},
  typeText: { fontSize: 14, color: '#666' },
  saveButton: { marginTop: spacing.lg },
})

export default ReminderFormModal 