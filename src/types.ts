export type Category = 'Work' | 'Life' | 'Health' | 'Study' | 'Other';

export interface ReminderConfig {
  enabled: boolean;
  email?: string;
  leadTimeMinutes: number; // 5, 15, 30, 60, 1440
  sent?: boolean;
}

export interface Schedule {
  id: string;
  title: string;
  dateTime: string; // ISO string
  category: Category;
  reminder: ReminderConfig;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: '#a78bfa', // Purple
  Life: '#67e8f9', // Cyan
  Health: '#f87171', // Red
  Study: '#fbbf24', // Amber
  Other: '#94a3b8', // Slate
};

export const LEAD_TIME_OPTIONS = [
  { label: '5 Minutes', value: 5 },
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '1 Day', value: 1440 },
];
