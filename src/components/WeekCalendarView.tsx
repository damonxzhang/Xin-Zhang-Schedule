import React from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  startOfDay, 
  differenceInMinutes,
  addMinutes,
  setHours,
  setMinutes
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent
} from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { Schedule, CATEGORY_COLORS } from '../types';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface WeekCalendarViewProps {
  schedules: Schedule[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSchedule: (id: string, updates: Partial<Schedule>) => void;
  onEditSchedule: (schedule: Schedule) => void;
  onAddAtTime: (date: Date) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
const HOUR_HEIGHT = 80; // pixels per hour

// 辅助函数：计算位置
const getPosition = (dateTime: string, duration: number) => {
  const date = parseISO(dateTime);
  const dayStart = startOfDay(date);
  const minutesFromStartOfDay = differenceInMinutes(date, dayStart);
  const minutesFrom8AM = minutesFromStartOfDay - 8 * 60;
  
  const top = (minutesFrom8AM / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;
  
  return { top, height };
};

// 单元格组件（Droppable）
function DayColumn({ day, index, children, onAddAtTime }: { day: Date, index: number, children: React.ReactNode, onAddAtTime: (date: Date) => void }) {
  const { setNodeRef } = useDroppable({
    id: `column-${index}`,
    data: { day }
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-1 border-r border-slate-100 last:border-r-0 relative min-w-[120px]"
    >
      {/* Horizontal Hour Lines */}
      {HOURS.map(hour => (
        <div 
          key={hour} 
          onClick={() => {
            const clickDate = new Date(day);
            clickDate.setHours(hour);
            clickDate.setMinutes(0);
            onAddAtTime(clickDate);
          }}
          className="border-b border-slate-50 w-full hover:bg-slate-50/50 cursor-pointer transition-colors"
          style={{ height: `${HOUR_HEIGHT}px` }}
        />
      ))}
      {children}
    </div>
  );
}

// 日程卡片组件（Draggable）
interface DraggableScheduleCardProps {
  schedule: Schedule;
  onToggleComplete: (id: string) => void;
  onDoubleClick: (schedule: Schedule) => void;
  isDraggingOverlay?: boolean;
}

function DraggableScheduleCard({ 
  schedule, 
  onToggleComplete, 
  onDoubleClick,
  isDraggingOverlay = false 
}: DraggableScheduleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: schedule.id,
    data: { schedule }
  });

  const { top, height } = getPosition(schedule.dateTime, schedule.durationMinutes || 60);
  const startTime = parseISO(schedule.dateTime);
  const endTime = addMinutes(startTime, schedule.durationMinutes || 60);

  const style = {
    top: isDraggingOverlay ? 0 : `${top}px`,
    height: `${Math.max(height, 40)}px`,
    backgroundColor: `${CATEGORY_COLORS[schedule.category]}15`,
    borderColor: `${CATEGORY_COLORS[schedule.category]}30`,
    borderLeftWidth: '4px',
    borderLeftColor: CATEGORY_COLORS[schedule.category],
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : (schedule.completed ? 0.4 : 1),
    cursor: 'grab'
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick(schedule);
      }}
      className={cn(
        "absolute left-1 right-1 p-2 rounded-xl border flex flex-col justify-between overflow-hidden group transition-all hover:z-40 shadow-sm",
        isDraggingOverlay && "shadow-xl ring-2 ring-purple-500/50"
      )}
      style={style}
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

      {!isDraggingOverlay && (
        <div className="absolute top-1 right-1 hidden group-hover:flex flex-col gap-1">
          <button 
            onPointerDown={(e) => { e.stopPropagation(); onToggleComplete(schedule.id); }}
            className="p-1 bg-white/80 hover:bg-white rounded-lg text-slate-400 hover:text-green-500 shadow-sm transition-colors border border-slate-100"
          >
            <div className="w-3 h-3 border-2 border-current rounded-sm" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function WeekCalendarView({ 
  schedules, 
  onToggleComplete, 
  onDelete, 
  onUpdateSchedule, 
  onEditSchedule,
  onAddAtTime
}: WeekCalendarViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id.toString().startsWith('column-')) {
      const schedule = active.data.current?.schedule as Schedule;
      const targetDay = over.data.current?.day as Date;
      
      // 计算垂直偏移量带来的时间变化
      const deltaY = event.delta.y;
      const deltaMinutes = Math.round(deltaY / HOUR_HEIGHT * 60);
      
      // 计算新时间
      let newDate = parseISO(schedule.dateTime);
      // 1. 设置日期为目标列的日期
      newDate = setHours(newDate, newDate.getHours());
      newDate = setMinutes(newDate, newDate.getMinutes());
      
      // 合并日期和时间
      const finalDate = new Date(
        targetDay.getFullYear(),
        targetDay.getMonth(),
        targetDay.getDate(),
        newDate.getHours(),
        newDate.getMinutes()
      );
      
      // 2. 加上拖动的偏移分钟
      const updatedDate = addMinutes(finalDate, deltaMinutes);
      
      // 限制在 8:00 - 22:00 范围内
      const hours = updatedDate.getHours();
      if (hours >= 8 && hours < 22) {
        onUpdateSchedule(schedule.id, {
          dateTime: updatedDate.toISOString()
        });
      }
    }
  };

  const activeSchedule = activeId ? schedules.find(s => s.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToFirstScrollableAncestor]}
    >
      <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[850px]">
        {/* Header with Days */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <div className="w-16 border-r border-slate-200 flex-shrink-0" />
          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {weekDays.map((day, i) => {
              const isTodayDay = isSameDay(day, today);
              return (
                <div 
                  key={i} 
                  className={cn(
                    "flex-1 py-4 text-center border-r border-slate-100 last:border-r-0 min-w-[120px]",
                    isTodayDay && "bg-purple-50/50"
                  )}
                >
                  <div className={cn(
                    "text-xs font-bold uppercase tracking-wider mb-1",
                    isTodayDay ? "text-purple-600" : "text-slate-400"
                  )}>
                    {format(day, 'EEEE', { locale: zhCN })}
                  </div>
                  <div className={cn(
                    "text-xl font-display",
                    isTodayDay ? "text-purple-700 font-bold" : "text-slate-700"
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
                <DayColumn key={i} day={day} index={i} onAddAtTime={onAddAtTime}>
                  {schedules
                    .filter(s => isSameDay(parseISO(s.dateTime), day))
                    .map((schedule) => (
                      <DraggableScheduleCard 
                        key={schedule.id} 
                        schedule={schedule} 
                        onToggleComplete={onToggleComplete}
                        onDoubleClick={onEditSchedule}
                      />
                    ))}
                </DayColumn>
              ))}

              {/* Current Time Indicator */}
              <div 
                className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                style={{ 
                  top: ((today.getHours() - 8) * 60 + today.getMinutes()) / 60 * HOUR_HEIGHT,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeSchedule ? (
          <DraggableScheduleCard 
            schedule={activeSchedule} 
            onToggleComplete={onToggleComplete} 
            onDoubleClick={onEditSchedule}
            isDraggingOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
