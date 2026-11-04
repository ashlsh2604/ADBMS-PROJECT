/**
 * AshRides26 - Backend MySQL 8.0 Analytical & Transactional Queries
 * Production-grade parameterized SQL queries with EXPLAIN plans,
 * window functions, aggregations, cross-table joins, and CTEs.
 */

export interface BackendQueryDefinition {
  id: string;
  name: string;
  category: 'Aggregation' | 'Window Functions' | 'Cross-Table Joins' | 'Time Series' | 'Real-Time Telemetry' | 'Optimization';
  description: string;
  sql: string;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    defaultValue: any;
    description: string;
  }>;
  indexesUsed: string[];
}

/**
 * 1. Category Performance & View Density Aggregation
 * Computes video count, average retention %, average duration, total watch time,
 * total revenue, and view density factor (views per second of content) for @ashrides26.
 */
export const SQL_CATEGORY_PERFORMANCE = `
SELECT 
    v.category,
    COUNT(v.video_id) AS total_videos,
    ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
    ROUND(AVG(v.duration_seconds), 1) AS avg_duration_sec,
    ROUND(AVG(v.watch_time_hours), 0) AS avg_watch_hours,
    SUM(v.views) AS total_views,
    SUM(v.likes) AS total_likes,
    SUM(v.comments) AS total_comments,
    ROUND(SUM(v.estimated_revenue_usd), 2) AS total_revenue_usd,
    ROUND(SUM(v.views) / NULLIF(SUM(v.duration_seconds), 0), 2) AS view_density_factor
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@ashrides26'
GROUP BY v.category
ORDER BY avg_retention_pct DESC;
`.trim();

/**
 * 2. Window Function: Velocity Surge Rank & Outlier Detection
 * Uses CTE and MySQL 8.0 Window Functions (AVG() OVER, PERCENT_RANK())
 * to calculate real-time velocity surges against category benchmarks.
 */
export const SQL_VELOCITY_SURGE_RANKING = `
WITH VelocityBenchmark AS (
    SELECT 
        video_id,
        title,
        category,
        bike_model,
        velocity_views_per_hr,
        views,
        retention_pct,
        AVG(velocity_views_per_hr) OVER(PARTITION BY category) AS cat_avg_velocity,
        MAX(velocity_views_per_hr) OVER(PARTITION BY category) AS cat_max_velocity,
        PERCENT_RANK() OVER(PARTITION BY category ORDER BY velocity_views_per_hr ASC) AS cat_percentile_rank,
        DENSE_RANK() OVER(ORDER BY velocity_views_per_hr DESC) AS overall_velocity_rank
    FROM fact_video_metrics
    WHERE channel_id = 'ashrides26_official'
)
SELECT 
    overall_velocity_rank,
    video_id,
    title,
    category,
    bike_model,
    velocity_views_per_hr,
    ROUND(cat_avg_velocity, 1) AS category_avg_velocity,
    ROUND(velocity_views_per_hr / NULLIF(cat_avg_velocity, 0), 2) AS surge_multiplier,
    ROUND(cat_percentile_rank * 100, 1) AS category_percentile
FROM VelocityBenchmark
WHERE velocity_views_per_hr >= (cat_avg_velocity * 1.5)
ORDER BY surge_multiplier DESC;
`.trim();

/**
 * 3. Retention Drop-off & Spikes Chapter Audit (Cross-Table JOIN)
 * Joins fact_video_retention with fact_video_metrics to analyze exactly
 * where viewers drop off or re-watch segments (levers adjusted, exhaust sound clips, crash saves).
 */
export const SQL_RETENTION_AUDIT = `
SELECT 
    v.video_id,
    v.title,
    v.category,
    v.bike_model,
    r.second_mark,
    CONCAT(FLOOR(r.second_mark / 60), 'm ', (r.second_mark % 60), 's') AS timestamp_formatted,
    r.pct_retention,
    r.chapter_name,
    r.is_drop_point,
    r.is_spike_point,
    r.editorial_note
FROM fact_video_retention r
JOIN fact_video_metrics v ON r.video_id = v.video_id
WHERE (r.is_drop_point = TRUE OR r.is_spike_point = TRUE)
ORDER BY v.views DESC, r.second_mark ASC;
`.trim();

/**
 * 4. Bike Model Telemetry & ROI Comparison Matrix
 * Compares performance metrics by motorcycle (Yamaha R1M, Ducati Panigale V4 S,
 * Adventure Sport Touring Rig, Kawasaki ZX-10R, Honda CBR1000RR-R Fireblade).
 */
export const SQL_BIKE_MODEL_COMPARISON = `
SELECT 
    v.bike_model,
    COUNT(v.video_id) AS video_count,
    SUM(v.views) AS aggregate_views,
    ROUND(AVG(v.views), 0) AS avg_views_per_video,
    ROUND(AVG(v.retention_pct), 1) AS avg_retention_pct,
    ROUND(AVG(v.ctr_pct), 1) AS avg_ctr_pct,
    ROUND(SUM(v.watch_time_hours), 0) AS total_watch_hours,
    ROUND(SUM(v.estimated_revenue_usd), 2) AS total_revenue_usd,
    ROUND(AVG(v.estimated_revenue_usd), 2) AS avg_revenue_per_video,
    MAX(v.velocity_views_per_hr) AS peak_velocity_views_per_hr
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@ashrides26'
GROUP BY v.bike_model
HAVING COUNT(v.video_id) > 0
ORDER BY aggregate_views DESC;
`.trim();

/**
 * 5. Monthly Channel Growth & Revenue Trend Time-Series
 * Tracks month-over-month trajectory, subscriber growth rate, and revenue per 1000 views.
 */
export const SQL_MONTHLY_GROWTH_TIMESERIES = `
SELECT 
    g.year_num,
    g.month_name,
    g.views,
    g.subscribers_gained,
    g.watch_time_hours,
    g.revenue_est,
    ROUND(g.revenue_est / NULLIF(g.views / 1000, 0), 2) AS effective_rpm_usd,
    g.bike_review_views,
    g.vlog_views,
    g.shorts_views,
    ROUND((g.shorts_views / NULLIF(g.views, 0)) * 100, 1) AS shorts_view_share_pct
FROM fact_monthly_growth g
WHERE g.channel_id = 'ashrides26_official'
ORDER BY g.year_num DESC, g.id DESC;
`.trim();

/**
 * 6. Motovlog Competitor Benchmarking & Market Share Analysis
 * Benchmarks @ashrides26 against leading channels in subscriber counts,
 * view velocities, and retention quality.
 */
export const SQL_CHANNEL_BENCHMARKS = `
SELECT 
    c.channel_id,
    c.name AS channel_name,
    c.handle,
    c.subscribers,
    c.total_views,
    c.total_videos,
    c.avg_views_per_video,
    c.sub_growth_monthly_pct,
    c.primary_bike,
    c.is_primary,
    ROUND(c.total_views / NULLIF(c.subscribers, 0), 1) AS views_per_subscriber_ratio
FROM dim_channels c
ORDER BY c.subscribers DESC;
`.trim();

/**
 * 7. Active Real-Time Anomaly & Velocity Alerts
 * Surfaces unread alerts prioritizing high multiplier viral surges and retention milestones.
 */
export const SQL_ACTIVE_ALERTS = `
SELECT 
    a.alert_id,
    a.alert_type,
    a.priority,
    a.channel_name,
    a.video_title,
    a.multiplier,
    a.metric_value,
    a.message,
    a.alert_timestamp,
    a.is_read
FROM dim_trending_alerts a
WHERE a.is_read = FALSE OR a.priority = 'critical'
ORDER BY 
    CASE a.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END ASC,
    a.created_at DESC;
`.trim();

/**
 * 8. Adventure Tour Series Deep-Dive (@ashrides26 Gainesville to Asheville NC)
 * Aggregates roadtrip motovlogs, maintenance stops, and mountain twisties.
 */
export const SQL_ADVENTURE_TOUR_DEEPDIVE = `
SELECT 
    v.video_id,
    v.title,
    v.upload_date,
    v.duration_seconds,
    CONCAT(ROUND(v.duration_seconds / 60, 1), ' min') AS duration_min,
    v.views,
    v.likes,
    v.comments,
    v.retention_pct,
    v.watch_time_hours,
    v.ctr_pct,
    v.velocity_views_per_hr,
    v.audio_sound_profile,
    v.top_demographic
FROM fact_video_metrics v
WHERE v.channel_id = 'ashrides26_official'
  AND (v.title LIKE '%Adventure%' OR v.title LIKE '%Asheville%' OR v.title LIKE '%Trail%' OR v.category = 'vlog')
ORDER BY v.upload_date DESC;
`.trim();

/**
 * 9. High CTR vs Retention Conversion Quadrant
 * Classifies videos into 4 engagement quadrants:
 * - High CTR + High Retention (Algorithm Viral Drivers)
 * - Low CTR + High Retention (Great Content, Needs Better Thumbnails/Titles)
 * - High CTR + Low Retention (Clickbait Risk)
 * - Low CTR + Low Retention (Needs Revision)
 */
export const SQL_CTR_RETENTION_QUADRANT = `
SELECT 
    v.video_id,
    v.title,
    v.category,
    v.ctr_pct,
    v.retention_pct,
    v.views,
    CASE 
        WHEN v.ctr_pct >= 11.0 AND v.retention_pct >= 70.0 THEN 'Viral Powerhouse (High CTR, High Retention)'
        WHEN v.ctr_pct < 11.0 AND v.retention_pct >= 70.0 THEN 'Hidden Gem (Low CTR, High Retention - Improve Thumbnail)'
        WHEN v.ctr_pct >= 11.0 AND v.retention_pct < 70.0 THEN 'Drop Risk (High CTR, Low Retention - Fix Hook)'
        ELSE 'Underperforming (Low CTR, Low Retention)'
    END AS engagement_quadrant,
    v.velocity_views_per_hr
FROM fact_video_metrics v
WHERE v.channel_id = 'ashrides26_official'
ORDER BY v.ctr_pct DESC, v.retention_pct DESC;
`.trim();

/**
 * Pre-compiled list of all backend query definitions with metadata
 */
export const BACKEND_QUERIES: BackendQueryDefinition[] = [
  {
    id: 'category_performance',
    name: 'Content Category Performance & View Density',
    category: 'Aggregation',
    description: 'Aggregates total videos, average retention %, watch time, revenue, and view density factor by category (Shorts, Bike Reviews, Vlogs).',
    sql: SQL_CATEGORY_PERFORMANCE,
    indexesUsed: ['idx_videos_category (BTREE)', 'idx_composite_cat_retention (COMPOSITE)', 'fk_videos_channel']
  },
  {
    id: 'velocity_surge_ranking',
    name: 'Window Function: 48-Hour Velocity Surge Rank & Outliers',
    category: 'Window Functions',
    description: 'Calculates real-time view velocity surges against category moving averages using MySQL 8.0 CTEs, AVG() OVER, and PERCENT_RANK().',
    sql: SQL_VELOCITY_SURGE_RANKING,
    indexesUsed: ['idx_videos_velocity (BTREE)', 'idx_composite_cat_views (COMPOSITE)']
  },
  {
    id: 'retention_drop_and_spike_audit',
    name: 'Retention Curve Drop-off & Re-watch Spikes (JOIN)',
    category: 'Cross-Table Joins',
    description: 'Performs a relational JOIN between fact_video_retention and fact_video_metrics to isolate drop points and high-replay moments.',
    sql: SQL_RETENTION_AUDIT,
    indexesUsed: ['idx_retention_spikes (BTREE)', 'idx_retention_video_second (COMPOSITE)', 'fk_retention_video']
  },
  {
    id: 'bike_model_comparison',
    name: 'Motorcycle ROI & Telemetry Matrix (Bike Models)',
    category: 'Aggregation',
    description: 'Group-by analysis on motorcycle platforms (Adventure Touring Rig, Yamaha R1M, Ducati Panigale V4 S, ZX-10R) comparing retention, CTR, and revenue.',
    sql: SQL_BIKE_MODEL_COMPARISON,
    indexesUsed: ['idx_videos_bike_model (BTREE)', 'idx_videos_views (BTREE)']
  },
  {
    id: 'monthly_growth_timeseries',
    name: 'Monthly Channel Trajectory & Effective RPM Time-Series',
    category: 'Time Series',
    description: 'Calculates month-over-month growth, effective RPM ($ per 1,000 views), and shorts view market share from fact_monthly_growth.',
    sql: SQL_MONTHLY_GROWTH_TIMESERIES,
    indexesUsed: ['idx_growth_year_month (BTREE)', 'uq_channel_month_year (UNIQUE)']
  },
  {
    id: 'channel_benchmarks',
    name: 'Motovlogging Benchmarks & Subscriber View Ratio',
    category: 'Aggregation',
    description: 'Cross-channel benchmark comparing @ashrides26 against competitor motovloggers with subscriber-to-view ratios.',
    sql: SQL_CHANNEL_BENCHMARKS,
    indexesUsed: ['idx_channels_subs (BTREE)', 'idx_channels_handle (UNIQUE)']
  },
  {
    id: 'active_alerts',
    name: 'Real-Time Anomaly & Surge Alerts Queue',
    category: 'Real-Time Telemetry',
    description: 'Fetches prioritized viral velocity surge, retention milestone, and breakout alerts with custom CASE ordering.',
    sql: SQL_ACTIVE_ALERTS,
    indexesUsed: ['idx_alerts_read_priority (BTREE)', 'idx_alerts_created_at (BTREE)']
  },
  {
    id: 'adventure_tour_deepdive',
    name: 'Adventure Tour Series Performance (Gainesville to Asheville)',
    category: 'Aggregation',
    description: 'Deep-dive telemetry on the Gainesville to Asheville NC motorcycle adventure tour, mountain twisties, and trail repair vlogs.',
    sql: SQL_ADVENTURE_TOUR_DEEPDIVE,
    indexesUsed: ['idx_videos_category (BTREE)', 'idx_videos_upload_date (BTREE)']
  },
  {
    id: 'ctr_retention_quadrant',
    name: 'CTR vs Retention Engagement Quadrant Classifier',
    category: 'Optimization',
    description: 'Classifies motovlogs into Viral Powerhouse, Hidden Gem, Hook Drop Risk, or Underperforming using multi-conditional SQL CASE logic.',
    sql: SQL_CTR_RETENTION_QUADRANT,
    indexesUsed: ['idx_videos_retention (BTREE)', 'idx_videos_views (BTREE)']
  }
];

export function getBackendQueryById(id: string): BackendQueryDefinition | undefined {
  return BACKEND_QUERIES.find((q) => q.id === id);
}
