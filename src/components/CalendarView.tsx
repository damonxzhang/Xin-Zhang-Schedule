import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Schedule, CATEGORY_COLORS } from '../types';
import { cn } from '../lib/utils';

interface CalendarViewProps {
  schedules: Schedule[];
  onSelectDate: (date: Date | null) => void;
  onDoubleClickDate: (date: Date) => void;
  selectedDate: Date | null;
}

export default function CalendarView({ schedules, onSelectDate, onDoubleClickDate, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-400/60 mb-1">月度概览</span>
          <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-purple-600 transition-all border border-slate-100 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-400 hover:text-purple-600 transition-all border border-slate-100 shadow-sm"
          >
            今天
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-purple-600 transition-all border border-slate-100 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return (
      <div className="grid grid-cols-7 mb-4">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const daySchedules = schedules.filter(s => isSameDay(parseISO(s.dateTime), day));
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <motion.button
              key={day.toString()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(isSelected ? null : day)}
              onDoubleClick={() => onDoubleClickDate(day)}
              className={cn(
                "relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-center transition-all border",
                isSelected 
                  ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200" 
                  : isToday
                    ? "bg-purple-50 border-purple-200 text-purple-600"
                    : isCurrentMonth
                      ? "bg-white border-slate-100 text-slate-700 hover:border-purple-300"
                      : "bg-slate-50 border-transparent text-slate-300 opacity-50"
              )}
            >
              <span className={cn(
                "text-sm font-bold mb-1",
                isSelected ? "text-white" : ""
              )}>
                {format(day, 'd')}
              </span>
              
              <div className="flex flex-wrap justify-center gap-1 max-w-full">
                {daySchedules.slice(0, 3).map((s, i) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shadow-sm",
                      isSelected ? "bg-white/60" : ""
                    )}
                    style={{ backgroundColor: !isSelected ? CATEGORY_COLORS[s.category] : undefined }}
                  />
                ))}
                {daySchedules.length > 3 && (
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSelected ? "bg-white/40" : "bg-slate-300"
                  )} />
                )}
              </div>

              {isToday && !isSelected && (
                <div className="absolute top-2 right-2 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 sm:p-8 rounded-[2.5rem] mb-8 shadow-2xl border-white"
    >
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4 justify-center">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
