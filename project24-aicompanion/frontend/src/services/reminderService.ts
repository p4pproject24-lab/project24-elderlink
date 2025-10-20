import api from '../lib/api';

export interface Reminder {
  id?: string;
  userId: string;
  title: string;
  timestamp: string; // ISO string format
  description?: string;
  tags: ReminderTag[];
  status: ReminderStatus;
}

export enum ReminderTag {
  MEDICATION = 'MEDICATION',
  APPOINTMENT = 'APPOINTMENT',
  EVENT = 'EVENT',
  TASK = 'TASK',
  PERSONAL = 'PERSONAL',
  WORK = 'WORK',
  FINANCE = 'FINANCE',
  HEALTH = 'HEALTH',
  TRAVEL = 'TRAVEL',
  SOCIAL = 'SOCIAL',
  EDUCATION = 'EDUCATION',
  LEISURE = 'LEISURE',
  OTHER = 'OTHER'
}

export enum ReminderStatus {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  MISSED = 'MISSED'
}

export interface CreateReminderRequest {
  userId: string;
  title: string;
  timestamp: string; // ISO string
  description?: string;
  tags: ReminderTag[];
}

export interface UpdateReminderRequest {
  title?: string;
  timestamp?: string; // ISO string
  description?: string;
  tags?: ReminderTag[];
  status?: ReminderStatus;
}

export interface PaginatedRemindersResponse {
  reminders: Reminder[];
  hasMore: boolean;
  currentPage: number;
}

class ReminderService {
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
  }

  async createReminder(reminder: CreateReminderRequest): Promise<Reminder> {
    if (!this.userId) {
      throw new Error('User ID not set');
    }
    try {
      console.log(`Creating reminder for Firebase UID: ${this.userId}`, reminder);
      const apiInstance = await api();
      const response = await apiInstance.post('/reminders', reminder);
      const data = response.data;
      console.log('Created reminder response:', data);
      return {
        id: data.id,
        userId: data.userId,
        title: data.title,
        timestamp: data.timestamp,
        description: data.description,
        tags: data.tags,
        status: data.status as ReminderStatus,
      };
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }

  async getReminders(page: number = 0): Promise<PaginatedRemindersResponse> {
    if (!this.userId) {
      console.error('User ID not set in reminderService');
      throw new Error('User ID not set');
    }
    try {
      console.log(`Fetching reminders for Firebase UID: ${this.userId}, page ${page}`);
      const apiInstance = await api();
      const response = await apiInstance.get(`/reminders?userId=${this.userId}&page=${page}`);
      console.log('Reminder API response:', response.data);
      
      const data = response.data;
      const reminders = (data.reminders || data).map((reminder: any) => ({
        id: reminder.id,
        userId: reminder.userId,
        title: reminder.title,
        timestamp: reminder.timestamp,
        description: reminder.description,
        tags: reminder.tags,
        status: reminder.status as ReminderStatus,
      }));
      
      console.log(`Processed ${reminders.length} reminders for Firebase UID: ${this.userId}`);
      
      // Backend returns 10 items per page, so if we get less than 10, there are no more pages
      const hasMore = reminders.length === 10;
      return {
        reminders,
        hasMore,
        currentPage: page,
      };
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return {
        reminders: [],
        hasMore: false,
        currentPage: page,
      };
    }
  }

  async updateReminder(reminderId: string, updates: UpdateReminderRequest): Promise<Reminder> {
    try {
      const apiInstance = await api();
      const response = await apiInstance.put(`/reminders/${reminderId}`, updates);
      const data = response.data;
      return {
        id: data.id,
        userId: data.userId,
        title: data.title,
        timestamp: data.timestamp,
        description: data.description,
        tags: data.tags,
        status: data.status as ReminderStatus,
      };
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId: string): Promise<void> {
    try {
      const apiInstance = await api();
      await apiInstance.delete(`/reminders/${reminderId}`);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  async markAsCompleted(reminderId: string): Promise<Reminder> {
    return this.updateReminder(reminderId, { status: ReminderStatus.COMPLETE });
  }

  async markAsMissed(reminderId: string): Promise<Reminder> {
    return this.updateReminder(reminderId, { status: ReminderStatus.MISSED });
  }

  async markAsIncomplete(reminderId: string): Promise<Reminder> {
    return this.updateReminder(reminderId, { status: ReminderStatus.INCOMPLETE });
  }
}

export const reminderService = new ReminderService();
export default reminderService;

// Reminder API calls
export const reminderAPI = {
  createReminder: async (reminder: any) => {
    const apiInstance = await api();
    const response = await apiInstance.post('/reminders', reminder);
    return response.data;
  },
  
  getReminders: async (userId: string, page: number = 0) => {
    const apiInstance = await api();
    const response = await apiInstance.get(`/reminders?userId=${userId}&page=${page}`);
    return response.data;
  },
  
  updateReminder: async (reminderId: string, updates: any) => {
    const apiInstance = await api();
    const response = await apiInstance.put(`/reminders/${reminderId}`, updates);
    return response.data;
  },
  
  deleteReminder: async (reminderId: string) => {
    const apiInstance = await api();
    const response = await apiInstance.delete(`/reminders/${reminderId}`);
    return response.data;
  },
}; 