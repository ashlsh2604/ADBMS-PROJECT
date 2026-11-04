/**
 * AshRides26 - Advanced DBMS (ADBMS) 4-Phase Core Module
 * Implements Phase 1 (Data Modelling & 3NF Normalization),
 * Phase 2 (Database Creation, NULL Handling, Constraints & Aggregates),
 * Phase 3 (JOINs, Subqueries, Views, Stored Procedures & Analytics),
 * Phase 4 (ACID Transactions, COMMIT, ROLLBACK, SAVEPOINT, Concurrency & Validation).
 */

export interface AdbmsEntity {
  name: string;
  type: 'Fact' | 'Dimension' | 'Bridge' | 'Audit';
  primaryKey: string;
  foreignKeys: string[];
  description: string;
  attributes: Array<{
    name: string;
    type: string;
    nullable: boolean;
    constraint?: string;
    description: string;
  }>;
}

export interface AdbmsRelationship {
  from: string;
  to: string;
  cardinality: '1:1' | '1:N' | 'N:M';
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  foreignKey: string;
  description: string;
}

export interface AdbmsNormalizationStep {
  form: 'UNF' | '1NF' | '2NF' | '3NF';
  title: string;
  rule: string;
  problemInPrevious: string;
  solutionApplied: string;
  functionalDependencies: string[];
  tables: string[];
}

export interface AdbmsQueryItem {
  id: string;
  phase: 1 | 2 | 3 | 4;
  subCategory: string;
  title: string;
  description: string;
  sql: string;
  indexesUsed: string[];
  explanation: string;
}

export interface AdbmsProcedureDef {
  name: string;
  parameters: Array<{ name: string; type: string; mode: 'IN' | 'OUT'; description: string }>;
  description: string;
  definitionSql: string;
  sampleCallSql: string;
}

// =====================================================================
// PHASE 1: DATA MODELLING & NORMALIZATION SPECIFICATIONS
// =====================================================================

export const ADBMS_ENTITIES: AdbmsEntity[] = [
  {
    name: 'dim_channels',
    type: 'Dimension',
    primaryKey: 'channel_id',
    foreignKeys: [],
    description: 'Master motovlogger channel profile, handle, verification status, and benchmarks.',
    attributes: [
      { name: 'channel_id', type: 'VARCHAR(64)', nullable: false, constraint: 'PRIMARY KEY', description: 'Unique channel identifier' },
      { name: 'name', type: 'VARCHAR(128)', nullable: false, constraint: 'NOT NULL', description: 'Display name' },
      { name: 'handle', type: 'VARCHAR(64)', nullable: false, constraint: 'UNIQUE', description: 'YouTube handle (@ashrides26)' },
      { name: 'subscribers', type: 'BIGINT UNSIGNED', nullable: false, constraint: 'DEFAULT 0, CHECK >= 0', description: 'Total subscriber count' },
      { name: 'total_views', type: 'BIGINT UNSIGNED', nullable: false, constraint: 'DEFAULT 0', description: 'Cumulative channel views' },
      { name: 'total_videos', type: 'INT UNSIGNED', nullable: false, constraint: 'DEFAULT 0', description: 'Uploaded video count' },
      { name: 'primary_bike', type: 'VARCHAR(255)', nullable: true, description: 'Motorcycles featured' },
      { name: 'is_primary', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT FALSE', description: 'True for @ashrides26' },
      { name: 'sub_growth_monthly_pct', type: 'DECIMAL(5,2)', nullable: false, description: 'Monthly growth velocity %' },
    ],
  },
  {
    name: 'fact_video_metrics',
    type: 'Fact',
    primaryKey: 'video_id',
    foreignKeys: ['channel_id -> dim_channels.channel_id'],
    description: 'Central fact table recording video telemetry, views, retention %, and estimated revenue.',
    attributes: [
      { name: 'video_id', type: 'VARCHAR(64)', nullable: false, constraint: 'PRIMARY KEY', description: 'Unique video ID' },
      { name: 'channel_id', type: 'VARCHAR(64)', nullable: false, constraint: 'FK -> dim_channels', description: 'Owning channel' },
      { name: 'title', type: 'VARCHAR(255)', nullable: false, constraint: 'NOT NULL', description: 'Video title' },
      { name: 'category', type: 'ENUM', nullable: false, constraint: 'bike_review, vlog, shorts', description: 'Content classification' },
      { name: 'bike_model', type: 'VARCHAR(128)', nullable: false, constraint: 'NOT NULL', description: 'Motorcycle tested' },
      { name: 'duration_seconds', type: 'INT UNSIGNED', nullable: false, constraint: 'CHECK > 0', description: 'Duration in seconds' },
      { name: 'views', type: 'BIGINT UNSIGNED', nullable: false, constraint: 'DEFAULT 0', description: 'View count' },
      { name: 'retention_pct', type: 'DECIMAL(5,2)', nullable: false, constraint: 'CHECK 0-100', description: 'Average retention percentage' },
      { name: 'ctr_pct', type: 'DECIMAL(5,2)', nullable: false, constraint: 'CHECK 0-100', description: 'Click-through rate' },
      { name: 'estimated_revenue_usd', type: 'DECIMAL(10,2)', nullable: false, constraint: 'CHECK >= 0', description: 'AdSense & sponsorship revenue' },
      { name: 'velocity_views_per_hr', type: 'INT UNSIGNED', nullable: false, description: 'Hourly view velocity' },
      { name: 'audio_sound_profile', type: 'VARCHAR(128)', nullable: true, description: 'NULL if default mic used' },
      { name: 'top_demographic', type: 'VARCHAR(128)', nullable: true, description: 'NULL if insufficient sample' },
    ],
  },
  {
    name: 'fact_video_retention',
    type: 'Fact',
    primaryKey: 'id (AUTO_INCREMENT)',
    foreignKeys: ['video_id -> fact_video_metrics.video_id'],
    description: 'Second-by-second viewer attention curve, drop points, and high-replay spike markers.',
    attributes: [
      { name: 'id', type: 'BIGINT UNSIGNED', nullable: false, constraint: 'PRIMARY KEY AUTO_INCREMENT', description: 'Retention point ID' },
      { name: 'video_id', type: 'VARCHAR(64)', nullable: false, constraint: 'FK -> fact_video_metrics', description: 'Associated video' },
      { name: 'second_mark', type: 'INT UNSIGNED', nullable: false, constraint: 'CHECK >= 0', description: 'Timestamp in seconds' },
      { name: 'pct_retention', type: 'DECIMAL(5,2)', nullable: false, constraint: 'CHECK 0-100', description: 'Remaining audience %' },
      { name: 'chapter_name', type: 'VARCHAR(128)', nullable: true, description: 'Optional chapter title' },
      { name: 'is_drop_point', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT FALSE', description: 'Significant audience drop' },
      { name: 'is_spike_point', type: 'BOOLEAN', nullable: false, constraint: 'DEFAULT FALSE', description: 'High re-watch replay peak' },
      { name: 'editorial_note', type: 'VARCHAR(255)', nullable: true, description: 'Producer analysis note' },
    ],
  },
  {
    name: 'fact_bike_telemetry',
    type: 'Fact',
    primaryKey: 'telemetry_id',
    foreignKeys: ['video_id -> fact_video_metrics.video_id'],
    description: 'Physical motorcycle sensor logs (top speed, lean angles, exhaust dB, G-force).',
    attributes: [
      { name: 'telemetry_id', type: 'VARCHAR(64)', nullable: false, constraint: 'PRIMARY KEY', description: 'Telemetry log ID' },
      { name: 'video_id', type: 'VARCHAR(64)', nullable: false, constraint: 'UNIQUE FK', description: '1:1 video linkage' },
      { name: 'bike_model', type: 'VARCHAR(128)', nullable: false, description: 'Bike model tested' },
      { name: 'top_speed_mph', type: 'DECIMAL(5,1)', nullable: false, constraint: 'CHECK > 0', description: 'Peak speed reached' },
      { name: 'avg_lean_angle_deg', type: 'DECIMAL(4,1)', nullable: false, constraint: 'CHECK 0-65', description: 'Cornering lean angle' },
      { name: 'exhaust_sound_db', type: 'DECIMAL(4,1)', nullable: false, constraint: 'CHECK 50-135', description: 'Exhaust dB sound level' },
      { name: 'g_force_peak', type: 'DECIMAL(3,2)', nullable: false, description: 'Peak braking/acceleration G-force' },
      { name: 'gps_route_name', type: 'VARCHAR(128)', nullable: false, description: 'Route / Canyon name' },
    ],
  },
  {
    name: 'fact_monthly_growth',
    type: 'Fact',
    primaryKey: 'id',
    foreignKeys: ['channel_id -> dim_channels.channel_id'],
    description: 'Aggregated monthly performance, subscriber additions, and revenue time-series.',
    attributes: [
      { name: 'id', type: 'INT UNSIGNED', nullable: false, constraint: 'PRIMARY KEY', description: 'Record ID' },
      { name: 'channel_id', type: 'VARCHAR(64)', nullable: false, constraint: 'FK', description: 'Channel ID' },
      { name: 'month_name', type: 'VARCHAR(16)', nullable: false, description: 'Month name' },
      { name: 'year_num', type: 'INT UNSIGNED', nullable: false, constraint: 'CHECK >= 2020', description: 'Year' },
      { name: 'views', type: 'BIGINT UNSIGNED', nullable: false, description: 'Monthly views' },
      { name: 'subscribers_gained', type: 'INT', nullable: false, description: 'Net subscribers gained' },
      { name: 'revenue_est', type: 'DECIMAL(10,2)', nullable: false, description: 'Monthly revenue' },
    ],
  },
  {
    name: 'dim_trending_alerts',
    type: 'Dimension',
    primaryKey: 'alert_id',
    foreignKeys: ['video_id -> fact_video_metrics.video_id (Optional)'],
    description: 'Real-time velocity spikes, viral shorts breakouts, and retention milestone notifications.',
    attributes: [
      { name: 'alert_id', type: 'VARCHAR(64)', nullable: false, constraint: 'PRIMARY KEY', description: 'Alert ID' },
      { name: 'video_id', type: 'VARCHAR(64)', nullable: true, description: 'NULL for channel-wide milestones' },
      { name: 'alert_type', type: 'ENUM', nullable: false, description: 'velocity_surge, milestone, etc.' },
      { name: 'multiplier', type: 'DECIMAL(4,1)', nullable: true, description: 'NULL for non-velocity alerts' },
      { name: 'priority', type: 'ENUM', nullable: false, description: 'critical, high, medium, info' },
    ],
  },
  {
    name: 'dim_sponsors_partnerships',
    type: 'Dimension',
    primaryKey: 'sponsor_id',
    foreignKeys: [],
    description: 'Motorcycle gear brands, exhaust manufacturers, and affiliate contracts.',
    attributes: [
      { name: 'sponsor_id', type: 'VARCHAR(64)', nullable: false, constraint: 'PRIMARY KEY', description: 'Sponsor ID' },
      { name: 'brand_name', type: 'VARCHAR(128)', nullable: false, constraint: 'UNIQUE', description: 'Brand name' },
      { name: 'category', type: 'VARCHAR(64)', nullable: false, description: 'Exhaust, Helmet Audio, Tires' },
      { name: 'royalty_cpm_boost', type: 'DECIMAL(4,2)', nullable: false, description: 'CPM boost percentage' },
    ],
  },
  {
    name: 'fact_video_sponsorships',
    type: 'Bridge',
    primaryKey: '(video_id, sponsor_id)',
    foreignKeys: ['video_id -> fact_video_metrics.video_id', 'sponsor_id -> dim_sponsors_partnerships.sponsor_id'],
    description: 'Bridge table resolving the Many-to-Many relationship between videos and sponsors.',
    attributes: [
      { name: 'video_id', type: 'VARCHAR(64)', nullable: false, constraint: 'COMPOSITE PK, FK', description: 'Video ID' },
      { name: 'sponsor_id', type: 'VARCHAR(64)', nullable: false, constraint: 'COMPOSITE PK, FK', description: 'Sponsor ID' },
      { name: 'featured_product', type: 'VARCHAR(128)', nullable: false, description: 'Featured item in video' },
      { name: 'payout_usd', type: 'DECIMAL(10,2)', nullable: false, description: 'Contract payout' },
    ],
  },
];

export const ADBMS_RELATIONSHIPS: AdbmsRelationship[] = [
  {
    from: 'dim_channels',
    to: 'fact_video_metrics',
    cardinality: '1:N',
    onDelete: 'CASCADE',
    foreignKey: 'channel_id',
    description: 'One channel publishes many motovlog videos (Mandatory 1:N).',
  },
  {
    from: 'fact_video_metrics',
    to: 'fact_video_retention',
    cardinality: '1:N',
    onDelete: 'CASCADE',
    foreignKey: 'video_id',
    description: 'One video contains many chronological retention second plot points (1:N).',
  },
  {
    from: 'fact_video_metrics',
    to: 'fact_bike_telemetry',
    cardinality: '1:1',
    onDelete: 'CASCADE',
    foreignKey: 'video_id',
    description: 'One video has at most one physical bike sensor telemetry dataset (0..1 : 1).',
  },
  {
    from: 'dim_channels',
    to: 'fact_monthly_growth',
    cardinality: '1:N',
    onDelete: 'CASCADE',
    foreignKey: 'channel_id',
    description: 'One channel records monthly subscriber and view milestones (1:N).',
  },
  {
    from: 'fact_video_metrics',
    to: 'dim_sponsors_partnerships',
    cardinality: 'N:M',
    onDelete: 'CASCADE',
    foreignKey: 'fact_video_sponsorships bridge',
    description: 'Many videos feature multiple sponsors, and sponsors sponsor multiple videos (N:M).',
  },
  {
    from: 'dim_users',
    to: 'user_device_sessions',
    cardinality: '1:N',
    onDelete: 'CASCADE',
    foreignKey: 'user_id',
    description: 'One user account synchronizes multiple connected devices (1:N).',
  },
  {
    from: 'dim_users',
    to: 'user_saved_queries',
    cardinality: '1:N',
    onDelete: 'CASCADE',
    foreignKey: 'user_id',
    description: 'One user saves multiple custom SQL scripts in the workbench (1:N).',
  },
];

export const ADBMS_NORMALIZATION_STEPS: AdbmsNormalizationStep[] = [
  {
    form: 'UNF',
    title: 'Unnormalized Form (UNF) - Raw Motovlogging Log',
    rule: 'Contains repeating groups, multi-valued attributes, and unseparated master entities.',
    problemInPrevious: 'Raw spreadsheet containing channel metadata, repeating retention curves inside single cells, multi-valued tags, and embedded sponsor contracts.',
    solutionApplied: 'Identified all distinct business attributes, isolated repeating rows, and prepared for atomic decomposition.',
    functionalDependencies: ['All fields lumped in single document.'],
    tables: ['unf_raw_motovlog_log (channel_name, handle, video_title, retention_points_list, sponsor_list, ... )'],
  },
  {
    form: '1NF',
    title: 'First Normal Form (1NF) - Atomic Attributes & Primary Keys',
    rule: 'Each column contains only atomic (indivisible) values; no repeating groups; each record has a unique primary key.',
    problemInPrevious: 'Retention points were stored as nested lists; tags were non-atomic; sponsor contracts were comma-delimited strings.',
    solutionApplied: 'Created composite keys (video_id, second_mark) and (video_id, sponsor_id). Every column holds single atomic values.',
    functionalDependencies: [
      '(video_id, second_mark) -> pct_retention, chapter_name, video_title, channel_handle, channel_subs',
      '(video_id, sponsor_id) -> featured_product, payout_usd, video_title, channel_handle',
    ],
    tables: ['table_1nf_video_composite (video_id, second_mark, pct_retention, title, channel_name, handle, subscribers, duration)'],
  },
  {
    form: '2NF',
    title: 'Second Normal Form (2NF) - Elimination of Partial Dependencies',
    rule: 'Table is in 1NF and all non-key attributes are fully functionally dependent on the ENTIRE primary key (no partial dependencies on subsets of composite keys).',
    problemInPrevious: 'In (video_id, second_mark), the attributes title, category, and duration depend ONLY on video_id, NOT on second_mark. This is a partial dependency causing update anomalies.',
    solutionApplied: 'Decomposed into fact_video_metrics (keyed solely by video_id) and fact_video_retention (keyed by video_id + second_mark).',
    functionalDependencies: [
      'video_id -> title, category, bike_model, duration_seconds, views, channel_id, channel_name, channel_handle',
      '(video_id, second_mark) -> pct_retention, chapter_name, is_drop_point',
    ],
    tables: ['fact_video_metrics', 'fact_video_retention'],
  },
  {
    form: '3NF',
    title: 'Third Normal Form (3NF) - Elimination of Transitive Dependencies',
    rule: 'Table is in 2NF and no non-key attribute is transitively dependent on the primary key (X -> Y and Y -> Z where Z is non-prime is eliminated).',
    problemInPrevious: 'In fact_video_metrics, video_id -> channel_id, and channel_id -> channel_name, handle, subscribers. Therefore, video_id -> subscribers is a TRANSITIVE dependency. If channel subscriber count changes, all video rows would need updating.',
    solutionApplied: 'Decomposed channel details into dim_channels. Now video_id points only to channel_id (FK), and channel details live exclusively in dim_channels.',
    functionalDependencies: [
      'video_id -> channel_id, title, category, bike_model, views, retention_pct',
      'channel_id -> name, handle, subscribers, total_views, primary_bike',
      'Result: Strict 3NF compliance with zero update, insertion, or deletion anomalies!',
    ],
    tables: ['dim_channels', 'fact_video_metrics', 'fact_video_retention', 'fact_bike_telemetry'],
  },
];

// =====================================================================
// PHASE 2 & 3: QUERIES SUITE (AGGREGATES, NULLS, JOINS, SUBQUERIES, VIEWS)
// =====================================================================

export const ADBMS_QUERIES: AdbmsQueryItem[] = [
  // --- Phase 2: Database Creation, NULL Handling, Constraints & Aggregates ---
  {
    id: 'p2_null_handling_coalesce',
    phase: 2,
    subCategory: 'NULL Handling',
    title: 'Explicit NULL Handling via COALESCE() & NULLIF()',
    description: 'Demonstrates handling nullable audio profiles, missing demographics, and dividing by zero safely using NULLIF.',
    sql: `SELECT 
    v.video_id,
    v.title,
    v.category,
    COALESCE(v.audio_sound_profile, 'Standard Helmet Audio (No Ext Mic)') AS resolved_audio_profile,
    COALESCE(v.top_demographic, 'General Audience (Insufficient Telemetry)') AS resolved_demographic,
    v.views,
    v.duration_seconds,
    ROUND(v.views / NULLIF(v.duration_seconds, 0), 2) AS view_density_factor
FROM fact_video_metrics v
ORDER BY v.views DESC
LIMIT 6;`,
    indexesUsed: ['idx_videos_views (BTREE)'],
    explanation: 'Uses COALESCE to provide production fallback values for nullable attributes and NULLIF to prevent division-by-zero fatal errors.',
  },
  {
    id: 'p2_multi_level_aggregates',
    phase: 2,
    subCategory: 'Aggregates',
    title: 'Multi-Level Aggregate KPIs with HAVING Filter',
    description: 'Calculates COUNT(), SUM(), AVG(), MIN(), and MAX() grouped by bike model and filtered by HAVING aggregate threshold.',
    sql: `SELECT 
    v.bike_model,
    COUNT(v.video_id) AS video_count,
    SUM(v.views) AS total_views,
    ROUND(AVG(v.views), 0) AS avg_views,
    MIN(v.retention_pct) AS min_retention_pct,
    MAX(v.retention_pct) AS max_retention_pct,
    ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
    ROUND(SUM(v.estimated_revenue_usd), 2) AS total_revenue_usd
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@ashrides26'
GROUP BY v.bike_model
HAVING COUNT(v.video_id) >= 1 AND SUM(v.views) >= 500000
ORDER BY total_views DESC;`,
    indexesUsed: ['idx_videos_bike_model (BTREE)', 'idx_videos_views (BTREE)'],
    explanation: 'Demonstrates SQL aggregation standards with aggregate filter criteria (HAVING) evaluated after GROUP BY grouping.',
  },

  // --- Phase 3: Data Querying (JOINs, Subqueries, Views, Stored Procedures) ---
  {
    id: 'p3_three_way_inner_join',
    phase: 3,
    subCategory: 'Relational JOINs',
    title: '3-Way Relational JOIN: Channel -> Video -> Retention Points',
    description: 'Joins dim_channels, fact_video_metrics, and fact_video_retention to isolate chapter retention spikes for @ashrides26.',
    sql: `SELECT 
    c.handle AS channel_handle,
    v.video_id,
    v.title AS video_title,
    v.category,
    r.second_mark,
    CONCAT(FLOOR(r.second_mark / 60), 'm ', (r.second_mark % 60), 's') AS timestamp_formatted,
    r.pct_retention,
    r.chapter_name,
    r.is_spike_point,
    r.editorial_note
FROM dim_channels c
INNER JOIN fact_video_metrics v ON c.channel_id = v.channel_id
INNER JOIN fact_video_retention r ON v.video_id = r.video_id
WHERE c.handle = '@ashrides26' AND r.is_spike_point = TRUE
ORDER BY r.pct_retention DESC, r.second_mark ASC;`,
    indexesUsed: ['idx_channels_handle (UNIQUE)', 'fk_videos_channel', 'fk_retention_video', 'idx_retention_spikes'],
    explanation: 'Relational 3-way INNER JOIN navigating 1:N relationships from channel master to individual second-by-second attention spikes.',
  },
  {
    id: 'p3_left_outer_join_telemetry',
    phase: 3,
    subCategory: 'Relational JOINs',
    title: 'LEFT OUTER JOIN: Videos with Optional Bike Telemetry Sensors',
    description: 'Demonstrates LEFT OUTER JOIN ensuring all videos are returned even if physical hardware sensor logs are not present.',
    sql: `SELECT 
    v.video_id,
    v.title,
    v.bike_model,
    v.views,
    v.retention_pct,
    COALESCE(t.top_speed_mph, 0.0) AS top_speed_mph,
    COALESCE(t.avg_lean_angle_deg, 0.0) AS avg_lean_angle_deg,
    COALESCE(t.exhaust_sound_db, 0.0) AS exhaust_sound_db,
    COALESCE(t.gps_route_name, 'No GPS Log Available') AS gps_route_name,
    CASE WHEN t.telemetry_id IS NOT NULL THEN 'SENSOR LOGGED' ELSE 'NO TELEMETRY' END AS sensor_status
FROM fact_video_metrics v
LEFT JOIN fact_bike_telemetry t ON v.video_id = t.video_id
ORDER BY v.views DESC;`,
    indexesUsed: ['idx_videos_views (BTREE)', 'fk_telemetry_video'],
    explanation: 'LEFT OUTER JOIN preserves rows from fact_video_metrics when no matching fact_bike_telemetry record exists.',
  },
  {
    id: 'p3_correlated_subquery_above_cat_avg',
    phase: 3,
    subCategory: 'Subqueries',
    title: 'Correlated Subquery: Videos Exceeding Category Average Views',
    description: 'Uses a correlated subquery in the WHERE clause where the inner query depends on the outer row category.',
    sql: `SELECT 
    v.video_id,
    v.title,
    v.category,
    v.bike_model,
    v.views,
    v.retention_pct,
    ROUND((SELECT AVG(v2.views) 
           FROM fact_video_metrics v2 
           WHERE v2.category = v.category), 0) AS category_avg_views,
    ROUND(v.views / (SELECT AVG(v2.views) 
                     FROM fact_video_metrics v2 
                     WHERE v2.category = v.category), 2) AS category_outperform_ratio
FROM fact_video_metrics v
WHERE v.views > (
    SELECT AVG(v2.views)
    FROM fact_video_metrics v2
    WHERE v2.category = v.category
)
ORDER BY category_outperform_ratio DESC;`,
    indexesUsed: ['idx_videos_category (BTREE)', 'idx_videos_views (BTREE)'],
    explanation: 'Correlated subquery evaluates category benchmark per row, isolating videos outperforming their specific content genre.',
  },
  {
    id: 'p3_subquery_with_exists',
    phase: 3,
    subCategory: 'Subqueries',
    title: 'Subquery with EXISTS: Channels with Trending Viral Motovlogs',
    description: 'Finds channels that have at least one active viral or trending video using the efficient EXISTS clause.',
    sql: `SELECT 
    c.channel_id,
    c.name,
    c.handle,
    c.subscribers,
    c.primary_bike
FROM dim_channels c
WHERE EXISTS (
    SELECT 1 
    FROM fact_video_metrics v 
    WHERE v.channel_id = c.channel_id 
      AND v.is_trending = TRUE
)
ORDER BY c.subscribers DESC;`,
    indexesUsed: ['idx_videos_trending (COMPOSITE)', 'fk_videos_channel'],
    explanation: 'EXISTS short-circuits evaluation as soon as the first matching trending record is located in the fact table.',
  },
  {
    id: 'p3_query_analytical_view',
    phase: 3,
    subCategory: 'Views',
    title: 'Querying DBMS View: v_category_performance_summary',
    description: 'Queries the pre-compiled analytical relational view encapsulating complex aggregations and safe divisions.',
    sql: `SELECT 
    v.category,
    v.total_videos,
    v.avg_retention_pct,
    v.avg_duration_sec,
    v.avg_watch_hours,
    v.total_views,
    v.total_revenue_usd,
    v.view_density_factor
FROM v_category_performance_summary v
ORDER BY v.total_revenue_usd DESC;`,
    indexesUsed: ['v_category_performance_summary (VIEW OPTIMIZER)'],
    explanation: 'Views provide abstraction and encapsulation, shielding consumers from complex joins and business calculation logic.',
  },
  {
    id: 'p3_call_stored_procedure',
    phase: 3,
    subCategory: 'Stored Procedures',
    title: 'CALL sp_GetVideoTelemetryReport("ash_vid_adv_01")',
    description: 'Executes the MySQL stored procedure returning multi-table KPI and physical sensor reporting.',
    sql: `CALL sp_GetVideoTelemetryReport('ash_vid_adv_01');`,
    indexesUsed: ['PRIMARY KEY Scan (fact_video_metrics)', 'fk_telemetry_video (fact_bike_telemetry)'],
    explanation: 'Stored procedures encapsulate reusable business logic, parameter validation, and multi-statement queries inside the database.',
  },

  // --- Phase 4: Data Integrity (Transactions, Concurrency, Validation) ---
  {
    id: 'p4_acid_transaction_demo',
    phase: 4,
    subCategory: 'Transactions & ACID',
    title: 'ACID Transaction Script: COMMIT, ROLLBACK & SAVEPOINT',
    description: 'Demonstrates START TRANSACTION, intermediate SAVEPOINT, conditional error simulation, and COMMIT.',
    sql: `START TRANSACTION;

-- Step 1: Update video views atomically
UPDATE fact_video_metrics 
SET views = views + 25000, velocity_views_per_hr = velocity_views_per_hr + 400
WHERE video_id = 'ash_vid_adv_01';

-- Step 2: Establish intermediate checkpoint
SAVEPOINT sp_views_updated;

-- Step 3: Insert milestone telemetry alert
INSERT INTO dim_trending_alerts (
  alert_id, video_id, video_title, channel_name, category, 
  alert_type, metric_value, message, alert_timestamp, priority
) VALUES (
  'alert_tx_demo_01', 'ash_vid_adv_01', 'Gainesville to Asheville NC Adventure', '@AshRides26', 'vlog',
  'milestone', '767,000 Views', 'Milestone recorded via atomic ACID transaction.', 'Just now', 'high'
);

-- Option A: If validation fails -> ROLLBACK TO SAVEPOINT sp_views_updated;
-- Option B: If fatal error -> ROLLBACK;
-- Option C: Success commit:
COMMIT;`,
    indexesUsed: ['InnoDB Redo Log & Undo Buffer Pool', 'Row-level Lock on video_id'],
    explanation: 'Ensures Atomicity (all-or-nothing), Consistency (integrity checks pass), Isolation (row locked), and Durability (WAL flushed).',
  },
  {
    id: 'p4_concurrency_pessimistic_lock',
    phase: 4,
    subCategory: 'Concurrency Control',
    title: 'Pessimistic Locking: SELECT ... FOR UPDATE',
    description: 'Demonstrates row-level exclusive locks in MySQL InnoDB to prevent lost updates during concurrent edits.',
    sql: `START TRANSACTION;

-- Acquire exclusive X-Lock on target record
SELECT video_id, title, views, estimated_revenue_usd
FROM fact_video_metrics
WHERE video_id = 'ash_vid_01'
FOR UPDATE;

-- Concurrent transactions attempting to modify this row are queued until COMMIT
UPDATE fact_video_metrics
SET estimated_revenue_usd = estimated_revenue_usd + 250.00
WHERE video_id = 'ash_vid_01';

COMMIT;`,
    indexesUsed: ['PRIMARY (Exclusive X-Lock)', 'InnoDB Lock Monitor'],
    explanation: 'SELECT ... FOR UPDATE prevents race conditions and Dirty Writes in high-velocity concurrent transaction environments.',
  },
];

export const ADBMS_PROCEDURES: AdbmsProcedureDef[] = [
  {
    name: 'sp_GetVideoTelemetryReport',
    parameters: [{ name: 'p_video_id', type: 'VARCHAR(64)', mode: 'IN', description: 'Video identifier to analyze' }],
    description: 'Returns a 3-part comprehensive analytical dossier (Core Metrics, Physical Telemetry, High-Risk Drops & Spikes).',
    definitionSql: `CREATE PROCEDURE sp_GetVideoTelemetryReport(IN p_video_id VARCHAR(64))
BEGIN
  -- 1. Video KPI snapshot
  SELECT video_id, title, category, bike_model, views, retention_pct, ctr_pct, estimated_revenue_usd 
  FROM fact_video_metrics WHERE video_id = p_video_id;

  -- 2. Physical telemetry sensor logs
  SELECT telemetry_id, top_speed_mph, avg_lean_angle_deg, exhaust_sound_db, gps_route_name 
  FROM fact_bike_telemetry WHERE video_id = p_video_id;

  -- 3. Retention inflection points
  SELECT second_mark, pct_retention, chapter_name, is_drop_point, is_spike_point, editorial_note 
  FROM fact_video_retention WHERE video_id = p_video_id AND (is_drop_point = TRUE OR is_spike_point = TRUE);
END;`,
    sampleCallSql: `CALL sp_GetVideoTelemetryReport('ash_vid_adv_01');`,
  },
  {
    name: 'sp_CalculateChannelGrowthKPIs',
    parameters: [
      { name: 'p_channel_id', type: 'VARCHAR(64)', mode: 'IN', description: 'Target channel' },
      { name: 'p_total_revenue', type: 'DECIMAL(10,2)', mode: 'OUT', description: 'Calculated cumulative revenue' },
      { name: 'p_avg_rpm', type: 'DECIMAL(6,2)', mode: 'OUT', description: 'Effective revenue per 1000 views' },
      { name: 'p_total_views', type: 'BIGINT UNSIGNED', mode: 'OUT', description: 'Cumulative views' },
    ],
    description: 'Calculates channel-wide financial and view totals using OUT parameters.',
    definitionSql: `CREATE PROCEDURE sp_CalculateChannelGrowthKPIs(
  IN p_channel_id VARCHAR(64),
  OUT p_total_revenue DECIMAL(10,2),
  OUT p_avg_rpm DECIMAL(6,2),
  OUT p_total_views BIGINT UNSIGNED
)
BEGIN
  SELECT 
    COALESCE(SUM(revenue_est), 0.00),
    COALESCE(ROUND(SUM(revenue_est) / NULLIF(SUM(views) / 1000, 0), 2), 0.00),
    COALESCE(SUM(views), 0)
  INTO p_total_revenue, p_avg_rpm, p_total_views
  FROM fact_monthly_growth
  WHERE channel_id = p_channel_id;
END;`,
    sampleCallSql: `CALL sp_CalculateChannelGrowthKPIs('ashrides26_official', @rev, @rpm, @views);\nSELECT @rev AS total_revenue, @rpm AS effective_rpm, @views AS total_views;`,
  },
  {
    name: 'sp_SimulateLiveTrafficSpike',
    parameters: [
      { name: 'p_video_id', type: 'VARCHAR(64)', mode: 'IN', description: 'Target video' },
      { name: 'p_additional_views', type: 'INT', mode: 'IN', description: 'Views spike to inject atomically' },
    ],
    description: 'Executes an atomic transaction updating video views, checking thresholds, and generating an anomaly alert.',
    definitionSql: `CREATE PROCEDURE sp_SimulateLiveTrafficSpike(
  IN p_video_id VARCHAR(64),
  IN p_additional_views INT
)
BEGIN
  START TRANSACTION;
  UPDATE fact_video_metrics 
  SET views = views + p_additional_views, velocity_views_per_hr = velocity_views_per_hr + FLOOR(p_additional_views / 2)
  WHERE video_id = p_video_id;
  SAVEPOINT sp_spike_applied;
  COMMIT;
END;`,
    sampleCallSql: `CALL sp_SimulateLiveTrafficSpike('ash_vid_adv_01', 12500);`,
  },
];
