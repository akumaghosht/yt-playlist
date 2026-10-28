import type { PlaylistAnalysis, VideoItem } from '../types/playlist';
import { getCachedPlaylist, setCachedPlaylist } from './cache';

/**
 * YouTube Playlist ID extractor and URL cleaner
 * Handles standard URLs, video links with playlist context, short links, and raw IDs
 */
export function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Raw ID pattern (YouTube playlist IDs usually start with PL, UU, FL, RD, or OLAK5uy_)
  const rawIdPattern = /^(PL|UU|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]{8,}$/i;
  if (rawIdPattern.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    // 2. Query parameter ?list= or &list=
    const listParam = url.searchParams.get('list');
    if (listParam) {
      return listParam;
    }

    // 3. /playlist/ID pathname format
    const playlistPathMatch = url.pathname.match(/\/playlist\/(PL[a-zA-Z0-9_-]+)/i);
    if (playlistPathMatch) {
      return playlistPathMatch[1];
    }
  } catch {
    // If input is not a full URL with protocol, check if there's a list= substring
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1];
    }
  }

  // Fallback regex pattern matching anywhere in the string
  const fallbackMatch = trimmed.match(/(PL[a-zA-Z0-9_-]{16,40}|UU[a-zA-Z0-9_-]{22}|FL[a-zA-Z0-9_-]{22}|RD[a-zA-Z0-9_-]{16,})/);
  if (fallbackMatch) {
    return fallbackMatch[1];
  }

  return null;
}

/**
 * ISO 8601 Duration Parser
 * Parses YouTube duration formats: P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?
 * Returns duration in integer seconds. Returns 0 for empty, live streams, or malformed values.
 */
export function parseIsoDuration(durationStr: string): number {
  if (!durationStr || durationStr === 'PT0S' || durationStr === 'P0D') {
    return 0;
  }

  const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
  const matches = durationStr.match(regex);

  if (!matches) {
    return 0;
  }

  const days = parseInt(matches[4] || '0', 10);
  const hours = parseInt(matches[5] || '0', 10);
  const minutes = parseInt(matches[6] || '0', 10);
  const seconds = parseInt(matches[7] || '0', 10);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Retrieve active API key:
 * Checks localStorage ('user_yt_api_key' or 'yt_custom_api_key') first,
 * then falls back to PUBLIC_YOUTUBE_API_KEY environment variable.
 */
export function getActiveApiKey(): string {
  if (typeof window !== 'undefined') {
    const userKey =
      localStorage.getItem('user_yt_api_key') ||
      localStorage.getItem('yt_custom_api_key');
    if (userKey && userKey.trim()) {
      return userKey.trim();
    }
  }
  return import.meta.env.PUBLIC_YOUTUBE_API_KEY || '';
}

/**
 * 2-Step Paginated Batch Fetcher directly in browser (CORS supported by YouTube Data API v3)
 * Step A: Fetch up to 500 items via playlistItems.list with while(nextPageToken) loop.
 * Step B: Chunk collected video IDs into batches of 50 and query videos.list for durations & statistics.
 *
 * Integrated 24-Hour localStorage Caching to preserve daily API quotas!
 */
export async function fetchPlaylistFromYouTube(
  playlistId: string,
  explicitApiKey?: string,
  bypassCache = false
): Promise<PlaylistAnalysis> {
  // Check 24h cache first if not explicitly bypassed
  if (!bypassCache) {
    const cached = getCachedPlaylist(playlistId);
    if (cached) {
      return cached;
    }
  }

  const apiKey = (explicitApiKey || getActiveApiKey()).trim();

  if (!apiKey) {
    const error: any = new Error(
      'YouTube Data API key required. Please set PUBLIC_YOUTUBE_API_KEY in your .env file or input your custom key in Settings.'
    );
    error.code = 'NO_API_KEY';
    throw error;
  }

  const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

  // 1. Fetch Playlist Metadata
  let playlistTitle = 'YouTube Playlist';
  let playlistDescription = '';
  let playlistChannel = '';
  let playlistThumbnail = '';

  try {
    const metaUrl = `${YOUTUBE_API_BASE}/playlists?part=snippet&id=${encodeURIComponent(
      playlistId
    )}&key=${apiKey}`;
    const metaRes = await fetch(metaUrl);
    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      handleApiError(metaData, metaRes.status);
    }

    if (metaData.items && metaData.items.length > 0) {
      const snip = metaData.items[0].snippet;
      playlistTitle = snip.title || playlistTitle;
      playlistDescription = snip.description || '';
      playlistChannel = snip.channelTitle || '';
      playlistThumbnail =
        snip.thumbnails?.maxres?.url ||
        snip.thumbnails?.high?.url ||
        snip.thumbnails?.medium?.url ||
        snip.thumbnails?.default?.url ||
        '';
    }
  } catch (err: any) {
    if (err.code) throw err;
  }

  // 2. Step A: Paginated Fetch of playlistItems (up to 500 items / 10 pages)
  interface RawPlaylistItem {
    id: string;
    position: number;
    videoId: string;
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnail: string;
    isUnavailable: boolean;
  }

  const collectedItems: RawPlaylistItem[] = [];
  let nextPageToken = '';
  let pageCount = 0;
  const maxPages = 10; // 10 * 50 = 500 videos

  do {
    const itemsUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
      playlistId
    )}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${apiKey}`;

    const itemsRes = await fetch(itemsUrl);
    const itemsData = await itemsRes.json();

    if (!itemsRes.ok) {
      handleApiError(itemsData, itemsRes.status);
    }

    if (itemsData.items && itemsData.items.length > 0) {
      for (const item of itemsData.items) {
        const videoId = item.contentDetails?.videoId;
        const title = item.snippet?.title || '';
        const desc = item.snippet?.description || '';

        // Edge-case isolation: Tag private / deleted / unavailable videos
        const isUnavailable =
          !videoId ||
          title === 'Private video' ||
          title === 'Deleted video' ||
          desc === 'This video is private.' ||
          desc === 'This video is deleted.';

        const thumb =
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          '';

        collectedItems.push({
          id: item.id,
          position: collectedItems.length + 1,
          videoId: videoId || `unavailable_${collectedItems.length + 1}`,
          title: isUnavailable ? (title || 'Unavailable Video') : title,
          channelTitle: item.snippet?.videoOwnerChannelTitle || playlistChannel || '',
          publishedAt: item.snippet?.publishedAt || '',
          thumbnail: thumb,
          isUnavailable,
        });
      }
    }

    nextPageToken = itemsData.nextPageToken || '';
    pageCount++;
  } while (nextPageToken && pageCount < maxPages);

  if (collectedItems.length === 0) {
    const err: any = new Error(
      'This playlist appears to be empty or is marked Private. Please ensure the playlist is Public or Unlisted.'
    );
    err.code = 'EMPTY_PLAYLIST';
    throw err;
  }

  // 3. Step B: Chunk collected video IDs into batches of 50 and fetch durations & statistics
  const activeVideoIds = collectedItems
    .filter((it) => !it.isUnavailable && it.videoId && !it.videoId.startsWith('unavailable_'))
    .map((it) => it.videoId);

  interface VideoDetailMap {
    [id: string]: {
      durationSeconds: number;
      durationRaw: string;
      viewCount: number;
      thumbnail?: string;
      title?: string;
    };
  }

  const detailsMap: VideoDetailMap = {};
  const chunkSize = 50;

  for (let i = 0; i < activeVideoIds.length; i += chunkSize) {
    const chunk = activeVideoIds.slice(i, i + chunkSize);
    const videosUrl = `${YOUTUBE_API_BASE}/videos?part=contentDetails,snippet,statistics&id=${chunk.join(
      ','
    )}&key=${apiKey}`;

    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    if (videosRes.ok && videosData.items) {
      for (const vid of videosData.items) {
        const durRaw = vid.contentDetails?.duration || 'PT0S';
        const durSec = parseIsoDuration(durRaw);
        const views = parseInt(vid.statistics?.viewCount || '0', 10);
        const thumb =
          vid.snippet?.thumbnails?.medium?.url ||
          vid.snippet?.thumbnails?.high?.url ||
          vid.snippet?.thumbnails?.default?.url;

        detailsMap[vid.id] = {
          durationSeconds: durSec,
          durationRaw: durRaw,
          viewCount: views,
          thumbnail: thumb,
          title: vid.snippet?.title,
        };
      }
    }
  }

  // 4. Combine into final list of VideoItems
  const finalVideos: VideoItem[] = collectedItems.map((item) => {
    const details = detailsMap[item.videoId];
    const isUnavail =
      item.isUnavailable ||
      !details ||
      (details.durationSeconds === 0 && details.durationRaw === 'PT0S' && item.title.includes('Private'));
    const durationSeconds = details?.durationSeconds || 0;

    return {
      id: item.videoId,
      playlistItemId: item.id,
      position: item.position,
      title: details?.title && !details.title.includes('Private') ? details.title : item.title,
      channelTitle: item.channelTitle,
      publishedAt: item.publishedAt,
      durationRaw: details?.durationRaw || 'PT0S',
      durationSeconds,
      durationFormatted: isUnavail ? 'Unavailable' : formatCompactDuration(durationSeconds),
      viewCount: details?.viewCount || 0,
      thumbnail: details?.thumbnail || item.thumbnail || playlistThumbnail,
      isUnavailable: isUnavail,
      videoUrl: item.videoId.startsWith('unavailable_')
        ? `https://www.youtube.com/playlist?list=${playlistId}`
        : `https://www.youtube.com/watch?v=${item.videoId}&list=${playlistId}`,
    };
  });

  const activeVideos = finalVideos.filter((v) => !v.isUnavailable);
  const totalDurationSeconds = activeVideos.reduce((acc, v) => acc + v.durationSeconds, 0);
  const averageDurationSeconds =
    activeVideos.length > 0 ? Math.round(totalDurationSeconds / activeVideos.length) : 0;
  const totalViews = activeVideos.reduce((acc, v) => acc + v.viewCount, 0);

  const sortedByDuration = [...activeVideos].sort((a, b) => a.durationSeconds - b.durationSeconds);
  const shortestVideo = sortedByDuration[0] || null;
  const longestVideo = sortedByDuration[sortedByDuration.length - 1] || null;

  const totalVideos = finalVideos.length;
  const unavailableCount = totalVideos - activeVideos.length;

  const result: PlaylistAnalysis = {
    playlist: {
      id: playlistId,
      title: playlistTitle,
      description: playlistDescription,
      channelTitle: playlistChannel,
      thumbnail: playlistThumbnail || (finalVideos[0]?.thumbnail || ''),
      itemCount: totalVideos,
      activeItemCount: activeVideos.length,
      unavailableItemCount: unavailableCount,
    },
    videos: finalVideos,
    totalVideos,
    unavailableCount,
    activeCount: activeVideos.length,
    totalDurationSeconds,
    totalSeconds: totalDurationSeconds,
    totalFormatted: formatDetailedDuration(totalDurationSeconds),
    averageDurationSeconds,
    averageSeconds: averageDurationSeconds,
    averageFormatted: formatCompactDuration(averageDurationSeconds),
    longestVideo,
    shortestVideo,
    totalViews,
  };

  // Cache result for 24 hours in localStorage
  setCachedPlaylist(playlistId, result);

  return result;
}

function handleApiError(data: any, status: number): never {
  const errorObj = data?.error;
  const reason = errorObj?.errors?.[0]?.reason || '';
  const message = errorObj?.message || 'Failed to communicate with YouTube API.';

  const err: any = new Error(message);
  err.status = status;

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    err.code = 'QUOTA_EXCEEDED';
    err.message =
      'YouTube Data API quota exceeded for the current key. Please add your personal free YouTube API key in Settings to continue.';
  } else if (reason === 'keyInvalid' || reason === 'badRequest') {
    err.code = 'INVALID_API_KEY';
    err.message = 'The YouTube API key provided is invalid or disabled. Please check your key in Settings.';
  } else if (status === 404) {
    err.code = 'NOT_FOUND';
    err.message = 'Playlist not found. Please verify the playlist URL or ensure the playlist is Public or Unlisted.';
  } else {
    err.code = 'API_ERROR';
  }

  throw err;
}

/**
 * Format total seconds into a detailed human-readable string:
 * e.g., "1 day, 4 hours, 12 minutes, 30 seconds" or "4h 12m 30s"
 */
export function formatDetailedDuration(seconds: number): string {
  if (seconds <= 0) return '0 seconds';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} min${minutes > 1 ? 's' : ''}`);
  }
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} sec${remainingSeconds > 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Format seconds into a compact string:
 * e.g., "4h 12m 30s" or "18m 45s" or "32s"
 */
export function formatCompactDuration(seconds: number): string {
  if (seconds <= 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remSec = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remSec}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${remSec}s`;
  }
  return `${remSec}s`;
}

/**
 * Format seconds as a digital clock:
 * e.g., "14:22" or "1:05:12"
 */
export function formatClock(seconds: number): string {
  if (seconds <= 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Format view counts into compact readable format (e.g., 1.4M, 250K)
 */
export function formatViewCount(views: number): string {
  if (!views || views <= 0) return '0';
  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return views.toLocaleString();
}

/**
 * Format publication date into "MMM DD, YYYY"
 */
export function formatPublishDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
