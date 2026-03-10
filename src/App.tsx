import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar as CalendarIcon, Search, Bell } from 'lucide-react';
import { Schedule } from './types';
import ScheduleCard from './components/ScheduleCard';
import AddScheduleModal from './components/AddScheduleModal';
import ReminderManager from './components/ReminderManager';
import CalendarView from './components/CalendarView';
import WeekCalendarView from './components/WeekCalendarView';
import { isToday, isThisWeek, parseISO, compareAsc, isSameDay, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from './lib/utils';

type Tab = '今天' | '本周' | '日历' | '所有';

export default function App() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [activeTab, setActiveTab] = useState<Tab>('日历');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  const API_URL = 'http://localhost:3001/api/schedules';

  // Fetch from DB
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        console.log('Fetching schedules from:', API_URL);
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          console.log('Schedules fetched successfully:', data.length, 'items');
          setSchedules(data);
        } else {
          console.error('Fetch failed with status:', response.status);
        }
      } catch (error) {
        console.error('获取日程失败:', error);
      }
    };
    fetchSchedules();
  }, []);

  const handleAddSchedule = async (data: Omit<Schedule, 'id' | 'createdAt' | 'completed'>) => {
    const newSchedule: Schedule = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });
      if (response.ok) {
        setSchedules(prev => [...prev, newSchedule]);
      } else {
        const errorData = await response.json();
        console.error('添加日程失败:', errorData.error);
        alert(`添加失败: ${errorData.error}`);
      }
    } catch (error) {
      console.error('添加日程失败:', error);
      alert('添加失败，请检查后端服务器是否正常运行');
    }
  };

  const handleToggleComplete = async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    const updatedSchedule = { ...schedule, completed: !schedule.completed };
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      });
      if (response.ok) {
        setSchedules(prev => prev.map(s => s.id === id ? updatedSchedule : s));
      } else {
        const errorData = await response.json();
        console.error('更新状态失败:', errorData.error);
        alert(`操作失败: ${errorData.error}`);
      }
    } catch (error) {
      console.error('更新完成状态失败:', error);
      alert('操作失败，请检查后端服务器连接');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSchedules(prev => prev.filter(s => s.id !== id));
      } else {
        const errorData = await response.json().catch(() => ({ error: '删除请求返回异常' }));
        console.error('删除日程失败:', errorData.error);
        alert(`删除失败: ${errorData.error}`);
      }
    } catch (error) {
      console.error('删除日程失败:', error);
      alert('删除失败，请检查后端服务器连接');
    }
  };

  const handleUpdateSchedule = async (id: string, updates: Partial<Schedule>) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    const updatedSchedule = { ...schedule, ...updates };
    
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      });
      if (response.ok) {
        setSchedules(prev => prev.map(s => s.id === id ? updatedSchedule : s));
      } else {
        const errorData = await response.json();
        console.error('更新日程失败:', errorData.error);
      }
    } catch (error) {
      console.error('更新日程失败:', error);
    }
  };

  const handleReminderSent = async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (!schedule) return;

    const updatedSchedule = { 
      ...schedule, 
      reminder: { ...schedule.reminder, sent: true } 
    };

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      });
      if (response.ok) {
        setSchedules(prev => prev.map(s => s.id === id ? updatedSchedule : s));
      }
    } catch (error) {
      console.error('更新提醒状态失败:', error);
    }
  };

  const handleCalendarDoubleClick = (date: Date) => {
    setModalInitialDate(date);
    setEditSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditSchedule(schedule);
    setModalInitialDate(null);
    setIsModalOpen(true);
  };

  const filteredSchedules = useMemo(() => {
    let filtered = schedules.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === '今天') {
      filtered = filtered.filter(s => isToday(parseISO(s.dateTime)));
    } else if (activeTab === '本周') {
      filtered = filtered.filter(s => isThisWeek(parseISO(s.dateTime), { weekStartsOn: 1 }));
    } else if (activeTab === '日历' && selectedCalendarDate) {
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
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-12 sm:pt-12 sm:pb-20">
      <ReminderManager schedules={schedules} onReminderSent={handleReminderSent} />
      
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1.5 glass-card rounded-2xl w-fit overflow-x-auto no-scrollbar">
          {(['今天', '本周', '日历', '所有'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap",
                activeTab === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white shadow-sm rounded-xl border border-slate-200"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-purple-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-10 w-full sm:w-64 text-sm py-2.5"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-6">
        {activeTab === '本周' ? (
          <WeekCalendarView 
            schedules={schedules}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
            onUpdateSchedule={handleUpdateSchedule}
            onEditSchedule={handleEditSchedule}
          />
        ) : activeTab === '日历' ? (
          <>
            <CalendarView 
              schedules={schedules} 
              onSelectDate={setSelectedCalendarDate}
              onDoubleClickDate={handleCalendarDoubleClick}
              selectedDate={selectedCalendarDate}
            />
            {selectedCalendarDate && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <CalendarIcon size={18} className="text-purple-500" />
                    <span>{format(selectedCalendarDate, 'yyyy年MM月dd日', { locale: zhCN })}</span> 的任务
                  </h3>
                  <button 
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    清除选择
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
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
                          onEdit={handleEditSchedule}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="glass-card p-12 rounded-3xl text-center text-slate-300 italic">
                      该日期暂无日程
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        ) : (
          /* Default List View for '今天' and '所有' */
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
                      onEdit={handleEditSchedule}
                    />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-20 rounded-3xl flex flex-col items-center justify-center text-center"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <CalendarIcon className="text-slate-300" size={40} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">
                    未找到日程
                  </h3>
                  <p className="text-slate-400 max-w-xs">
                    {searchQuery 
                      ? "找不到匹配搜索的任务。" 
                      : `您在${activeTab}没有安排任何任务。`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 z-40"
      >
        <Plus size={32} strokeWidth={3} className="text-white" />
      </motion.button>

      {/* Modal */}
      <AddScheduleModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialDate(null);
          setEditSchedule(null);
        }}
        onAdd={handleAddSchedule}
        onUpdate={handleUpdateSchedule}
        initialDate={modalInitialDate}
        editSchedule={editSchedule}
      />

      {/* Footer Decoration */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-purple-100/50 blur-[120px] rounded-full -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-indigo-100/50 blur-[120px] rounded-full -z-10" />
    </div>
  );
}
