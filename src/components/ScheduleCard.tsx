import { motion, AnimatePresence } from 'motion/react';
import { Check, Trash2, Bell, Clock, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { Schedule, CATEGORY_COLORS } from '../types';
import { format, isPast } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface ScheduleCardProps {
  schedule: Schedule;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScheduleCard({ schedule, onToggleComplete, onDelete }: ScheduleCardProps) {
  const expired = isPast(new Date(schedule.dateTime)) && !schedule.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        "glass-card p-5 rounded-2xl group relative overflow-hidden transition-all duration-300",
        schedule.completed && "opacity-60 grayscale-[0.5]",
        expired && "border-red-500/50 bg-red-500/5"
      )}
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: CATEGORY_COLORS[schedule.category] }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              style={{ backgroundColor: CATEGORY_COLORS[schedule.category] }}
            />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">
              {schedule.category}
            </span>
          </div>

          <h3 className={cn(
            "text-lg font-semibold mb-1 truncate transition-all",
            schedule.completed && "line-through text-white/40"
          )}>
            {schedule.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-cyan-400" />
              <span>{format(new Date(schedule.dateTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</span>
            </div>
            {schedule.reminder.enabled && (
              <div className="flex items-center gap-1.5">
                <Bell size={14} className="text-purple-400" />
                <span className="text-xs">提醒已激活</span>
              </div>
            )}
          </div>

          {schedule.notes && (
            <p className="mt-3 text-sm text-white/40 line-clamp-2 italic">
              "{schedule.notes}"
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleComplete(schedule.id)}
            className={cn(
              "p-2 rounded-xl transition-all",
              schedule.completed 
                ? "bg-green-500/20 text-green-400" 
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            )}
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {expired && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">
            已过期任务
          </span>
        </div>
      )}
    </motion.div>
  );
}
