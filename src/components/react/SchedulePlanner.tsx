import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, BookOpen, ChevronRight, Check } from 'lucide-react';
import { formatCompactDuration } from '../../utils/youtube';

interface SchedulePlannerProps {
  totalSecondsToWatch: number;
  currentSpeed: number;
}

export const SchedulePlanner: React.FC<SchedulePlannerProps> = ({
  totalSecondsToWatch,
  currentSpeed,
}) => {
  const [plannerMode, setPlannerMode] = useState<'dailyPace' | 'targetDate'>('dailyPace');
  const [dailyMinutes, setDailyMinutes] = useState(45);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  // Target date mode
  const defaultTargetDate = new Date();
  defaultTargetDate.setDate(defaultTargetDate.getDate() + 14);
  const [targetDateStr, setTargetDateStr] = useState(defaultTargetDate.toISOString().split('T')[0]);

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
    <div className="bg-[#181818] border border-[#272727] rounded-xl p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-900/40 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Smart Study & Schedule Planner</h3>
            <p className="text-xs text-[#AAAAAA]">Forecast your completion deadline based on daily habits and speed</p>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center p-1 rounded-lg bg-[#212121] border border-[#272727] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPlannerMode('dailyPace')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${plannerMode === 'dailyPace'
                ? 'bg-[#272727] text-white shadow'
                : 'text-[#AAAAAA] hover:text-white'
              }`}
          >
            By Daily Time
          </button>
          <button
            type="button"
            onClick={() => setPlannerMode('targetDate')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${plannerMode === 'targetDate'
                ? 'bg-[#272727] text-white shadow'
                : 'text-[#AAAAAA] hover:text-white'
              }`}
          >
            By Target Deadline
          </button>
        </div>
      </div>

      {/* Main planner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {plannerMode === 'dailyPace' ? (
            <div className="p-4 rounded-lg bg-[#212121] border border-[#272727] space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-mono text-[#AAAAAA]">Daily Study Time:</span>
                  <span className="font-mono font-bold text-white">
                    {Math.floor(dailyMinutes / 60) > 0 ? `${Math.floor(dailyMinutes / 60)}h ` : ''}
                    {dailyMinutes % 60}m per day
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={dailyMinutes}
                  onChange={(e) => setDailyMinutes(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#0F0F0F] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#717171] mt-1">
                  <span>15m</span>
                  <span>45m</span>
                  <span>1.5h</span>
                  <span>2.5h</span>
                  <span>4h</span>
                </div>
              </div>

              {/* Days per week */}
              <div>
                <label className="block text-xs font-mono text-[#AAAAAA] mb-2">
                  Study Days Per Week:
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-1.5 rounded-md text-xs font-mono font-medium border transition-colors ${daysPerWeek === num
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : 'bg-[#181818] border-[#272727] text-[#AAAAAA] hover:text-white'
                        }`}
                    >
                      {num} {num === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#212121] border border-[#272727] space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#AAAAAA] mb-1.5">
                  Desired Completion Deadline:
                </label>
                <input
                  type="date"
                  value={targetDateStr}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0F0F0F] border border-[#272727] rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#AAAAAA] mb-2">
                  Study Days Per Week:
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDaysPerWeek(num)}
                      className={`py-1.5 rounded-md text-xs font-mono font-medium border transition-colors ${daysPerWeek === num
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : 'bg-[#181818] border-[#272727] text-[#AAAAAA] hover:text-white'
                        }`}
                    >
                      {num}d
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Speed notice */}
          <div className="text-xs text-[#717171] flex items-center justify-between px-1">
            <span>
              Calculated at active speed: <strong className="text-white font-mono">{currentSpeed.toFixed(2)}x</strong>
            </span>
            <span>
              Total runtime: <strong className="text-white font-mono">{formatCompactDuration(effectiveSeconds)}</strong>
            </span>
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-lg bg-gradient-to-br from-[#1E1929] to-[#141414] border border-indigo-900/40 shadow-lg relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Schedule Projection
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 font-mono">
                {currentSpeed.toFixed(2)}x Speed
              </span>
            </div>

            {plannerMode === 'dailyPace' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
                  <span className="text-[11px] font-mono text-indigo-300 uppercase tracking-wide block mb-1">
                    Completion Forecast
                  </span>
                  <div className="text-sm sm:text-base font-semibold text-white leading-snug">
                    If I watch <span className="text-amber-400 font-bold">{dailyMinutes >= 60 ? `${(dailyMinutes / 60).toFixed(1)} hrs` : `${dailyMinutes} mins`}</span>/day, I&apos;ll finish by:
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1 text-indigo-200">
                    {formattedProjectedDate}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-950/60">
                  <div className="p-2.5 rounded bg-black/40 border border-indigo-900/30">
                    <span className="text-[#AAAAAA] block text-[11px]">Total Study Days</span>
                    <span className="font-bold text-white text-base font-mono">{totalDays} days</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-indigo-900/30">
                    <span className="text-[#AAAAAA] block text-[11px]">Daily Sessions</span>
                    <span className="font-bold text-white text-base font-mono">{totalSessions} sessions</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-[#AAAAAA] block">Required Daily Commitment</span>
                  <div className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    {Math.floor(requiredDailyMinutes / 60) > 0 ? `${Math.floor(requiredDailyMinutes / 60)}h ` : ''}
                    {requiredDailyMinutes % 60} mins <span className="text-sm font-normal text-indigo-300">/ day</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-950/60">
                  <div className="p-2.5 rounded bg-black/40 border border-indigo-900/30">
                    <span className="text-[#AAAAAA] block text-[11px]">Calendar Days Left</span>
                    <span className="font-bold text-white text-base font-mono">{diffDays} days</span>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-indigo-900/30">
                    <span className="text-[#AAAAAA] block text-[11px]">Study Sessions</span>
                    <span className="font-bold text-white text-base font-mono">{studyDaysAvailable} sessions</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-900/30 text-[11px] text-indigo-200/80 flex items-center justify-between">
            <span>Keep consistent to stay on track!</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

