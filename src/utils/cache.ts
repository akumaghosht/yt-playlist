import type { PlaylistAnalysis } from '../types/playlist';

const CACHE_PREFIX = 'yt_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds

interface CacheEntry {
  timestamp: number;
  data: PlaylistAnalysis;
}

/**
 * Retrieve a cached playlist analysis from localStorage if within the 24-hour TTL
 */
export function getCachedPlaylist(playlistId: string): PlaylistAnalysis | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${playlistId}`);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);
    const now = Date.now();

    // Check if within 24h TTL
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }

    // Expired, clear entry
    localStorage.removeItem(`${CACHE_PREFIX}${playlistId}`);
  } catch (err) {
    console.warn('Failed to parse cached playlist:', err);
  }

  return null;
}

/**
 * Store playlist analysis in localStorage with a 24-hour timestamp
 */
export function setCachedPlaylist(playlistId: string, data: PlaylistAnalysis): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`${CACHE_PREFIX}${playlistId}`, JSON.stringify(entry));
  } catch (err) {
    console.warn('Failed to save playlist to cache (storage may be full):', err);
  }
}

/**
 * Remove a specific playlist or all playlists from cache
 */
export function clearPlaylistCache(playlistId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    if (playlistId) {
      localStorage.removeItem(`${CACHE_PREFIX}${playlistId}`);
    } else {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}

