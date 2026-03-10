export type Category = '工作' | '生活' | '健康' | '学习' | '其他';

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
  durationMinutes: number; // 持续时间（分钟）
  category: Category;
  reminder: ReminderConfig;
  notes?: string;
  completed: boolean;
  createdAt: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  工作: '#a78bfa', // Purple
  生活: '#67e8f9', // Cyan
  健康: '#f87171', // Red
  学习: '#fbbf24', // Amber
  其他: '#94a3b8', // Slate
};

export const LEAD_TIME_OPTIONS = [
  { label: '准时提醒', value: 0 },
  { label: '5 分钟前', value: 5 },
  { label: '15 分钟前', value: 15 },
  { label: '30 分钟前', value: 30 },
  { label: '1 小时前', value: 60 },
  { label: '1 天前', value: 1440 },
];
