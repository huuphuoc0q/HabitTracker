
// import React, { useState, useEffect, useMemo } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { ChevronLeft, ChevronRight, Settings, Plus, Trash2, Check, History, ListTodo, BarChart3, Download, X, ClipboardList, Edit2 } from 'lucide-react';
// import html2canvas from 'html2canvas';

// // ---------------------------------------------------------------------------
// // Helpers
// // ---------------------------------------------------------------------------

// interface DailyTask {
//   id: string;
//   text: string;
//   dateAdded?: string; // YYYY-MM-DD
// }

// type DailyTasksData = Record<string, {
//   pending: DailyTask[];
//   completed: DailyTask[];
// }>;

// function getTodayKey(): string {
//   return new Date().toISOString().split('T')[0];
// }

// // function addTask(tasks: DailyTasksData, dateKey: string, text: string): DailyTasksData {
// //   const newId = Date.now().toString();
// //   const newTask: DailyTask = { id: newId, text, dateAdded: getTodayKey() };
// //   const todayData = tasks[dateKey] || { pending: [], completed: [] };
// //   return {
// //     ...tasks,
// //     [dateKey]: {
// //       ...todayData,
// //       pending: [...todayData.pending, newTask]
// //     }
// //   };
// // }

// // function toggleTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
// //   const dateData = tasks[dateKey];
// //   if (!dateData) return tasks;

// //   const pending = dateData.pending.filter(t => t.id !== taskId);
// //   const task = dateData.pending.find(t => t.id === taskId);
// //   const completed = task ? [...dateData.completed, { ...task, dateAdded: dateKey }] : dateData.completed;

// //   const newData = { ...tasks, [dateKey]: { pending, completed } };
// //   if (pending.length === 0 && completed.length === 0) {
// //     const { [dateKey]: _, ...rest } = newData;
// //     return rest;
// //   }
// //   return newData;
// // }
// function addTask(tasks: DailyTasksData, dateKey: string, text: string): DailyTasksData {
//   const newId = Date.now().toString();
//   // FIX: Lưu chính xác giờ phút giây hiện tại (thay vì chỉ lưu mỗi ngày)
//   const newTask: DailyTask = { id: newId, text, dateAdded: new Date().toISOString() };
//   const todayData = tasks[dateKey] || { pending: [], completed: [] };
//   return {
//     ...tasks,
//     [dateKey]: {
//       ...todayData,
//       pending: [...todayData.pending, newTask]
//     }
//   };
// }

// function toggleTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
//   const dateData = tasks[dateKey];
//   if (!dateData) return tasks;

//   const pending = dateData.pending.filter(t => t.id !== taskId);
//   const task = dateData.pending.find(t => t.id === taskId);
//   // FIX: Cập nhật giờ chính xác lúc bạn ấn nút "Hoàn thành"
//   const completed = task ? [...dateData.completed, { ...task, dateAdded: new Date().toISOString() }] : dateData.completed;

//   const newData = { ...tasks, [dateKey]: { pending, completed } };
//   if (pending.length === 0 && completed.length === 0) {
//     const { [dateKey]: _, ...rest } = newData;
//     return rest;
//   }
//   return newData;
// }
// function removeTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
//   const dateData = tasks[dateKey];
//   if (!dateData) return tasks;

//   const pending = dateData.pending.filter(t => t.id !== taskId);
//   const completed = dateData.completed.filter(t => t.id !== taskId);

//   const newData = { ...tasks, [dateKey]: { pending, completed } };
//   if (pending.length === 0 && completed.length === 0) {
//     const { [dateKey]: _, ...rest } = newData;
//     return rest;
//   }
//   return newData;
// }

// function updateTask(tasks: DailyTasksData, dateKey: string, taskId: string, newText: string): DailyTasksData {
//   const dateData = tasks[dateKey];
//   if (!dateData) return tasks;

//   const pending = dateData.pending.map(t => t.id === taskId ? { ...t, text: newText } : t);
//   const completed = dateData.completed.map(t => t.id === taskId ? { ...t, text: newText } : t);

//   return { ...tasks, [dateKey]: { pending, completed } };
// }

// function getPastDays(tasks: DailyTasksData, limit: number = 30): string[] {
//   return Object.keys(tasks).sort((a, b) => b.localeCompare(a)).slice(1, limit + 1);
// }

// function useLocalStorage<T>(key: string, initialValue: T) {
//   const [storedValue, setStoredValue] = useState<T>(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       console.warn("Lỗi khi đọc từ localStorage:", error);
//       return initialValue;
//     }
//   });

//   const setValue = (value: T | ((val: T) => T)) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.warn("Lỗi khi lưu vào localStorage:", error);
//     }
//   };

//   return [storedValue, setValue] as const;
// }

// function getTextColor(hexColor: string) {
//   const hex = hexColor.replace('#', '');
//   const r = parseInt(hex.substring(0, 2), 16);
//   const g = parseInt(hex.substring(2, 4), 16);
//   const b = parseInt(hex.substring(4, 6), 16);
//   const yiq = (r * 299 + g * 587 + b * 114) / 1000;
//   return yiq >= 128 ? '#1e293b' : '#ffffff';
// }

// const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
// const MONTHS = [
//   'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
//   'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
// ];

// interface LegendItem { id: string; color: string; label: string; }
// interface Habit { id: string; name: string; }
// type MultiTrackedData = Record<string, Record<string, string>>; 

// // ---------------------------------------------------------------------------
// // Main Application
// // ---------------------------------------------------------------------------

// export default function App() {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [dailyTasks, setDailyTasks] = useLocalStorage<DailyTasksData>('habit-tracker-daily-tasks', {});
  
//   const [legend, setLegend] = useLocalStorage<LegendItem[]>('activity-tracker-legend', [
//     { id: '1', color: '#22c55e', label: 'Hoàn thành' },
//     { id: '2', color: '#ef4444', label: 'Không hoàn thành' }
//   ]);
  
//   const [habits, setHabits] = useLocalStorage<Habit[]>('activity-tracker-habits', [
//     { id: '1', name: 'Học từ vựng TOEIC' },
//     { id: '2', name: 'Tập Gym / Thể thao' },
//     { id: '3', name: 'Code dự án cá nhân' }
//   ]);
  
//   const [trackedData, setTrackedData] = useLocalStorage<MultiTrackedData>('activity-tracker-multi-data', {});

//   const [activeHabitId, setActiveHabitId] = useState<string>(habits[0]?.id || '');
//   const [activeColorId, setActiveColorId] = useState<string>('1');
//   const [isEditingHabits, setIsEditingHabits] = useState(false);
//   const [showOverview, setShowOverview] = useState(false);
//   const [viewMode, setViewMode] = useState<'habits' | 'tasks'>('habits');
//   const [viewDate, setViewDate] = useState(new Date());
// const [showTaskDetailModal, setShowTaskDetailModal] = useState<'week' | 'month' | null>(null);
// const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
// const [editTaskText, setEditTaskText] = useState(""); 
// const todayKey = getTodayKey();
//   const viewDateKey = viewDate.toISOString().split('T')[0];
//   const viewDayTasks = dailyTasks[viewDateKey] || { pending: [], completed: [] };
//   const pastDays = getPastDays(dailyTasks);

//   // === THÊM ĐOẠN LOGIC NÀY VÀO ĐÂY ===
//   const taskStats = useMemo(() => {
//     const calculateForDays = (daysToLookBack: number) => {
//       let pending = 0;
//       let completed = 0;
//       const todayDate = new Date();
//       for (let i = 0; i < daysToLookBack; i++) {
//         const d = new Date(todayDate);
//         d.setDate(d.getDate() - i);
//         const key = d.toISOString().split('T')[0];
//         if (dailyTasks[key]) {
//           pending += dailyTasks[key].pending.length;
//           completed += dailyTasks[key].completed.length;
//         }
//       }
//       return { pending, completed, total: pending + completed };
//     };
//     return {
//       week: calculateForDays(7),
//       month: calculateForDays(30)
//     };
//   }, [dailyTasks]);
//   // ===================================
//   const addTodayTask = (text: string) => {
//     if (!text.trim()) return;
//     setDailyTasks(addTask(dailyTasks, todayKey, text.trim()));
//   };

//   const toggleTaskAction = (taskId: string) => {
//     setDailyTasks(toggleTask(dailyTasks, viewDateKey, taskId));
//   };
// const handleDeleteTask = (taskId: string) => {
//     if (window.confirm('Bạn có chắc muốn xoá task này?')) {
//       setDailyTasks(removeTask(dailyTasks, viewDateKey, taskId));
//     }
//   };

//   const handleStartEdit = (task: DailyTask) => {
//     setEditingTaskId(task.id);
//     setEditTaskText(task.text);
//   };

//   const handleSaveEdit = (taskId: string) => {
//     if (!editTaskText.trim()) return;
//     setDailyTasks(updateTask(dailyTasks, viewDateKey, taskId, editTaskText.trim()));
//     setEditingTaskId(null);
//     setEditTaskText("");
//   };
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();

//   const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
//   const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
//   const handleToday = () => setCurrentDate(new Date());
// const handlePrevDay = () => {
//     const prev = new Date(viewDate);
//     prev.setDate(prev.getDate() - 1);
//     setViewDate(prev);
//   };
  
//   const handleNextDay = () => {
//     const next = new Date(viewDate);
//     next.setDate(next.getDate() + 1);
//     setViewDate(next);
//   };
  
//   const handleTodayTask = () => setViewDate(new Date());
//   const daysInMonth = new Date(year, month + 1, 0).getDate();
//   const firstDay = new Date(year, month, 1).getDay();
//   const prefixDays = firstDay === 0 ? 6 : firstDay - 1;

//   const calendarCells = [];
//   for (let i = 0; i < prefixDays; i++) calendarCells.push(null);
//   for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
//   const suffixDays = calendarCells.length % 7 === 0 ? 0 : 7 - (calendarCells.length % 7);
//   for (let i = 0; i < suffixDays; i++) calendarCells.push(null);

//   const onDayClick = (day: number) => {
//     if (isEditingHabits || !activeHabitId) return;
//     const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//     setTrackedData(prev => {
//       const next = { ...prev };
//       if (!next[activeHabitId]) next[activeHabitId] = {};
//       if (next[activeHabitId][dateKey] === activeColorId) delete next[activeHabitId][dateKey];
//       else next[activeHabitId][dateKey] = activeColorId;
//       return next;
//     });
//   };

//   const handleAddHabit = () => {
//     const newId = Date.now().toString();
//     setHabits([...habits, { id: newId, name: 'Chủ đề mới' }]);
//     setActiveHabitId(newId);
//   };
  
//   const handleUpdateHabit = (id: string, name: string) => setHabits(habits.map(h => h.id === id ? { ...h, name } : h));
  
//   const handleRemoveHabit = (id: string) => {
//     if (habits.length <= 1) return;
//     const newData = { ...trackedData };
//     delete newData[id];
//     setTrackedData(newData);
//     setHabits(habits.filter(h => h.id !== id));
//   };

//   const currentHabitData = trackedData[activeHabitId] || {};
//   const todayStr = `Hôm nay: Thứ ${new Date().getDay() === 0 ? 'CN' : new Date().getDay() + 1}, ${new Date().getDate()} Tháng ${new Date().getMonth() + 1}, ${new Date().getFullYear()}`;

//   const chartData = useMemo(() => {
//     return habits.map(habit => {
//       const hData = trackedData[habit.id] || {};
//       const thisMonthKeys = Object.keys(hData).filter(k => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
//       return { 
//         id: habit.id, 
//         name: habit.name, 
//         counts: [
//           { label: 'Xong', val: thisMonthKeys.filter(k => hData[k] === '1').length, color: '#22c55e' },
//           { label: 'Bỏ', val: thisMonthKeys.filter(k => hData[k] === '2').length, color: '#ef4444' }
//         ] 
//       };
//     });
//   }, [habits, trackedData, month, year]);

//   const exportChartToImage = async () => {
//     const element = document.getElementById('monthly-chart-export-area');
//     if (!element) return;
//     try {
//       const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
//       const link = document.createElement('a');
//       link.href = canvas.toDataURL('image/png');
//       link.download = `ThongKe_${month + 1}_${year}.png`;
//       link.click();
//     } catch (error) { console.error(error); }
//   };

//   return (
//     <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans relative">
      
//       {/* Modal Tổng quan */}
//       <AnimatePresence>
//         {showOverview && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">
//               <div className="flex items-center justify-between p-5 border-b border-slate-100">
//                 <h3 className="text-lg font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-500" /> Thống kê tháng {month + 1}/{year}</h3>
//                 <button onClick={() => setShowOverview(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><X className="w-5 h-5" /></button>
//               </div>

//               <div className="p-6 overflow-x-auto bg-slate-50 flex-1">
//                 <div id="monthly-chart-export-area" className="min-w-[700px] p-10 rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}>
//                   <div className="text-center mb-8">
//                     <h2 className="text-2xl font-bold" style={{ color: '#0f172a', margin: 0 }}>Báo cáo thói quen tháng {month + 1}</h2>
//                     <div className="flex justify-center gap-6 mt-4">
//                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22c55e' }}></div><span className="text-xs font-bold" style={{ color: '#475569' }}>Hoàn thành</span></div>
//                       <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }}></div><span className="text-xs font-bold" style={{ color: '#475569' }}>Không hoàn thành</span></div>
//                     </div>
//                   </div>
                  
//                   <div className="relative h-64 flex items-end border-b" style={{ borderColor: '#cbd5e1' }}>
//                     <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
//                       {[daysInMonth, Math.round(daysInMonth*0.5), 0].map((val, i) => (
//                         <div key={i} className="flex items-center w-full h-0">
//                           <span className="text-xs font-medium w-10 text-right pr-3" style={{ color: '#94a3b8' }}>{val}</span>
//                           <div className="flex-1 border-b border-dashed" style={{ borderColor: '#f1f5f9' }}></div>
//                         </div>
//                       ))}
//                     </div>

//                     <div className="pl-12 flex w-full justify-around h-full items-end pb-[1px] z-10">
//                       {chartData.map((habit) => (
//                         <div key={habit.id} className="flex flex-col items-center flex-1 h-full justify-end px-2">
//                           <div className="flex items-end gap-2 w-full justify-center h-full">
//                             {habit.counts.map((status, sIdx) => {
//                               const hPercent = (status.val / daysInMonth) * 100;
//                               return (
//                                 <div key={sIdx} className="flex flex-col items-center flex-1 max-w-[35px] h-full justify-end">
//                                   <span className="text-[10px] font-black mb-1" style={{ color: status.color }}>{status.val}</span>
//                                   <motion.div initial={{ height: 0 }} animate={{ height: `${hPercent}%` }} transition={{ duration: 0.8, delay: 0.1*sIdx }} className="w-full rounded-t-md relative" style={{ backgroundColor: status.color }} />
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       ))}
//                     </div> 
//                   </div>

//                   {/* <div className="pl-12 flex w-full justify-around mt-6">
//                     {chartData.map(habit => (
//                       <div key={habit.id} className="flex-1 text-center px-2">
//                         <span className="text-[10px] font-bold uppercase tracking-wider block truncate" style={{ color: '#334155' }}>{habit.name}</span>
//                       </div>
//                     ))}
//                   </div> */}
//                   <div className="pl-12 flex w-full justify-around mt-6 gap-2">
//     {chartData.map(habit => (
//       <div key={habit.id} className="flex-1 flex justify-center text-center min-w-0">
//         <span 
//           className="text-[10px] font-bold uppercase tracking-wider text-slate-700 line-clamp-2 leading-tight" 
//           title={habit.name}
//         >
//           {habit.name}
//         </span>
//       </div>
//     ))}
//   </div>
//                 </div>
//               </div>

//               <div className="p-5 border-t bg-white flex justify-end">
//                 <button onClick={exportChartToImage} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-md hover:bg-emerald-700 transition-all">
//                   <Download className="w-4 h-4" /> Tải ảnh báo cáo
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
// {/* === MODAL CHI TIẾT TASK (MỚI) === */}
//       <AnimatePresence>
//         {showTaskDetailModal && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
//               <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
//                 <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
//                   <ClipboardList className="w-5 h-5 text-emerald-500" /> 
//                   Chi tiết Task {showTaskDetailModal === 'week' ? '7 ngày' : '30 ngày'} qua
//                 </h3>
//                 <button onClick={() => setShowTaskDetailModal(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
//               </div>

//               <div className="p-6 overflow-y-auto flex-1">
//                 {(() => {
//                   const days = showTaskDetailModal === 'week' ? 7 : 30;
//                   const pendingList: (DailyTask & { date: string })[] = [];
//                   const completedList: (DailyTask & { date: string })[] = [];
//                   const todayDate = new Date();
                  
//                   for (let i = 0; i < days; i++) {
//                     const d = new Date(todayDate);
//                     d.setDate(d.getDate() - i);
//                     const key = d.toISOString().split('T')[0];
//                     if (dailyTasks[key]) {
//                       dailyTasks[key].pending.forEach(t => pendingList.push({ ...t, date: key }));
//                       dailyTasks[key].completed.forEach(t => completedList.push({ ...t, date: key }));
//                     }
//                   }

//                   return (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       {/* Cột Chưa hoàn thành */}
//                       <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
//                         <h4 className="font-bold text-orange-600 mb-4 flex items-center gap-2 border-b border-orange-50 pb-2">
//                           <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
//                           Tồn đọng ({pendingList.length})
//                         </h4>
//                         <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
//                           {pendingList.length === 0 ? (
//                             <p className="text-sm text-slate-400 italic text-center py-4">Không có task tồn đọng!</p>
//                           ) : (
//                             pendingList.map(task => (
//                               <div key={task.id} className="bg-orange-50/50 p-3 rounded-xl border border-orange-100">
//                                 <p className="text-sm font-bold text-slate-800">{task.text}</p>
//                                 <p className="text-[10px] text-slate-500 mt-1">Ngày: {new Date(task.date).toLocaleDateString('vi-VN')}</p>
//                               </div>
//                             ))
//                           )}
//                         </div>
//                       </div>

//                       {/* Cột Hoàn thành */}
//                       <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
//                         <h4 className="font-bold text-emerald-600 mb-4 flex items-center gap-2 border-b border-emerald-50 pb-2">
//                           <Check className="w-4 h-4" />
//                           Đã xong ({completedList.length})
//                         </h4>
//                         <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
//                           {completedList.length === 0 ? (
//                             <p className="text-sm text-slate-400 italic text-center py-4">Chưa có task hoàn thành.</p>
//                           ) : (
//                             completedList.map(task => (
//                               <div key={task.id} className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
//                                 <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
//                                 <div>
//                                   <p className="text-sm font-bold text-emerald-900">{task.text}</p>
//                                   <p className="text-[10px] text-emerald-600/80 mt-1">Ngày: {new Date(task.date).toLocaleDateString('vi-VN')}</p>
//                                 </div>
//                               </div>
//                             ))
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })()}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       {/* ========================================= */}
//       {/* Sidebar */}
//       <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col justify-between flex-shrink-0 z-10 overflow-y-auto">
//         <div className="space-y-8">
//           <div>
//             <div className="flex gap-2 mb-2">
//               <button 
//                 onClick={() => setViewMode('habits')}
//                 className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${
//                   viewMode === 'habits' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
//                 }`}
//               >
//                 <ListTodo className="w-5 h-5" />
//                 <span className="hidden sm:inline">Habits</span>
//               </button>
//               <button 
//                 onClick={() => setViewMode('tasks')}
//                 className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${
//                   viewMode === 'tasks' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
//                 }`}
//               >
//                 <ClipboardList className="w-5 h-5" />
//                 <span className="hidden sm:inline">Tasks</span>
//               </button>
//             </div>
//             <h1 className="text-2xl font-bold text-slate-900">Habit<span className="text-emerald-500">Tracker</span></h1>
//             <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Binary Tracking System</p>
//           </div>

//           <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
//             <div className="flex items-center justify-between mb-3">
//               <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ListTodo className="w-3.5 h-3.5" /> Chủ đề theo dõi</label>
//               <button onClick={() => setIsEditingHabits(!isEditingHabits)} className={`p-1 rounded-md ${isEditingHabits ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-200'}`}>
//                 {isEditingHabits ? <Check className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
//               </button>
//             </div>
//             {isEditingHabits ? (
//               <div className="space-y-2">
//                 {habits.map(habit => (
//                   <div key={habit.id} className="flex gap-2">
//                     <input type="text" value={habit.name} onChange={(e) => handleUpdateHabit(habit.id, e.target.value)} className="flex-1 bg-white border rounded-lg px-2 py-1 text-sm" />
//                     <button onClick={() => handleRemoveHabit(habit.id)} disabled={habits.length <= 1} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
//                   </div>
//                 ))}
//                 <button onClick={handleAddHabit} className="w-full py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> Thêm chủ đề</button>
//               </div>
//             ) : (
//               <select value={activeHabitId} onChange={(e) => setActiveHabitId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 font-semibold cursor-pointer">
//                 {habits.map(habit => <option key={habit.id} value={habit.id}>{habit.name}</option>)}
//               </select>
//             )}
//           </section>

//           <section>
//             <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Trạng thái đánh dấu</label>
//             <div className="space-y-3">
//               {legend.map(item => (
//                 <button key={item.id} onClick={() => setActiveColorId(item.id)} className={`w-full flex items-center p-3 rounded-xl border transition-all ${activeColorId === item.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-100 bg-slate-50'}`}>
//                   <div className="w-4 h-4 rounded shadow-sm mr-3" style={{ backgroundColor: item.color }} />
//                   <span className={`text-sm ${activeColorId === item.id ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{item.label}</span>
//                 </button>
//               ))}
//             </div>
//           </section>
//         </div>
//       </aside>

//       {/* Main Container */}
//       {/* <main className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-start overflow-y-auto bg-slate-50">
//         <div className="w-full max-w-lg flex flex-col pt-8 lg:pt-auto pb-16 my-auto"> */}
//        {/* Main Container */}
//       <main className={`flex-1 p-4 lg:p-8 flex flex-col justify-start overflow-y-auto bg-slate-50 ${viewMode === 'habits' ? 'items-center' : ''}`}>
//         <div className={`w-full flex flex-col pt-8 lg:pt-auto pb-16 my-auto ${viewMode === 'habits' ? 'max-w-lg' : 'max-w-full'}`}>
//           <header className="w-full flex justify-between items-end mb-6">
//             <div className="flex flex-col">
//               <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{todayStr}</span>
//               <h2 className="text-2xl lg:text-3xl font-black text-slate-900">{MONTHS[month]} {year}</h2>
//               <p className="text-sm font-medium text-slate-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{habits.find(h => h.id === activeHabitId)?.name}</span></p>
//             </div>
//             <div className="flex gap-2">
//               <button onClick={() => setShowOverview(true)} className="flex items-center gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm font-semibold text-sm mr-1"><BarChart3 className="w-5 h-5" /><span className="hidden lg:inline">Tổng quan</span></button>
//               <button onClick={handlePrevMonth} className="p-2 border rounded-lg bg-white"><ChevronLeft className="w-5 h-5" /></button>
//               <button onClick={handleToday} className="hidden sm:block px-3 py-1.5 text-sm font-medium rounded-lg bg-white border">Hôm nay</button>
//               <button onClick={handleNextMonth} className="p-2 border rounded-lg bg-white"><ChevronRight className="w-5 h-5" /></button>
//             </div>
//           </header>

//           {/* View: Habits */}
//           {viewMode === 'habits' && (
//             <div className="p-4 lg:p-5 bg-white rounded-2xl shadow-xl border">
//               <div className="grid grid-cols-7 gap-2 mb-2">
//                 {WEEKDAYS.map(wd => <div key={wd} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{wd}</div>)}
//               </div>
//               <div className="grid grid-cols-7 gap-2">
//                 {calendarCells.map((day, idx) => {
//                   if (day === null) return <div key={`empty-${idx}`} className="w-full aspect-square opacity-0" />;
//                   const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
//                   const colorId = currentHabitData[dateKey];
//                   const item = legend.find(l => l.id === colorId);
//                   const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
//                   return (
//                     <button key={dateKey} onClick={() => onDayClick(day)} className="relative w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all" style={item ? { backgroundColor: item.color, color: getTextColor(item.color) } : { backgroundColor: '#E2E8F0', color: '#64748b' }}>
//                       {day}
//                       {isToday && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* View: Tasks */}
//           {/* View: Tasks */}
//           {viewMode === 'tasks' && (
//             <div className="space-y-5 w-full">
//               {/* === BẢNG THỐNG KÊ DASHBOARD (MỚI) === */}
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="grid grid-cols-1 sm:grid-cols-2 gap-4"
//               >
//                 {/* 7 Ngày */}
//                 {/* <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center"> */}
//                 <div 
//                   onClick={() => setShowTaskDetailModal('week')}
//                   className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all"
//                 >
//                   <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 7 ngày qua</h4>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-1">
//                       <div className="flex justify-between items-end mb-1">
//                         <span className="text-2xl font-black text-emerald-600">{taskStats.week.completed}</span>
//                         <span className="text-xs font-semibold text-slate-400">Đã xong</span>
//                       </div>
//                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.completed / taskStats.week.total) * 100 : 0}%` }} />
//                       </div>
//                     </div>
//                     <div className="w-px h-10 bg-slate-200"></div>
//                     <div className="flex-1">
//                       <div className="flex justify-between items-end mb-1">
//                         <span className="text-2xl font-black text-orange-500">{taskStats.week.pending}</span>
//                         <span className="text-xs font-semibold text-slate-400">Tồn đọng</span>
//                       </div>
//                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.pending / taskStats.week.total) * 100 : 0}%` }} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* 30 Ngày */}
//                 {/* <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center"> */}
//                 {/* 30 Ngày */}
//                 <div 
//                   onClick={() => setShowTaskDetailModal('month')}
//                   className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all"
//                 >
//                   <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 30 ngày qua</h4>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-1">
//                       <div className="flex justify-between items-end mb-1">
//                         <span className="text-2xl font-black text-emerald-600">{taskStats.month.completed}</span>
//                         <span className="text-xs font-semibold text-slate-400">Đã xong</span>
//                       </div>
//                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.completed / taskStats.month.total) * 100 : 0}%` }} />
//                       </div>
//                     </div>
//                     <div className="w-px h-10 bg-slate-200"></div>
//                     <div className="flex-1">
//                       <div className="flex justify-between items-end mb-1">
//                         <span className="text-2xl font-black text-orange-500">{taskStats.month.pending}</span>
//                         <span className="text-xs font-semibold text-slate-400">Tồn đọng</span>
//                       </div>
//                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.pending / taskStats.month.total) * 100 : 0}%` }} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//               {/* ======================================= */}
//               {/* Today Tasks */}
//               <motion.div 
                 
//                 className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-xl rounded-2xl p-5 lg:p-6 shadow-xl border border-emerald-200/50"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//               >
//                 {/* <h3 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
//                   <ClipboardList className="w-7 h-7 drop-shadow-md" />
//                   TASKS: {viewDate.toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})}
//                 </h3> */}
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
//   <h3 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2 m-0">
//     <ClipboardList className="w-7 h-7 drop-shadow-md text-emerald-600" />
//     Tasks ngày {viewDate.toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})}
//   </h3>
//   <div className="flex gap-2 shrink-0">
//     <button onClick={handlePrevDay} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Ngày hôm trước">
//       <ChevronLeft className="w-5 h-5" />
//     </button>
//     <button onClick={handleTodayTask} className="px-3 py-1.5 text-sm font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
//       Hôm nay
//     </button>
//     <button onClick={handleNextDay} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Ngày hôm sau">
//       <ChevronRight className="w-5 h-5" />
//     </button>
//   </div>
// </div>
//                 {/* Add Task */}
//                 <div className="flex gap-3 mb-6">
//                   <input
//                     type="text"
//                     placeholder="Nhập task mới (Enter để thêm)..."
//                     onKeyDown={(e) => {
//                       if (e.key === 'Enter') {
//                         const target = e.target as HTMLInputElement;
//                         addTodayTask(target.value);
//                         target.value = '';
//                       }
//                     }}
//                     className="flex-1 bg-white/80 border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 ring-emerald-400/30 focus:border-emerald-400 font-medium text-base placeholder-slate-400 transition-all hover:shadow-md"
//                   />
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     whileTap={{ scale: 0.95 }}
//                     onClick={() => {
//                       const input = document.querySelector('input[placeholder*="Nhập task"]') as HTMLInputElement;
//                       if (input?.value) {
//                         addTodayTask(input.value);
//                         input.value = '';
//                       }
//                     }}
//                     className="w-12 h-12 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg text-white rounded-xl flex items-center justify-center transition-all"
//                   >
//                     <Plus className="w-6 h-6" />
//                   </motion.button>
//                 </div>

//                 {/* Pending Tasks */}
//                 {/* <section>
//                   <h4 className="font-black text-lg text-slate-800 mb-3 flex items-center gap-2">
//                     <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center">
//                       <div className="w-2 h-2 bg-white rounded-full animate-ping" />
//                     </div>
//                     Chưa hoàn thành ({viewDayTasks.pending.length})
//                   </h4>
//                   <AnimatePresence>
//                     {viewDayTasks.pending.length ? (
//                       viewDayTasks.pending.map(task => (
//                         <motion.div
//                           layout
//                           key={task.id}
//                           initial={{ opacity: 0, x: 20, scale: 0.95 }}
//                           animate={{ opacity: 1, x: 0, scale: 1 }}
//                           exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
//                           className="group bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all duration-300 mb-3 relative overflow-hidden"
//                           onClick={() => toggleTaskAction(task.id)}
//                         >
//                           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -skew-x-12 group-hover:animate-slide-right opacity-0 group-hover:opacity-100 transition-all duration-500" />
//                           <div className="flex items-center gap-4 relative z-10">
//                             <motion.div 
//                               className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center group-hover:bg-emerald-500 transition-all"
//                               whileHover={{ rotate: 180, scale: 1.1 }}
//                             >
//                               <Check className="w-5 h-5 text-white opacity-20 group-hover:opacity-100" />
//                             </motion.div>
//                             <div className="flex-1">
//                               <p className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 mb-1">{task.text}</p>
//                               {task.dateAdded && (
//                                 <p className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
//                                   Thêm {new Date(task.dateAdded).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         </motion.div>
//                       ))
//                     ) : (
//                       <motion.div 
//                         initial={{ opacity: 0, scale: 0.9 }} 
//                         animate={{ opacity: 1, scale: 1 }} 
//                         className="text-center py-8 bg-gradient-to-b from-orange-50/50 to-yellow-50/50 rounded-xl border border-dashed border-orange-200 p-6"
//                       >
//                         <ClipboardList className="w-12 h-12 mx-auto mb-3 text-orange-400 opacity-50" />
//                         <h4 className="text-lg font-bold text-slate-600 mb-1">Chưa có task!</h4>
//                         <p className="text-sm text-slate-500">Ngày này đã hoàn hảo 🎉</p>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </section> */}
// {/* Pending Tasks */}
//                 <section>
//                   <h4 className="font-black text-lg text-slate-800 mb-3 flex items-center gap-2">
//                     <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center">
//                       <div className="w-2 h-2 bg-white rounded-full animate-ping" />
//                     </div>
//                     Chưa hoàn thành ({viewDayTasks.pending.length})
//                   </h4>
//                   <AnimatePresence>
//                     {viewDayTasks.pending.length ? (
//                       viewDayTasks.pending.map(task => (
//                         <motion.div
                          
//                           key={task.id}
//                           initial={{ opacity: 0, x: 20, scale: 0.95 }}
//                           animate={{ opacity: 1, x: 0, scale: 1 }}
//                           exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
//                           className="group bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all duration-300 mb-3 relative overflow-hidden flex items-center justify-between"
//                           onClick={() => { if (editingTaskId !== task.id) toggleTaskAction(task.id); }}
//                         >
//                           <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -skew-x-12 group-hover:animate-slide-right opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
//                           <div className="flex items-center gap-4 relative z-10 flex-1 overflow-hidden">
//                             <motion.div 
//                               className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center group-hover:bg-emerald-500 transition-all"
//                               whileHover={{ rotate: 180, scale: 1.1 }}
//                             >
//                               <Check className="w-5 h-5 text-white opacity-20 group-hover:opacity-100" />
//                             </motion.div>
                            
//                             <div className="flex-1" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
//                               {editingTaskId === task.id ? (
//                                 <div className="flex items-center gap-2 pr-2">
//                                   <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold text-slate-800 shadow-inner" />
//                                   <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-sm"><Check className="w-4 h-4" /></button>
//                                   <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"><X className="w-4 h-4" /></button>
//                                 </div>
//                               ) : (
//                                 <>
//                                   <p className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 mb-1 truncate">{task.text}</p>
//                                   {task.dateAdded && <p className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">Thêm {new Date(task.dateAdded).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</p>}
//                                 </>
//                               )}
//                             </div>
//                           </div>
                          
//                           {/* KHU VỰC NÚT SỬA/XOÁ */}
//                           {editingTaskId !== task.id && (
//                             <div className="relative z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity ml-2">
//                               <button onClick={(e) => { e.stopPropagation(); handleStartEdit(task); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg shadow-sm transition-colors" title="Sửa task"><Edit2 className="w-4 h-4" /></button>
//                               <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg shadow-sm transition-colors" title="Xoá task"><Trash2 className="w-4 h-4" /></button>
//                             </div>
//                           )}
//                         </motion.div>
//                       ))
//                     ) : (
//                       <motion.div 
//                         initial={{ opacity: 0, scale: 0.9 }} 
//                         animate={{ opacity: 1, scale: 1 }} 
//                         className="text-center py-8 bg-gradient-to-b from-orange-50/50 to-yellow-50/50 rounded-xl border border-dashed border-orange-200 p-6"
//                       >
//                         <ClipboardList className="w-12 h-12 mx-auto mb-3 text-orange-400 opacity-50" />
//                         <h4 className="text-lg font-bold text-slate-600 mb-1">Chưa có task!</h4>
//                         <p className="text-sm text-slate-500">Ngày này đã hoàn hảo 🎉</p>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </section>
//                 {/* Completed Tasks */}
//                 {/* {viewDayTasks.completed.length > 0 && (
//                   <motion.section 
//                     initial={{ opacity: 0, height: 0 }} 
//                     animate={{ opacity: 1, height: 'auto' }}
//                   >
//                     <h4 className="font-black text-lg text-emerald-700 mb-3 flex items-center gap-2 mt-6">
//                       <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center animate-pulse">
//                         <Check className="w-3.5 h-3.5 text-white" />
//                       </div>
//                       Hoàn thành ({viewDayTasks.completed.length})
//                     </h4>
//                       <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
//                       {viewDayTasks.completed.map(task => (
//                         <motion.div 
//                           key={task.id}
//                           className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 shadow-sm hover:shadow transition-all"
//                         >
//                           <div className="w-9 h-9 shrink-0 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
//                             <Check className="w-5 h-5 text-white" />
//                           </div>
//                           <div className="flex-1">
//                             <p className="font-semibold text-sm text-emerald-800 line-clamp-1">{task.text}</p>
//                             <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
//                               ✓ {new Date(task.dateAdded || viewDateKey).toLocaleString('vi-VN', { 
//                                 day: 'numeric', 
//                                 month: 'short', 
//                                 hour: '2-digit', 
//                                 minute: '2-digit' 
//                               })}
//                             </p>
//                           </div>
//                         </motion.div>
//                       ))}
//                     </div>
//                   </motion.section>
//                 )} */}
//                 {/* Completed Tasks */}
//                 {viewDayTasks.completed.length > 0 && (
//                   <motion.section 
//                     initial={{ opacity: 0, height: 0 }} 
//                     animate={{ opacity: 1, height: 'auto' }}
//                   >
//                     <h4 className="font-black text-lg text-emerald-700 mb-3 flex items-center gap-2 mt-6">
//                       <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center animate-pulse">
//                         <Check className="w-3.5 h-3.5 text-white" />
//                       </div>
//                       Hoàn thành ({viewDayTasks.completed.length})
//                     </h4>
//                     <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
//                       {viewDayTasks.completed.map(task => (
//                         <motion.div 
//                           key={task.id}
//                           className="group flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 shadow-sm hover:shadow transition-all relative overflow-hidden cursor-pointer"
//                           onClick={() => { if (editingTaskId !== task.id) toggleTaskAction(task.id); }}
//                         >
//                           <div className="w-9 h-9 shrink-0 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm relative z-10">
//                             <Check className="w-5 h-5 text-white" />
//                           </div>
                          
//                           <div className="flex-1 relative z-10 overflow-hidden" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
//                             {editingTaskId === task.id ? (
//                               <div className="flex items-center gap-2 pr-2">
//                                 <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-2 py-1.5 focus:outline-none text-sm font-semibold text-slate-800" />
//                                 <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white rounded-md shadow-sm border border-emerald-200"><Check className="w-4 h-4" /></button>
//                                 <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white rounded-md shadow-sm border border-slate-200"><X className="w-4 h-4" /></button>
//                               </div>
//                             ) : (
//                               <>
//                                 <p className="font-semibold text-sm text-emerald-800 truncate">{task.text}</p>
//                                 <p className="text-[10px] text-emerald-600 font-medium mt-0.5">✓ {new Date(task.dateAdded || viewDateKey).toLocaleString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
//                               </>
//                             )}
//                           </div>
                          
//                           {/* KHU VỰC NÚT SỬA/XOÁ */}
//                           {editingTaskId !== task.id && (
//                             <div className="relative z-10 opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity ml-2">
//                               <button onClick={(e) => { e.stopPropagation(); handleStartEdit(task); }} className="p-1.5 text-emerald-600/60 hover:text-blue-600 hover:bg-white rounded-lg transition-colors" title="Sửa task"><Edit2 className="w-4 h-4" /></button>
//                               <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-emerald-600/60 hover:text-red-500 hover:bg-white rounded-lg transition-colors" title="Xoá task"><Trash2 className="w-4 h-4" /></button>
//                             </div>
//                           )}
//                         </motion.div>
//                       ))}
//                     </div>
//                   </motion.section>
//                 )}
//               </motion.div>

//               {/* Past Days Quick View */}
//               {pastDays.length > 0 && (
//                 <motion.section 
//                   className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 p-5 lg:p-6"
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                 >
//                   <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
//                     📜 Tasks các ngày trước
//                   </h4>
//                   {/* Chỉnh lại thành 3 cột (lg:grid-cols-3) vì đã kéo giãn chiều ngang */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
//                     {pastDays.slice(0, 6).map(date => {
//                       const dayTasks = dailyTasks[date] || { pending: [], completed: [] };
//                       return (
//                         <motion.button
//                           key={date}
                          
//                           whileHover={{ scale: 1.02, y: -2 }}
//                           className="group bg-gradient-to-br from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-teal-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all relative overflow-hidden text-left"
//                           onClick={() => setViewDate(new Date(date))}
//                         >
//                           <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all" />
//                           <div className="relative z-10">
//                             <p className="font-bold text-slate-800 text-base mb-1.5">
//                               {new Date(date).toLocaleDateString('vi-VN', { 
//                                 weekday: 'short', 
//                                 day: 'numeric', 
//                                 month: 'short' 
//                               })}
//                             </p>
//                             <div className="flex items-center gap-4 text-xs">
//                               <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
//                                 <div className="w-2.5 h-2.5 bg-orange-400 rounded-full" />
//                                 {dayTasks.pending.length}
//                               </div>
//                               <div className="flex items-center gap-1 text-emerald-600 font-semibold">
//                                 <Check className="w-3.5 h-3.5" />
//                                 {dayTasks.completed.length}
//                               </div>
//                             </div>
//                             {dayTasks.pending.length > 0 && (
//                               <div className="mt-3 pt-3 border-t border-slate-200">
//                                 {dayTasks.pending.slice(0, 2).map(task => (
//                                   <p key={task.id} className="text-[11px] text-slate-700 line-clamp-1 bg-orange-100/70 px-2 py-0.5 rounded-md mb-1 font-medium inline-block mr-1">
//                                     {task.text}
//                                   </p>
//                                 ))}
//                                 {dayTasks.pending.length > 2 && (
//                                   <p className="text-[10px] text-slate-500 block mt-0.5">+{dayTasks.pending.length - 2} nữa...</p>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         </motion.button>
//                       );
//                     })}
//                   </div>
//                 </motion.section>
//               )}
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Settings, Plus, Trash2, Check, History, ListTodo, BarChart3, Download, X, ClipboardList, Edit2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

interface DailyTask {
  id: string;
  text: string;
  dateAdded?: string; 
}

type DailyTasksData = Record<string, {
  pending: DailyTask[];
  completed: DailyTask[];
}>;

interface LegendItem { id: string; color: string; label: string; }
interface Habit { id: string; name: string; }
type MultiTrackedData = Record<string, Record<string, string>>;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function addTask(tasks: DailyTasksData, dateKey: string, text: string): DailyTasksData {
  const newId = Date.now().toString();
  const newTask: DailyTask = { id: newId, text, dateAdded: new Date().toISOString() };
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

  const newData = { ...tasks, [dateKey]: { pending, completed } };
  if (pending.length === 0 && completed.length === 0) {
    const { [dateKey]: _, ...rest } = newData;
    return rest;
  }
  return newData;
}

function removeTask(tasks: DailyTasksData, dateKey: string, taskId: string): DailyTasksData {
  const dateData = tasks[dateKey];
  if (!dateData) return tasks;

  const pending = dateData.pending.filter(t => t.id !== taskId);
  const completed = dateData.completed.filter(t => t.id !== taskId);

  const newData = { ...tasks, [dateKey]: { pending, completed } };
  if (pending.length === 0 && completed.length === 0) {
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

function getPastDays(tasks: DailyTasksData, limit: number = 30): string[] {
  return Object.keys(tasks).sort((a, b) => b.localeCompare(a)).slice(1, limit + 1);
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn("Lỗi khi đọc từ localStorage:", error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn("Lỗi khi lưu vào localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}

function getTextColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#1e293b' : '#ffffff';
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// ---------------------------------------------------------------------------
// Main Application Component
// ---------------------------------------------------------------------------

export default function App() {
  // === 1. Local Storage States ===
  const [dailyTasks, setDailyTasks] = useLocalStorage<DailyTasksData>('habit-tracker-daily-tasks', {});
  const [legend, setLegend] = useLocalStorage<LegendItem[]>('activity-tracker-legend', [
    { id: '1', color: '#22c55e', label: 'Hoàn thành' },
    { id: '2', color: '#ef4444', label: 'Không hoàn thành' }
  ]);
  const [habits, setHabits] = useLocalStorage<Habit[]>('activity-tracker-habits', [
    { id: '1', name: 'Học từ vựng TOEIC' },
    { id: '2', name: 'Tập Gym / Thể thao' },
    { id: '3', name: 'Code dự án cá nhân' }
  ]);
  const [trackedData, setTrackedData] = useLocalStorage<MultiTrackedData>('activity-tracker-multi-data', {});

  // === 2. UI States ===
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

  const onDayClick = (day: number) => {
    if (isEditingHabits || !activeHabitId) return;
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTrackedData(prev => {
      const next = { ...prev };
      if (!next[activeHabitId]) next[activeHabitId] = {};
      if (next[activeHabitId][dateKey] === activeColorId) delete next[activeHabitId][dateKey];
      else next[activeHabitId][dateKey] = activeColorId;
      return next;
    });
  };

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

  const addTodayTask = (text: string) => {
    if (!text.trim()) return;
    setDailyTasks(addTask(dailyTasks, todayKey, text.trim()));
  };

  const toggleTaskAction = (taskId: string) => {
    setDailyTasks(toggleTask(dailyTasks, viewDateKey, taskId));
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Bạn có chắc muốn xoá task này?')) {
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
                      {[daysInMonth, Math.round(daysInMonth*0.5), 0].map((val, i) => (
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
                                  <motion.div initial={{ height: 0 }} animate={{ height: `${hPercent}%` }} transition={{ duration: 0.8, delay: 0.1*sIdx }} className="w-full rounded-t-md relative" style={{ backgroundColor: status.color }} />
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
                                <p className="text-sm font-bold text-slate-800">{task.text}</p>
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
                                <div>
                                  <p className="text-sm font-bold text-emerald-900">{task.text}</p>
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

      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col justify-between flex-shrink-0 z-10 overflow-y-auto">
        <div className="space-y-8">
          <div>
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => setViewMode('habits')}
                className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${
                  viewMode === 'habits' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ListTodo className="w-5 h-5" />
                <span className="hidden sm:inline">Habits</span>
              </button>
              <button 
                onClick={() => setViewMode('tasks')}
                className={`flex items-center gap-2 p-2 rounded-xl font-bold transition-all ${
                  viewMode === 'tasks' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
      </aside>

      {/* Main Container */}
      <main className={`flex-1 p-4 lg:p-8 flex flex-col justify-start overflow-y-auto bg-slate-50 ${viewMode === 'habits' ? 'items-center' : ''}`}>
        <div className={`w-full flex flex-col pt-8 lg:pt-auto pb-16 my-auto ${viewMode === 'habits' ? 'max-w-lg' : 'max-w-full'}`}>
          <header className="w-full flex justify-between items-end mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{todayStr}</span>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900">{MONTHS[month]} {year}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Đang xem: <span className="text-emerald-600 font-bold">{habits.find(h => h.id === activeHabitId)?.name}</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowOverview(true)} className="flex items-center gap-1.5 p-2 lg:px-3 lg:py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm font-semibold text-sm mr-1"><BarChart3 className="w-5 h-5" /><span className="hidden lg:inline">Tổng quan</span></button>
              <button onClick={handlePrevMonth} className="p-2 border rounded-lg bg-white transition-transform hover:scale-95"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={handleToday} className="hidden sm:block px-3 py-1.5 text-sm font-medium rounded-lg bg-white border transition-transform hover:scale-95">Hôm nay</button>
              <button onClick={handleNextMonth} className="p-2 border rounded-lg bg-white transition-transform hover:scale-95"><ChevronRight className="w-5 h-5" /></button>
            </div>
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
                  const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const colorId = currentHabitData[dateKey];
                  const item = legend.find(l => l.id === colorId);
                  const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                  return (
                    <button 
                      key={dateKey} 
                      onClick={() => onDayClick(day)} 
                      className="relative w-full h-14 sm:h-16 rounded-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-95 active:scale-90" 
                      style={item ? { backgroundColor: item.color, color: getTextColor(item.color) } : { backgroundColor: '#E2E8F0', color: '#64748b' }}
                    >
                      {day}
                      {isToday && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View: Tasks */}
          {viewMode === 'tasks' && (
            <div className="space-y-5 w-full">
              {/* === BẢNG THỐNG KÊ DASHBOARD === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 7 Ngày */}
                <div 
                  onClick={() => setShowTaskDetailModal('week')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all"
                >
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 7 ngày qua</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-2xl font-black text-emerald-600">{taskStats.week.completed}</span>
                        <span className="text-xs font-semibold text-slate-400">Đã xong</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.completed / taskStats.week.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-2xl font-black text-orange-500">{taskStats.week.pending}</span>
                        <span className="text-xs font-semibold text-slate-400">Tồn đọng</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.week.total ? (taskStats.week.pending / taskStats.week.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 30 Ngày */}
                <div 
                  onClick={() => setShowTaskDetailModal('month')}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xl flex flex-col justify-center cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-300 transition-all"
                >
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Thống kê 30 ngày qua</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-2xl font-black text-emerald-600">{taskStats.month.completed}</span>
                        <span className="text-xs font-semibold text-slate-400">Đã xong</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.completed / taskStats.month.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-2xl font-black text-orange-500">{taskStats.month.pending}</span>
                        <span className="text-xs font-semibold text-slate-400">Tồn đọng</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-400 rounded-full transition-all duration-500" style={{ width: `${taskStats.month.total ? (taskStats.month.pending / taskStats.month.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today Tasks */}
              <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 rounded-2xl p-5 lg:p-6 shadow-xl border border-emerald-200/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2 m-0">
                    <ClipboardList className="w-7 h-7 drop-shadow-md text-emerald-600" />
                    Tasks ngày {viewDate.toLocaleDateString('vi-VN', {weekday: 'long', day: 'numeric', month: 'long'})}
                  </h3>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={handlePrevDay} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Ngày hôm trước">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleTodayTask} className="px-3 py-1.5 text-sm font-bold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
                      Hôm nay
                    </button>
                    <button onClick={handleNextDay} className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors" title="Ngày hôm sau">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Add Task Input */}
                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Nhập task mới (Enter để thêm)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        addTodayTask(target.value);
                        target.value = '';
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 ring-emerald-400/30 focus:border-emerald-400 font-medium text-base placeholder-slate-400 transition-shadow hover:shadow-md"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Nhập task"]') as HTMLInputElement;
                      if (input?.value) {
                        addTodayTask(input.value);
                        input.value = '';
                      }
                    }}
                    className="w-12 h-12 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md hover:shadow-lg text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Pending Tasks Section */}
                <section>
                  <h4 className="font-black text-lg text-slate-800 mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    </div>
                    Chưa hoàn thành ({viewDayTasks.pending.length})
                  </h4>
                  {viewDayTasks.pending.length ? (
                    <div className="space-y-3">
                      {viewDayTasks.pending.map(task => (
                        <div
                          key={task.id}
                          className="group bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all duration-300 relative flex items-center justify-between"
                          onClick={() => { if (editingTaskId !== task.id) toggleTaskAction(task.id); }}
                        >
                          <div className="flex items-center gap-4 relative z-10 flex-1 overflow-hidden">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg shadow-sm flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                              <Check className="w-5 h-5 text-white opacity-20 group-hover:opacity-100" />
                            </div>
                            
                            <div className="flex-1" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
                              {editingTaskId === task.id ? (
                                <div className="flex items-center gap-2 pr-2">
                                  <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm font-semibold text-slate-800 shadow-inner" />
                                  <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-sm"><Check className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-base font-bold text-slate-900 leading-snug group-hover:text-emerald-700 mb-1 truncate">{task.text}</p>
                                  {task.dateAdded && <p className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">Thêm {new Date(task.dateAdded).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}</p>}
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gradient-to-b from-orange-50/50 to-yellow-50/50 rounded-xl border border-dashed border-orange-200 p-6">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 text-orange-400 opacity-50" />
                      <h4 className="text-lg font-bold text-slate-600 mb-1">Chưa có task!</h4>
                      <p className="text-sm text-slate-500">Ngày này đã hoàn hảo 🎉</p>
                    </div>
                  )}
                </section>

                {/* Completed Tasks Section */}
                {viewDayTasks.completed.length > 0 && (
                  <section className="mt-6">
                    <h4 className="font-black text-lg text-emerald-700 mb-3 flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                      Hoàn thành ({viewDayTasks.completed.length})
                    </h4>
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {viewDayTasks.completed.map(task => (
                        <div 
                          key={task.id}
                          className="group flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 shadow-sm hover:shadow transition-all relative overflow-hidden cursor-pointer"
                          onClick={() => { if (editingTaskId !== task.id) toggleTaskAction(task.id); }}
                        >
                          <div className="w-9 h-9 shrink-0 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm relative z-10">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 relative z-10 overflow-hidden" onClick={(e) => { if (editingTaskId === task.id) e.stopPropagation(); }}>
                            {editingTaskId === task.id ? (
                              <div className="flex items-center gap-2 pr-2">
                                <input autoFocus value={editTaskText} onChange={(e) => setEditTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); if (e.key === 'Escape') setEditingTaskId(null); }} className="flex-1 bg-white border border-emerald-400 rounded-lg px-2 py-1.5 focus:outline-none text-sm font-semibold text-slate-800" />
                                <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="p-1.5 text-emerald-600 bg-white rounded-md shadow-sm border border-emerald-200"><Check className="w-4 h-4" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingTaskId(null); }} className="p-1.5 text-slate-500 bg-white rounded-md shadow-sm border border-slate-200"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <>
                                <p className="font-semibold text-sm text-emerald-800 truncate">{task.text}</p>
                                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">✓ {new Date(task.dateAdded || viewDateKey).toLocaleString('vi-VN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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