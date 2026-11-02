export interface QueryPreset {
  id: string;
  title: string;
  sql: string;
}

export const QUERY_PRESETS: QueryPreset[] = [
  {
    id: 'category-performance',
    title: 'Category Retention & View Density',
    sql: `SELECT
  v.category,
  COUNT(v.video_id) AS total_videos,
  ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
  ROUND(AVG(v.duration_seconds), 1) AS avg_duration_sec,
  ROUND(AVG(v.watch_time_hours), 0) AS avg_watch_hours,
  ROUND(SUM(v.views) / NULLIF(SUM(v.duration_seconds), 0), 2) AS view_density_factor
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.is_primary = TRUE
GROUP BY v.category
ORDER BY avg_retention_pct DESC`,
  },
  {
    id: 'retention-drops',
    title: 'Retention Drop Point Analysis',
    sql: `SELECT
  v.title,
  r.second_mark,
  r.pct_retention,
  r.chapter_name,
  r.editorial_note
FROM fact_video_retention r
JOIN fact_video_metrics v ON r.video_id = v.video_id
WHERE r.is_drop_point = TRUE
ORDER BY r.pct_retention ASC
LIMIT 20`,
  },
  {
    id: 'trending-videos',
    title: 'High Velocity Trending Videos',
    sql: `SELECT video_id, title, bike_model, velocity_views_per_hr, retention_pct, views
FROM fact_video_metrics
WHERE is_trending = TRUE
ORDER BY velocity_views_per_hr DESC
LIMIT 20`,
  },
  {
    id: 'channel-benchmarks',
    title: 'Channel Benchmarks',
    sql: `SELECT name, subscribers, total_videos, avg_views_per_video, sub_growth_monthly_pct, primary_bike
FROM dim_channels
ORDER BY subscribers DESC`,
  },
  {
    id: 'monthly-growth',
    title: 'Monthly Revenue vs Watch Time',
    sql: `SELECT month_name, year_num, views, subscribers_gained, watch_time_hours, revenue_est
FROM fact_monthly_growth
ORDER BY year_num DESC, views DESC`,
  },
  {
    id: 'video-count',
    title: 'Total Analyzed Videos',
    sql: 'SELECT COUNT(*) AS total_videos FROM fact_video_metrics',
  },
];

export const findPreset = (id: string) => QUERY_PRESETS.find((preset) => preset.id === id);
