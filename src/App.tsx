import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Schedule } from './types';
import ScheduleCard from './components/ScheduleCard';
import AddScheduleModal from './components/AddScheduleModal';
import ReminderManager from './components/ReminderManager';
import CalendarView from './components/CalendarView';
import { isToday, isThisWeek, parseISO, compareAsc, isSameDay, format } from 'date-fns';
import { cn } from './lib/utils';

type Tab = 'Today' | 'This Week' | 'Calendar' | 'All';

export default function App() {
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('lumina_schedules');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<Tab>('Calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('lumina_schedules', JSON.stringify(schedules));
  }, [schedules]);

  const handleAddSchedule = (data: Omit<Schedule, 'id' | 'createdAt' | 'completed'>) => {
    const newSchedule: Schedule = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setSchedules(prev => [...prev, newSchedule]);
  };

  const handleToggleComplete = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, completed: !s.completed } : s
    ));
  };

  const handleDelete = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleReminderSent = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, reminder: { ...s.reminder, sent: true } } : s
    ));
  };

  const handleCalendarDoubleClick = (date: Date) => {
    setModalInitialDate(date);
    setIsModalOpen(true);
  };

  const filteredSchedules = useMemo(() => {
    let filtered = schedules.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'Today') {
      filtered = filtered.filter(s => isToday(parseISO(s.dateTime)));
    } else if (activeTab === 'This Week') {
      filtered = filtered.filter(s => isThisWeek(parseISO(s.dateTime)));
    } else if (activeTab === 'Calendar' && selectedCalendarDate) {
      filtered = filtered.filter(s => isSameDay(parseISO(s.dateTime), selectedCalendarDate));
    }

    // Sorting: 
    // 1. Incomplete first
    // 2. By date ascending
    // 3. Completed at bottom
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return compareAsc(parseISO(a.dateTime), parseISO(b.dateTime));
    });
  }, [schedules, activeTab, searchQuery, selectedCalendarDate]);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 pb-12 sm:pt-12 sm:pb-20">
      <ReminderManager schedules={schedules} onReminderSent={handleReminderSent} />
      
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-end gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-cyan-400 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 w-full sm:w-64 text-sm py-2.5"
            />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 p-1.5 glass-card rounded-2xl w-fit overflow-x-auto no-scrollbar">
        {(['Today', 'This Week', 'Calendar', 'All'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap",
              activeTab === tab ? "text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'Calendar' && (
        <CalendarView 
          schedules={schedules} 
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
          onDoubleClickDate={handleCalendarDoubleClick}
        />
      )}

      {/* List Header */}
      {activeTab === 'Calendar' && selectedCalendarDate && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 glass-card rounded-xl text-cyan-400">
              <CalendarIcon size={18} />
            </div>
            <h3 className="text-xl font-bold">
              Tasks for <span className="text-cyan-400">{format(selectedCalendarDate, 'MMMM d, yyyy')}</span>
            </h3>
          </div>
          <button 
            onClick={() => setSelectedCalendarDate(null)}
            className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors"
          >
            Clear Selection
          </button>
        </motion.div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map((schedule, index) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ScheduleCard 
                  schedule={schedule}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-20 rounded-3xl flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <CalendarIcon className="text-white/20" size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">No schedules found</h3>
              <p className="text-white/40 max-w-xs">
                {searchQuery 
                  ? "We couldn't find any tasks matching your search." 
                  : activeTab === 'Calendar' && selectedCalendarDate
                    ? `You don't have any tasks scheduled for ${format(selectedCalendarDate, 'MMMM d')}.`
                    : `You don't have any tasks scheduled for ${activeTab.toLowerCase()}.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 z-40"
      >
        <Plus size={32} strokeWidth={3} />
      </motion.button>

      {/* Modal */}
      <AddScheduleModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialDate(null);
        }}
        onAdd={handleAddSchedule}
        initialDate={modalInitialDate}
      />

      {/* Footer Decoration */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-cyan-600/10 blur-[120px] rounded-full -z-10" />
    </div>
  );
}
