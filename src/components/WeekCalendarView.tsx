import React from 'react';
import { motion } from 'motion/react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  startOfDay, 
  differenceInMinutes,
  addMinutes
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Schedule, CATEGORY_COLORS } from '../types';
import { cn } from '../lib/utils';

interface WeekCalendarViewProps {
  schedules: Schedule[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
const COLUMN_WIDTH = 'min-w-[120px]';
const HOUR_HEIGHT = 80; // pixels per hour

export default function WeekCalendarView({ schedules, onToggleComplete, onDelete }: WeekCalendarViewProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getPosition = (dateTime: string, duration: number) => {
    const date = parseISO(dateTime);
    const dayStart = startOfDay(date);
    const minutesFromStartOfDay = differenceInMinutes(date, dayStart);
    const minutesFrom8AM = minutesFromStartOfDay - 8 * 60;
    
    const top = (minutesFrom8AM / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height };
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[850px]">
      {/* Header with Days */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <div className="w-16 border-r border-slate-200 flex-shrink-0" />
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div 
                key={i} 
                className={cn(
                  "flex-1 py-4 text-center border-r border-slate-100 last:border-r-0 min-w-[120px]",
                  isToday && "bg-purple-50/50"
                )}
              >
                <div className={cn(
                  "text-xs font-bold uppercase tracking-wider mb-1",
                  isToday ? "text-purple-600" : "text-slate-400"
                )}>
                  {format(day, 'EEEE', { locale: zhCN })}
                </div>
                <div className={cn(
                  "text-xl font-display",
                  isToday ? "text-purple-700 font-bold" : "text-slate-700"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar bg-white">
        <div className="flex min-h-full">
          {/* Time Labels */}
          <div className="w-16 border-r border-slate-200 flex-shrink-0 bg-slate-50/50">
            {HOURS.map(hour => (
              <div 
                key={hour} 
                className="text-[10px] font-bold text-slate-400 text-center relative"
                style={{ height: `${HOUR_HEIGHT}px`, top: '-6px' }}
              >
                {`${hour}:00`}
              </div>
            ))}
          </div>

          {/* Grid Columns */}
          <div className="flex-1 flex relative">
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className="flex-1 border-r border-slate-100 last:border-r-0 relative min-w-[120px]"
              >
                {/* Horizontal Hour Lines */}
                {HOURS.map(hour => (
                  <div 
                    key={hour} 
                    className="border-b border-slate-50 w-full"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {/* Schedules */}
                {schedules
                  .filter(s => isSameDay(parseISO(s.dateTime), day))
                  .map((schedule) => {
                    const { top, height } = getPosition(schedule.dateTime, schedule.durationMinutes || 60);
                    const startTime = parseISO(schedule.dateTime);
                    const endTime = addMinutes(startTime, schedule.durationMinutes || 60);

                    if (top < 0 || top > (HOURS.length * HOUR_HEIGHT)) return null;

                    return (                    <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "absolute left-1 right-1 p-2 rounded-xl border flex flex-col justify-between overflow-hidden group transition-all hover:z-40 shadow-sm",
                          schedule.completed ? "opacity-40 grayscale-[0.5]" : "opacity-100"
                        )}
                        style={{ 
                          top: `${top}px`, 
                          height: `${Math.max(height, 40)}px`,
                          backgroundColor: `${CATEGORY_COLORS[schedule.category]}15`,
                          borderColor: `${CATEGORY_COLORS[schedule.category]}30`,
                          borderLeftWidth: '4px',
                          borderLeftColor: CATEGORY_COLORS[schedule.category]
                        }}
                      >
                        <div className="min-w-0">
                          <div 
                            className={cn(
                              "text-xs font-bold truncate",
                              schedule.completed ? "line-through text-slate-400" : "text-slate-800"
                            )}
                            style={{ color: !schedule.completed ? CATEGORY_COLORS[schedule.category] : undefined }}
                          >
                            {schedule.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </div>
                        </div>

                        <div className="absolute top-1 right-1 hidden group-hover:flex flex-col gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(schedule.id); }}
                            className="p-1 bg-white/80 hover:bg-white rounded-lg text-slate-400 hover:text-green-500 shadow-sm transition-colors border border-slate-100"
                          >
                            <div className="w-3 h-3 border-2 border-current rounded-sm" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            ))}

            {/* Current Time Indicator */}
            {isSameDay(today, today) && (
              <div 
                className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                style={{ 
                  top: ((today.getHours() - 8) * 60 + today.getMinutes()) / 60 * HOUR_HEIGHT,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
