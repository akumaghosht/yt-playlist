import React, { useState, useEffect } from 'react';
import {
  Search,
  Key,
  Clock,
  Layers,
  TrendingUp,
  Award,
  Share2,
  ExternalLink,
  AlertCircle,
  Check,
  PlaySquare,
  X,
  RotateCw,
  Zap,
  Loader2,
} from 'lucide-react';
import type { PlaylistAnalysis } from '../../types/playlist';
import {
  extractPlaylistId,
  fetchPlaylistFromYouTube,
  getActiveApiKey,
  formatCompactDuration,
  formatViewCount,
} from '../../utils/youtube';
import { getCachedPlaylist } from '../../utils/cache';
import { SpeedMatrix } from './SpeedMatrix';
import { ProgressTracker } from './ProgressTracker';
import { SchedulePlanner } from './SchedulePlanner';
import { VideoTable } from './VideoTable';
import { SettingsModal } from './SettingsModal';

interface PlaylistAnalyzerProps {
  defaultApiKey?: string;
}

export const PlaylistAnalyzer: React.FC<PlaylistAnalyzerProps> = ({ defaultApiKey = '' }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PlaylistAnalysis | null>(null);

  // Speed matrix active speed
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);

  // Range selector
  const [startIndex, setStartIndex] = useState<number>(1);
  const [endIndex, setEndIndex] = useState<number>(1);

  // Watched state persisted per playlist
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // Share link toast
  const [shareToast, setShareToast] = useState(false);

  // Initialize from LocalStorage & URL query params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load custom key from user_yt_api_key or yt_custom_api_key
    const savedKey =
      localStorage.getItem('user_yt_api_key') ||
      localStorage.getItem('yt_custom_api_key') ||
      '';
    setCustomApiKey(savedKey);

    // Check URL search params
    const params = new URLSearchParams(window.location.search);
    const listParam = params.get('list') || params.get('id');

    if (listParam) {
      setInputUrl(listParam);
      fetchAnalysis(listParam, savedKey, false);
    }
  }, []);

  // Update Range indices and preferences when analysis data changes
  useEffect(() => {
    if (analysis?.videos) {
      // 1. Load saved watched IDs (permanent)
      const watchedKey = `yt_watched_${analysis.playlist.id}`;
      const savedWatched = localStorage.getItem(watchedKey);
      if (savedWatched) {
        try {
          const parsed = JSON.parse(savedWatched);
          if (Array.isArray(parsed)) {
            setWatchedIds(new Set(parsed));
          }
        } catch {
          setWatchedIds(new Set());
        }
      } else {
        setWatchedIds(new Set());
      }

      // 2. Load custom user preferences (speed, range selection - permanent)
      const prefsKey = `yt_prefs_${analysis.playlist.id}`;
      const savedPrefs = localStorage.getItem(prefsKey);
      if (savedPrefs) {
        try {
          const prefs = JSON.parse(savedPrefs);
          if (typeof prefs.speed === 'number' && prefs.speed > 0) {
            setCurrentSpeed(prefs.speed);
          }
          if (typeof prefs.start === 'number' && typeof prefs.end === 'number') {
            setStartIndex(Math.max(1, Math.min(prefs.start, analysis.videos.length)));
            setEndIndex(Math.max(1, Math.min(prefs.end, analysis.videos.length)));
            return;
          }
        } catch {}
      }

      // Default range: all videos
      setStartIndex(1);
      setEndIndex(analysis.videos.length);
    }
  }, [analysis]);

  // Persist preferences (speed and range) per playlist
  const savePreferences = (speed: number, start: number, end: number) => {
    if (!analysis) return;
    const prefsKey = `yt_prefs_${analysis.playlist.id}`;
    localStorage.setItem(
      prefsKey,
      JSON.stringify({
        speed,
        start,
        end,
      })
    );
  };

  // Toggle video watched state
  const handleToggleWatched = (videoId: string) => {
    if (!analysis) return;
    const next = new Set(watchedIds);
    if (next.has(videoId)) {
      next.delete(videoId);
    } else {
      next.add(videoId);
    }
    setWatchedIds(next);

    const storageKey = `yt_watched_${analysis.playlist.id}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
  };

  const handleToggleAllWatched = (markAll: boolean) => {
    if (!analysis) return;
    const next = new Set(watchedIds);
    const rangeVideos = analysis.videos.slice(startIndex - 1, endIndex);

    for (const v of rangeVideos) {
      if (!v.isUnavailable) {
        if (markAll) {
          next.add(v.id);
        } else {
          next.delete(v.id);
        }
      }
    }
    setWatchedIds(next);

    const storageKey = `yt_watched_${analysis.playlist.id}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
  };

  const handleSetWatchedCount = (count: number) => {
    if (!analysis) return;
    const next = new Set<string>();
    const activeVideos = analysis.videos.filter((v) => !v.isUnavailable);
    for (let i = 0; i < Math.min(count, activeVideos.length); i++) {
      next.add(activeVideos[i].id);
    }
    setWatchedIds(next);

    const storageKey = `yt_watched_${analysis.playlist.id}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
  };

  // 100% Client-Side Direct Fetching via YouTube Data API v3 with 24h Cache
  const fetchAnalysis = async (
    urlOrId: string,
    apiKeyOverride?: string,
    bypassCache = false
  ) => {
    const trimmed = urlOrId.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a YouTube playlist URL or ID.');
      return;
    }

    // Extract Playlist ID
    const playlistId = extractPlaylistId(trimmed);
    if (!playlistId) {
      setErrorMessage(
        'Invalid YouTube playlist URL or ID. Please check format (e.g., https://www.youtube.com/playlist?list=PL... or PL...)'
      );
      return;
    }

    // Check if cached before showing spinner
    if (!bypassCache) {
      const cached = getCachedPlaylist(playlistId);
      if (cached) {
        setAnalysis(cached);
        setErrorMessage(null);
        updateBrowserUrl(playlistId);
        return;
      }
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const activeKey = apiKeyOverride || customApiKey || defaultApiKey || getActiveApiKey();
      const result = await fetchPlaylistFromYouTube(playlistId, activeKey, bypassCache);
      setAnalysis(result);
      updateBrowserUrl(playlistId);
    } catch (err: any) {
      console.error('YouTube Data API fetch error:', err);
      if (err.code === 'NO_API_KEY') {
        setErrorMessage('API key is not configured in .env or Settings.');
      } else if (err.code === 'QUOTA_EXCEEDED') {
        setErrorMessage('YouTube Data API quota exceeded for this key.');
      } else {
        setErrorMessage(err.message || 'An error occurred while fetching playlist details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateBrowserUrl = (playlistId: string) => {
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('list', playlistId);
      window.history.replaceState({}, '', currentUrl.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalysis(inputUrl);
  };

  // Auto-clean URL on paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const playlistId = extractPlaylistId(text);
    if (playlistId) {
      e.preventDefault();
      setInputUrl(playlistId);
      fetchAnalysis(playlistId);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  // Compute active range seconds for SchedulePlanner
  const activeRangeSeconds = analysis
    ? analysis.videos
      .slice(Math.max(0, startIndex - 1), endIndex)
      .filter((v) => !v.isUnavailable && !watchedIds.has(v.id))
      .reduce((acc, v) => acc + v.durationSeconds, 0)
    : 0;

  return (
    <div className="w-full space-y-8">
      {/* 1. HERO SEARCH SECTION */}
      <section className="relative pt-6 pb-2">
        <div className="max-w-4xl mx-auto text-center space-y-4">

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            YouTube Playlist <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-amber-500">Length Checker</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-[#AAAAAA] max-w-2xl mx-auto leading-relaxed">
            Calculate exact runtime at 1.0x to 2.0x speeds, customize subsets with range selectors, track progress, and project study deadlines in seconds.
          </p>

          {/* Search Box Form */}
          <form onSubmit={handleSubmit} className="pt-2 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1.5 bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-xl sm:rounded-full shadow-lg dark:shadow-2xl focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all">
              <div className="flex items-center pl-3.5 flex-1 min-w-0">
                <Search className="w-5 h-5 text-slate-400 dark:text-[#717171] shrink-0" />
                <input
                  type="text"
                  placeholder="Paste YouTube playlist URL, video link, or ID..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onPaste={handlePaste}
                  className="w-full px-3 py-2.5 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#717171] focus:outline-none font-mono"
                />
                {inputUrl && (
                  <button
                    type="button"
                    onClick={() => setInputUrl('')}
                    className="p-1 text-slate-400 dark:text-[#717171] hover:text-slate-900 dark:hover:text-white mr-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 px-1.5 sm:px-0">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2.5 rounded-full text-slate-600 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#272727] transition-colors relative"
                  title="API Key Settings"
                  aria-label="API Settings"
                >
                  <Key className="w-5 h-5" />
                  {customApiKey && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold tracking-wide transition-all shadow-lg shadow-red-950/20 dark:shadow-red-950/40 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Calculate Length</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick example link hints */}
          <div className="text-xs text-slate-400 dark:text-[#717171] font-mono flex items-center justify-center gap-2 flex-wrap pt-1">
            <span>Supports:</span>
            <span className="text-slate-600 dark:text-[#AAAAAA]">youtube.com/playlist?list=...</span>
            <span>&bull;</span>
            <span className="text-slate-600 dark:text-[#AAAAAA]">watch?v=...&list=...</span>
            <span>&bull;</span>
            <span className="text-slate-600 dark:text-[#AAAAAA]">youtu.be/...</span>
            <span>&bull;</span>
            <span className="text-slate-600 dark:text-[#AAAAAA]">Raw IDs (PL...)</span>
          </div>
        </div>
      </section>

      {/* Subtle inline error feedback */}
      {errorMessage && (
        <div className="pt-2 text-xs text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 font-mono animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-[#181818] border border-slate-300 dark:border-[#272727] rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 dark:bg-[#181818] border border-slate-300 dark:border-[#272727] rounded-xl" />
          <div className="h-96 bg-slate-200 dark:bg-[#181818] border border-slate-300 dark:border-[#272727] rounded-xl" />
        </div>
      )}

      {/* 2. ANALYZED DASHBOARD CONTENT */}
      {!isLoading && analysis && (
        <div className="space-y-8">
          {/* Playlist Header Banner */}
          <div className="p-5 md:p-6 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-16 sm:w-28 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-200 dark:bg-[#212121] border border-slate-300 dark:border-[#272727]">
                <img
                  src={analysis.playlist.thumbnail}
                  alt={analysis.playlist.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <PlaySquare className="w-6 h-6 text-white/90 drop-shadow" />
                </div>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {analysis.playlist.title}
                  </h2>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#AAAAAA] flex items-center gap-2">
                  <span>By <strong className="text-slate-900 dark:text-white">{analysis.playlist.channelTitle}</strong></span>
                  <span>&bull;</span>
                  <span>{analysis.totalVideos} total videos</span>
                  {analysis.unavailableCount > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      ({analysis.unavailableCount} unavailable)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => fetchAnalysis(analysis.playlist.id, customApiKey, true)}
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] hover:border-slate-300 dark:hover:border-[#383838] text-xs font-semibold text-slate-700 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Refresh Live</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] hover:border-slate-300 dark:hover:border-[#383838] text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors"
              >
                {shareToast ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                <span>{shareToast ? 'Link Copied!' : 'Share Analysis'}</span>
              </button>

              <a
                href={`https://www.youtube.com/playlist?list=${analysis.playlist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red-600/20 border border-red-200 dark:border-red-500/40 hover:bg-red-100 dark:hover:bg-red-600/30 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors"
              >
                <span>Open on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Stat Overview Cards (Adhering to @DESIGN.md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Duration */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-2 relative group hover:border-slate-300 dark:hover:border-[#383838] shadow-sm transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-[#AAAAAA]">
                <span className="text-xs font-mono uppercase tracking-wider">Total Duration</span>
                <Clock className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatCompactDuration(analysis.totalDurationSeconds)}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#717171] leading-relaxed line-clamp-1" title={analysis.totalFormatted}>
                {analysis.totalFormatted}
              </p>
            </div>

            {/* Stat 2: Active vs Unavailable Videos */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-2 relative group hover:border-slate-300 dark:hover:border-[#383838] shadow-sm transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-[#AAAAAA]">
                <span className="text-xs font-mono uppercase tracking-wider">Videos Count</span>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {analysis.activeCount}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-[#AAAAAA]">active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#717171]">
                {analysis.unavailableCount > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {analysis.unavailableCount} private or deleted
                  </span>
                ) : (
                  '100% active streamable'
                )}
              </p>
            </div>

            {/* Stat 3: Average Video Length */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-2 relative group hover:border-slate-300 dark:hover:border-[#383838] shadow-sm transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-[#AAAAAA]">
                <span className="text-xs font-mono uppercase tracking-wider">Average Video</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {analysis.averageFormatted}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#717171]">Across active videos</p>
            </div>

            {/* Stat 4: Total View Count */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-2 relative group hover:border-slate-300 dark:hover:border-[#383838] shadow-sm transition-colors">
              <div className="flex items-center justify-between text-slate-500 dark:text-[#AAAAAA]">
                <span className="text-xs font-mono uppercase tracking-wider">Total Views</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formatViewCount(analysis.totalViews)}
              </div>
              <p className="text-xs text-slate-500 dark:text-[#717171]">Combined playlist engagement</p>
            </div>
          </div>

          {/* Longest & Shortest Highlights */}
          {(analysis.longestVideo || analysis.shortestVideo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.shortestVideo && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono uppercase text-emerald-600 dark:text-emerald-400 tracking-wider font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Shortest Video
                    </span>
                    <a
                      href={analysis.shortestVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 font-medium block truncate mt-0.5"
                    >
                      #{analysis.shortestVideo.position}: {analysis.shortestVideo.title}
                    </a>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {analysis.shortestVideo.durationFormatted}
                  </span>
                </div>
              )}

              {analysis.longestVideo && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] flex items-center justify-between gap-3 text-xs shadow-sm">
                  <div className="min-w-0">
                    <span className="text-[11px] font-mono uppercase text-amber-600 dark:text-amber-400 tracking-wider font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Longest Video
                    </span>
                    <a
                      href={analysis.longestVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 font-medium block truncate mt-0.5"
                    >
                      #{analysis.longestVideo.position}: {analysis.longestVideo.title}
                    </a>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#212121] border border-slate-200 dark:border-[#272727] font-mono font-bold text-slate-900 dark:text-white shrink-0">
                    {analysis.longestVideo.durationFormatted}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Speed Matrix Grid */}
          <SpeedMatrix
            totalSeconds={analysis.totalDurationSeconds}
            currentSpeed={currentSpeed}
            onSpeedSelect={(speed) => {
              setCurrentSpeed(speed);
              savePreferences(speed, startIndex, endIndex);
            }}
          />

          {/* Range & Progress Tracker */}
          <ProgressTracker
            videos={analysis.videos}
            startIndex={startIndex}
            endIndex={endIndex}
            onRangeChange={(s, e) => {
              setStartIndex(s);
              setEndIndex(e);
              savePreferences(currentSpeed, s, e);
            }}
            watchedIds={watchedIds}
            onToggleAllWatched={handleToggleAllWatched}
            onSetWatchedCount={handleSetWatchedCount}
            currentSpeed={currentSpeed}
          />

          {/* Smart Study & Schedule Planner */}
          <SchedulePlanner
            totalSecondsToWatch={activeRangeSeconds > 0 ? activeRangeSeconds : analysis.totalDurationSeconds}
            currentSpeed={currentSpeed}
          />

          {/* Interactive Video Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                All Videos in Playlist ({analysis.videos.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-[#717171] font-mono">
                Click any row checkbox to mark as watched
              </span>
            </div>
            <VideoTable
              videos={analysis.videos}
              watchedIds={watchedIds}
              onToggleWatched={handleToggleWatched}
              playlistTitle={analysis.playlist.title}
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeyChange={(key) => {
          setCustomApiKey(key);
          if (inputUrl) {
            fetchAnalysis(inputUrl, key, true);
          }
        }}
      />
    </div>
  );
};
