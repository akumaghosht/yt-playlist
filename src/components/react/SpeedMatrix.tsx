import React from 'react';
import { Gauge, Zap } from 'lucide-react';
import { formatCompactDuration } from '../../utils/youtube';

interface SpeedMatrixProps {
  totalSeconds: number;
  currentSpeed: number;
  onSpeedSelect: (speed: number) => void;
}

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
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl p-5 md:p-6 space-y-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-500">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Playback Speed Matrix</h3>
            <p className="text-xs text-slate-600 dark:text-[#AAAAAA]">Compare watch times and efficiency savings across playback rates</p>
          </div>
        </div>
        <div className="flex items-center self-start sm:self-auto px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] text-xs font-mono text-slate-600 dark:text-[#AAAAAA]">
          <span>Active Speed: <strong className="text-slate-900 dark:text-white">{currentSpeed.toFixed(2)}x</strong></span>
        </div>
      </div>

      {/* Preset cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {presetSpeeds.map((preset) => {
          const stats = calculateForSpeed(preset.speed);
          const isSelected = Math.abs(currentSpeed - preset.speed) < 0.01;

          return (
            <button
              key={preset.speed}
              type="button"
              onClick={() => onSpeedSelect(preset.speed)}
              className={`text-left p-3.5 rounded-lg border transition-all duration-150 relative group ${
                isSelected
                  ? 'bg-red-50/70 dark:bg-[#221515] border-red-500 dark:border-red-600 shadow-md shadow-red-950/10 dark:shadow-red-950/40 ring-1 ring-red-500'
                  : 'bg-slate-50 dark:bg-[#212121] border-slate-200 dark:border-[#272727] hover:border-slate-300 dark:hover:border-[#383838] hover:bg-slate-100 dark:hover:bg-[#252525]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
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

              <div className="mt-2 text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {stats.formatted}
              </div>

              <div className="mt-1 text-[11px] text-slate-500 dark:text-[#AAAAAA] flex items-center justify-between">
                <span>{preset.note}</span>
              </div>

              {stats.savedSec > 0 ? (
                <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-[#717171] border-t border-slate-200 dark:border-[#272727] pt-1.5">
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
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Custom Playback Multiplier
            </span>
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-[#AAAAAA] flex items-center gap-2">
            <span>Result: <strong className="text-slate-900 dark:text-white text-sm">{customStats.formatted}</strong></span>
            {customStats.pctSaved > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                (Saves {customStats.savedFormatted} &bull; {customStats.pctSaved}%)
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={currentSpeed}
            onChange={(e) => onSpeedSelect(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-[#0F0F0F] rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-[#717171] px-1">
            <span>0.50x (Slow)</span>
            <span>1.00x</span>
            <span>1.50x</span>
            <span>2.00x</span>
            <span>2.50x</span>
            <span>3.00x (Hyper)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
