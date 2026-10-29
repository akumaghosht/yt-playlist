import React from 'react';
import { Gauge } from 'lucide-react';
import { formatCompactDuration } from '../../utils/youtube';

interface SpeedMatrixProps {
  totalSeconds: number;
  currentSpeed: number;
  onSpeedSelect: (speed: number) => void;
}

const SPEED_MARKS = [
  { value: 0.5, label: '0.5x', sub: 'Slow' },
  { value: 1.0, label: '1.0x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2.0x' },
  { value: 2.5, label: '2.5x' },
  { value: 3.0, label: '3.0x', sub: 'Hyper' },
];

// 26 ruler graduation ticks from 0.5x to 3.0x (every 0.1x)
const SPEED_TICKS = Array.from({ length: 26 }, (_, i) => {
  const value = Math.round((0.5 + i * 0.1) * 10) / 10;
  const percent = (i / 25) * 100;
  const isMajor = i % 5 === 0;
  return { value, percent, isMajor };
});

export const SpeedMatrix: React.FC<SpeedMatrixProps> = ({
  totalSeconds,
  currentSpeed,
  onSpeedSelect,
}) => {
  const presetSpeeds = [
    { speed: 1.0, label: 'Normal (1.0x)', note: 'Standard Pace' },
    { speed: 1.25, label: '1.25x', note: 'Comfortable Boost' },
    { speed: 1.5, label: '1.5x', note: 'Popular Study Speed' },
    { speed: 1.75, label: '1.75x', note: 'Fast Learner' },
    { speed: 2.0, label: '2.0x', note: 'Double Speed' },
  ];

  const calculateForSpeed = (speed: number) => {
    const adjustedSec = Math.round(totalSeconds / speed);
    const savedSec = Math.max(0, totalSeconds - adjustedSec);
    const pctSaved = totalSeconds > 0 ? Math.round((savedSec / totalSeconds) * 100) : 0;
    return {
      adjustedSec,
      savedSec,
      pctSaved,
      formatted: formatCompactDuration(adjustedSec),
      savedFormatted: formatCompactDuration(savedSec),
    };
  };

  const customStats = calculateForSpeed(currentSpeed);

  return (
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-500 shrink-0">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight">Playback Speed Matrix</h3>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-[#AAAAAA]">Compare watch times and efficiency savings across playback rates</p>
          </div>
        </div>
        <div className="flex items-center self-start sm:self-auto px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] text-xs font-mono text-slate-600 dark:text-[#AAAAAA]">
          <span>Active Speed: <strong className="text-slate-900 dark:text-white">{currentSpeed.toFixed(2)}x</strong></span>
        </div>
      </div>

      {/* Preset cards grid - 2 columns on mobile with 5th card spanning 2 cols, 3 on sm, 5 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {presetSpeeds.map((preset, index) => {
          const stats = calculateForSpeed(preset.speed);
          const isSelected = Math.abs(currentSpeed - preset.speed) < 0.01;
          const isLast = index === presetSpeeds.length - 1;

          return (
            <button
              key={preset.speed}
              type="button"
              onClick={() => onSpeedSelect(preset.speed)}
              className={`text-left p-3 sm:p-3.5 rounded-lg border transition-all duration-150 relative group touch-manipulation cursor-pointer ${
                isLast ? 'col-span-2 sm:col-span-1' : ''
              } ${
                isSelected
                  ? 'bg-red-50/70 dark:bg-[#221515] border-red-500 dark:border-red-600 shadow-md shadow-red-950/10 dark:shadow-red-950/40 ring-1 ring-red-500'
                  : 'bg-slate-50 dark:bg-[#212121] border-slate-200 dark:border-[#272727] hover:border-slate-300 dark:hover:border-[#383838] hover:bg-slate-100 dark:hover:bg-[#252525]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold font-mono ${isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {preset.speed.toFixed(2)}x
                </span>
                {stats.pctSaved > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400">
                    -{stats.pctSaved}%
                  </span>
                )}
              </div>

              <div className="mt-1.5 sm:mt-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {stats.formatted}
              </div>

              <div className="mt-0.5 sm:mt-1 text-[11px] text-slate-500 dark:text-[#AAAAAA] flex items-center justify-between truncate">
                <span>{preset.note}</span>
              </div>

              {stats.savedSec > 0 ? (
                <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-[#717171] border-t border-slate-200 dark:border-[#272727] pt-1.5 truncate">
                  Save {stats.savedFormatted}
                </div>
              ) : (
                <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-[#717171] border-t border-slate-200 dark:border-[#272727] pt-1.5">
                  Original runtime
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Custom Speed Slider */}
      <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
            Custom Playback Multiplier
          </span>
          <div className="text-xs font-mono text-slate-600 dark:text-[#AAAAAA] flex items-center gap-1.5 flex-wrap">
            <span>Result: <strong className="text-slate-900 dark:text-white text-xs sm:text-sm">{customStats.formatted}</strong></span>
            {customStats.pctSaved > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                (Save {customStats.savedFormatted} &bull; {customStats.pctSaved}%)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={currentSpeed}
            onChange={(e) => onSpeedSelect(parseFloat(e.target.value))}
            className="w-full h-3 sm:h-2 bg-slate-200 dark:bg-[#0F0F0F] rounded-lg appearance-none cursor-pointer accent-red-600 touch-pan-x"
            aria-label="Custom playback speed multiplier"
          />

          {/* Calibrated scale with tiny lines towards labels */}
          <div className="relative pt-1 select-none">
            {/* Calibration scale ruler lines */}
            <div className="relative h-2.5 sm:h-3 mx-2 sm:mx-2.5 pointer-events-none" aria-hidden="true">
              {SPEED_TICKS.map((tick) => {
                const isActive = Math.abs(currentSpeed - tick.value) < 0.03;
                const isPassed = tick.value <= currentSpeed + 0.001;
                return (
                  <div
                    key={tick.value}
                    style={{ left: `${tick.percent}%` }}
                    className={`absolute -translate-x-1/2 top-0 rounded-full transition-colors ${
                      tick.isMajor
                        ? 'w-[1.5px] h-2.5 sm:h-3'
                        : 'w-[1px] h-1.5 sm:h-2'
                    } ${
                      isActive
                        ? 'bg-red-600 dark:bg-red-500 ring-1 ring-red-400/40'
                        : isPassed
                        ? 'bg-slate-400/80 dark:bg-[#555555]'
                        : 'bg-slate-300 dark:bg-[#2e2e2e]'
                    }`}
                  />
                );
              })}
            </div>

            {/* Labels marked across the scale */}
            <div className="relative h-6 mx-2 sm:mx-2.5 mt-1">
              {SPEED_MARKS.map((mark) => {
                const percent = ((mark.value - 0.5) / 2.5) * 100;
                const isSelected = Math.abs(currentSpeed - mark.value) < 0.03;
                return (
                  <button
                    key={mark.value}
                    type="button"
                    onClick={() => onSpeedSelect(mark.value)}
                    style={{ left: `${percent}%` }}
                    className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer transition-colors touch-manipulation group ${
                      isSelected
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : 'text-slate-500 dark:text-[#717171] hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={`Set speed to ${mark.label}${mark.sub ? ` (${mark.sub})` : ''}`}
                  >
                    <span className="text-[10px] sm:text-[11px] font-mono leading-tight">
                      {mark.label}
                    </span>
                    {mark.sub && (
                      <span className="hidden sm:inline text-[9px] font-mono opacity-70 leading-none">
                        {mark.sub}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};