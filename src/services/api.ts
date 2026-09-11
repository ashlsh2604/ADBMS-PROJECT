import { Video, Channel, MonthlyGrowth, TrendingAlert, DbmsQueryResult, FilterState, UserAccount } from '../types/database';
import { VIDEOS, CHANNELS, MONTHLY_GROWTH_DATA, INITIAL_TRENDING_ALERTS, INITIAL_USER_ACCOUNT, DBMS_SCHEMA } from '../data/mockDbmsData';

export interface DbStatusInfo {
  connected: boolean;
  mode: 'mysql_live' | 'mysql_compatible';
  engine: string;
  host: string;
  port: number;
  database: string;
  user: string;
  tablesCount: number;
  totalRows: number;
  totalQueriesExecuted: number;
  uptimeSeconds: number;
  lastConnectedAt?: string;
  errorMessage?: string;
}

const API_BASE = '/api';

/**
 * Helper to make API requests with automatic JSON parsing and graceful fallback
 */
async function fetchJson<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Request to ${url} failed, using client-side fallback:`, err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

// ==========================================
// Videos API
// ==========================================
export async function fetchVideos(filter?: Partial<FilterState>): Promise<Video[]> {
  const params = new URLSearchParams();
  if (filter?.category && filter.category !== 'all') params.append('category', filter.category);
  if (filter?.bikeFilter) params.append('bike', filter.bikeFilter);
  if (filter?.searchQuery) params.append('search', filter.searchQuery);
  if (filter?.dateRange && filter.dateRange !== 'all') params.append('dateRange', filter.dateRange);
  if (filter?.sortBy) params.append('sortBy', filter.sortBy);
  if (filter?.sortOrder) params.append('sortOrder', filter.sortOrder);

  const queryStr = params.toString();
  const url = `${API_BASE}/videos${queryStr ? `?${queryStr}` : ''}`;
  return fetchJson<Video[]>(url, undefined, VIDEOS);
}

export async function fetchVideoById(id: string): Promise<Video | null> {
  const fallback = VIDEOS.find((v) => v.video_id === id) || null;
  return fetchJson<Video | null>(`${API_BASE}/videos/${id}`, undefined, fallback);
}

export async function fetchComparisonVideos(ids: string[]): Promise<Video[]> {
  const fallback = VIDEOS.filter((v) => ids.includes(v.video_id));
  return fetchJson<Video[]>(`${API_BASE}/videos/compare?ids=${ids.join(',')}`, undefined, fallback);
}

export async function createVideoApi(videoData: Partial<Video>): Promise<Video> {
  try {
    const res = await fetch(`${API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(videoData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend video creation fallback to local creation', err);
  }
  
  // Local fallback object
  const newVid: Video = {
    video_id: videoData.video_id || `ash_vid_${Date.now()}`,
    channel_id: 'ashrides26_official',
    title: videoData.title || 'New AshRides26 Video',
    thumbnail_url: videoData.thumbnail_url || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    category: videoData.category || 'vlog',
    bike_model: videoData.bike_model || 'Adventure Rig',
    duration_seconds: Number(videoData.duration_seconds) || 1200,
    upload_date: videoData.upload_date || new Date().toISOString().split('T')[0],
    views: Number(videoData.views) || 1000,
    likes: Number(videoData.likes) || 150,
    comments: Number(videoData.comments) || 30,
    retention_pct: Number(videoData.retention_pct) || 70,
    watch_time_hours: Number(videoData.watch_time_hours) || 250,
    ctr_pct: Number(videoData.ctr_pct) || 12.0,
    cpm_usd: Number(videoData.cpm_usd) || 7.5,
    estimated_revenue_usd: Number(videoData.estimated_revenue_usd) || 7.5,
    velocity_views_per_hr: Number(videoData.velocity_views_per_hr) || 100,
    tags: videoData.tags || ['AshRides26', 'Adventure'],
    is_trending: false,
    trending_score: 50,
    youtube_url: videoData.youtube_url || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Intro' },
      { second: 600, pct_retention: 75, chapter_name: 'Main Content' },
      { second: 1200, pct_retention: 60, chapter_name: 'Outro' }
    ]
  };
  return newVid;
}

// ==========================================
// Channels & Benchmarks API
// ==========================================
export async function fetchChannels(): Promise<Channel[]> {
  return fetchJson<Channel[]>(`${API_BASE}/channels`, undefined, CHANNELS);
}

export async function fetchChannelById(id: string): Promise<Channel | null> {
  const fallback = CHANNELS.find((c) => c.channel_id === id) || null;
  return fetchJson<Channel | null>(`${API_BASE}/channels/${id}`, undefined, fallback);
}

// ==========================================
// Growth & Metrics API
// ==========================================
export async function fetchMonthlyGrowth(): Promise<MonthlyGrowth[]> {
  return fetchJson<MonthlyGrowth[]>(`${API_BASE}/growth`, undefined, MONTHLY_GROWTH_DATA);
}

// ==========================================
// Real-time Alerts API
// ==========================================
export async function fetchAlerts(): Promise<TrendingAlert[]> {
  return fetchJson<TrendingAlert[]>(`${API_BASE}/alerts`, undefined, INITIAL_TRENDING_ALERTS);
}

export async function markAlertAsReadApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/alerts/${id}/read`, { method: 'PUT' });
    return res.ok;
  } catch {
    return true;
  }
}

export async function triggerNewAlertApi(alert: TrendingAlert): Promise<TrendingAlert> {
  return fetchJson<TrendingAlert>(
    `${API_BASE}/alerts/trigger`,
    {
      method: 'POST',
      body: JSON.stringify(alert),
    },
    alert
  );
}

// ==========================================
// DBMS SQL Workbench API
// ==========================================
export async function executeDbQuery(sql: string): Promise<DbmsQueryResult> {
  return fetchJson<DbmsQueryResult>(`${API_BASE}/db/query`, {
    method: 'POST',
    body: JSON.stringify({ sql }),
  });
}

export async function fetchDbStatus(): Promise<DbStatusInfo> {
  return fetchJson<DbStatusInfo>(`${API_BASE}/db/status`, undefined, {
    connected: false,
    mode: 'mysql_compatible',
    engine: 'MySQL 8.0 Relational Layer',
    host: '127.0.0.1',
    port: 3306,
    database: 'ashrides26_db',
    user: 'root',
    tablesCount: 8,
    totalRows: 174,
    totalQueriesExecuted: 28,
    uptimeSeconds: 120,
  });
}

export async function fetchDbSchema(): Promise<any> {
  return fetchJson<any>(`${API_BASE}/db/schema`, undefined, {
    database: 'ashrides26_db',
    tables: DBMS_SCHEMA,
  });
}

export async function testMySqlConnectionApi(config: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}) {
  return fetchJson<any>(`${API_BASE}/db/test-connection`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

// ==========================================
// User Authentication & Device Sync API
// ==========================================
export async function loginUserApi(email: string, role?: string, name?: string): Promise<UserAccount> {
  const result = await fetchJson<{ success: boolean; user: UserAccount }>(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      body: JSON.stringify({ email, role, name }),
    },
    {
      success: true,
      user: {
        ...INITIAL_USER_ACCOUNT,
        email,
        name: name || (email.includes('ash') ? 'Ash (AshRides26)' : email.split('@')[0]),
        role: (role as any) || 'Channel Owner (Ash)',
        last_login: 'Just now',
      },
    }
  );
  return result.user;
}

export async function signupUserApi(name: string, email: string, role?: string): Promise<UserAccount> {
  const result = await fetchJson<{ success: boolean; user: UserAccount }>(
    `${API_BASE}/auth/signup`,
    {
      method: 'POST',
      body: JSON.stringify({ name, email, role }),
    },
    {
      success: true,
      user: {
        ...INITIAL_USER_ACCOUNT,
        id: `usr_${Date.now()}`,
        name,
        email,
        role: (role as any) || 'Data Analyst',
        last_login: 'Just now',
      },
    }
  );
  return result.user;
}

export async function syncDeviceApi(deviceSession: any): Promise<UserAccount> {
  const result = await fetchJson<{ success: boolean; user: UserAccount }>(
    `${API_BASE}/auth/sync`,
    {
      method: 'POST',
      body: JSON.stringify({ deviceSession }),
    },
    {
      success: true,
      user: INITIAL_USER_ACCOUNT,
    }
  );
  return result.user;
}
