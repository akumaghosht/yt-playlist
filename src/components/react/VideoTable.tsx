import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Search,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type { VideoItem } from '../../types/playlist';
import { formatCompactDuration, formatViewCount, formatPublishDate } from '../../utils/youtube';

interface VideoTableProps {
  videos: VideoItem[];
  watchedIds: Set<string>;
  onToggleWatched: (videoId: string) => void;
  playlistTitle: string;
}

type SortField = 'position' | 'title' | 'duration' | 'views' | 'date';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'unwatched' | 'watched' | 'unavailable';

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  watchedIds,
  onToggleWatched,
  playlistTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'position' || field === 'title' ? 'asc' : 'desc');
    }
  };

  // Filter & Search
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      // 1. Status Filter
      if (filterStatus === 'watched' && !watchedIds.has(video.id)) return false;
      if (filterStatus === 'unwatched' && (watchedIds.has(video.id) || video.isUnavailable)) return false;
      if (filterStatus === 'unavailable' && !video.isUnavailable) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(query);
        const matchesChannel = video.channelTitle.toLowerCase().includes(query);
        const matchesIndex = video.position.toString() === query;
        if (!matchesTitle && !matchesChannel && !matchesIndex) return false;
      }

      return true;
    });
  }, [videos, watchedIds, filterStatus, searchQuery]);

  // Sort
  const sortedVideos = useMemo(() => {
    return [...filteredVideos].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'position') {
        comparison = a.position - b.position;
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'duration') {
        comparison = a.durationSeconds - b.durationSeconds;
      } else if (sortField === 'views') {
        comparison = a.viewCount - b.viewCount;
      } else if (sortField === 'date') {
        comparison = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredVideos, sortField, sortOrder]);

  const copySummary = () => {
    const activeVideos = videos.filter((v) => !v.isUnavailable);
    const watchedCount = activeVideos.filter((v) => watchedIds.has(v.id)).length;
    const totalSec = activeVideos.reduce((acc, v) => acc + v.durationSeconds, 0);

    const summary = [
      `Playlist: ${playlistTitle}`,
      `Total Videos: ${videos.length} (${activeVideos.length} active, ${videos.length - activeVideos.length} unavailable)`,
      `Total Runtime: ${formatCompactDuration(totalSec)}`,
      `Watched Progress: ${watchedCount}/${activeVideos.length} (${activeVideos.length > 0 ? Math.round((watchedCount / activeVideos.length) * 100) : 0}%)`,
    ].join('\n');

    navigator.clipboard.writeText(summary);
    showToast('Copied playlist summary to clipboard!');
  };

  const copyFullList = () => {
    const text = videos
      .map(
        (v) =>
          `${v.position}. ${v.title} [${v.durationFormatted}] (${formatViewCount(v.viewCount)} views) - ${v.videoUrl}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('Playlist full list copied to clipboard!');
  };

  return (
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl overflow-hidden shadow-sm transition-colors">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-[#272727] space-y-3 sm:space-y-4 bg-slate-50/70 dark:bg-[#141414]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          {/* Search input */}
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#717171]" />
            <input
              type="text"
              placeholder="Filter by title, channel, or video #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-white dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded-lg text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#717171] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white touch-manipulation p-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Copy buttons - 2 columns on mobile, auto on desktop */}
          <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={copySummary}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] text-xs text-slate-700 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#383838] flex items-center justify-center gap-1.5 transition-colors font-medium touch-manipulation min-h-[38px]"
              title="Copy clean summary to clipboard"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Summary</span>
            </button>
            <button
              type="button"
              onClick={copyFullList}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] text-xs text-slate-700 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#383838] flex items-center justify-center gap-1.5 transition-colors font-medium touch-manipulation min-h-[38px]"
              title="Copy all video links and titles"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
              <span>Full List</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-[#717171] uppercase mr-0.5 shrink-0">Filter:</span>
          {(
            [
              { id: 'all', label: `All (${videos.length})` },
              { id: 'unwatched', label: `Unwatched (${videos.filter((v) => !v.isUnavailable && !watchedIds.has(v.id)).length})` },
              { id: 'watched', label: `Watched (${videos.filter((v) => watchedIds.has(v.id)).length})` },
              { id: 'unavailable', label: `Unavailable (${videos.filter((v) => v.isUnavailable).length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-full font-mono transition-colors shrink-0 touch-manipulation min-h-[32px] flex items-center ${
                filterStatus === tab.id
                  ? 'bg-red-600 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-[#212121] text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#272727]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Sort Pills Bar (Only shown on small screens) */}
        <div className="flex sm:hidden items-center justify-between gap-1.5 pt-2 border-t border-slate-200/70 dark:border-[#272727]/70">
          <span className="text-[10px] font-mono text-slate-500 dark:text-[#717171] uppercase shrink-0">Sort:</span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { field: 'position', label: '#' },
              { field: 'duration', label: 'Duration' },
              { field: 'views', label: 'Views' },
              { field: 'date', label: 'Date' },
            ].map((s) => (
              <button
                key={s.field}
                type="button"
                onClick={() => handleSort(s.field as SortField)}
                className={`px-2 py-1 text-[11px] rounded-md border font-mono transition-colors shrink-0 touch-manipulation flex items-center gap-1 ${
                  sortField === s.field
                    ? 'bg-slate-200 dark:bg-[#272727] text-slate-900 dark:text-white border-red-500 font-semibold'
                    : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-[#AAAAAA] border-slate-200 dark:border-[#272727]'
                }`}
              >
                <span>{s.label}</span>
                {sortField === s.field && (
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. MOBILE RESPONSIVE VIDEO LIST (Visible on < 640px) */}
      <div className="block sm:hidden divide-y divide-slate-100 dark:divide-[#222222]">
        {sortedVideos.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-[#717171]">
            No videos found matching your filter criteria.
          </div>
        ) : (
          sortedVideos.map((video) => {
            const isWatched = watchedIds.has(video.id);

            return (
              <div
                key={video.id + video.position}
                className={`p-3 flex items-start gap-2.5 transition-colors ${
                  isWatched ? 'opacity-65 bg-slate-50/70 dark:bg-[#141414]' : 'hover:bg-slate-50 dark:hover:bg-[#1a1a1a]'
                }`}
              >
                {/* Watched checkbox */}
                <div className="pt-0.5 shrink-0">
                  {!video.isUnavailable ? (
                    <label className="p-1 -m-1 inline-flex items-center justify-center cursor-pointer touch-manipulation min-w-[34px] min-h-[34px]">
                      <input
                        type="checkbox"
                        checked={isWatched}
                        onChange={() => onToggleWatched(video.id)}
                        className="w-4 h-4 rounded bg-white dark:bg-[#0F0F0F] border-slate-300 dark:border-[#383838] text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-red-600"
                        aria-label={`Mark video ${video.position} as watched`}
                      />
                    </label>
                  ) : (
                    <div className="p-1 min-w-[34px] min-h-[34px] flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-500" title="Unavailable video" />
                    </div>
                  )}
                </div>

                {/* Thumbnail with overlay duration */}
                <div className="relative w-20 h-12 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-[#272727] border border-slate-200 dark:border-[#2f2f2f]">
                  <img
                    src={video.thumbnail}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {!video.isUnavailable && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-[9px] font-mono font-medium text-white">
                      {video.durationFormatted}
                    </span>
                  )}
                </div>

                {/* Video Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs font-semibold line-clamp-2 leading-snug hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1 transition-colors ${
                      isWatched ? 'line-through text-slate-400 dark:text-[#888888]' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <span>{video.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 inline opacity-60" />
                  </a>

                  <div className="text-[10px] font-mono text-slate-500 dark:text-[#AAAAAA] flex items-center gap-1.5 flex-wrap">
                    <span className="text-red-600 dark:text-red-400 font-semibold">#{video.position}</span>
                    <span>&bull;</span>
                    <span className="truncate max-w-[90px]">{video.channelTitle}</span>
                    <span>&bull;</span>
                    <span>{video.isUnavailable ? 'Unavailable' : `${formatViewCount(video.viewCount)} views`}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP MULTI-COLUMN TABLE (Visible on >= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#272727] bg-slate-100/80 dark:bg-[#101010] text-[11px] font-mono uppercase text-slate-600 dark:text-[#AAAAAA] tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Watched</th>
              <th className="py-3 px-3 w-16 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('position')}>
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-[#717171]" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[280px] cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  <span>Video Title</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-[#717171]" />
                </div>
              </th>
              <th className="py-3 px-4 w-28 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('duration')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Duration</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-[#717171]" />
                </div>
              </th>
              <th className="py-3 px-4 w-24 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('views')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Views</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-[#717171]" />
                </div>
              </th>
              <th className="py-3 px-4 w-28 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => handleSort('date')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Published</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-[#717171]" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222222] text-xs">
            {sortedVideos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-[#717171]">
                  No videos found matching your filter criteria.
                </td>
              </tr>
            ) : (
              sortedVideos.map((video) => {
                const isWatched = watchedIds.has(video.id);

                return (
                  <tr
                    key={video.id + video.position}
                    className={`hover:bg-slate-50 dark:hover:bg-[#1f1f1f] transition-colors group ${
                      isWatched ? 'opacity-70 bg-slate-100/60 dark:bg-[#141414]' : ''
                    }`}
                  >
                    {/* Watched checkbox */}
                    <td className="py-3 px-4 text-center">
                      {!video.isUnavailable ? (
                        <input
                          type="checkbox"
                          checked={isWatched}
                          onChange={() => onToggleWatched(video.id)}
                          className="w-4 h-4 rounded bg-white dark:bg-[#0F0F0F] border-slate-300 dark:border-[#383838] text-red-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-red-600"
                          title="Mark as watched"
                        />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" title="Unavailable video" />
                      )}
                    </td>

                    {/* Order position */}
                    <td className="py-3 px-3 font-mono text-slate-400 dark:text-[#717171]">{video.position}</td>

                    {/* Thumbnail & Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-11 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-[#272727] border border-slate-200 dark:border-[#2f2f2f]">
                          <img
                            src={video.thumbnail}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {!video.isUnavailable && (
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/85 text-[10px] font-mono font-medium text-white">
                              {video.durationFormatted}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`font-medium line-clamp-1 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1.5 transition-colors ${
                              isWatched ? 'line-through text-slate-400 dark:text-[#888888]' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            <span>{video.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 dark:text-[#717171] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                          <div className="text-[11px] text-slate-500 dark:text-[#717171] flex items-center gap-2 mt-0.5">
                            <span>{video.channelTitle}</span>
                            {video.isUnavailable && (
                              <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-mono">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {video.durationFormatted}
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-[#AAAAAA]">
                      {video.isUnavailable ? '—' : formatViewCount(video.viewCount)}
                    </td>

                    {/* Published Date */}
                    <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-[#717171]">
                      {formatPublishDate(video.publishedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-[#272727] border border-slate-700 dark:border-[#383838] text-xs font-semibold text-white shadow-2xl flex items-center justify-center sm:justify-start gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};