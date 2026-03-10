import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Bell, Tag, Clock, Mail, AlignLeft } from 'lucide-react';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-card w-full max-w-lg rounded-3xl overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold">新建日程</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Plus size={14} /> 标题
                </label>
                <input
                  required
                  type="text"
                  placeholder="需要做什么？"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Clock size={14} /> 日期和时间
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Clock size={14} /> 持续时长 (分钟)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    className="glass-input w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Tag size={14} /> 分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="glass-input w-full appearance-none"
                  >
                    {Object.keys(CATEGORY_COLORS).map((cat) => (
                      <option key={cat} value={cat} className="bg-[#1a1a2e]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Bell size={14} /> 邮件提醒
                  </label>
                  <button
                    type="button"
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      reminderEnabled ? "bg-purple-500" : "bg-white/10"
                    )}
                  >
                    <motion.div
                      animate={{ x: reminderEnabled ? 26 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {reminderEnabled && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                          <Mail size={12} /> 提醒邮箱
                        </label>
                        <input
                          required={reminderEnabled}
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="glass-input w-full text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                          <Clock size={12} /> 提前时间
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {LEAD_TIME_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setLeadTime(opt.value)}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                                leadTime === opt.value
                                  ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <AlignLeft size={14} /> 备注
                </label>
                <textarea
                  placeholder="添加一些细节..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input w-full min-h-[100px] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all active:scale-[0.98]"
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
