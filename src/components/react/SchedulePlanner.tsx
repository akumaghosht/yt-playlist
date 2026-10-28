import React, { useState } from 'react';
import { BookOpen, Check } from 'lucide-react';
import { formatCompactDuration } from '../../utils/youtube';

interface SchedulePlannerProps {
  totalSecondsToWatch: number;
  currentSpeed: number;
}

const formatStudyTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} mins`;
};

const formatTickHour = (h: number): string => {
  if (h === 0.25) return '15m';
  if (h === 0.5) return '30m';
  if (h === 0.75) return '45m';
  if (Number.isInteger(h)) return `${h}h`;
  if ((h * 10) % 5 === 0) return `${h}h`;
  const rounded = Math.round(h * 10) / 10;
  return `${rounded}h`;
};

const formatHoursForInput = (hours: number): string => {
  if (Number.isInteger(hours)) return hours.toString();
  const rounded = Math.round(hours * 100) / 100;
  return rounded.toString();
};

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({
  totalSecondsToWatch,
  currentSpeed,
}) => {
  const [plannerMode, setPlannerMode] = useState<'dailyPace' | 'targetDate'>('dailyPace');
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [timelineMax, setTimelineMax] = useState(4);
  const [customHoursInput, setCustomHoursInput] = useState('0.75');
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  // Target date mode
  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 14);
  const [targetDateStr, setTargetDateStr] = useState(defaultTargetDate.toISOString().split('T')[0]);

  const handleSliderChange = (hours: number) => {
    const clamped = Math.min(timelineMax, Math.max(0.25, hours));
    const newMinutes = Math.round(clamped * 60);
    setDailyMinutes(newMinutes);
    setCustomHoursInput(formatHoursForInput(clamped));
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomHoursInput(valStr);

    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(24, Math.max(0.25, parsed));
      const newMinutes = Math.round(clamped * 60);
      setDailyMinutes(newMinutes);

      if (clamped > 4) {
        setTimelineMax(Math.min(24, Math.ceil(clamped)));
      } else {
        setTimelineMax(4);
      }
    }
  };

  const handleCustomHoursBlur = () => {
    const parsed = parseFloat(customHoursInput);
    if (isNaN(parsed) || parsed <= 0) {
      setCustomHoursInput(formatHoursForInput(dailyMinutes / 60));
    } else {
      const clamped = Math.min(24, Math.max(0.25, parsed));
      setCustomHoursInput(formatHoursForInput(clamped));
      const newMinutes = Math.round(clamped * 60);
      setDailyMinutes(newMinutes);
      if (clamped > 4) {
        setTimelineMax(Math.min(24, Math.ceil(clamped)));
      } else {
        setTimelineMax(4);
      }
    }
  };

  const handleResetTimeline = () => {
    setTimelineMax(4);
    const clamped = Math.min(4, dailyMinutes / 60);
    setDailyMinutes(Math.round(clamped * 60));
    setCustomHoursInput(formatHoursForInput(clamped));
  };

  const calibrationTicks = [
    { label: '15m', hours: 0.25 },
    { label: formatTickHour(timelineMax * 0.25), hours: timelineMax * 0.25 },
    { label: formatTickHour(timelineMax * 0.5), hours: timelineMax * 0.5 },
    { label: formatTickHour(timelineMax * 0.75), hours: timelineMax * 0.75 },
    { label: formatTickHour(timelineMax), hours: timelineMax },
  ];

  // Actual seconds to watch factored by playback speed
  const effectiveSeconds = Math.round(totalSecondsToWatch / currentSpeed);
  const effectiveMinutes = Math.ceil(effectiveSeconds / 60);

  // 1. Calculation for Daily Pace Mode:
  const minutesPerWeek = dailyMinutes * daysPerWeek;
  const totalWeeks = minutesPerWeek > 0 ? effectiveMinutes / minutesPerWeek : 0;
  const totalDays = Math.ceil(totalWeeks * 7);
  const totalSessions = Math.ceil(effectiveMinutes / Math.max(1, dailyMinutes));

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + totalDays);
  const formattedProjectedDate = projectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // 2. Calculation for Target Date Mode:
  const selectedTarget = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = selectedTarget.getTime() - today.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const studyDaysAvailable = Math.max(1, Math.ceil((diffDays * daysPerWeek) / 7));
  const requiredDailyMinutes = Math.ceil(effectiveMinutes / studyDaysAvailable);

  return (
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-500 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight">Smart Study & Schedule Planner</h3>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#AAAAAA]">Forecast your completion deadline based on daily habits and speed</p>
          </div>
        </div>

        {/* Mode switcher tabs - full width equal tabs on mobile */}
        <div className="grid grid-cols-2 sm:flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPlannerMode('dailyPace')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center touch-manipulation min-h-[34px] flex items-center justify-center ${
              plannerMode === 'dailyPace'
                ? 'bg-white dark:bg-[#272727] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            By Daily Time
          </button>
          <button
            type="button"
            onClick={() => setPlannerMode('targetDate')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center touch-manipulation min-h-[34px] flex items-center justify-center ${
              plannerMode === 'targetDate'
                ? 'bg-white dark:bg-[#272727] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            By Target Deadline
          </button>
        </div>
      </div>

      {/* Main planner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          {plannerMode === 'dailyPace' ? (
            <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-3.5 sm:space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs mb-2">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="font-mono text-slate-600 dark:text-[#AAAAAA]">Daily Study Time:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {formatStudyTime(dailyMinutes)} / day
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] focus-within:border-red-500 rounded-lg px-2.5 py-1 transition-colors">
                      <label htmlFor="custom-study-hours" className="text-[11px] font-mono text-slate-500 dark:text-[#717171] cursor-pointer">
                        Custom:
                      </label>
                      <input
                        id="custom-study-hours"
                        type="number"
                        min="0.25"
                        max="24"
                        step="0.25"
                        value={customHoursInput}
                        onChange={handleCustomHoursChange}
                        onBlur={handleCustomHoursBlur}
                        className="w-12 bg-transparent text-base sm:text-xs font-mono font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:text-red-500 dark:focus:text-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="hrs"
                        title="Enter custom daily hours (up to 24 hours)"
                      />
                      <span className="text-[11px] font-mono text-slate-500 dark:text-[#AAAAAA]">hrs</span>
                    </div>
                    {timelineMax > 4 && (
                      <button
                        type="button"
                        onClick={handleResetTimeline}
                        className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-mono transition-colors border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-1.5 py-1 rounded touch-manipulation"
                        title="Reset timeline back to 4 hours"
                      >
                        Reset (4h)
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max={timelineMax}
                  step="0.25"
                  value={dailyMinutes / 60}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                  className="w-full h-3 sm:h-2 bg-slate-200 dark:bg-[#0F0F0F] rounded-lg appearance-none cursor-pointer accent-red-600 touch-pan-x"
                  aria-label="Daily study time hours slider"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-[#717171] mt-1 px-0.5">
                  {calibrationTicks.map((tick, index) => {
                    const isSelected = Math.abs(dailyMinutes - Math.round(tick.hours * 60)) < 5;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setDailyMinutes(Math.round(tick.hours * 60));
                          setCustomHoursInput(formatHoursForInput(tick.hours));
                        }}
                        className={`hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1 touch-manipulation ${
                          isSelected ? 'text-red-600 dark:text-red-400 font-bold' : ''
                        }`}
                      >
                        {tick.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Days per week */}
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-[#AAAAAA] mb-2">
                  Study Days Per Week:
                </label>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-2 sm:py-1.5 rounded-md text-xs font-mono font-medium border transition-colors touch-manipulation flex items-center justify-center min-h-[36px] ${
                        daysPerWeek === num
                          ? 'bg-red-600 border-red-500 text-white shadow shadow-red-950/20 dark:shadow-red-950/50'
                          : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#272727] text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#252525]'
                      }`}
                    >
                      <span className="sm:hidden">{num}d</span>
                      <span className="hidden sm:inline">{num} {num === 1 ? 'day' : 'days'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-[#AAAAAA] mb-1.5">
                  Desired Completion Deadline:
                </label>
                <input
                  type="date"
                  value={targetDateStr}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded-lg text-base sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-red-500 min-h-[44px] [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-[#AAAAAA] mb-2">
                  Study Days Per Week:
                </label>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-2 sm:py-1.5 rounded-md text-xs font-mono font-medium border transition-colors touch-manipulation flex items-center justify-center min-h-[36px] ${
                        daysPerWeek === num
                          ? 'bg-red-600 border-red-500 text-white shadow shadow-red-950/20 dark:shadow-red-950/50'
                          : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-[#272727] text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#252525]'
                      }`}
                    >
                      <span className="sm:hidden">{num}d</span>
                      <span className="hidden sm:inline">{num} {num === 1 ? 'day' : 'days'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Speed notice */}
          <div className="text-xs text-slate-500 dark:text-[#717171] flex items-center justify-between px-1 flex-wrap gap-1">
            <span>
              Active speed: <strong className="text-slate-900 dark:text-white font-mono">{currentSpeed.toFixed(2)}x</strong>
            </span>
            <span>
              Runtime: <strong className="text-slate-900 dark:text-white font-mono">{formatCompactDuration(effectiveSeconds)}</strong>
            </span>
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] shadow-sm relative overflow-hidden">
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-600 dark:text-red-400 font-medium">
                Schedule Projection
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] text-red-600 dark:text-red-400 font-mono">
                {currentSpeed.toFixed(2)}x Speed
              </span>
            </div>

            {plannerMode === 'dailyPace' ? (
              <div className="space-y-3">
                <div className="p-3 sm:p-3.5 rounded-lg bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                  <span className="text-[11px] font-mono text-red-600 dark:text-red-400 uppercase tracking-wide block mb-1 font-medium">
                    Completion Forecast
                  </span>
                  <div className="text-xs sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                    If I watch <span className="text-amber-600 dark:text-amber-400 font-bold">{formatStudyTime(dailyMinutes)}</span>/day, I&apos;ll finish by:
                  </div>
                  <div className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                    {formattedProjectedDate}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-[#272727]">
                  <div className="p-2.5 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                    <span className="text-slate-500 dark:text-[#AAAAAA] block text-[11px]">Calendar Days</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-mono">{totalDays} days</span>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                    <span className="text-slate-500 dark:text-[#AAAAAA] block text-[11px]">Study Sessions</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-mono">{totalSessions} sessions</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 sm:p-3.5 rounded-lg bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                  <span className="text-[11px] font-mono text-red-600 dark:text-red-400 uppercase tracking-wide block mb-1 font-medium">
                    Required Daily Commitment
                  </span>
                  <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {formatStudyTime(requiredDailyMinutes)} <span className="text-xs sm:text-sm font-normal text-red-600 dark:text-red-300">/ day</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-[#272727]">
                  <div className="p-2.5 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                    <span className="text-slate-500 dark:text-[#AAAAAA] block text-[11px]">Calendar Days Left</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-mono">{diffDays} days</span>
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
                    <span className="text-slate-500 dark:text-[#AAAAAA] block text-[11px]">Study Sessions</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-mono">{studyDaysAvailable} sessions</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-[#272727] text-[11px] text-slate-500 dark:text-[#AAAAAA] flex items-center justify-between">
            <span>Keep consistent to stay on track!</span>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};