import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeAnalyticsQuery } from '../server/db/sqlGuard.js';
import { QUERY_PRESETS } from '../server/analytics/presets.js';

test('allows read-only analytics queries and presets', () => {
  assertSafeAnalyticsQuery('SELECT COUNT(*) FROM fact_video_metrics');
  assertSafeAnalyticsQuery('WITH recent AS (SELECT * FROM fact_video_metrics) SELECT * FROM recent');
  for (const preset of QUERY_PRESETS) assertSafeAnalyticsQuery(preset.sql);
});

test('rejects writes, multiple statements, system tables, and dangerous functions', () => {
  const bad = [
    'DROP TABLE fact_video_metrics',
    'SELECT 1; DROP TABLE fact_video_metrics',
    'UPDATE fact_video_metrics SET views = 0',
    'SELECT * FROM mysql.user',
    'SELECT * FROM dim_users',
    'SELECT SLEEP(10)',
    "SELECT * FROM fact_video_metrics INTO OUTFILE '/tmp/x'",
    'SELECT * FROM fact_video_metrics FOR UPDATE',
  ];
  for (const sql of bad) assert.throws(() => assertSafeAnalyticsQuery(sql), /not allowed|Only|could not|Cross-database|not available/i);
});
