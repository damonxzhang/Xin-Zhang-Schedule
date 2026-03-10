import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Bell, Tag, Clock, Mail, AlignLeft, Type, Calendar, FileText } from 'lucide-react';
import { parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Category, CATEGORY_COLORS, LEAD_TIME_OPTIONS, Schedule } from '../types';
import { cn } from '../lib/utils';

interface AddScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdate?: (id: string, schedule: Partial<Schedule>) => void;
  initialDate?: Date | null;
  editSchedule?: Schedule | null;
}

export default function AddScheduleModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  onUpdate,
  initialDate,
  editSchedule 
}: AddScheduleModalProps) {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [category, setCategory] = useState<Category>('工作');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [email, setEmail] = useState('zhx703@163.com');
  const [leadTime, setLeadTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Pre-fill date when modal opens with an initial date or existing schedule
  useEffect(() => {
    if (isOpen) {
      if (editSchedule) {
        // Edit mode: fill with existing schedule data
        setTitle(editSchedule.title);
        const date = parseISO(editSchedule.dateTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        setDuration(editSchedule.durationMinutes);
        setCategory(editSchedule.category);
        setReminderEnabled(editSchedule.reminder.enabled);
        setEmail(editSchedule.reminder.email || 'zhx703@163.com');
        setLeadTime(editSchedule.reminder.leadTimeMinutes);
        setNotes(editSchedule.notes || '');
      } else if (initialDate) {
        // Create mode with initial date
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        const hours = String(initialDate.getHours()).padStart(2, '0');
        const minutes = String(initialDate.getMinutes()).padStart(2, '0');
        setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        // Create mode default to now
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
      setReminderEnabled(true);
      setEmail('zhx703@163.com');
      setLeadTime(0);
      setNotes('');
      setIsPreviewMode(false);
    }
  }, [isOpen, initialDate, editSchedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime) return;

    const scheduleData = {
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
    };

    if (editSchedule && onUpdate) {
      onUpdate(editSchedule.id, scheduleData);
    } else {
      onAdd(scheduleData);
    }

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
                {editSchedule ? '编辑日程' : '新建日程'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <FileText size={14} className="text-purple-500" />
                    日程详情 (支持 Markdown)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600 transition-colors font-bold uppercase tracking-tighter"
                  >
                    {isPreviewMode ? '编辑' : '预览'}
                  </button>
                </div>
                
                <div className="relative min-h-[120px]">
                  {isPreviewMode ? (
                    <div className="glass-input w-full min-h-[120px] prose prose-sm prose-slate max-w-none overflow-y-auto bg-slate-50/50">
                      {notes ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                      ) : (
                        <span className="text-slate-400 italic">暂无内容</span>
                      )}
                    </div>
                  ) : (
                    <textarea
                      placeholder="添加一些详细说明... (支持 Markdown)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="glass-input w-full min-h-[120px] py-3 resize-none"
                    />
                  )}
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
                {editSchedule ? '保存修改' : '创建日程'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
