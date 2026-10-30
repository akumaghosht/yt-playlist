/**
 * Client-Side Rate Limiter & Abuse Prevention Utility
 *
 * Protects shared YouTube Data API quota against rapid spam, bot loops,
 * and high-volume automated requests on the client side.
 *
 * Rules:
 * 1. Cooldown Period: Requires minimum interval (e.g. 4 seconds) between requests to stop double-clicking/spam.
 * 2. Sliding Window Quota: Limits users on the shared free key to MAX_REQUESTS per WINDOW_MS (e.g. 10 requests / 15 minutes).
 * 3. Custom Key Exemption: Users who supply their own personal YouTube API key in Settings are exempt from the quota.
 * 4. Cache Exemption: Cached playlist retrievals (0 API units) do not consume rate limit quota.
 */

const STORAGE_KEY = 'yt_rate_limit_data';
const COOLDOWN_SECONDS = 4; // Minimum seconds between queries
const WINDOW_MINUTES = 15; // 15-minute sliding window
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10; // Max uncached analyses per 15 mins on shared key

interface RateLimitData {
  timestamps: number[];
  lastRequestTime: number;
}

function getStoredData(): RateLimitData {
  if (typeof window === 'undefined') {
    return { timestamps: [], lastRequestTime: 0 };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { timestamps: [], lastRequestTime: 0 };
    const parsed = JSON.parse(raw);
    return {
      timestamps: Array.isArray(parsed.timestamps) ? parsed.timestamps : [],
      lastRequestTime: typeof parsed.lastRequestTime === 'number' ? parsed.lastRequestTime : 0,
    };
  } catch {
    return { timestamps: [], lastRequestTime: 0 };
  }
}

function saveStoredData(data: RateLimitData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // LocalStorage write failed (e.g. full or private mode quota)
  }
}

export interface RateLimitCheckResult {
  allowed: boolean;
  reason?: 'COOLDOWN' | 'QUOTA_EXCEEDED';
  waitSeconds?: number;
  resetMinutes?: number;
  remainingRequests: number;
}

/**
 * Checks whether an uncached API request is currently permitted.
 * @param isCustomKey Whether the user is using their own custom API key.
 */
export function checkRateLimit(isCustomKey = false): RateLimitCheckResult {
  const now = Date.now();
  const data = getStoredData();

  // 1. Check cooldown (applies to all users to prevent accidental double-clicks)
  const timeSinceLast = now - data.lastRequestTime;
  const cooldownMs = (isCustomKey ? 2 : COOLDOWN_SECONDS) * 1000;
  if (timeSinceLast < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - timeSinceLast) / 1000);
    return {
      allowed: false,
      reason: 'COOLDOWN',
      waitSeconds,
      remainingRequests: isCustomKey ? 999 : Math.max(0, MAX_REQUESTS_PER_WINDOW - data.timestamps.length),
    };
  }

  // 2. Custom keys bypass the sliding window quota entirely
  if (isCustomKey) {
    return {
      allowed: true,
      remainingRequests: 999,
    };
  }

  // 3. Clean up timestamps older than the sliding window
  const activeTimestamps = data.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestTimestamp = activeTimestamps[0];
    const resetTimeMs = oldestTimestamp + WINDOW_MS - now;
    const resetMinutes = Math.max(1, Math.ceil(resetTimeMs / 60000));

    return {
      allowed: false,
      reason: 'QUOTA_EXCEEDED',
      resetMinutes,
      remainingRequests: 0,
    };
  }

  return {
    allowed: true,
    remainingRequests: MAX_REQUESTS_PER_WINDOW - activeTimestamps.length,
  };
}

/**
 * Records an executed API request timestamp.
 * Should only be called when an actual uncached API request is dispatched.
 */
export function recordApiRequest(isCustomKey = false): void {
  const now = Date.now();
  const data = getStoredData();

  const activeTimestamps = data.timestamps.filter((ts) => now - ts < WINDOW_MS);
  if (!isCustomKey) {
    activeTimestamps.push(now);
  }

  saveStoredData({
    timestamps: activeTimestamps,
    lastRequestTime: now,
  });
}

/**
 * Gets remaining seconds on cooldown timer (0 if no cooldown active).
 */
export function getCooldownRemainingSeconds(isCustomKey = false): number {
  const now = Date.now();
  const data = getStoredData();
  const cooldownMs = (isCustomKey ? 2 : COOLDOWN_SECONDS) * 1000;
  const timeSinceLast = now - data.lastRequestTime;

  if (timeSinceLast < cooldownMs) {
    return Math.ceil((cooldownMs - timeSinceLast) / 1000);
  }
  return 0;
}

/**
 * Gets remaining free quota requests in the current window.
 */
export function getRemainingQuota(isCustomKey = false): number {
  if (isCustomKey) return 999;
  const now = Date.now();
  const data = getStoredData();
  const activeTimestamps = data.timestamps.filter((ts) => now - ts < WINDOW_MS);
  return Math.max(0, MAX_REQUESTS_PER_WINDOW - activeTimestamps.length);
}

