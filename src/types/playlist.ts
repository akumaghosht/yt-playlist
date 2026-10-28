export interface VideoItem {
  id: string;
  playlistItemId?: string;
  position: number; // 1-based index in playlist
  title: string;
  channelTitle: string;
  publishedAt: string;
  durationRaw: string; // ISO 8601 string, e.g. PT14M22S
  durationSeconds: number; // In seconds
  durationFormatted: string; // "14m 22s" or "1h 05m 12s"
  viewCount: number;
  thumbnail: string;
  isUnavailable: boolean; // Private, deleted, or missing
  videoUrl: string;
}

export interface PlaylistMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId?: string;
  thumbnail: string;
  itemCount: number;
  activeItemCount: number;
  unavailableItemCount: number;
}

export interface PlaylistAnalysis {
  playlist: PlaylistMetadata;
  videos: VideoItem[];
  totalVideos: number;
  unavailableCount: number;
  activeCount: number;
  totalDurationSeconds: number;
  totalSeconds: number;
  totalFormatted: string;
  averageDurationSeconds: number;
  averageSeconds: number;
  averageFormatted: string;
  longestVideo: VideoItem | null;
  shortestVideo: VideoItem | null;
  totalViews: number;
  isDemo?: boolean;
  sourceNotice?: string;
}

export interface SpeedComparison {
  speed: number;
  label: string;
  seconds: number;
  formatted: string;
  savedSeconds: number;
  savedFormatted: string;
  percentageSaved: number;
}

export interface SchedulePlan {
  dailyMinutes: number;
  daysPerWeek: number;
  speed: number;
  totalSessions: number;
  totalDays: number;
  completionDate: string; // formatted date
}
