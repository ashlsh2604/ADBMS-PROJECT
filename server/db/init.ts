import fs from 'node:fs';
import mysql from 'mysql2/promise';
import type { AppConfig } from '../config.js';
import { schemaPath } from '../config.js';
import { splitSqlScript } from './sqlScript.js';
import { MySqlStore } from '../stores/mysqlStore.js';
import type { DataStore } from '../stores/types.js';
import { CHANNELS, VIDEOS, MONTHLY_GROWTH_DATA, INITIAL_TRENDING_ALERTS } from '../../src/data/mockDbmsData.js';
import { hashPassword } from '../auth/passwords.js';

export async function createMySqlStore(config: AppConfig): Promise<DataStore> {
  if (!/^[A-Za-z0-9_]+$/.test(config.db.database)) {
    throw new Error('MYSQL_DATABASE may contain only letters, numbers, and underscores');
  }
  const admin = await mysql.createConnection({ ...config.db, database: undefined, connectTimeout: 5000 });
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally { await admin.end(); }

  const pool = mysql.createPool({ ...config.db, waitForConnections: true, connectionLimit: 10, queueLimit: 0, connectTimeout: 5000, multipleStatements: false, decimalNumbers: true });
  try {
    const ddl = fs.readFileSync(schemaPath, 'utf8');
    for (const statement of splitSqlScript(ddl)) {
      await pool.query(statement);
    }
    await seedIfEmpty(pool, config);
    return new MySqlStore(pool);
  } catch (error) {
    await pool.end();
    throw error;
  }
}

async function seedIfEmpty(pool: mysql.Pool, config: AppConfig): Promise<void> {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM dim_channels');
  if (Number((rows as any[])[0]?.count) === 0) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const channel of CHANNELS) {
        await connection.query(
          `INSERT INTO dim_channels (channel_id, name, handle, avatar_url, banner_url, subscribers, total_views, total_videos, country, primary_bike, joined_date, verified, is_primary, description, avg_views_per_video, sub_growth_monthly_pct)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [channel.channel_id, channel.name, channel.handle, channel.avatar_url, channel.banner_url, channel.subscribers, channel.total_views, channel.total_videos, channel.country, channel.primary_bike, channel.joined_date, channel.verified, channel.is_primary, channel.description, channel.avg_views_per_video, channel.sub_growth_monthly_pct]
        );
      }
      for (const video of VIDEOS) {
        await connection.query(
          `INSERT INTO fact_video_metrics (video_id, channel_id, title, thumbnail_url, category, bike_model, duration_seconds, upload_date, views, likes, comments, retention_pct, watch_time_hours, ctr_pct, cpm_usd, estimated_revenue_usd, velocity_views_per_hr, tags_json, is_trending, trending_score, audio_sound_profile, top_demographic, youtube_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [video.video_id, video.channel_id, video.title, video.thumbnail_url, video.category, video.bike_model, video.duration_seconds, video.upload_date, video.views, video.likes, video.comments, video.retention_pct, video.watch_time_hours, video.ctr_pct, video.cpm_usd, video.estimated_revenue_usd, video.velocity_views_per_hr, JSON.stringify(video.tags), video.is_trending, video.trending_score, video.audio_sound_profile || null, video.top_demographic || null, video.youtube_url || null]
        );
        for (const point of video.retention_curve || []) {
          await connection.query(
            'INSERT INTO fact_video_retention (video_id, second_mark, pct_retention, chapter_name, is_drop_point, is_spike_point, editorial_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [video.video_id, point.second, point.pct_retention, point.chapter_name || null, Boolean(point.is_drop_point), Boolean(point.is_spike_point), point.note || null]
          );
        }
      }
      const primary = CHANNELS[0]?.channel_id;
      for (const growth of MONTHLY_GROWTH_DATA) {
        await connection.query(
          'INSERT INTO fact_monthly_growth (channel_id, month_name, year_num, views, subscribers_gained, watch_time_hours, revenue_est, bike_review_views, vlog_views, shorts_views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [primary, growth.month, growth.year, growth.views, growth.subscribers_gained, growth.watch_time_hours, growth.revenue_est, growth.bike_review_views, growth.vlog_views, growth.shorts_views]
        );
      }
      for (const alert of INITIAL_TRENDING_ALERTS) {
        await connection.query(
          'INSERT INTO dim_trending_alerts (alert_id, video_id, video_title, channel_name, category, alert_type, multiplier, metric_value, message, alert_timestamp, is_read, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [alert.id, alert.video_id || null, alert.video_title || null, alert.channel_name, alert.category || null, alert.alert_type, alert.multiplier ?? null, alert.metric_value, alert.message, alert.timestamp, alert.is_read, alert.priority]
        );
      }
      await connection.commit();
      console.log('[DB] Seeded analytics dataset.');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  }

  const [users] = await pool.query('SELECT COUNT(*) AS count FROM dim_users');
  if (Number((users as any[])[0]?.count) === 0 && process.env.BOOTSTRAP_OWNER_EMAIL && process.env.BOOTSTRAP_OWNER_PASSWORD) {
    const passwordHash = await hashPassword(process.env.BOOTSTRAP_OWNER_PASSWORD);
    await pool.query('INSERT INTO dim_users (user_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [`usr_${Date.now().toString(36)}`, process.env.BOOTSTRAP_OWNER_NAME || 'Channel Owner', process.env.BOOTSTRAP_OWNER_EMAIL.toLowerCase(), passwordHash, 'Channel Owner (Ash)']);
    console.log('[DB] Bootstrapped owner account from environment.');
  }
}
