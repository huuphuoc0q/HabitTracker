import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Settings, Plus, Trash2, Check, Pickaxe, MousePointerClick, History } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  return yiq >= 128 ? '#1e293b' : '#ffffff'; // slate-800 for light bg, white for dark bg
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

interface LegendItem {
  id: string;
  color: string;
  label: string;
}

type TrackedData = Record<string, string>; // 'YYYY-MM-DD' -> legendId

// ---------------------------------------------------------------------------
// Main Application
// ---------------------------------------------------------------------------

export default function App() {
  // State for Time
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Persisted Data
  const [legend, setLegend] = useLocalStorage<LegendItem[]>('activity-tracker-legend', [
    { id: '1', color: '#22c55e', label: 'Làm được' },
    { id: '2', color: '#ef4444', label: 'Không làm được' }
  ]);
  const [trackedData, setTrackedData] = useLocalStorage<TrackedData>('activity-tracker-data', {});

  // UI State
  const [activeColorId, setActiveColorId] = useState<string>(legend[0]?.id || '');
  const [isEditingLegend, setIsEditingLegend] = useState(false);

  // Month navigation logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToMonth = (y: number, m: number) => {
    setCurrentDate(new Date(y, m, 1));
  };

  // Ensure an active color is always selected if legend exists
  useEffect(() => {
    if (legend.length > 0 && !legend.find(l => l.id === activeColorId)) {
      setActiveColorId(legend[0].id);
    }
  }, [legend, activeColorId]);

  // Calendar Calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prefixDays = firstDay === 0 ? 6 : firstDay - 1; // Make Mon=0, Sun=6

  const calendarCells = [];
  for (let i = 0; i < prefixDays; i++) {
    calendarCells.push(null); // Empty offsets
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  const totalCells = calendarCells.length;
  const suffixDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < suffixDays; i++) {
    calendarCells.push(null);
  }

  // Handle Day Click
  const onDayClick = (day: number) => {
    if (!activeColorId || isEditingLegend) return;
    
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setTrackedData(prev => {
      const next = { ...prev };
      // Toggle off if clicking with same color
      if (next[dateKey] === activeColorId) {
        delete next[dateKey];
      } else {
        next[dateKey] = activeColorId;
      }
      return next;
    });
  };

  // Legend Editing Functions
  const handleAddLegendItem = () => {
    setLegend([
      ...legend,
      { id: Date.now().toString(), color: '#3b82f6', label: 'Trạng thái mới' }
    ]);
  };

  const handleUpdateLegend = (id: string, updates: Partial<LegendItem>) => {
    setLegend(legend.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveLegendItem = (id: string) => {
    if (legend.length <= 1) return; // Prevent deleting the last one
    
    // Clean up tracked data that used this legend
    const newData = { ...trackedData };
    Object.keys(newData).forEach(key => {
      if (newData[key] === id) {
        delete newData[key];
      }
    });
    setTrackedData(newData);
    setLegend(legend.filter(item => item.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Renderers & UI Logic
  // ---------------------------------------------------------------------------

  const activeDaysThisMonth = Object.keys(trackedData).filter(k => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;
  const consistencyPercent = Math.round((activeDaysThisMonth / daysInMonth) * 100) || 0;
  const totalActiveDays = Object.keys(trackedData).length;

  const todayStr = `Hôm nay: Thứ ${new Date().getDay() === 0 ? 'CN' : new Date().getDay() + 1}, ${new Date().getDate()} Tháng ${new Date().getMonth() + 1}, ${new Date().getFullYear()}`;

  // Analyze historical data
  const historyData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(trackedData).forEach(key => {
      const ym = key.substring(0, 7); // YYYY-MM
      counts[ym] = (counts[ym] || 0) + 1;
    });
    // Sort descending
    return Object.entries(counts).sort((a, b) => b[0].localeCompare(a[0]));
  }, [trackedData]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 lg:p-8 flex flex-col justify-between flex-shrink-0 z-10 lg:shadow-[10px_0_30px_-10px_rgba(0,0,0,0.05)] overflow-y-auto">
        <div className="space-y-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Habit<span className="text-emerald-500">Tracker</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Monthly Progress System
            </p>
          </div>

          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block m-0">
                Legend & Customization
              </label>
              <button
                onClick={() => setIsEditingLegend(!isEditingLegend)}
                className={`p-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isEditingLegend 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Cài đặt"
              >
                {isEditingLegend ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {isEditingLegend ? (
                  <motion.div 
                    key="edit-mode"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded text-center border border-slate-100">
                      Tùy chỉnh màu sắc và ý nghĩa của chúng cho bảng theo dõi.
                    </p>
                    {legend.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-sm cursor-pointer">
                          <input 
                            type="color" 
                            value={item.color}
                            onChange={(e) => handleUpdateLegend(item.id, { color: e.target.value })}
                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={item.label}
                          onChange={(e) => handleUpdateLegend(item.id, { label: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                          placeholder="Nhãn..."
                        />
                        <button 
                          onClick={() => handleRemoveLegendItem(item.id)}
                          disabled={legend.length <= 1}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed shrink-0"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddLegendItem}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom...
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view-mode"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    {legend.map(item => {
                      const isActive = activeColorId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveColorId(item.id)}
                          className={`
                            w-full flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer
                            ${isActive ? 'border-slate-300 bg-white shadow-sm ring-1 ring-slate-200' : 'border-slate-100 bg-slate-50 hover:bg-white'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded shadow-sm" 
                              style={{ backgroundColor: item.color }} 
                            />
                            <span className={`text-sm ${isActive ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                              {item.label}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono hidden sm:block">
                            {item.color.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Hint / Helper text */}
            {!isEditingLegend && (
              <p className="mt-8 text-center text-xs text-slate-400 px-4 mb-8">
                Nhấp lại vào một ô đã tô màu để xóa đánh dấu.
              </p>
            )}

            {/* History Section */}
            {!isEditingLegend && historyData.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Lịch sử theo dõi
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {historyData.map(([ym, count]) => {
                    const [y, m] = ym.split('-');
                    const isCurrentView = parseInt(y) === year && parseInt(m) - 1 === month;
                    return (
                      <button
                        key={ym}
                        onClick={() => navigateToMonth(parseInt(y), parseInt(m) - 1)}
                        className={`w-full flex justify-between items-center p-3 rounded-xl border text-sm transition-colors ${
                          isCurrentView 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>Tháng {parseInt(m)}/{y}</span>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                          {count} ngày
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer info in sidebar */}
        {!isEditingLegend && (
          <div className="bg-slate-900 rounded-2xl p-4 text-white mt-8 hidden lg:block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">Monthly Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-mono text-slate-300">LocalStorage: OK</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-start overflow-y-auto min-h-0 bg-slate-50">
        <div className="w-full max-w-lg flex flex-col pt-8 lg:pt-auto pb-16 lg:pb-8 my-auto">
          
          <header className="w-full flex justify-between items-end mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                {todayStr}
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900">
                {MONTHS[month]} {year}
              </h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="flex items-center gap-1 p-2 lg:px-3 lg:py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-colors text-slate-700 font-medium text-sm"
                title="Tháng trước"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden lg:inline">Tháng trước</span>
              </button>
              <button 
                onClick={handleToday}
                className="hidden sm:block px-3 py-1.5 text-sm font-medium rounded-lg bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-colors text-slate-700"
              >
                Hôm nay
              </button>
              <button 
                onClick={handleNextMonth}
                className="flex items-center gap-1 p-2 lg:px-3 lg:py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 shadow-sm transition-colors text-slate-700 font-medium text-sm"
                title="Tháng sau"
              >
                <span className="hidden lg:inline">Tháng sau</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="p-4 lg:p-5 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="grid grid-cols-7 gap-1.5 lg:gap-2 mb-2">
              {WEEKDAYS.map(wd => (
                <div key={wd} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
                  {wd}
                </div>
              ))}
            </div>

            <motion.div 
              className="grid grid-cols-7 gap-1.5 lg:gap-2"
              key={`${year}-${month}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="w-full aspect-square opacity-0" />;
                }

                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const assignedColorId = trackedData[dateKey];
                const legendItem = legend.find(l => l.id === assignedColorId);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                return (
                  <motion.button
                    key={dateKey}
                    whileHover={{ scale: 0.95 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDayClick(day)}
                    disabled={isEditingLegend}
                    title={`Ngày ${day}`}
                    aria-label={`Ngày ${day}`}
                    className={`
                      relative w-full aspect-square rounded-lg flex items-center justify-center
                      text-sm font-bold transition-all
                      ${isEditingLegend ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
                    style={
                      legendItem 
                      ? { 
                          backgroundColor: legendItem.color, 
                          color: getTextColor(legendItem.color),
                          boxShadow: `0 0 10px ${legendItem.color}40`,
                        } 
                      : {
                          backgroundColor: '#E2E8F0',
                          color: '#64748b' 
                        }
                    }
                  >
                    {isToday && (
                      <div 
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full" 
                        style={{ backgroundColor: legendItem ? (getTextColor(legendItem.color) === '#ffffff' ? '#ffffff' : '#1e293b') : '#3b82f6' }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <footer className="mt-6 flex gap-6 lg:gap-10 justify-center pb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{consistencyPercent}%</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Consistency</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{activeDaysThisMonth}</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Days This Month</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{totalActiveDays}</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1">Total Active</p>
            </div>
          </footer>
        </div>
      </main>

    </div>
  );
}

