import { randomUUID } from 'node:crypto';
import type { Channel, DbmsQueryResult, MonthlyGrowth, TrendingAlert, UserAccount, Video } from '../../src/types/database.js';
import { CHANNELS, VIDEOS, MONTHLY_GROWTH_DATA, INITIAL_TRENDING_ALERTS, INITIAL_USER_ACCOUNT } from '../../src/data/mockDbmsData.js';
import { ApiError, conflict, notFound } from '../errors.js';
import { hashPassword } from '../auth/passwords.js';
import { filterVideos } from '../analytics/filterVideos.js';
import type { CreateAlertInput, CreateVideoInput, SyncInput } from '../validation.js';
import type { QueryPreset } from '../analytics/presets.js';
import type { AuthRecord, DataStore } from './types.js';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const publicUser = ({ password_hash, ...user }: AuthRecord): UserAccount => clone(user);

function result(sql: string, columns: string[], data: Record<string, any>[], scanned: number, started: number): DbmsQueryResult {
  return {
    query_sql: sql,
    execution_time_ms: Number((performance.now() - started).toFixed(2)),
    rows_scanned: scanned,
    rows_returned: data.length,
    indexes_used: [],
    cost_estimate: 0,
    columns,
    data,
    schema_plan: 'Demo preset computed from the in-memory seed dataset. This is not MySQL EXPLAIN output.',
  };
}

export async function createDemoStore(): Promise<DataStore> {
  const videos = clone(VIDEOS);
  const channels = clone(CHANNELS);
  const growth = clone(MONTHLY_GROWTH_DATA);
  const alerts = clone(INITIAL_TRENDING_ALERTS);
  const users = new Map<string, AuthRecord>();
  const sessions = new Map<string, { userId: string; expiresAt: number }>();
  const demoPassword = await hashPassword('demopass123');

  const seedUser = (user: UserAccount) => users.set(user.email.toLowerCase(), { ...clone(user), password_hash: demoPassword });
  seedUser(INITIAL_USER_ACCOUNT);
  seedUser({ ...INITIAL_USER_ACCOUNT, id: 'usr_architect', name: 'Alex (DBMS Architect)', email: 'analyst@dbms.project', role: 'DBMS Lead Architect', connected_devices: [], saved_video_ids: [], saved_comparisons: [], custom_queries: [] });
  seedUser({ ...INITIAL_USER_ACCOUNT, id: 'usr_editor', name: 'Marcus (Editor)', email: 'editor@ashrides26.motovlog', role: 'Motovlog Editor', connected_devices: [], saved_video_ids: [], saved_comparisons: [], custom_queries: [] });

  const requireUser = (id: string) => {
    const record = [...users.values()].find((user) => user.id === id);
    if (!record) throw notFound('User not found');
    return record;
  };

  const store: DataStore = {
    mode: 'demo',
    engineLabel: 'In-memory demo dataset (not MySQL)',
    async getVideos(filter = {}) {
      return clone(filterVideos(videos, {
        category: filter.category as any,
        bikeFilter: filter.bike as string,
        searchQuery: filter.search as string,
        dateRange: filter.dateRange as any,
        sortBy: filter.sortBy as any,
        sortOrder: filter.sortOrder as any,
      }));
    },
    async getVideoById(id) { return clone(videos.find((video) => video.video_id === id) || null); },
    async createVideo(input: CreateVideoInput) {
      const videoId = input.video_id || `ash_vid_${randomUUID()}`;
      if (videos.some((video) => video.video_id === videoId)) throw conflict('A video with this ID already exists');
      const video: Video = {
        ...input,
        video_id: videoId,
        channel_id: channels[0]?.channel_id || 'ashrides26_official',
        thumbnail_url: input.thumbnail_url || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
        is_trending: false,
        trending_score: 50,
        youtube_url: input.youtube_url || 'https://youtube.com/@ashrides26',
        retention_curve: [
          { second: 0, pct_retention: 100, chapter_name: 'Intro' },
          { second: Math.floor(input.duration_seconds / 2), pct_retention: 75, chapter_name: 'Main content' },
          { second: input.duration_seconds, pct_retention: 60, chapter_name: 'Outro' },
        ],
      };
      videos.unshift(video);
      return clone(video);
    },
    async getChannels() { return clone(channels); },
    async getGrowth() { return clone(growth); },
    async getAlerts() { return clone(alerts); },
    async markAlertRead(id) {
      const alert = alerts.find((item) => item.id === id);
      if (!alert) return false;
      alert.is_read = true;
      return true;
    },
    async createAlert(input: CreateAlertInput) {
      const alert: TrendingAlert = { ...input, id: input.id || `alert_${randomUUID()}`, is_read: false };
      if (alerts.some((item) => item.id === alert.id)) throw conflict('An alert with this ID already exists');
      alerts.unshift(alert);
      return clone(alert);
    },
    async findAuthUserByEmail(email) {
      const user = users.get(email.toLowerCase());
      return user ? clone(user) : null;
    },
    async createUser({ name, email, passwordHash, role }) {
      if (users.has(email.toLowerCase())) throw conflict('An account with this email already exists');
      const user: AuthRecord = {
        id: `usr_${randomUUID()}`, name, email: email.toLowerCase(), role, password_hash: passwordHash,
        avatar: INITIAL_USER_ACCOUNT.avatar, last_login: new Date().toISOString(), created_at: new Date().toISOString().slice(0, 10),
        connected_devices: [], saved_video_ids: [], saved_comparisons: [], custom_queries: [],
        notification_settings: clone(INITIAL_USER_ACCOUNT.notification_settings),
      };
      users.set(user.email, user);
      return publicUser(user);
    },
    async getUserById(id) {
      const user = [...users.values()].find((item) => item.id === id);
      return user ? publicUser(user) : null;
    },
    async recordLogin(id) { requireUser(id).last_login = new Date().toISOString(); },
    async createSession(userId, tokenHash, expiresAt) { sessions.set(tokenHash, { userId, expiresAt: expiresAt.getTime() }); },
    async getUserBySession(tokenHash) {
      const session = sessions.get(tokenHash);
      if (!session) return null;
      if (session.expiresAt < Date.now()) { sessions.delete(tokenHash); return null; }
      return store.getUserById(session.userId);
    },
    async deleteSession(tokenHash) { sessions.delete(tokenHash); },
    async syncWorkspace(userId, input: SyncInput) {
      const user = requireUser(userId);
      if (input.saved_video_ids) user.saved_video_ids = [...new Set(input.saved_video_ids)];
      if (input.saved_comparisons) user.saved_comparisons = clone(input.saved_comparisons);
      if (input.custom_queries) user.custom_queries = clone(input.custom_queries);
      if (input.notification_settings) user.notification_settings = clone(input.notification_settings);
      if (input.device) {
        const existing = user.connected_devices.findIndex((device) => device.id === input.device!.id);
        if (existing >= 0) user.connected_devices[existing] = clone(input.device);
        else user.connected_devices.unshift(clone(input.device));
        user.connected_devices = user.connected_devices.slice(0, 10);
      }
      if (input.remove_device_id) user.connected_devices = user.connected_devices.filter((device) => device.id !== input.remove_device_id);
      if (input.rename_device) {
        const device = user.connected_devices.find((item) => item.id === input.rename_device!.id);
        if (device) device.device_name = input.rename_device.device_name;
      }
      return publicUser(user);
    },
    async runPreset(preset: QueryPreset) {
      const started = performance.now();
      let columns: string[] = [];
      let data: Record<string, any>[] = [];
      switch (preset.id) {
        case 'category-performance': {
          columns = ['category', 'total_videos', 'avg_retention_pct', 'avg_duration_sec', 'avg_watch_hours', 'view_density_factor'];
          const groups = new Map<string, Video[]>();
          for (const video of videos) groups.set(video.category, [...(groups.get(video.category) || []), video]);
          data = [...groups.entries()].map(([category, items]) => ({
            category,
            total_videos: items.length,
            avg_retention_pct: Number((items.reduce((sum, v) => sum + v.retention_pct, 0) / items.length).toFixed(2)),
            avg_duration_sec: Number((items.reduce((sum, v) => sum + v.duration_seconds, 0) / items.length).toFixed(1)),
            avg_watch_hours: Math.round(items.reduce((sum, v) => sum + v.watch_time_hours, 0) / items.length),
            view_density_factor: Number((items.reduce((sum, v) => sum + v.views, 0) / items.reduce((sum, v) => sum + v.duration_seconds, 0)).toFixed(2)),
          })).sort((a, b) => b.avg_retention_pct - a.avg_retention_pct);
          break;
        }
        case 'retention-drops':
          columns = ['title', 'second_mark', 'pct_retention', 'chapter_name', 'editorial_note'];
          data = videos.flatMap((video) => video.retention_curve.filter((point) => point.is_drop_point).map((point) => ({
            title: video.title, second_mark: point.second, pct_retention: point.pct_retention, chapter_name: point.chapter_name || null, editorial_note: point.note || null,
          }))).sort((a, b) => a.pct_retention - b.pct_retention).slice(0, 20);
          break;
        case 'trending-videos':
          columns = ['video_id', 'title', 'bike_model', 'velocity_views_per_hr', 'retention_pct', 'views'];
          data = videos.filter((video) => video.is_trending).sort((a, b) => b.velocity_views_per_hr - a.velocity_views_per_hr).slice(0, 20).map(({ video_id, title, bike_model, velocity_views_per_hr, retention_pct, views }) => ({ video_id, title, bike_model, velocity_views_per_hr, retention_pct, views }));
          break;
        case 'channel-benchmarks':
          columns = ['name', 'subscribers', 'total_videos', 'avg_views_per_video', 'sub_growth_monthly_pct', 'primary_bike'];
          data = channels.map(({ name, subscribers, total_videos, avg_views_per_video, sub_growth_monthly_pct, primary_bike }) => ({ name, subscribers, total_videos, avg_views_per_video, sub_growth_monthly_pct, primary_bike }));
          break;
        case 'monthly-growth':
          columns = ['month_name', 'year_num', 'views', 'subscribers_gained', 'watch_time_hours', 'revenue_est'];
          data = growth.map((g) => ({ month_name: g.month, year_num: g.year, views: g.views, subscribers_gained: g.subscribers_gained, watch_time_hours: g.watch_time_hours, revenue_est: g.revenue_est }));
          break;
        case 'video-count':
          columns = ['total_videos'];
          data = [{ total_videos: videos.length }];
          break;
        default:
          throw new ApiError(400, 'Unknown analytics preset');
      }
      return result(preset.sql, columns, data, videos.length, started);
    },
    async runQuery() {
      throw new ApiError(400, 'Custom SQL requires a live MySQL connection. In demo mode, run one of the labeled analytics presets instead.', 'DEMO_SQL_DISABLED');
    },
    async getStats() {
      return { tablesCount: 8, totalRows: channels.length + videos.length + growth.length + alerts.length + users.size };
    },
    async close() { sessions.clear(); },
  };
  return store;
}
