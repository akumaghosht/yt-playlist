import type { PlaylistAnalysis } from '../types/playlist';

/**
 * Playlist history: a permanent (no TTL) record of previously analyzed playlists.
 *
 * - `yt_history` holds a lightweight index used to render the history list.
 * - `yt_history_data_<id>` holds the full analysis snapshot so a history entry can be
 *   reopened instantly without spending any API quota.
 */
const INDEX_KEY = 'yt_history';
const DATA_PREFIX = 'yt_history_data_';
const MAX_ENTRIES = 12;

export interface HistoryEntry {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  totalVideos: number;
  activeCount: number;
  totalDurationSeconds: number;
  savedAt: number;
}

export function getPlaylistHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e) => e && typeof e.id === 'string');
  } catch {
    return [];
  }
}

function writeIndex(entries: HistoryEntry[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

/**
 * Add or refresh a playlist in history (moved to the top). Oldest entries are evicted
 * beyond MAX_ENTRIES, or earlier if the browser storage quota is hit.
 */
export function saveToHistory(analysis: PlaylistAnalysis): void {
  if (typeof window === 'undefined' || analysis.isDemo) return;

  const id = analysis.playlist.id;
  const entry: HistoryEntry = {
    id,
    title: analysis.playlist.title,
    channelTitle: analysis.playlist.channelTitle,
    thumbnail: analysis.playlist.thumbnail,
    totalVideos: analysis.totalVideos,
    activeCount: analysis.activeCount,
    totalDurationSeconds: analysis.totalDurationSeconds,
    savedAt: Date.now(),
  };

  let entries = [entry, ...getPlaylistHistory().filter((e) => e.id !== id)];
  while (entries.length > MAX_ENTRIES) {
    const evicted = entries.pop()!;
    localStorage.removeItem(`${DATA_PREFIX}${evicted.id}`);
  }

  const payload = JSON.stringify(analysis);
  // Retry while evicting the oldest entries if storage is full.
  for (;;) {
    try {
      localStorage.setItem(`${DATA_PREFIX}${id}`, payload);
      writeIndex(entries);
      return;
    } catch (err) {
      if (entries.length <= 1) {
        console.warn('Failed to save playlist to history (storage may be full):', err);
        try {
          localStorage.removeItem(`${DATA_PREFIX}${id}`);
          writeIndex(entries.filter((e) => e.id !== id));
        } catch { }
        return;
      }
      const evicted = entries.pop()!;
      localStorage.removeItem(`${DATA_PREFIX}${evicted.id}`);
    }
  }
}

export function loadFromHistory(playlistId: string): PlaylistAnalysis | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${playlistId}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as PlaylistAnalysis;
    return data?.playlist?.id ? data : null;
  } catch {
    return null;
  }
}

export function removeFromHistory(playlistId: string): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const entries = getPlaylistHistory().filter((e) => e.id !== playlistId);
  try {
    localStorage.removeItem(`${DATA_PREFIX}${playlistId}`);
    writeIndex(entries);
  } catch { }
  return entries;
}

export function clearPlaylistHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const e of getPlaylistHistory()) {
      localStorage.removeItem(`${DATA_PREFIX}${e.id}`);
    }
    localStorage.removeItem(INDEX_KEY);
  } catch { }
}

/** Count of watched videos saved for a playlist (from yt_watched_<id>). */
export function getWatchedCount(playlistId: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const parsed = JSON.parse(localStorage.getItem(`yt_watched_${playlistId}`) || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
