import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Bell, Tag, Clock, Mail, AlignLeft, Type, Calendar } from 'lucide-react';
import { Category, CATEGORY_COLORS, LEAD_TIME_OPTIONS, Schedule } from '../types';
import { cn } from '../lib/utils';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'completed'>) => void;
  initialDate?: Date | null;
}

export default function AddScheduleModal({ isOpen, onClose, onAdd, initialDate }: AddScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState<Category>('工作');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [email, setEmail] = useState('zhx703@163.com');
  const [leadTime, setLeadTime] = useState(15);
  const [notes, setNotes] = useState('');

  // Pre-fill date when modal opens with an initial date
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        // Format to YYYY-MM-DDThh:mm for datetime-local input
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        const hours = String(initialDate.getHours()).padStart(2, '0');
        const minutes = String(initialDate.getMinutes()).padStart(2, '0');
        setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        // If opening without initial date, default to now
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    } else {
      // Reset form when modal closes
      setTitle('');
      setDateTime('');
      setDuration(60);
      setCategory('工作');
      setReminderEnabled(false);
      setEmail('zhx703@163.com');
      setLeadTime(15);
      setNotes('');
    }
  }, [isOpen, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime) return;

    onAdd({
      title,
      dateTime: new Date(dateTime).toISOString(),
      durationMinutes: duration,
      category,
      reminder: {
        enabled: reminderEnabled,
        email: reminderEnabled ? email : undefined,
        leadTimeMinutes: leadTime,
      },
      notes,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-card rounded-[2.5rem] p-8 overflow-hidden shadow-2xl border-white"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                新建日程
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Type size={14} className="text-purple-500" />
                  日程标题
                </label>
                <input
                  autoFocus
                  required
                  placeholder="要做什么？"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" />
                    日期与时间
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500" />
                    持续时长 (分钟)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="glass-input w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Tag size={14} className="text-purple-500" />
                  分类
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CATEGORY_COLORS).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat as Category)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        category === cat 
                          ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:border-purple-300"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Bell size={14} className="text-indigo-500" />
                    邮件提醒
                  </label>
                  <button
                    type="button"
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1",
                      reminderEnabled ? "bg-purple-600" : "bg-slate-200"
                    )}
                  >
                    <motion.div 
                      animate={{ x: reminderEnabled ? 24 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {reminderEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <input
                        type="email"
                        placeholder="提醒邮箱"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input w-full"
                      />
                      <select
                        value={leadTime}
                        onChange={(e) => setLeadTime(parseInt(e.target.value))}
                        className="glass-input w-full appearance-none bg-slate-50"
                      >
                        {LEAD_TIME_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-white text-slate-900">
                            提前 {opt.label} 提醒
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-[0.98] mt-4"
              >
                创建日程
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
