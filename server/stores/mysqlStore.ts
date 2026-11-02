import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';
import type { Channel, DbmsQueryResult, MonthlyGrowth, TrendingAlert, UserAccount, Video } from '../../src/types/database.js';
import { conflict, notFound } from '../errors.js';
import { assertSafeAnalyticsQuery, withRowLimit } from '../db/sqlGuard.js';
import type { CreateAlertInput, CreateVideoInput, SyncInput } from '../validation.js';
import type { QueryPreset } from '../analytics/presets.js';
import type { AuthRecord, DataStore } from './types.js';

const num = (value: any) => Number(value ?? 0);
const bool = (value: any) => Boolean(value);
const parseJson = <T>(value: any, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

function mapChannel(row: any): Channel {
  return { ...row, subscribers: num(row.subscribers), total_views: num(row.total_views), total_videos: num(row.total_videos), avg_views_per_video: num(row.avg_views_per_video), sub_growth_monthly_pct: num(row.sub_growth_monthly_pct), verified: bool(row.verified), is_primary: bool(row.is_primary), joined_date: String(row.joined_date).slice(0, 10) };
}

function mapVideo(row: any, curve: any[] = []): Video {
  return {
    ...row,
    duration_seconds: num(row.duration_seconds), views: num(row.views), likes: num(row.likes), comments: num(row.comments),
    retention_pct: num(row.retention_pct), watch_time_hours: num(row.watch_time_hours), ctr_pct: num(row.ctr_pct), cpm_usd: num(row.cpm_usd),
    estimated_revenue_usd: num(row.estimated_revenue_usd), velocity_views_per_hr: num(row.velocity_views_per_hr),
    is_trending: bool(row.is_trending), trending_score: num(row.trending_score), tags: parseJson<string[]>(row.tags_json, []),
    upload_date: String(row.upload_date).slice(0, 10),
    retention_curve: curve.map((point) => ({ second: num(point.second_mark), pct_retention: num(point.pct_retention), chapter_name: point.chapter_name || undefined, is_drop_point: bool(point.is_drop_point), is_spike_point: bool(point.is_spike_point), note: point.editorial_note || undefined })),
  };
}

function mapAlert(row: any): TrendingAlert {
  return { id: row.alert_id, video_id: row.video_id || undefined, video_title: row.video_title || undefined, channel_name: row.channel_name, category: row.category || undefined, alert_type: row.alert_type, multiplier: row.multiplier == null ? undefined : num(row.multiplier), metric_value: row.metric_value, message: row.message, timestamp: row.alert_timestamp, is_read: bool(row.is_read), priority: row.priority };
}

const SORT_COLUMNS = new Set(['views', 'retention_pct', 'watch_time_hours', 'likes', 'comments', 'velocity_views_per_hr', 'upload_date']);
const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
const like = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;

export class MySqlStore implements DataStore {
  readonly mode = 'mysql' as const;
  readonly engineLabel = 'MySQL (live connection pool)';

  constructor(private pool: mysql.Pool) {}

  private async curvesFor(videoIds: string[]): Promise<Map<string, any[]>> {
    const map = new Map<string, any[]>();
    if (!videoIds.length) return map;
    const [rows] = await this.pool.query('SELECT * FROM fact_video_retention WHERE video_id IN (?) ORDER BY video_id, second_mark', [videoIds]);
    for (const row of rows as any[]) map.set(row.video_id, [...(map.get(row.video_id) || []), row]);
    return map;
  }

  async getVideos(filter: Record<string, unknown> = {}): Promise<Video[]> {
    const where: string[] = [];
    const params: any[] = [];
    if (filter.category && filter.category !== 'all') { where.push('category = ?'); params.push(filter.category); }
    if (filter.bike) { where.push('bike_model LIKE ?'); params.push(like(String(filter.bike))); }
    if (filter.search) {
      where.push('(title LIKE ? OR bike_model LIKE ? OR category LIKE ? OR JSON_SEARCH(tags_json, \'one\', ?) IS NOT NULL)');
      const q = like(String(filter.search)); params.push(q, q, q, String(filter.search));
    }
    const days = RANGE_DAYS[String(filter.dateRange)];
    if (days) { where.push('upload_date <= CURDATE() AND upload_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)'); params.push(days); }
    const sortBy = SORT_COLUMNS.has(String(filter.sortBy)) ? String(filter.sortBy) : 'views';
    const sortOrder = filter.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const [rows] = await this.pool.query(`SELECT * FROM fact_video_metrics ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${sortBy} ${sortOrder} LIMIT 500`, params);
    const videos = rows as any[];
    const curves = await this.curvesFor(videos.map((video) => video.video_id));
    return videos.map((video) => mapVideo(video, curves.get(video.video_id) || []));
  }

  async getVideoById(id: string): Promise<Video | null> {
    const [rows] = await this.pool.query('SELECT * FROM fact_video_metrics WHERE video_id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) return null;
    const curves = await this.curvesFor([id]);
    return mapVideo(row, curves.get(id) || []);
  }

  async createVideo(input: CreateVideoInput): Promise<Video> {
    const videoId = input.video_id || `ash_vid_${randomUUID()}`;
    const [channelRows] = await this.pool.query('SELECT channel_id FROM dim_channels ORDER BY is_primary DESC LIMIT 1');
    const channelId = (channelRows as any[])[0]?.channel_id;
    if (!channelId) throw conflict('Seed a channel before creating videos');
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `INSERT INTO fact_video_metrics (video_id, channel_id, title, thumbnail_url, category, bike_model, duration_seconds, upload_date, views, likes, comments, retention_pct, watch_time_hours, ctr_pct, cpm_usd, estimated_revenue_usd, velocity_views_per_hr, tags_json, youtube_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [videoId, channelId, input.title, input.thumbnail_url || null, input.category, input.bike_model, input.duration_seconds, input.upload_date, input.views, input.likes, input.comments, input.retention_pct, input.watch_time_hours, input.ctr_pct, input.cpm_usd, input.estimated_revenue_usd, input.velocity_views_per_hr, JSON.stringify(input.tags), input.youtube_url || null]
      );
      const curve = [
        { second: 0, pct: 100, chapter: 'Intro' },
        { second: Math.floor(input.duration_seconds / 2), pct: 75, chapter: 'Main content' },
        { second: input.duration_seconds, pct: 60, chapter: 'Outro' },
      ];
      for (const point of curve) {
        await connection.query('INSERT INTO fact_video_retention (video_id, second_mark, pct_retention, chapter_name) VALUES (?, ?, ?, ?)', [videoId, point.second, point.pct, point.chapter]);
      }
      await connection.commit();
    } catch (error: any) {
      await connection.rollback();
      if (error?.code === 'ER_DUP_ENTRY') throw conflict('A video with this ID already exists');
      throw error;
    } finally { connection.release(); }
    return (await this.getVideoById(videoId))!;
  }

  async getChannels(): Promise<Channel[]> {
    const [rows] = await this.pool.query('SELECT * FROM dim_channels ORDER BY is_primary DESC, subscribers DESC');
    return (rows as any[]).map(mapChannel);
  }

  async getGrowth(): Promise<MonthlyGrowth[]> {
    const [rows] = await this.pool.query('SELECT * FROM fact_monthly_growth ORDER BY year_num, id');
    return (rows as any[]).map((row) => ({ month: row.month_name, year: num(row.year_num), views: num(row.views), subscribers_gained: num(row.subscribers_gained), watch_time_hours: num(row.watch_time_hours), revenue_est: num(row.revenue_est), bike_review_views: num(row.bike_review_views), vlog_views: num(row.vlog_views), shorts_views: num(row.shorts_views) }));
  }

  async getAlerts(): Promise<TrendingAlert[]> {
    const [rows] = await this.pool.query('SELECT * FROM dim_trending_alerts ORDER BY created_at DESC LIMIT 200');
    return (rows as any[]).map(mapAlert);
  }

  async markAlertRead(id: string): Promise<boolean> {
    const [result] = await this.pool.query('UPDATE dim_trending_alerts SET is_read = TRUE WHERE alert_id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async createAlert(input: CreateAlertInput): Promise<TrendingAlert> {
    const id = input.id || `alert_${randomUUID()}`;
    try {
      await this.pool.query(
        `INSERT INTO dim_trending_alerts (alert_id, video_id, video_title, channel_name, category, alert_type, multiplier, metric_value, message, alert_timestamp, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, input.video_id || null, input.video_title || null, input.channel_name, input.category || null, input.alert_type, input.multiplier ?? null, input.metric_value, input.message, input.timestamp, input.priority]
      );
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') throw conflict('An alert with this ID already exists');
      throw error;
    }
    return { ...input, id, is_read: false };
  }

  private async hydrateUser(row: any): Promise<AuthRecord> {
    const [devices] = await this.pool.query('SELECT * FROM user_device_sessions WHERE user_id = ? ORDER BY last_synced_at DESC', [row.user_id]);
    const [savedVideos] = await this.pool.query('SELECT video_id FROM user_saved_videos WHERE user_id = ? ORDER BY created_at', [row.user_id]);
    const [comparisons] = await this.pool.query('SELECT video_ids_json FROM user_saved_comparisons WHERE user_id = ? ORDER BY position', [row.user_id]);
    const [queries] = await this.pool.query('SELECT * FROM user_saved_queries WHERE user_id = ? ORDER BY created_at DESC', [row.user_id]);
    const settings = parseJson(row.settings_json, {} as UserAccount['notification_settings']);
    return {
      id: row.user_id, name: row.name, email: row.email, role: row.role, password_hash: row.password_hash,
      avatar: row.avatar_url || '', last_login: row.last_login || '', created_at: String(row.created_at).slice(0, 10),
      connected_devices: (devices as any[]).map((device) => ({ id: device.session_id, device_name: device.device_name, device_type: device.device_type, os: device.os || '', browser: device.browser || '', ip_location: device.ip_location || '', last_synced_at: String(device.last_synced_at), is_current: bool(device.is_current), battery_level: device.battery_level == null ? undefined : num(device.battery_level) })),
      saved_video_ids: (savedVideos as any[]).map((item) => item.video_id),
      saved_comparisons: (comparisons as any[]).map((item) => parseJson<string[]>(item.video_ids_json, [])),
      custom_queries: (queries as any[]).map((query) => ({ id: query.query_id, title: query.title, description: query.description || '', sql: query.sql_query, category: query.category || 'Analytics', created_at: String(query.created_at).slice(0, 10) })),
      notification_settings: settings,
    };
  }

  async findAuthUserByEmail(email: string): Promise<AuthRecord | null> {
    const [rows] = await this.pool.query('SELECT * FROM dim_users WHERE email = ?', [email.toLowerCase()]);
    const row = (rows as any[])[0];
    return row ? this.hydrateUser(row) : null;
  }

  async createUser(input: { name: string; email: string; passwordHash: string; role: UserAccount['role'] }): Promise<UserAccount> {
    const id = `usr_${randomUUID()}`;
    try {
      await this.pool.query('INSERT INTO dim_users (user_id, name, email, password_hash, role, last_login) VALUES (?, ?, ?, ?, ?, ?)', [id, input.name, input.email.toLowerCase(), input.passwordHash, input.role, new Date().toISOString()]);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY') throw conflict('An account with this email already exists');
      throw error;
    }
    return (await this.getUserById(id))!;
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const [rows] = await this.pool.query('SELECT * FROM dim_users WHERE user_id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) return null;
    const { password_hash, ...user } = await this.hydrateUser(row);
    return user;
  }

  async recordLogin(id: string): Promise<void> {
    await this.pool.query('UPDATE dim_users SET last_login = ? WHERE user_id = ?', [new Date().toISOString(), id]);
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query('INSERT INTO auth_sessions (session_hash, user_id, expires_at) VALUES (?, ?, ?)', [tokenHash, userId, expiresAt]);
    await this.pool.query('DELETE FROM auth_sessions WHERE expires_at < NOW()');
  }

  async getUserBySession(tokenHash: string): Promise<UserAccount | null> {
    const [rows] = await this.pool.query('SELECT user_id FROM auth_sessions WHERE session_hash = ? AND expires_at > NOW()', [tokenHash]);
    const row = (rows as any[])[0];
    return row ? this.getUserById(row.user_id) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query('DELETE FROM auth_sessions WHERE session_hash = ?', [tokenHash]);
  }

  async syncWorkspace(userId: string, input: SyncInput): Promise<UserAccount> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      if (input.notification_settings) await connection.query('UPDATE dim_users SET settings_json = ? WHERE user_id = ?', [JSON.stringify(input.notification_settings), userId]);
      if (input.saved_video_ids) {
        await connection.query('DELETE FROM user_saved_videos WHERE user_id = ?', [userId]);
        for (const videoId of new Set(input.saved_video_ids)) await connection.query('INSERT INTO user_saved_videos (user_id, video_id) VALUES (?, ?)', [userId, videoId]);
      }
      if (input.saved_comparisons) {
        await connection.query('DELETE FROM user_saved_comparisons WHERE user_id = ?', [userId]);
        for (const [position, ids] of input.saved_comparisons.entries()) await connection.query('INSERT INTO user_saved_comparisons (comparison_id, user_id, video_ids_json, position) VALUES (?, ?, ?, ?)', [randomUUID(), userId, JSON.stringify(ids), position]);
      }
      if (input.custom_queries) {
        await connection.query('DELETE FROM user_saved_queries WHERE user_id = ?', [userId]);
        for (const query of input.custom_queries) await connection.query('INSERT INTO user_saved_queries (query_id, user_id, title, description, sql_query, category) VALUES (?, ?, ?, ?, ?, ?)', [query.id, userId, query.title, query.description, query.sql, query.category]);
      }
      if (input.device) {
        const device = input.device;
        await connection.query(
          `INSERT INTO user_device_sessions (session_id, user_id, device_name, device_type, os, browser, ip_location, battery_level, is_current)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_name=VALUES(device_name), device_type=VALUES(device_type), os=VALUES(os), browser=VALUES(browser), ip_location=VALUES(ip_location), battery_level=VALUES(battery_level), is_current=VALUES(is_current)`,
          [device.id, userId, device.device_name, device.device_type, device.os, device.browser, device.ip_location, device.battery_level ?? null, device.is_current]
        );
      }
      if (input.remove_device_id) await connection.query('DELETE FROM user_device_sessions WHERE session_id = ? AND user_id = ?', [input.remove_device_id, userId]);
      if (input.rename_device) await connection.query('UPDATE user_device_sessions SET device_name = ? WHERE session_id = ? AND user_id = ?', [input.rename_device.device_name, input.rename_device.id, userId]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
    return (await this.getUserById(userId))!;
  }

  async runQuery(sql: string): Promise<DbmsQueryResult> {
    assertSafeAnalyticsQuery(sql);
    const trimmed = sql.trim().replace(/;\s*$/, '');
    const connection = await this.pool.getConnection();
    const started = performance.now();
    try {
      await connection.query('SET TRANSACTION READ ONLY');
      await connection.beginTransaction();
      const [dataRows, fields] = await connection.query(withRowLimit(trimmed, 200));
      const rows = (Array.isArray(dataRows) ? dataRows : []) as Record<string, any>[];
      const truncated = rows.length > 200;
      const data = truncated ? rows.slice(0, 200) : rows;
      const columns = data.length ? Object.keys(data[0]) : Array.isArray(fields) ? fields.map((field: any) => field.name) : [];
      let schemaPlan = 'Read-only transaction; result limited to 200 rows.';
      let indexes: string[] = [];
      let rowsScanned = data.length;
      try {
        const [explainRows] = await connection.query(`EXPLAIN ${trimmed}`);
        const plan = explainRows as any[];
        if (plan.length) {
          schemaPlan = plan.map((row) => `${row.select_type || 'SIMPLE'} | ${row.table || ''} | type: ${row.type || 'ALL'} | key: ${row.key || 'none'} | rows: ${row.rows ?? '?'} | Extra: ${row.Extra || ''}`).join('\n');
          indexes = [...new Set(plan.map((row) => row.key).filter(Boolean))];
          rowsScanned = plan.reduce((sum, row) => sum + num(row.rows), 0);
        }
      } catch { /* EXPLAIN is best-effort; the query result remains authoritative. */ }
      return {
        query_sql: trimmed,
        execution_time_ms: Number((performance.now() - started).toFixed(2)),
        rows_scanned: rowsScanned,
        rows_returned: data.length,
        indexes_used: indexes,
        cost_estimate: 0,
        columns,
        data,
        schema_plan: `${schemaPlan}${truncated ? '\nResult truncated to 200 rows.' : ''}`,
      };
    } finally {
      try { await connection.rollback(); } finally { connection.release(); }
    }
  }

  async runPreset(preset: QueryPreset): Promise<DbmsQueryResult> { return this.runQuery(preset.sql); }

  async getStats() {
    const [tables] = await this.pool.query('SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE()');
    const [rows] = await this.pool.query(`SELECT
      (SELECT COUNT(*) FROM dim_channels) + (SELECT COUNT(*) FROM fact_video_metrics) +
      (SELECT COUNT(*) FROM fact_monthly_growth) + (SELECT COUNT(*) FROM dim_trending_alerts) +
      (SELECT COUNT(*) FROM dim_users) AS count`);
    return { tablesCount: num((tables as any[])[0]?.count), totalRows: num((rows as any[])[0]?.count) };
  }

  async close(): Promise<void> { await this.pool.end(); }
}
