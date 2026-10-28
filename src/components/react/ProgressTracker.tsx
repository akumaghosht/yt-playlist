import React, { useState } from 'react';
import { Sliders, CheckCircle2, RotateCcw, CheckSquare, Target } from 'lucide-react';
import { formatCompactDuration } from '../../utils/youtube';
import type { VideoItem } from '../../types/playlist';

interface ProgressTrackerProps {
  videos: VideoItem[];
  startIndex: number;
  endIndex: number;
  onRangeChange: (start: number, end: number) => void;
  watchedIds: Set<string>;
  onToggleAllWatched: (markAll: boolean) => void;
  onSetWatchedCount?: (count: number) => void;
  currentSpeed: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  videos,
  startIndex,
  endIndex,
  onRangeChange,
  watchedIds,
  onToggleAllWatched,
  onSetWatchedCount,
  currentSpeed,
}) => {
  const totalCount = videos.length;

  // Active videos in the selected range
  const rangeVideos = videos.slice(Math.max(0, startIndex - 1), endIndex);
  const activeRangeVideos = rangeVideos.filter((v) => !v.isUnavailable);

  // Range total duration
  const rangeTotalSeconds = activeRangeVideos.reduce((acc, v) => acc + v.durationSeconds, 0);

  // Watched videos in range
  const watchedInRange = activeRangeVideos.filter((v) => watchedIds.has(v.id));
  const watchedSeconds = watchedInRange.reduce((acc, v) => acc + v.durationSeconds, 0);

  // Remaining duration in range
  const remainingSeconds = Math.max(0, rangeTotalSeconds - watchedSeconds);
  const remainingAtSpeed = Math.round(remainingSeconds / currentSpeed);

  // Percentages
  const watchedPercent =
    activeRangeVideos.length > 0
      ? Math.round((watchedInRange.length / activeRangeVideos.length) * 100)
      : 0;

  // Presets
  const [lastPreset, setLastPreset] = useState<'all' | 'first10' | 'firstHalf' | 'secondHalf' | null>('all');

  const half = Math.max(1, Math.floor(totalCount / 2));
  const matchesAll = totalCount > 0 && startIndex === 1 && endIndex === totalCount;
  const matchesFirst10 = totalCount > 0 && startIndex === 1 && endIndex === Math.min(10, totalCount);
  const matchesFirstHalf = totalCount > 1 && startIndex === 1 && endIndex === half;
  const matchesSecondHalf = totalCount > 1 && startIndex === half + 1 && endIndex === totalCount;

  let activePreset: 'all' | 'first10' | 'firstHalf' | 'secondHalf' | null = null;
  if (lastPreset === 'all' && matchesAll) {
    activePreset = 'all';
  } else if (lastPreset === 'first10' && matchesFirst10) {
    activePreset = 'first10';
  } else if (lastPreset === 'firstHalf' && matchesFirstHalf) {
    activePreset = 'firstHalf';
  } else if (lastPreset === 'secondHalf' && matchesSecondHalf) {
    activePreset = 'secondHalf';
  } else if (matchesAll) {
    activePreset = 'all';
  } else if (matchesFirst10 && totalCount > 10) {
    activePreset = 'first10';
  } else if (matchesFirstHalf && half !== totalCount) {
    activePreset = 'firstHalf';
  } else if (matchesSecondHalf) {
    activePreset = 'secondHalf';
  }

  const setPreset = (type: 'all' | 'first10' | 'next10' | 'firstHalf' | 'secondHalf') => {
    if (totalCount === 0) return;
    if (type !== 'next10') {
      setLastPreset(type);
    } else {
      setLastPreset(null);
    }
    if (type === 'all') {
      onRangeChange(1, totalCount);
    } else if (type === 'first10') {
      onRangeChange(1, Math.min(10, totalCount));
    } else if (type === 'next10') {
      const nextStart = Math.min(startIndex + 10, totalCount);
      const nextEnd = Math.min(nextStart + 9, totalCount);
      onRangeChange(nextStart, nextEnd);
    } else if (type === 'firstHalf') {
      onRangeChange(1, half);
    } else if (type === 'secondHalf') {
      onRangeChange(half + 1, totalCount);
    }
  };

  const handleWatchedCountChange = (val: number) => {
    if (!onSetWatchedCount) return;
    const clamped = Math.max(0, Math.min(val, totalCount));
    onSetWatchedCount(clamped);
  };

  return (
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl p-5 md:p-6 space-y-6 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Range & Progress Calculator</h3>
            <p className="text-xs text-slate-600 dark:text-[#AAAAAA]">Filter specific video subsets and track completion status in real time</p>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-[#717171] uppercase mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => setPreset('all')}
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              activePreset === 'all'
                ? 'bg-slate-200 dark:bg-[#272727] text-slate-900 dark:text-white border-red-500'
                : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-[#AAAAAA] border-slate-200 dark:border-[#272727] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPreset('first10')}
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              activePreset === 'first10'
                ? 'bg-slate-200 dark:bg-[#272727] text-slate-900 dark:text-white border-red-500'
                : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-[#AAAAAA] border-slate-200 dark:border-[#272727] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1 - 10
          </button>
          <button
            type="button"
            onClick={() => setPreset('firstHalf')}
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              activePreset === 'firstHalf'
                ? 'bg-slate-200 dark:bg-[#272727] text-slate-900 dark:text-white border-red-500'
                : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-[#AAAAAA] border-slate-200 dark:border-[#272727] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1st Half
          </button>
          <button
            type="button"
            onClick={() => setPreset('secondHalf')}
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              activePreset === 'secondHalf'
                ? 'bg-slate-200 dark:bg-[#272727] text-slate-900 dark:text-white border-red-500'
                : 'bg-slate-100 dark:bg-[#212121] text-slate-600 dark:text-[#AAAAAA] border-slate-200 dark:border-[#272727] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            2nd Half
          </button>
        </div>
      </div>

      {/* Range controls & dynamic outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Range Selector */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
              Watch Range Selection
            </span>
            <span className="text-xs font-mono text-red-600 dark:text-red-400 font-semibold">
              {rangeVideos.length} of {totalCount} videos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-slate-600 dark:text-[#AAAAAA] mb-1">
                From Video #
              </label>
              <input
                type="number"
                min="1"
                max={endIndex}
                value={startIndex}
                onChange={(e) => {
                  setLastPreset(null);
                  const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, endIndex));
                  onRangeChange(val, endIndex);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded-md text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-600 dark:text-[#AAAAAA] mb-1">
                To Video #
              </label>
              <input
                type="number"
                min={startIndex}
                max={totalCount}
                value={endIndex}
                onChange={(e) => {
                  setLastPreset(null);
                  const val = Math.max(startIndex, Math.min(parseInt(e.target.value) || totalCount, totalCount));
                  onRangeChange(startIndex, val);
                }}
                className="w-full px-3 py-2 bg-white dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded-md text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-[#AAAAAA] flex items-center justify-between border-t border-slate-200 dark:border-[#272727] pt-3">
            <span>Range Runtime (1.0x):</span>
            <strong className="text-slate-900 dark:text-white font-mono">{formatCompactDuration(rangeTotalSeconds)}</strong>
          </div>
        </div>

        {/* Right Column: Progress & Watched Input */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Watch Progress
            </span>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {watchedInRange.length}/{activeRangeVideos.length} watched ({watchedPercent}%)
            </span>
          </div>

          {/* Quick Already-Watched Count Input */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#181818] p-2.5 rounded-lg border border-slate-200 dark:border-[#272727]">
            <label className="text-[11px] font-mono text-slate-600 dark:text-[#AAAAAA]">
              Already watched first:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={totalCount}
                value={watchedIds.size}
                onChange={(e) => handleWatchedCountChange(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-slate-50 dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded text-center text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-[#717171] font-mono">videos</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-200 dark:bg-[#0F0F0F] rounded-full overflow-hidden border border-slate-300 dark:border-[#272727]">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${watchedPercent}%` }}
            />
          </div>

          {/* Remaining Watch Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
              <span className="text-slate-500 dark:text-[#AAAAAA] block text-[10px]">Remaining Unwatched</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                {formatCompactDuration(remainingSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-[#717171] block">at 1.0x</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727]">
              <span className="text-slate-500 dark:text-[#AAAAAA] block text-[10px]">At {currentSpeed.toFixed(2)}x Speed</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                {formatCompactDuration(remainingAtSpeed)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">
                Save {formatCompactDuration(remainingSeconds - remainingAtSpeed)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#272727] pt-2">
            <button
              type="button"
              onClick={() => onToggleAllWatched(true)}
              className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-[#272727] hover:bg-slate-300 dark:hover:bg-[#333333] text-slate-800 dark:text-white flex items-center gap-1 transition-colors font-medium"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mark Range as Watched
            </button>
            <button
              type="button"
              onClick={() => onToggleAllWatched(false)}
              className="px-2.5 py-1 text-xs rounded bg-slate-200 dark:bg-[#272727] hover:bg-slate-300 dark:hover:bg-[#333333] text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
