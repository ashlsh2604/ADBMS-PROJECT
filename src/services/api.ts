import type { Channel, DbmsQueryResult, FilterState, MonthlyGrowth, TrendingAlert, UserAccount, Video } from '../types/database';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface AppConfig {
  demoMode: boolean;
  engine: string;
  presets: { id: string; title: string; sql: string }[];
}

export interface DbStatusInfo {
  connected: boolean;
  mode: 'demo' | 'mysql';
  engine: string;
  host: string;
  port: number;
  database: string;
  tablesCount: number;
  totalRows: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'same-origin',
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body?.code);
  }
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const fetchAppConfig = () => request<AppConfig>('/config');
export const fetchDbStatus = () => request<DbStatusInfo>('/db/status');
export const fetchDbSchema = () => request<{ database: string; engine: string; tables: string[]; demoMode: boolean }>('/db/schema');

export function videoFilterParams(filter?: Partial<FilterState>): string {
  const params = new URLSearchParams();
  if (filter?.category && filter.category !== 'all') params.set('category', filter.category);
  if (filter?.bikeFilter) params.set('bike', filter.bikeFilter);
  if (filter?.searchQuery) params.set('search', filter.searchQuery);
  if (filter?.dateRange && filter.dateRange !== 'all') params.set('dateRange', filter.dateRange);
  if (filter?.sortBy) params.set('sortBy', filter.sortBy);
  if (filter?.sortOrder) params.set('sortOrder', filter.sortOrder);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const fetchVideos = (filter?: Partial<FilterState>) => request<Video[]>(`/videos${videoFilterParams(filter)}`);
export const fetchVideoById = (id: string) => request<Video>(`/videos/${encodeURIComponent(id)}`);
export const fetchComparisonVideos = (ids: string[]) => request<Video[]>(`/videos/compare?ids=${ids.map(encodeURIComponent).join(',')}`);
export const createVideoApi = (videoData: Partial<Video>) => request<Video>('/videos', json('POST', videoData));
export const fetchChannels = () => request<Channel[]>('/channels');
export const fetchChannelById = (id: string) => request<Channel>(`/channels/${encodeURIComponent(id)}`);
export const fetchMonthlyGrowth = () => request<MonthlyGrowth[]>('/growth');
export const fetchAlerts = () => request<TrendingAlert[]>('/alerts');
export const markAlertAsReadApi = (id: string) => request<{ success: boolean }>(`/alerts/${encodeURIComponent(id)}/read`, { method: 'PUT' });
export const triggerNewAlertApi = (alert: Omit<TrendingAlert, 'id' | 'is_read'> & { id?: string }) => request<TrendingAlert>('/alerts/trigger', json('POST', alert));

export const executeDbQuery = (sql?: string, presetId?: string) => request<DbmsQueryResult>('/db/query', json('POST', { sql, presetId }));
export const testMySqlConnectionApi = (config: { host?: string; port?: number; database?: string }) => request<{ success: boolean; latencyMs: number; version?: string; message?: string }>('/db/test-connection', json('POST', config));

export const loginUserApi = (email: string, password: string) => request<{ success: boolean; user: UserAccount }>('/auth/login', json('POST', { email, password }));
export const signupUserApi = (name: string, email: string, password: string, role?: string) => request<{ success: boolean; user: UserAccount }>('/auth/signup', json('POST', { name, email, password, role }));
export const demoLoginApi = (profile: 'owner' | 'architect' | 'editor') => request<{ success: boolean; user: UserAccount }>('/auth/demo', json('POST', { profile }));
export const logoutUserApi = () => request<{ success: boolean }>('/auth/logout', { method: 'POST' });
export const fetchCurrentUser = () => request<UserAccount>('/auth/me');
export const syncWorkspaceApi = (payload: Record<string, unknown>) => request<{ success: boolean; user: UserAccount }>('/auth/sync', json('POST', payload));
