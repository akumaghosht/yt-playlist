import React from 'react';
import { Sliders, CheckCircle2, RotateCcw, CheckSquare, Target, Clock, Check } from 'lucide-react';
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
  const setPreset = (type: 'all' | 'first10' | 'next10' | 'firstHalf' | 'secondHalf') => {
    if (totalCount === 0) return;
    if (type === 'all') {
      onRangeChange(1, totalCount);
    } else if (type === 'first10') {
      onRangeChange(1, Math.min(10, totalCount));
    } else if (type === 'next10') {
      const nextStart = Math.min(startIndex + 10, totalCount);
      const nextEnd = Math.min(nextStart + 9, totalCount);
      onRangeChange(nextStart, nextEnd);
    } else if (type === 'firstHalf') {
      const half = Math.max(1, Math.floor(totalCount / 2));
      onRangeChange(1, half);
    } else if (type === 'secondHalf') {
      const half = Math.max(1, Math.floor(totalCount / 2));
      onRangeChange(half + 1, totalCount);
    }
  };

  const handleWatchedCountChange = (val: number) => {
    if (!onSetWatchedCount) return;
    const clamped = Math.max(0, Math.min(val, totalCount));
    onSetWatchedCount(clamped);
  };

  return (
    <div className="bg-[#181818] border border-[#272727] rounded-xl p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272727]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-emerald-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Range & Progress Calculator</h3>
            <p className="text-xs text-[#AAAAAA]">Filter specific video subsets and track completion status in real time</p>
          </div>
        </div>

        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#717171] uppercase mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => setPreset('all')}
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              startIndex === 1 && endIndex === totalCount
                ? 'bg-[#272727] text-white border-red-500'
                : 'bg-[#212121] text-[#AAAAAA] border-[#272727] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPreset('first10')}
            className="px-2.5 py-1 text-xs rounded-md bg-[#212121] text-[#AAAAAA] border border-[#272727] hover:text-white font-mono transition-colors"
          >
            1 - 10
          </button>
          <button
            type="button"
            onClick={() => setPreset('firstHalf')}
            className="px-2.5 py-1 text-xs rounded-md bg-[#212121] text-[#AAAAAA] border border-[#272727] hover:text-white font-mono transition-colors"
          >
            1st Half
          </button>
          <button
            type="button"
            onClick={() => setPreset('secondHalf')}
            className="px-2.5 py-1 text-xs rounded-md bg-[#212121] text-[#AAAAAA] border border-[#272727] hover:text-white font-mono transition-colors"
          >
            2nd Half
          </button>
        </div>
      </div>

      {/* Range controls & dynamic outputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Range Selector */}
        <div className="p-4 rounded-lg bg-[#212121] border border-[#272727] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-500" />
              Watch Range Selection
            </span>
            <span className="text-xs font-mono text-red-400">
              {rangeVideos.length} of {totalCount} videos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#AAAAAA] mb-1">
                From Video #
              </label>
              <input
                type="number"
                min="1"
                max={endIndex}
                value={startIndex}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(parseInt(e.target.value) || 1, endIndex));
                  onRangeChange(val, endIndex);
                }}
                className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#272727] rounded-md text-sm font-mono text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#AAAAAA] mb-1">
                To Video #
              </label>
              <input
                type="number"
                min={startIndex}
                max={totalCount}
                value={endIndex}
                onChange={(e) => {
                  const val = Math.max(startIndex, Math.min(parseInt(e.target.value) || totalCount, totalCount));
                  onRangeChange(startIndex, val);
                }}
                className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#272727] rounded-md text-sm font-mono text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="text-xs text-[#AAAAAA] flex items-center justify-between border-t border-[#272727] pt-3">
            <span>Range Runtime (1.0x):</span>
            <strong className="text-white font-mono">{formatCompactDuration(rangeTotalSeconds)}</strong>
          </div>
        </div>

        {/* Right Column: Progress & Watched Input */}
        <div className="p-4 rounded-lg bg-[#212121] border border-[#272727] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Watch Progress
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {watchedInRange.length}/{activeRangeVideos.length} watched ({watchedPercent}%)
            </span>
          </div>

          {/* Quick Already-Watched Count Input */}
          <div className="flex items-center justify-between gap-3 bg-[#181818] p-2.5 rounded-lg border border-[#272727]">
            <label className="text-[11px] font-mono text-[#AAAAAA]">
              Already watched first:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={totalCount}
                value={watchedIds.size}
                onChange={(e) => handleWatchedCountChange(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-[#0F0F0F] border border-[#272727] rounded text-center text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-[#717171] font-mono">videos</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-[#0F0F0F] rounded-full overflow-hidden border border-[#272727]">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${watchedPercent}%` }}
            />
          </div>

          {/* Remaining Watch Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-[#181818] border border-[#272727]">
              <span className="text-[#AAAAAA] block text-[10px]">Remaining Unwatched</span>
              <span className="font-bold text-white font-mono text-sm">
                {formatCompactDuration(remainingSeconds)}
              </span>
              <span className="text-[10px] text-[#717171] block">at 1.0x</span>
            </div>
            <div className="p-2 rounded bg-[#181818] border border-[#272727]">
              <span className="text-[#AAAAAA] block text-[10px]">At {currentSpeed.toFixed(2)}x Speed</span>
              <span className="font-bold text-amber-400 font-mono text-sm">
                {formatCompactDuration(remainingAtSpeed)}
              </span>
              <span className="text-[10px] text-emerald-400 block">
                Save {formatCompactDuration(remainingSeconds - remainingAtSpeed)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-[#272727] pt-2">
            <button
              type="button"
              onClick={() => onToggleAllWatched(true)}
              className="px-2.5 py-1 text-xs rounded bg-[#272727] hover:bg-[#333333] text-white flex items-center gap-1 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Mark Range as Watched
            </button>
            <button
              type="button"
              onClick={() => onToggleAllWatched(false)}
              className="px-2.5 py-1 text-xs rounded bg-[#272727] hover:bg-[#333333] text-[#AAAAAA] hover:text-white flex items-center gap-1 transition-colors"
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
