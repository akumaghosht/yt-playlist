import React from 'react';
import { History, Trash2, X, PlaySquare } from 'lucide-react';
import type { HistoryEntry } from '../../utils/history';
import { getWatchedCount } from '../../utils/history';
import { formatCompactDuration } from '../../utils/youtube';

interface PlaylistHistoryProps {
  entries: HistoryEntry[];
  onSelect: (playlistId: string) => void;
  onRemove: (playlistId: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const PlaylistHistory: React.FC<PlaylistHistoryProps> = ({
  entries,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="history-heading" className="max-w-4xl mx-auto space-y-3 px-1">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="history-heading"
          className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2"
        >
          <History className="w-4 h-4 text-red-600 dark:text-red-500" />
          Recent Playlists
        </h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] sm:text-xs text-slate-500 dark:text-[#888888] hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer touch-manipulation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear history
        </button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {entries.map((entry) => {
          const watched = getWatchedCount(entry.id);
          const pct = entry.activeCount > 0 ? Math.min(100, Math.round((watched / entry.activeCount) * 100)) : 0;
          return (
            <li key={entry.id} className="relative group">
              <button
                type="button"
                onClick={() => onSelect(entry.id)}
                className="w-full text-left p-2.5 sm:p-3 pr-9 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] hover:border-red-300 dark:hover:border-red-500/50 shadow-sm transition-colors flex items-center gap-3 cursor-pointer touch-manipulation"
                title={`Load "${entry.title}"`}
              >
                <div className="relative w-20 h-12 sm:w-24 sm:h-14 shrink-0 rounded-md overflow-hidden bg-slate-200 dark:bg-[#212121] border border-slate-200 dark:border-[#272727]">
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlaySquare className="w-5 h-5 text-slate-400 dark:text-[#717171]" />
                    </div>
                  )}
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/75 text-[9px] sm:text-[10px] font-mono text-white">
                    {entry.totalVideos}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#AAAAAA] truncate">
                    {entry.channelTitle} &bull; {formatCompactDuration(entry.totalDurationSeconds)}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-[#272727] overflow-hidden">
                      <div className="h-full bg-red-600 dark:bg-red-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-[#717171] shrink-0">
                      {pct}% &bull; {formatRelativeTime(entry.savedAt)}
                    </span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(entry.id)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-md text-slate-400 dark:text-[#717171] hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#272727] transition-colors cursor-pointer touch-manipulation"
                title="Remove from history"
                aria-label={`Remove ${entry.title} from history`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

interface PlaylistHistoryDropdownProps extends PlaylistHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  currentId?: string;
}

/**
 * Compact dropdown version of the history list, anchored under the search bar.
 * The parent element must be `relative`.
 */
export const PlaylistHistoryDropdown: React.FC<PlaylistHistoryDropdownProps> = ({
  isOpen,
  onClose,
  currentId,
  entries,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Click-outside backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />

      <div
        id="history-dropdown"
        role="dialog"
        aria-label="Recent playlists"
        className="absolute left-0 right-0 top-full mt-2 z-40 text-left rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] shadow-xl dark:shadow-2xl overflow-hidden animate-in fade-in"
      >
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-slate-100 dark:border-[#222222]">
          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
            Recent Playlists
          </span>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-slate-500 dark:text-[#888888] hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer touch-manipulation"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-xs text-slate-500 dark:text-[#888888]">
            No playlists yet. Analyzed playlists will appear here.
          </p>
        ) : (
          <ul className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-[#222222]">
            {entries.map((entry) => {
              const watched = getWatchedCount(entry.id);
              const pct = entry.activeCount > 0 ? Math.min(100, Math.round((watched / entry.activeCount) * 100)) : 0;
              const isCurrent = entry.id === currentId;
              return (
                <li key={entry.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (!isCurrent) onSelect(entry.id);
                    }}
                    className={`w-full text-left pl-3 pr-10 py-2 flex items-center gap-3 transition-colors cursor-pointer touch-manipulation ${
                      isCurrent ? 'bg-red-50 dark:bg-red-600/10' : 'hover:bg-slate-50 dark:hover:bg-[#212121]'
                    }`}
                  >
                    <div className="w-16 h-10 shrink-0 rounded overflow-hidden bg-slate-200 dark:bg-[#212121]">
                      {entry.thumbnail ? (
                        <img src={entry.thumbnail} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PlaySquare className="w-4 h-4 text-slate-400 dark:text-[#717171]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{entry.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#AAAAAA] truncate">
                        {isCurrent && <span className="text-red-600 dark:text-red-400 font-medium">Viewing &bull; </span>}
                        {entry.totalVideos} videos &bull; {formatCompactDuration(entry.totalDurationSeconds)} &bull; {pct}% watched &bull; {formatRelativeTime(entry.savedAt)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md text-slate-400 dark:text-[#717171] hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-[#272727] transition-colors cursor-pointer touch-manipulation"
                    title="Remove from history"
                    aria-label={`Remove ${entry.title} from history`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};
