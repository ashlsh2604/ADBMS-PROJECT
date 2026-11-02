import test from 'node:test';
import assert from 'node:assert/strict';
import { filterVideos } from '../server/analytics/filterVideos.js';
import type { Video } from '../src/types/database.js';

const video = (id: string, upload_date: string, views: number): Video => ({
  video_id: id, channel_id: 'c', title: id, thumbnail_url: '', category: 'vlog', bike_model: 'Bike',
  duration_seconds: 60, upload_date, views, likes: 0, comments: 0, retention_pct: 50, watch_time_hours: 0,
  ctr_pct: 0, cpm_usd: 0, estimated_revenue_usd: 0, velocity_views_per_hr: 0, tags: [], is_trending: false,
  trending_score: 0, retention_curve: [],
});

test('date filtering uses the supplied current date and excludes future uploads', () => {
  const now = new Date('2026-11-02T00:00:00Z');
  const videos = [video('old', '2026-08-28', 1), video('recent', '2026-10-30', 2), video('future', '2027-01-01', 3)];
  const result = filterVideos(videos, { dateRange: '7d' }, now);
  assert.deepEqual(result.map((item) => item.video_id), ['recent']);
});

test('sorting honors ascending and descending order', () => {
  const videos = [video('a', '2026-01-01', 10), video('b', '2026-01-02', 20)];
  assert.deepEqual(filterVideos(videos, { sortBy: 'views', sortOrder: 'asc' }).map((v) => v.views), [10, 20]);
  assert.deepEqual(filterVideos(videos, { sortBy: 'views', sortOrder: 'desc' }).map((v) => v.views), [20, 10]);
});
