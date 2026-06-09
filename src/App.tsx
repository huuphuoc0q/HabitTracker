
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Settings, Plus, Trash2, Check, History, ListTodo, BarChart3, Download, X, ClipboardList, Edit2, GripVertical, Play, Pause, RotateCcw, Timer, Coffee, Brain, Flame, Trophy, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import html2canvas from 'html2canvas';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import { auth } from './firebase';
const DraggableComponent = Draggable as any;
// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

interface DailyTask {
  id: string;
  text: string;
  dateAdded?: string; 
  recurringTaskId?: string;
  duration?: number;
}

interface RecurringTask {
  id: string;
  text: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  repeatType: 'daily' | 'weekly' | 'weekdays' | 'custom_days';
  weekdays?: number[]; // [0-6] (0: CN, 1: T2, ...)
  duration?: number;
}

type DailyTasksData = Record<string, {
  pending: DailyTask[];
  completed: DailyTask[];
  deletedRecurringIds?: string[];
}>;

interface LegendItem { id: string; color: string; label: string; }
interface Habit { id: string; name: string; }
type MultiTrackedData = Record<string, Record<string, string>>;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isRecurringTaskActive(task: RecurringTask, dateStr: string): boolean {
  if (dateStr < task.startDate) return false;
  if (task.endDate && dateStr > task.endDate) return false;

  const localDate = parseLocalDate(dateStr);
  const localDay = localDate.getDay(); // 0: CN, 1: T2, ..., 6: T7

  switch (task.repeatType) {
    case 'daily':
      return true;
    case 'weekly':
      if (task.weekdays && task.weekdays.length > 0) {
        return task.weekdays.includes(localDay);
      }
      const startDay = parseLocalDate(task.startDate).getDay();
      return localDay === startDay;
    case 'weekdays':
      return localDay >= 1 && localDay <= 5;
    case 'custom_days':
      return task.weekdays ? task.weekdays.includes(localDay) : false;
    default:
      return false;
  }
}

function getDatesToSync(currentViewDate: Date): string[] {
  const dates: string[] = [];
  dates.push(currentViewDate.toISOString().split('T')[0]);
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (!dates.includes(key)) {
      dates.push(key);
    }
  }
  return dates;
}

function addTask(tasks: DailyTasksData, dateKey: string, text: string, duration?: number): DailyTasksData {
  const newId = Date.now().toString();
  const newTask: DailyTask = { 
    id: newId, 
    text, 
    dateAdded: new Date().toISOString(),
    duration: duration || undefined
  };
  const todayData = tasks[dateKey] || { pending: [], completed: [] };
  return {
    ...tasks,
    [dateKey]: {
      ...todayData,
      pending: [...todayData.pending, newTask]
    }
  };
}

function toggleTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
  const dateData = tasks[dateKey];
  if (!dateData) return tasks;

  const pending = dateData.pending.filter(t => t.id !== taskId);
  const task = dateData.pending.find(t => t.id === taskId);
  const completed = task ? [...dateData.completed, { ...task, dateAdded: new Date().toISOString() }] : dateData.completed;

  const newData = { ...tasks, [dateKey]: { ...dateData, pending, completed } };
  if (pending.length === 0 && completed.length === 0 && (!dateData.deletedRecurringIds || dateData.deletedRecurringIds.length === 0)) {
    const { [dateKey]: _, ...rest } = newData;
    return rest;
  }
  return newData;
}

function removeTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
  const dateData = tasks[dateKey];
  if (!dateData) return tasks;

  const targetTask = dateData.pending.find(t => t.id === taskId) || dateData.completed.find(t => t.id === taskId);

  const pending = dateData.pending.filter(t => t.id !== taskId);
  const completed = dateData.completed.filter(t => t.id !== taskId);
  const deletedRecurringIds = dateData.deletedRecurringIds ? [...dateData.deletedRecurringIds] : [];

  if (targetTask && targetTask.recurringTaskId) {
    if (!deletedRecurringIds.includes(targetTask.recurringTaskId)) {
      deletedRecurringIds.push(targetTask.recurringTaskId);
    }
  }

  const newData = { 
    ...tasks, 
    [dateKey]: { 
      ...dateData,
      pending, 
      completed,
      deletedRecurringIds 
    } 
  };
  
  if (pending.length === 0 && completed.length === 0 && deletedRecurringIds.length === 0) {
    const { [dateKey]: _, ...rest } = newData;
    return rest;
  }
  return newData;
}

function updateTask(tasks: DailyTasksData, dateKey: string, taskId: string, newText: string): DailyTasksData {
  const dateData = tasks[dateKey];
  if (!dateData) return tasks;

  const pending = dateData.pending.map(t => t.id === taskId ? { ...t, text: newText } : t);
  const completed = dateData.completed.map(t => t.id === taskId ? { ...t, text: newText } : t);

  return { ...tasks, [dateKey]: { pending, completed } };
}
function reorderTasks(
  tasks: DailyTasksData,
  dateKey: string,
  startIndex: number,
  endIndex: number,
  listType: 'pending' | 'completed'
): DailyTasksData {
  const dateData = tasks[dateKey];
  if (!dateData) return tasks;

  const resultList = Array.from(dateData[listType]);
  const [removed] = resultList.splice(startIndex, 1);
  resultList.splice(endIndex, 0, removed);

  return {
    ...tasks,
    [dateKey]: {
      ...dateData,
      [listType]: resultList
    }
  };
}
// function getPastDays(tasks: DailyTasksData, limit: number = 30): string[] {
//   return Object.keys(tasks).sort((a, b) => b.localeCompare(a)).slice(1, limit + 1);
// }
function getPastDays(tasks: DailyTasksData, limit: number = 30): string[] {
  const todayKey = getTodayKey();
  return Object.keys(tasks)
    // CHỈ lấy những ngày trước hôm nay VÀ còn ít nhất 1 task tồn đọng
    .filter(date => date < todayKey && tasks[date].pending.length > 0)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, limit);
}

// Local storage logic removed in favor of Firebase Firestore Sync
function getTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1e293b' : '#ffffff';
}

function formatDuration(mins: number) {
  if (mins >= 60) {
    const hrs = mins / 60;
    if (Number.isInteger(hrs)) {
      return `${hrs} giờ`;
    }
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}g ${m}ph`;
  }
  return `${mins} phút`;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------
// === COMPONENT CON ĐƯỢC TỐI ƯU HÓA BẰNG REACT.MEMO ===
// === COMPONENT CON ĐƯỢC TỐI ƯU HÓA BẰNG REACT.MEMO ===
const MemoizedCalendarCell = React.memo(({ day, isToday, color, textColor, onDayClick }: {
  day: number, isToday: boolean, color: string, textColor: string, onDayClick: (day: number) => void
}) => {
  return (
    <button
      onClick={() => onDayClick(day)}
      className="relative w-full h-14 sm:h-16 rounded-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-95 active:scale-90"
      style={{ backgroundColor: color, color: textColor }}
    >
      {day}
      {isToday && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
    </button>
  );
});
// ====================================================
// ====================================================
function MainApp() {
  const { currentUser } = useAuth();
  // === 1. Firestore Sync States ===
  const [dailyTasks, setDailyTasks] = useFirestoreSync<DailyTasksData>('habit-tracker-daily-tasks', {});
  const [legend, setLegend] = useFirestoreSync<LegendItem[]>('activity-tracker-legend', [
    { id: '1', color: '#22c55e', label: 'Hoàn thành' },
    { id: '2', color: '#ef4444', label: 'Không hoàn thành' }
  ]);
  const [habits, setHabits] = useFirestoreSync<Habit[]>('activity-tracker-habits', [
    { id: '1', name: 'Học từ vựng TOEIC' },
    { id: '2', name: 'Tập Gym / Thể thao' },
    { id: '3', name: 'Code dự án cá nhân' }
  ]);
  const [trackedData, setTrackedData] = useFirestoreSync<MultiTrackedData>('activity-tracker-multi-data', {});
  // === ÂM THANH (AUDIO FEEDBACK) ===
  const playTaskDoneSound = React.useCallback(() => {
    // Tiếng "Ding" định dạng MP3 (Đảm bảo mọi trình duyệt đều đọc được)
    const audio = new Audio('https://www.myinstants.com/media/sounds/ding-sound-effect_2.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Trình duyệt chặn âm thanh:", e));
  }, []);

  const playPomoBellSound = React.useCallback(() => {
    // Tiếng chuông báo hết giờ Pomodoro định dạng MP3
    const audio = new Audio('https://www.myinstants.com/media/sounds/boxing-bell.mp3');
    audio.volume = 0.6;
    audio.play().catch(e => console.log("Trình duyệt chặn âm thanh:", e));
  }, []);
  // === 2. UI States ===
  // === POMODORO STATES & LOGIC ===
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const [pomoTime, setPomoTime] = useState(25 * 60); // 25 phút mặc định
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [activeTimingTask, setActiveTimingTask] = useState<DailyTask | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPomoRunning && pomoTime > 0) {
      interval = setInterval(() => setPomoTime((prev) => prev - 1), 1000);
    } else if (pomoTime === 0 && isPomoRunning) {
      // 1. Dừng đồng hồ & Phát tiếng chuông ngay lập tức!
      setIsPomoRunning(false);
      playPomoBellSound();

      // 2. Chờ nửa giây để chuông kịp vang lên rồi mới hiện bảng thông báo
      setTimeout(() => {
        if (activeTimingTask) {
          const confirmDone = window.confirm(`🎉 Hết giờ thực hiện task: "${activeTimingTask.text}"!\nBạn có muốn đánh dấu task này là hoàn thành không?`);
          if (confirmDone) {
            toggleTaskAction(activeTimingTask.id);
          }
          setActiveTimingTask(null);
          setPomoTime(25 * 60);
          setPomoMode('work');
        } else {
          if (pomoMode === 'work') {
            alert('🎉 Hết 25 phút tập trung! Giải lao 5 phút thôi nào bạn ơi!');
            setPomoMode('break');
            setPomoTime(5 * 60);
          } else {
            alert('⏰ Hết giờ nghỉ! Quay lại làm việc năng suất nào!');
            setPomoMode('work');
            setPomoTime(25 * 60);
          }
        }
      }, 500); // 500ms = nửa giây
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoTime, pomoMode, playPomoBellSound, activeTimingTask]);

  const togglePomo = () => setIsPomoRunning(!isPomoRunning);

  const resetPomo = () => {
    setIsPomoRunning(false);
    if (activeTimingTask) {
      setPomoTime((activeTimingTask.duration || 25) * 60);
    } else {
      setPomoTime(pomoMode === 'work' ? 25 * 60 : 5 * 60);
    }
  };

  const switchPomoMode = (mode: 'work' | 'break') => {
    setIsPomoRunning(false);
    setActiveTimingTask(null);
    setPomoMode(mode);
    setPomoTime(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeHabitId, setActiveHabitId] = useState<string>(habits[0]?.id || '');
  const [activeColorId, setActiveColorId] = useState<string>('1');
  const [isEditingHabits, setIsEditingHabits] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [viewMode, setViewMode] = useState<'habits' | 'tasks'>('habits');
  const [viewDate, setViewDate] = useState(new Date());
  const [showTaskDetailModal, setShowTaskDetailModal] = useState<'week' | 'month' | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [isPendingTasksExpanded, setIsPendingTasksExpanded] = useFirestoreSync<boolean>('habit-tracker-pending-tasks-expanded', true);
  const [isCompletedTasksExpanded, setIsCompletedTasksExpanded] = useFirestoreSync<boolean>('habit-tracker-completed-tasks-expanded', true);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useFirestoreSync<boolean>('activity-tracker-dashboard-collapsed', false);

  // === States for Recurring Tasks ===
  const [recurringTasks, setRecurringTasks] = useFirestoreSync<RecurringTask[]>('habit-tracker-recurring-tasks', []);
  const [isRecurringEnabled, setIsRecurringEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'weekdays' | 'custom_days'>('daily');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showRecurrenceForm, setShowRecurrenceForm] = useState(false);
  const [showManageRecurringModal, setShowManageRecurringModal] = useState(false);

  const migrateLocalData = async () => {
    if (!currentUser) return;
    const confirmMsg = "Bạn có muốn đồng bộ dữ liệu cũ (từ máy này) lên tài khoản hiện tại không?\n\nLưu ý: Dữ liệu cũ sẽ đè lên dữ liệu hiện tại trên Cloud.";
    if (!window.confirm(confirmMsg)) return;

    const readLocal = (key: string) => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        return null;
      }
    };

    const localDailyTasks = readLocal('habit-tracker-daily-tasks');
    if (localDailyTasks) setDailyTasks(localDailyTasks);

    const localLegend = readLocal('activity-tracker-legend');
    if (localLegend) setLegend(localLegend);

    const localHabits = readLocal('activity-tracker-habits');
    if (localHabits) setHabits(localHabits);

    const localTrackedData = readLocal('activity-tracker-multi-data');
    if (localTrackedData) setTrackedData(localTrackedData);

    const localRecurring = readLocal('habit-tracker-recurring-tasks');
    if (localRecurring) setRecurringTasks(localRecurring);

    alert("Đồng bộ dữ liệu cũ thành công!");
  };

  // === Sync Recurring Tasks ===
  useEffect(() => {
    if (recurringTasks.length === 0) return;
    
    const datesToSync = getDatesToSync(viewDate);
    let updated = false;
    let newDailyTasks = { ...dailyTasks };

    datesToSync.forEach(dateKey => {
      const activeRecs = recurringTasks.filter(task => isRecurringTaskActive(task, dateKey));
      if (activeRecs.length === 0) return;

      const dateData = newDailyTasks[dateKey] || { pending: [], completed: [] };
      const deletedIds = dateData.deletedRecurringIds || [];
      
      const newPending = [...dateData.pending];
      let dateUpdated = false;

      activeRecs.forEach(rec => {
        const isInstantiated = dateData.pending.some(t => t.recurringTaskId === rec.id) ||
                              dateData.completed.some(t => t.recurringTaskId === rec.id) ||
                              deletedIds.includes(rec.id);
        
        if (!isInstantiated) {
          const newInstantiatedTask: DailyTask = {
            id: `rec_${rec.id}_${dateKey}`,
            text: rec.text,
            dateAdded: new Date().toISOString(),
            recurringTaskId: rec.id,
            duration: rec.duration
          };
          newPending.push(newInstantiatedTask);
          dateUpdated = true;
        }
      });

      if (dateUpdated) {
        newDailyTasks[dateKey] = {
          ...dateData,
          pending: newPending
        };
        updated = true;
      }
    });

    if (updated) {
      setDailyTasks(newDailyTasks);
    }
  }, [recurringTasks, viewDate]);

  // === 3. Derived Data ===
  const todayKey = getTodayKey();
  const viewDateKey = viewDate.toISOString().split('T')[0];
  const viewDayTasks = dailyTasks[viewDateKey] || { pending: [], completed: [] };
  const pastDays = getPastDays(dailyTasks);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prefixDays = firstDay === 0 ? 6 : firstDay - 1;

  const calendarCells = [];
  for (let i = 0; i < prefixDays; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  const suffixDays = calendarCells.length % 7 === 0 ? 0 : 7 - (calendarCells.length % 7);
  for (let i = 0; i < suffixDays; i++) calendarCells.push(null);

  const currentHabitData = trackedData[activeHabitId] || {};
  const todayStr = `Hôm nay: Thứ ${new Date().getDay() === 0 ? 'CN' : new Date().getDay() + 1}, ${new Date().getDate()} Tháng ${new Date().getMonth() + 1}, ${new Date().getFullYear()}`;

  // === 4. Calculations ===
  const taskStats = useMemo(() => {
    const calculateForDays = (daysToLookBack: number) => {
      let pending = 0;
      let completed = 0;
      const todayDate = new Date();
      for (let i = 0; i < daysToLookBack; i++) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        if (dailyTasks[key]) {
          pending += dailyTasks[key].pending.length;
          completed += dailyTasks[key].completed.length;
        }
      }
      return { pending, completed, total: pending + completed };
    };
    return {
      week: calculateForDays(7),
      month: calculateForDays(30)
    };
  }, [dailyTasks]);
  // === TÍNH TOÁN KỶ LỤC (STREAK) ===
  const streakStats = useMemo(() => {
    let best = 0;
    // Lọc ra danh sách những ngày có hoàn thành ít nhất 1 task và sắp xếp tăng dần
    const activeDates = Object.keys(dailyTasks)
      .filter(date => dailyTasks[date].completed.length > 0)
      .sort((a, b) => a.localeCompare(b));

    // 1. Tính Kỷ lục tốt nhất (Best Streak)
    let temp = 0;
    let prevDate: Date | null = null;
    for (const date of activeDates) {
      const curr = new Date(date);
      if (!prevDate) {
        temp = 1;
      } else {
        const diff = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
        if (diff === 1) temp++;
        else temp = 1;
      }
      prevDate = curr;
      if (temp > best) best = temp;
    }

    // 2. Tính Chuỗi hiện tại (Current Streak)
    let currStreak = 0;
    const getPreviousDayStr = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    };

    let checkKey = getTodayKey(); // Bắt đầu đếm ngược từ hôm nay

    // Nếu hôm nay có làm task thì cộng 1, chưa làm thì bỏ qua và lui về hôm qua
    if (activeDates.includes(checkKey)) {
      currStreak++;
      checkKey = getPreviousDayStr(checkKey);
    } else {
      checkKey = getPreviousDayStr(checkKey);
    }

    // Cứ thế lui về quá khứ, nếu ngày nào cũng làm thì cộng dồn liên tục
    while (activeDates.includes(checkKey)) {
      currStreak++;
      checkKey = getPreviousDayStr(checkKey);
    }

    return { current: currStreak, best: Math.max(best, currStreak) };
  }, [dailyTasks]);
  const chartData = useMemo(() => {
    return habits.map(habit => {
      const hData = trackedData[habit.id] || {};
      const thisMonthKeys = Object.keys(hData).filter(k => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
      return {
        id: habit.id,
        name: habit.name,
        counts: [
          { label: 'Xong', val: thisMonthKeys.filter(k => hData[k] === '1').length, color: '#22c55e' },
          { label: 'Bỏ', val: thisMonthKeys.filter(k => hData[k] === '2').length, color: '#ef4444' }
        ]
      };
    });
  }, [habits, trackedData, month, year]);

  // === 5. Event Handlers - Habits ===
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const onDayClick = React.useCallback((day: number) => {
    if (isEditingHabits || !activeHabitId) return;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    setTrackedData(prev => {
      const currentHabitRecords = prev[activeHabitId] ? { ...prev[activeHabitId] } : {};

      if (currentHabitRecords[dateKey] === activeColorId) {
        delete currentHabitRecords[dateKey];
      } else {
        currentHabitRecords[dateKey] = activeColorId;
      }

      return {
        ...prev,
        [activeHabitId]: currentHabitRecords
      };
    });
  }, [year, month, activeHabitId, activeColorId, isEditingHabits, setTrackedData]);
  const handleAddHabit = () => {
    const newId = Date.now().toString();
    setHabits([...habits, { id: newId, name: 'Chủ đề mới' }]);
    setActiveHabitId(newId);
  };

  const handleUpdateHabit = (id: string, name: string) => setHabits(habits.map(h => h.id === id ? { ...h, name } : h));

  const handleRemoveHabit = (id: string) => {
    if (habits.length <= 1) return;
    const newData = { ...trackedData };
    delete newData[id];
    setTrackedData(newData);
    setHabits(habits.filter(h => h.id !== id));
  };

  const exportChartToImage = async () => {
    const element = document.getElementById('monthly-chart-export-area');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `ThongKe_${month + 1}_${year}.png`;
      link.click();
    } catch (error) { console.error(error); }
  };

  // === 6. Event Handlers - Tasks ===
  const handlePrevDay = () => {
    const prev = new Date(viewDate);
    prev.setDate(prev.getDate() - 1);
    setViewDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(viewDate);
    next.setDate(next.getDate() + 1);
    setViewDate(next);
  };

  const handleTodayTask = () => setViewDate(new Date());

  const addTodayTask = (text: string, duration?: number) => {
    if (!text.trim()) return;
    
    if (isRecurringEnabled) {
      const newRecId = Date.now().toString();
      const newRec: RecurringTask = {
        id: newRecId,
        text: text.trim(),
        startDate: viewDateKey,
        endDate: endDate || undefined,
        repeatType,
        weekdays: repeatType === 'custom_days' ? selectedWeekdays : undefined,
        duration: duration || undefined
      };
      
      setRecurringTasks(prev => [...prev, newRec]);
      
      // Reset form states
      setIsRecurringEnabled(false);
      setShowRecurrenceForm(false);
      setEndDate('');
      setRepeatType('daily');
      setSelectedWeekdays([1, 2, 3, 4, 5]);
    } else {
      setDailyTasks(addTask(dailyTasks, viewDateKey, text.trim(), duration));
    }
  };

  const startTaskTimer = (task: DailyTask) => {
    setActiveTimingTask(task);
    setPomoTime((task.duration || 25) * 60);
    setPomoMode('work');
    setIsPomoRunning(true);
  };

  const getRecurrenceSummary = (task: { repeatType: string, weekdays?: number[], endDate?: string }) => {
    let typeStr = '';
    if (task.repeatType === 'daily') typeStr = 'Mỗi ngày';
    else if (task.repeatType === 'weekly') typeStr = 'Hàng tuần';
    else if (task.repeatType === 'weekdays') typeStr = 'Thứ 2 - Thứ 6';
    else if (task.repeatType === 'custom_days') {
      const days = task.weekdays || [];
      const dayNames = days
        .slice()
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map(d => d === 0 ? 'CN' : `T${d}`);
      typeStr = `Các thứ: ${dayNames.join(', ')}`;
    }
    
    if (task.endDate) {
      typeStr += ` (đến ${new Date(task.endDate).toLocaleDateString('vi-VN')})`;
    }
    return typeStr;
  };

  const deleteRecurringTask = (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xoá chuỗi công việc lặp lại này? Các công việc chưa hoàn thành của chuỗi này sẽ bị gỡ bỏ.')) return;
    
    setRecurringTasks(prev => prev.filter(t => t.id !== id));
    
    setDailyTasks(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(dateKey => {
        const data = next[dateKey];
        if (data) {
          const pending = data.pending.filter(t => t.recurringTaskId !== id);
          const deletedRecurringIds = data.deletedRecurringIds?.filter(rid => rid !== id);
          next[dateKey] = {
            ...data,
            pending,
            deletedRecurringIds
          };
        }
      });
      return next;
    });
  };

  // const toggleTaskAction = (taskId: string) => {
  //   setDailyTasks(toggleTask(dailyTasks, viewDateKey, taskId));
  // };
  const toggleTaskAction = (taskId: string) => {
    // Kiểm tra xem task này có đang ở mục Chưa hoàn thành không
    const isPending = dailyTasks[viewDateKey]?.pending.some(t => t.id === taskId);

    // Nếu đúng là đang hoàn thành task -> Phát nhạc!
    if (isPending) {
      playTaskDoneSound();
    }

    // Nếu task này đang chạy đếm ngược -> Dừng đồng hồ và reset
    if (activeTimingTask && activeTimingTask.id === taskId) {
      setIsPomoRunning(false);
      setActiveTimingTask(null);
      setPomoTime(25 * 60);
    }

    setDailyTasks(toggleTask(dailyTasks, viewDateKey, taskId));
  };
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Bạn có chắc muốn xoá task này?')) {
      // Nếu task này đang chạy đếm ngược -> Dừng đồng hồ và reset
      if (activeTimingTask && activeTimingTask.id === taskId) {
        setIsPomoRunning(false);
        setActiveTimingTask(null);
        setPomoTime(25 * 60);
      }
      setDailyTasks(removeTask(dailyTasks, viewDateKey, taskId));
    }
  };

  const handleStartEdit = (task: DailyTask) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTaskText.trim()) return;
    setDailyTasks(updateTask(dailyTasks, viewDateKey, taskId, editTaskText.trim()));
    setEditingTaskId(null);
    setEditTaskText("");
  };
  const onDragEnd = (result: DropResult) => {
    // Nếu thả ra ngoài khu vực cho phép, hoặc không thay đổi vị trí -> Bỏ qua
    if (!result.destination || result.destination.index === result.source.index) return;

    // Lấy loại list (pending hoặc completed) từ id của Droppable
    const listType = result.source.droppableId as 'pending' | 'completed';

    // Gọi hàm sắp xếp lại và lưu
    setDailyTasks(reorderTasks(
      dailyTasks,
      viewDateKey,
      result.source.index,
      result.destination.index,
      listType
    ));
  };
  // === 7. Render ===
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans relative">

      {/* Modal Tổng quan Biểu đồ Habits */}
      <AnimatePresence>
        {showOverview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-500" /> Thống kê tháng {month + 1}/{year}</h3>
                <button onClick={() => setShowOverview(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-x-auto bg-slate-50 flex-1">
                <div id="monthly-chart-export-area" className="min-w-[700px] p-10 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold" style={{ color: '#0f172a', margin: 0 }}>Báo cáo thói quen tháng {month + 1}</h2>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div><span className="text-xs font-bold" style={{ color: '#475569' }}>Hoàn thành</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div><span className="text-xs font-bold" style={{ color: '#475569' }}>Không hoàn thành</span></div>
                    </div>
                  </div>

                  <div className="relative h-64 flex items-end border-b" style={{ borderColor: '#cbd5e1' }}>
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      {[daysInMonth, Math.round(daysInMonth * 0.5), 0].map((val, i) => (
                        <div key={i} className="flex items-center w-full h-0">
                          <span className="text-xs font-medium w-10 text-right pr-3" style={{ color: '#94a3b8' }}>{val}</span>
                          <div className="flex-1 border-b border-dashed" style={{ borderColor: '#f1f5f9' }}></div>
                        </div>
                      ))}
                    </div>

                    <div className="pl-12 flex w-full justify-around h-full items-end pb-[1px] z-10">
                      {chartData.map((habit) => (
                        <div key={habit.id} className="flex flex-col items-center flex-1 h-full justify-end px-2">
                          <div className="flex items-end gap-2 w-full justify-center h-full">
                            {habit.counts.map((status, sIdx) => {
                              const hPercent = (status.val / daysInMonth) * 100;
                              return (
                                <div key={sIdx} className="flex flex-col items-center flex-1 max-w-[35px] h-full justify-end">
                                  <span className="text-[10px] font-black mb-1" style={{ color: status.color }}>{status.val}</span>
                                  <motion.div initial={{ height: 0 }} animate={{ height: `${hPercent}%` }} transition={{ duration: 0.8, delay: 0.1 * sIdx }} className="w-full rounded-t-md relative" style={{ backgroundColor: status.color }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pl-12 flex w-full justify-around mt-6 gap-2">
                    {chartData.map(habit => (
                      <div key={habit.id} className="flex-1 flex justify-center text-center min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 line-clamp-2 leading-tight" title={habit.name}>
                          {habit.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t bg-white flex justify-end">
                <button onClick={exportChartToImage} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-all">
                  <Download className="w-4 h-4" /> Tải ảnh báo cáo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Chi tiết Task (Tuần/Tháng) */}
      <AnimatePresence>
        {showTaskDetailModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
                <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  Chi tiết Task {showTaskDetailModal === 'week' ? '7 ngày' : '30 ngày'} qua
                </h3>
                <button onClick={() => setShowTaskDetailModal(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {(() => {
                  const days = showTaskDetailModal === 'week' ? 7 : 30;
                  const pendingList: (DailyTask & { date: string })[] = [];
                  const completedList: (DailyTask & { date: string })[] = [];
                  const todayDate = new Date();

                  for (let i = 0; i < days; i++) {
                    const d = new Date(todayDate);
                    d.setDate(d.getDate() - i);
                    const key = d.toISOString().split('T')[0];
                    if (dailyTasks[key]) {
                      dailyTasks[key].pending.forEach(t => pendingList.push({ ...t, date: key }));
                      dailyTasks[key].completed.forEach(t => completedList.push({ ...t, date: key }));
                    }
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cột Chưa hoàn thành */}
                      <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <h4 className="font-bold text-orange-600 mb-4 flex items-center gap-2 border-b border-orange-50 pb-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                          Tồn đọng ({pendingList.length})
                        </h4>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          {pendingList.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">Không có task tồn đọng!</p>
                          ) : (
                            pendingList.map(task => (
                              <div key={task.id} className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
                                <p className="text-sm font-bold text-slate-800 break-words">{task.text}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Ngày: {new Date(task.date).toLocaleDateString('vi-VN')}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Cột Hoàn thành */}
                      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
                        <h4 className="font-bold text-emerald-600 mb-4 flex items-center gap-2 border-b border-emerald-50 pb-2">
                          <Check className="w-4 h-4" />
                          Đã xong ({completedList.length})
                        </h4>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          {completedList.length === 0 ? (
                            <p className="text-sm text-slate-400 italic text-center py-4">Chưa có task hoàn thành.</p>
                          ) : (
                            completedList.map(task => (
                              <div key={task.id} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-emerald-900 break-words">{task.text}</p>
                                  <p className="text-[10px] text-emerald-600/80 mt-1">Ngày: {new Date(task.date).toLocaleDateString('vi-VN')}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Quản lý Công việc Lặp lại */}
      <AnimatePresence>
        {showManageRecurringModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 font-sans">
                  <RotateCcw className="w-5 h-5 text-emerald-500 animate-spin-slow" /> 
                  Quản lý công việc lặp lại
                </h3>
                <button 
                  onClick={() => setShowManageRecurringModal(false)} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                {recurringTasks.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                    <RotateCcw className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <h4 className="text-base font-bold text-slate-600 mb-1">Chưa có công việc lặp lại nào!</h4>
                    <p className="text-xs text-slate-500">Bật "Thiết lập lặp lại" khi tạo task để thêm công việc tự động lặp chu kỳ.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recurringTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-800 break-words mb-1">{task.text}</p>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {task.duration && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-0.5">
                                <Timer className="w-3 h-3 text-blue-500" /> {formatDuration(task.duration)}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              {getRecurrenceSummary(task)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Bắt đầu: {new Date(task.startDate).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteRecurringTask(task.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Xoá toàn bộ chuỗi lặp"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col justify-between flex-shrink-0 z-10 overflow-y-auto">
        <div className="space-y-8">
          <div>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setViewMode('habits')}
                className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${viewMode === 'habits' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <ListTodo className="w-5 h-5" />
                <span className="hidden sm:inline">Habits</span>
              </button>
              <button
                onClick={() => setViewMode('tasks')}
                className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${viewMode === 'tasks' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                <ClipboardList className="w-5 h-5" />
                <span className="hidden sm:inline">Tasks</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Habit<span className="text-emerald-500">Tracker</span></h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Binary Tracking System</p>
          </div>

          <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> Chủ đề theo dõi</label>
              <button onClick={() => setIsEditingHabits(!isEditingHabits)} className={`p-1 rounded-md ${isEditingHabits ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-200'}`}>
                {isEditingHabits ? <Check className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
              </button>
            </div>
            {isEditingHabits ? (
              <div className="space-y-2">
                {habits.map(habit => (
                  <div key={habit.id} className="flex gap-2">
                    <input type="text" value={habit.name} onChange={(e) => handleUpdateHabit(habit.id, e.target.value)} className="flex-1 bg-white border rounded-lg px-2 py-1 text-sm" />
                    <button onClick={() => handleRemoveHabit(habit.id)} disabled={habits.length <= 1} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={handleAddHabit} className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Thêm chủ đề</button>
              </div>
            ) : (
              <select value={activeHabitId} onChange={(e) => setActiveHabitId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-semibold cursor-pointer">
                {habits.map(habit => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
              </select>
            )}
          </section>

          <section>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Trạng thái đánh dấu</label>
            <div className="space-y-3">
              {legend.map(item => (
                <button key={item.id} onClick={() => setActiveColorId(item.id)} className={`w-full flex items-center p-3 rounded-xl border transition-all ${activeColorId === item.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="w-4 h-4 rounded shadow-sm mr-3" style={{ backgroundColor: item.color }} />
                  <span className={`text-sm ${activeColorId === item.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>

          <section className="mt-auto pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{currentUser?.displayName || 'Người dùng'}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{currentUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={migrateLocalData} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Đồng bộ dữ liệu từ thiết bị lên Cloud">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 16 4-4 4 4"/></svg>
                </button>
                <button onClick={() => auth.signOut()} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Đăng xuất">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
      </aside>

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-8 flex flex-col justify-start overflow-y-auto bg-slate-50">
        <div className={`w-full flex flex-col pt-4 pb-16 transition-all duration-300 ease-in-out ${viewMode === 'habits' ? 'max-w-3xl mx-auto' : 'max-w-5xl mx-auto'}`}>
          <header className="w-full flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
            {viewMode === 'habits' ? (
              // Habits Mode Header
              <>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{todayStr}</span>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900">{MONTHS[month]} {year}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{habits.find(h => h.id === activeHabitId)?.name}</span></p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowOverview(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"><BarChart3 className="w-4 h-4" /><span>Tổng quan</span></button>
                  <button onClick={handlePrevMonth} className="p-2 border rounded-lg bg-white hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleToday} className="px-3 py-2 text-xs font-bold rounded-lg bg-white border hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer">Hôm nay</button>
                  <button onClick={handleNextMonth} className="p-2 border rounded-lg bg-white hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </>
            ) : (
              // Tasks Mode Header
              <>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{todayStr}</span>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900">
                    {viewDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Quản lý danh sách công việc hàng ngày</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setShowManageRecurringModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"><RotateCcw className="w-4 h-4" /><span>Quản lý lặp</span></button>
                  <button onClick={handlePrevDay} className="p-2 border rounded-lg bg-white hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleTodayTask} className="px-3 py-2 text-xs font-bold rounded-lg bg-white border hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer">Hôm nay</button>
                  <button onClick={handleNextDay} className="p-2 border rounded-lg bg-white hover:bg-slate-50 transition-transform active:scale-95 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </>
            )}
          </header>

          {/* View: Habits */}
          {viewMode === 'habits' && (
            <div className="p-4 lg:p-5 bg-white rounded-2xl shadow-xl border">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAYS.map(wd => <div key={wd} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{wd}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} className="w-full h-14 sm:h-16 opacity-0" />;
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const colorId = currentHabitData[dateKey];
                  const item = legend.find(l => l.id === colorId);
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                  // Tính toán màu sắc trước khi đưa qua chốt lính canh
                  const bgColor = item ? item.color : '#E2E8F0';
                  const txtColor = item ? getTextColor(item.color) : '#64748b';

                  return (
                    <MemoizedCalendarCell
                      key={dateKey}
                      day={day}
                      isToday={isToday}
                      color={bgColor}
                      textColor={txtColor}
                      onDayClick={onDayClick}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Tasks */}
          {viewMode === 'tasks' && (
            <div className="space-y-5 w-full">
              {/* === BẢNG THỐNG KÊ DASHBOARD === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pb-1">

                {/* --- POMODORO WIDGET (MỚI) --- */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-2xl hover:border-emerald-300 min-h-[140px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-500" /> CLOCK
                    </h4>
                    {activeTimingTask ? (
                      <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1 shrink-0">
                        <Play className="w-2.5 h-2.5 fill-current animate-pulse text-orange-500" /> Đang làm
                      </span>
                    ) : (
                      /* Nút chuyển chế độ Mini */
                      <div className="flex bg-slate-50 p-0.5 rounded-lg border border-slate-100">
                        <button onClick={() => switchPomoMode('work')} className={`px-1.5 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${pomoMode === 'work' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Brain className="w-2.5 h-2.5" /> Làm
                        </button>
                        <button onClick={() => switchPomoMode('break')} className={`px-1.5 py-1 text-[9px] font-bold rounded-md transition-all flex items-center gap-1 ${pomoMode === 'break' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                          <Coffee className="w-2.5 h-2.5" /> Nghỉ
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center my-1">
                    <span className="text-2xl font-black tracking-tight font-mono text-slate-700 leading-none mb-2">
                      {formatTime(pomoTime)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={togglePomo} className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer ${isPomoRunning ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
                        {isPomoRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      </button>
                      <button 
                        onClick={() => {
                          resetPomo();
                          if (activeTimingTask) {
                            setPomoTime((activeTimingTask.duration || 25) * 60);
                          }
                        }} 
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="h-4 flex items-center justify-center overflow-hidden">
                    {activeTimingTask ? (
                      <p className="text-[10px] font-bold text-slate-500 truncate max-w-full text-center" title={activeTimingTask.text}>
                        Task: {activeTimingTask.text}
                      </p>
                    ) : (
                      <p className="text-[9px] text-slate-400 italic">Sẵn sàng</p>
                    )}
                  </div>
                </div>

                {/* --- CHUỖI KỶ LỤC (STREAK) MỚI --- */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center relative overflow-hidden transition-all hover:shadow-2xl hover:border-orange-300 min-h-[140px]">
                  {/* Icon ngọn lửa mờ chìm dưới nền */}
                  <div className="absolute -right-4 -top-4 text-orange-100 opacity-50 rotate-12 pointer-events-none">
                    <Flame className="w-24 h-24" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-4 relative z-10">
                    <Flame className="w-4 h-4 text-orange-500" /> Kỷ lục (Streak)
                  </h4>

                  <div className="flex items-center gap-4 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-4xl font-black text-orange-500 leading-none">{streakStats.current}</span>
                        <span className="text-xs font-bold text-slate-400 mb-1">ngày</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiện tại</p>
                    </div>

                    <div className="w-px h-10 bg-slate-200"></div>

                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-slate-700 leading-none">{streakStats.best}</span>
                        <Trophy className="w-4 h-4 text-yellow-500 mb-0.5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tốt nhất</p>
                    </div>
                  </div>
                </div>

                {/* 7 Ngày */}
                <div
                  onClick={() => setShowTaskDetailModal('week')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all min-h-[140px]"
                >
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 7 ngày qua</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-emerald-600 leading-none">{taskStats.week.completed}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">tasks</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đã xong</p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.completed / taskStats.week.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="w-px h-12 bg-slate-200 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-orange-500 leading-none">{taskStats.week.pending}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">tasks</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tồn đọng</p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.pending / taskStats.week.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 30 Ngày */}
                <div
                  onClick={() => setShowTaskDetailModal('month')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all min-h-[140px]"
                >
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 30 ngày qua</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-emerald-600 leading-none">{taskStats.month.completed}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">tasks</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Đã xong</p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.completed / taskStats.month.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="w-px h-12 bg-slate-200 shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-2xl font-black text-orange-500 leading-none">{taskStats.month.pending}</span>
                        <span className="text-[10px] font-bold text-slate-400 mb-0.5">tasks</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tồn đọng</p>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.pending / taskStats.month.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today Tasks */}
              <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 rounded-2xl p-5 lg:p-6 shadow-xl border border-emerald-200/50">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Nhiệm vụ trong ngày</span>
                </div>


                 {/* Add Task Input */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    type="text"
                    id="new-task-text"
                    placeholder="Nhập task mới..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const durationInput = document.getElementById('new-task-duration') as HTMLInputElement;
                        const unitSelect = document.getElementById('new-task-duration-unit') as HTMLSelectElement;
                        if (target.value) {
                          const val = durationInput?.value ? parseInt(durationInput.value) : undefined;
                          const unit = unitSelect?.value || 'm';
                          const mins = (val && !isNaN(val)) ? (unit === 'h' ? val * 60 : val) : undefined;
                          addTodayTask(target.value, mins);
                          target.value = '';
                          if (durationInput) durationInput.value = '';
                          if (unitSelect) unitSelect.value = 'm';
                        }
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 ring-emerald-400/30 focus:border-emerald-400 font-medium text-base placeholder-slate-400 transition-shadow hover:shadow-md"
                  />
                  <div className="flex gap-2 shrink-0">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 ring-emerald-400/30 focus-within:border-emerald-400 transition-shadow hover:shadow-md pl-2 overflow-hidden">
                      <input
                        type="number"
                        id="new-task-duration"
                        placeholder="TG"
                        min="1"
                        className="w-12 py-3 font-semibold text-base text-slate-800 focus:outline-none placeholder-slate-400 bg-transparent text-center"
                      />
                      <div className="w-px h-6 bg-slate-200 mx-1" />
                      <div className="relative flex items-center pr-2">
                        <select
                          id="new-task-duration-unit"
                          defaultValue="m"
                          className="appearance-none bg-transparent pl-2 pr-6 py-3 text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="m">phút</option>
                          <option value="h">giờ</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const input = document.getElementById('new-task-text') as HTMLInputElement;
                        const durationInput = document.getElementById('new-task-duration') as HTMLInputElement;
                        const unitSelect = document.getElementById('new-task-duration-unit') as HTMLSelectElement;
                        if (input?.value) {
                          const val = durationInput?.value ? parseInt(durationInput.value) : undefined;
                          const unit = unitSelect?.value || 'm';
                          const mins = (val && !isNaN(val)) ? (unit === 'h' ? val * 60 : val) : undefined;
                          addTodayTask(input.value, mins);
                          input.value = '';
                          if (durationInput) durationInput.value = '';
                          if (unitSelect) unitSelect.value = 'm';
                        }
                      }}
                      className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Recurrence Setup Toggle & Sub-panel */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <button
                    type="button"
                    onClick={() => setIsRecurringEnabled(!isRecurringEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isRecurringEnabled 
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRecurringEnabled ? 'animate-spin-slow' : ''}`} />
                    Thiết lập lặp lại: {isRecurringEnabled ? 'Bật' : 'Tắt'}
                  </button>
                </div>

                {isRecurringEnabled && (
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200/60 shadow-sm mb-6 space-y-3.5 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chu kỳ:</span>
                        <div className="flex flex-wrap gap-1">
                          {(['daily', 'weekly', 'weekdays', 'custom_days'] as const).map((type) => {
                            let label = '';
                            if (type === 'daily') label = 'Mỗi ngày';
                            else if (type === 'weekly') label = 'Hàng tuần';
                            else if (type === 'weekdays') label = 'T2-T6';
                            else if (type === 'custom_days') label = 'Tùy chọn';
                            return (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setRepeatType(type)}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                                  repeatType === type
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày kết thúc:</span>
                        <input
                          type="date"
                          value={endDate}
                          min={viewDateKey}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 text-slate-700"
                        />
                      </div>
                    </div>

                    {repeatType === 'custom_days' && (
                      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chọn ngày trong tuần:</span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { val: 1, label: 'T2' },
                            { val: 2, label: 'T3' },
                            { val: 3, label: 'T4' },
                            { val: 4, label: 'T5' },
                            { val: 5, label: 'T6' },
                            { val: 6, label: 'T7' },
                            { val: 0, label: 'CN' }
                          ].map((day) => {
                            const isSelected = selectedWeekdays.includes(day.val);
                            return (
                              <button
                                key={day.val}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedWeekdays(selectedWeekdays.filter(d => d !== day.val));
                                  } else {
                                    setSelectedWeekdays([...selectedWeekdays, day.val]);
                                  }
                                }}
                                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Tasks Section */}
                {(viewDayTasks.pending.length > 0 || viewDayTasks.completed.length === 0) && (
                  <section>
                    <div 
                      onClick={() => setIsPendingTasksExpanded(!isPendingTasksExpanded)}
                      className="group/header font-black text-lg text-slate-800 mb-3 flex items-center justify-between cursor-pointer select-none py-1 hover:text-orange-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        </div>
                        <span>Chưa hoàn thành ({viewDayTasks.pending.length})</span>
                      </div>
                      {isPendingTasksExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover/header:text-orange-500 transition-colors" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover/header:text-orange-500 transition-colors" />
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isPendingTasksExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          {viewDayTasks.pending.length > 0 ? (
                            <DragDropContext onDragEnd={onDragEnd}>
                              <Droppable droppableId="pending">
                                {(provided) => (
                                  <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-3 min-h-[50px] pb-1"
                                  >
                                    {viewDayTasks.pending.map((task, index) => (
                                      <DraggableComponent key={task.id} draggableId={task.id} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            style={provided.draggableProps.style}
                                          >
                                            <div
                                              className={`group bg-white p-4 rounded-xl border relative flex items-center justify-between ${snapshot.isDragging
                                                  ? 'border-blue-400 shadow-2xl scale-105 z-50 ring-4 ring-blue-400/20'
                                                  : 'border-slate-200 shadow-sm hover:shadow-md transition-all duration-300'
                                                }`}
                                            >
                                              {/* Tay cầm để kéo */}
                                              <div
                                                {...provided.dragHandleProps}
                                                className="mr-3 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 -ml-2"
                                              >
                                                <GripVertical className="w-5 h-5" />
                                              </div>

                                              <div className="flex items-center gap-4 relative z-10 flex-1 overflow-hidden">

                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (editingTaskId !== task.id) toggleTaskAction(task.id);
                                                  }}
                                                  className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 hover:from-emerald-400 hover:to-emerald-500 rounded-lg shadow-sm flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                                                  title="Đánh dấu hoàn thành"
                                                >
                                                  <Check className="w-5 h-5 text-white opacity-80" />
                                                </button>

                                                {/* Nút Bắt đầu đếm ngược */}
                                                {editingTaskId !== task.id && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      startTaskTimer(task);
                                                    }}
                                                    className={`flex-shrink-0 w-10 h-10 rounded-lg shadow-sm flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                                                      activeTimingTask?.id === task.id
                                                        ? 'bg-orange-500 text-white animate-pulse'
                                                        : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                                    }`}
                                                    title={activeTimingTask?.id === task.id ? 'Đang thực hiện' : 'Bắt đầu thực hiện'}
                                                  >
                                                    <Play className="w-5 h-5 fill-current" />
                                                  </button>
                                                )}

                                                <div className="flex-1 min-w-0" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
                                                  {editingTaskId === task.id ? (
                                                    <div className="flex items-center gap-2 pr-2">
                                                      <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold text-slate-800 shadow-inner" />
                                                      <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-sm"><Check className="w-4 h-4" /></button>
                                                      <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"><X className="w-4 h-4" /></button>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <p className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 mb-1 break-words">{task.text}</p>
                                                      <div className="flex flex-wrap gap-1.5 items-center">
                                                         {task.duration && (
                                                           <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold border border-blue-100 font-sans shadow-sm">
                                                             <Timer className="w-3 h-3 text-blue-500" /> {formatDuration(task.duration)}
                                                           </span>
                                                         )}
                                                         {task.dateAdded && <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-sans">Thêm {new Date(task.dateAdded).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</span>}
                                                         {task.recurringTaskId && (
                                                           <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-bold border border-emerald-100 font-sans shadow-sm">
                                                             <RotateCcw className="w-3 h-3 text-emerald-500" /> Lặp lại
                                                           </span>
                                                         )}
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Sửa/Xóa Buttons */}
                                              {editingTaskId !== task.id && (
                                                <div className="relative z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity ml-2">
                                                  <button onClick={(e) => { e.stopPropagation(); handleStartEdit(task); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg shadow-sm transition-colors" title="Sửa task"><Edit2 className="w-4 h-4" /></button>
                                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg shadow-sm transition-colors" title="Xoá task"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </DraggableComponent>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </DragDropContext>
                          ) : (
                            <div className="text-center py-8 bg-gradient-to-b from-orange-50/50 to-yellow-50/50 rounded-xl border border-dashed border-orange-200 p-6">
                              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-orange-400 opacity-50" />
                              <h4 className="text-lg font-bold text-slate-600 mb-1">Chưa có task!</h4>
                              <p className="text-sm text-slate-500">Hãy thêm task mới để bắt đầu ngày năng suất 🎉</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}

                {/* Completed Tasks Section */}
                {/* Completed Tasks Section */}
                {viewDayTasks.completed.length > 0 && (
                  <section className="mt-6">
                    <div 
                      onClick={() => setIsCompletedTasksExpanded(!isCompletedTasksExpanded)}
                      className="group/header font-black text-lg text-emerald-700 mb-3 flex items-center justify-between cursor-pointer select-none py-1 hover:text-emerald-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span>Hoàn thành ({viewDayTasks.completed.length})</span>
                      </div>
                      {isCompletedTasksExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover/header:text-emerald-600 transition-colors" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover/header:text-emerald-600 transition-colors" />
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {isCompletedTasksExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar pb-1">
                            {viewDayTasks.completed.map(task => (
                              <div
                                key={task.id}
                                className="group flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 shadow-sm hover:shadow transition-all relative overflow-hidden"
                              >
                                {/* ĐÃ SỬA: Chuyển div thành button và thêm onClick vào đây */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (editingTaskId !== task.id) toggleTaskAction(task.id);
                                  }}
                                  className="w-9 h-9 shrink-0 bg-emerald-500 hover:bg-slate-400 rounded-lg flex items-center justify-center shadow-sm relative z-10 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                                  title="Đánh dấu chưa hoàn thành"
                                >
                                  <Check className="w-5 h-5 text-white" />
                                </button>

                                <div className="flex-1 relative z-10 min-w-0" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
                                  {editingTaskId === task.id ? (
                                    <div className="flex items-center gap-2 pr-2">
                                      <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-2 py-1.5 focus:outline-none text-sm font-semibold text-slate-800" />
                                      <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white rounded-md shadow-sm border border-emerald-200"><Check className="w-4 h-4" /></button>
                                      <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white rounded-md shadow-sm border border-slate-200"><X className="w-4 h-4" /></button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-sm text-emerald-800 break-words">{task.text}</p>
                                      <div className="flex flex-wrap gap-1.5 items-center mt-0.5">
                                        <span className="text-[10px] text-emerald-600 font-medium font-sans">✓ {new Date(task.dateAdded || viewDateKey).toLocaleString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        {task.recurringTaskId && (
                                          <span className="text-[9px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 font-bold font-sans">
                                            <RotateCcw className="w-2.5 h-2.5 text-emerald-600" /> Lặp lại
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Sửa/Xóa Buttons */}
                                {editingTaskId !== task.id && (
                                  <div className="relative z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity ml-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(task); }} className="p-1.5 text-emerald-600/60 hover:text-blue-600 hover:bg-white rounded-lg transition-colors" title="Sửa task"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-emerald-600/60 hover:text-red-500 hover:bg-white rounded-lg transition-colors" title="Xoá task"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}
              </div>

              {/* Past Days Quick View */}
              {pastDays.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 lg:p-6">
                  <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    📜 Tasks các ngày trước
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {pastDays.slice(0, 6).map(date => {
                      const dayTasks = dailyTasks[date] || { pending: [], completed: [] };
                      return (
                        <button
                          key={date}
                          className="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-teal-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all relative overflow-hidden text-left"
                          onClick={() => setViewDate(new Date(date))}
                        >
                          <div className="relative z-10">
                            <p className="font-bold text-slate-800 text-base mb-1.5">
                              {new Date(date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
                                <div className="w-2.5 h-2.5 bg-orange-400 rounded-full" />
                                {dayTasks.pending.length}
                              </div>
                              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <Check className="w-3.5 h-3.5" />
                                {dayTasks.completed.length}
                              </div>
                            </div>
                            {dayTasks.pending.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                {dayTasks.pending.slice(0, 2).map(task => (
                                  <p key={task.id} className="text-[11px] text-slate-700 line-clamp-1 bg-orange-100/70 px-2 py-0.5 rounded-md mb-1 font-medium inline-block mr-1">
                                    {task.text}
                                  </p>
                                ))}
                                {dayTasks.pending.length > 2 && (
                                  <p className="text-[10px] text-slate-500 block mt-0.5">+{dayTasks.pending.length - 2} nữa...</p>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return <MainApp />;
}