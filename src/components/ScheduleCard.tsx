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
        className="absolute -right-10 -top-10 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
        style={{ backgroundColor: CATEGORY_COLORS[schedule.category] }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[schedule.category] }}
            />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              {schedule.category}
            </span>
          </div>
          
          <h3 className={cn(
            "text-lg font-bold text-white mb-2 truncate transition-all",
            schedule.completed && "line-through text-white/30"
          )}>
            {schedule.title}
          </h3>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-white/40 text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
              <CalendarIcon size={12} className="text-purple-400" />
              <span>{format(new Date(schedule.dateTime), 'MM月dd日 HH:mm', { locale: zhCN })}</span>
            </div>
            
            {schedule.notes && (
              <div className="flex items-center gap-1.5 text-white/40 text-xs bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                <Clock size={12} className="text-cyan-400" />
                <span className="truncate max-w-[150px]">{schedule.notes}</span>
              </div>
            )}

            {schedule.reminder.enabled && (
              <div className="flex items-center gap-1.5 text-green-400/60 text-xs bg-green-500/5 px-2.5 py-1.5 rounded-lg border border-green-500/10">
                <Bell size={12} />
                <span>已设提醒</span>
              </div>
            )}

            {expired && !schedule.completed && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/20">
                <Clock size={12} />
                <span>已逾期</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(schedule.id);
            }}
            title={schedule.completed ? "标记为未完成" : "标记为已完成"}
            className={cn(
              "p-3 rounded-xl transition-all active:scale-90 cursor-pointer relative z-30",
              schedule.completed 
                ? "bg-green-500/20 text-green-400" 
                : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            )}
          >
            <Check size={20} strokeWidth={3} className="pointer-events-none" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(schedule.id);
            }}
            title="删除日程"
            className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all active:scale-90 cursor-pointer relative z-30"
          >
            <Trash2 size={20} strokeWidth={2.5} className="pointer-events-none" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
