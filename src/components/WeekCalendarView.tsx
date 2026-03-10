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
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex border-b border-white/10 bg-white/5">
        <div className="w-20 border-r border-white/10 flex items-center justify-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
          GMT+8
        </div>
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((day) => (
            <div 
              key={day.toString()} 
              className={cn(
                "py-4 text-center border-r border-white/5 last:border-r-0",
                isSameDay(day, today) && "bg-purple-500/10"
              )}
            >
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
                {format(day, 'eee', { locale: zhCN })}
              </div>
              <div className={cn(
                "text-lg font-display font-bold",
                isSameDay(day, today) ? "text-purple-400" : "text-white"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Body */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar">
        <div className="flex min-h-full">
          {/* Time Labels */}
          <div className="w-20 border-r border-white/10 flex flex-col bg-white/5">
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="text-[10px] font-bold text-white/20 h-[80px] flex items-start justify-center pt-2 border-b border-white/5"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day Columns */}
          <div className="flex-1 grid grid-cols-7 relative">
            {/* Grid Lines */}
            {HOURS.map((hour) => (
              <div 
                key={hour} 
                className="absolute left-0 right-0 border-b border-white/5 pointer-events-none"
                style={{ top: (hour - 8) * HOUR_HEIGHT + HOUR_HEIGHT - 1 }}
              />
            ))}
            
            {weekDays.map((day, dayIdx) => (
              <div 
                key={day.toString()} 
                className={cn(
                  "relative border-r border-white/5 last:border-r-0 h-full",
                  isSameDay(day, today) && "bg-purple-500/5"
                )}
              >
                {/* Events for this day */}
                {schedules
                  .filter(s => isSameDay(parseISO(s.dateTime), day))
                  .map((schedule) => {
                    const { top, height } = getPosition(schedule.dateTime, schedule.durationMinutes || 60);
                    const startTime = parseISO(schedule.dateTime);
                    const endTime = addMinutes(startTime, schedule.durationMinutes || 60);

                    // Only show if within 8:00 - 23:00 range for better UI
                    if (top < 0 || top > (HOURS.length * HOUR_HEIGHT)) return null;

                    return (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "absolute left-1 right-1 p-2 rounded-xl border flex flex-col justify-between overflow-hidden group transition-all hover:z-40",
                          schedule.completed ? "opacity-50" : "opacity-100"
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
                              schedule.completed ? "line-through text-white/30" : "text-white"
                            )}
                            style={{ color: !schedule.completed ? CATEGORY_COLORS[schedule.category] : undefined }}
                          >
                            {schedule.title}
                          </div>
                          <div className="text-[10px] text-white/40 font-medium">
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                          </div>
                        </div>

                        {/* Quick actions on hover */}
                        <div className="absolute top-1 right-1 hidden group-hover:flex flex-col gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(schedule.id); }}
                            className="p-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 transition-colors"
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
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
