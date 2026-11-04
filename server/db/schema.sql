-- =====================================================================
-- AshRides26 Advanced Database Management Systems (ADBMS) Project
-- Complete 4-Phase Relational Architecture - MySQL 8.0 Engine
-- =====================================================================
-- 
-- Phase 1: Data Modelling (Entities, Relationships, ER Model, 3NF)
-- Phase 2: Database Creation (DDL, Data, NULL Handling, Constraints, Aggregates)
-- Phase 3: Data Querying (JOINs, Subqueries, Views, Stored Procedures, Analytics)
-- Phase 4: Data Integrity (ACID Transactions, COMMIT, ROLLBACK, SAVEPOINT, Concurrency)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ashrides26_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ashrides26_db;

-- #####################################################################
-- PHASE 1 & 2: DATA MODELLING & DATABASE CREATION (DDL & CONSTRAINTS)
-- #####################################################################

-- ---------------------------------------------------------------------
-- Table 1: dim_channels (Dimension: Motovlogging YouTube Channels)
-- Normalization: 3NF - Channel master data isolated from videos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_channels (
  channel_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  handle VARCHAR(64) NOT NULL UNIQUE,
  avatar_url VARCHAR(512),
  banner_url VARCHAR(512),
  subscribers BIGINT UNSIGNED DEFAULT 0,
  total_views BIGINT UNSIGNED DEFAULT 0,
  total_videos INT UNSIGNED DEFAULT 0,
  country VARCHAR(64) DEFAULT 'United States',
  primary_bike VARCHAR(255),
  joined_date DATE,
  verified BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  description TEXT,
  avg_views_per_video BIGINT UNSIGNED DEFAULT 0,
  sub_growth_monthly_pct DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_channels_handle (handle),
  INDEX idx_channels_subs (subscribers DESC),
  INDEX idx_channels_is_primary (is_primary),
  CONSTRAINT chk_channel_subs CHECK (subscribers >= 0),
  CONSTRAINT chk_channel_views CHECK (total_views >= 0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 2: fact_video_metrics (Fact: Motovlog Videos & Telemetry KPIs)
-- Normalization: 3NF - Foreign key channel_id, no transitive dependencies
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_video_metrics (
  video_id VARCHAR(64) PRIMARY KEY,
  channel_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(512),
  category ENUM('bike_review', 'vlog', 'shorts') NOT NULL,
  bike_model VARCHAR(128) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL,
  upload_date DATE NOT NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  likes INT UNSIGNED NOT NULL DEFAULT 0,
  comments INT UNSIGNED NOT NULL DEFAULT 0,
  retention_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  watch_time_hours INT UNSIGNED NOT NULL DEFAULT 0,
  ctr_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  cpm_usd DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  estimated_revenue_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  velocity_views_per_hr INT UNSIGNED NOT NULL DEFAULT 0,
  tags_json JSON,
  is_trending BOOLEAN DEFAULT FALSE,
  trending_score INT UNSIGNED DEFAULT 0,
  audio_sound_profile VARCHAR(128) NULL,       -- Explicit NULL handling: NULL if standard mic used
  top_demographic VARCHAR(128) NULL,           -- Explicit NULL handling: NULL if insufficient sample
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_channel FOREIGN KEY (channel_id)
    REFERENCES dim_channels(channel_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_video_duration CHECK (duration_seconds > 0),
  CONSTRAINT chk_video_retention CHECK (retention_pct BETWEEN 0.00 AND 100.00),
  CONSTRAINT chk_video_ctr CHECK (ctr_pct BETWEEN 0.00 AND 100.00),
  CONSTRAINT chk_video_revenue CHECK (estimated_revenue_usd >= 0.00),
  INDEX idx_videos_category (category),
  INDEX idx_videos_upload_date (upload_date DESC),
  INDEX idx_videos_views (views DESC),
  INDEX idx_videos_retention (retention_pct DESC),
  INDEX idx_videos_velocity (velocity_views_per_hr DESC),
  INDEX idx_videos_bike_model (bike_model),
  INDEX idx_videos_trending (is_trending, trending_score DESC),
  INDEX idx_composite_cat_views (category, views DESC),
  INDEX idx_composite_cat_retention (category, retention_pct DESC)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 3: fact_video_retention (Fact: Second-by-Second Attention Curve)
-- Normalization: 3NF - Decomposed from video metrics (1:N relation)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_video_retention (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL,
  second_mark INT UNSIGNED NOT NULL,
  pct_retention DECIMAL(5,2) NOT NULL,
  chapter_name VARCHAR(128) NULL,             -- Explicit NULL handling: optional chapter title
  is_drop_point BOOLEAN DEFAULT FALSE,
  is_spike_point BOOLEAN DEFAULT FALSE,
  editorial_note VARCHAR(255) NULL,            -- Explicit NULL handling: optional reviewer note
  CONSTRAINT fk_retention_video FOREIGN KEY (video_id)
    REFERENCES fact_video_metrics(video_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_retention_pct CHECK (pct_retention BETWEEN 0.00 AND 100.00),
  CONSTRAINT chk_second_mark CHECK (second_mark >= 0),
  INDEX idx_retention_video_second (video_id, second_mark),
  INDEX idx_retention_spikes (video_id, is_spike_point)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 4: fact_bike_telemetry (Fact: Onboard Motorcycle Sensor Logs)
-- Normalization: 3NF - Physical hardware telemetry isolated from video metadata
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_bike_telemetry (
  telemetry_id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL UNIQUE,       -- 1:1 / 0..1 relationship with video
  bike_model VARCHAR(128) NOT NULL,
  top_speed_mph DECIMAL(5,1) NOT NULL,
  avg_lean_angle_deg DECIMAL(4,1) NOT NULL,
  exhaust_sound_db DECIMAL(4,1) NOT NULL,
  g_force_peak DECIMAL(3,2) NOT NULL,
  gps_elevation_gain_ft INT NOT NULL DEFAULT 0,
  gps_route_name VARCHAR(128) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_telemetry_video FOREIGN KEY (video_id)
    REFERENCES fact_video_metrics(video_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_top_speed CHECK (top_speed_mph > 0),
  CONSTRAINT chk_lean_angle CHECK (avg_lean_angle_deg BETWEEN 0.0 AND 65.0),
  CONSTRAINT chk_sound_db CHECK (exhaust_sound_db BETWEEN 50.0 AND 135.0)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 5: fact_monthly_growth (Fact: Monthly Aggregated Trajectory)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_monthly_growth (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  channel_id VARCHAR(64) NOT NULL,
  month_name VARCHAR(16) NOT NULL,
  year_num INT UNSIGNED NOT NULL,
  views BIGINT UNSIGNED NOT NULL DEFAULT 0,
  subscribers_gained INT NOT NULL DEFAULT 0,
  watch_time_hours INT UNSIGNED NOT NULL DEFAULT 0,
  revenue_est DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  bike_review_views BIGINT UNSIGNED DEFAULT 0,
  vlog_views BIGINT UNSIGNED DEFAULT 0,
  shorts_views BIGINT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_growth_channel FOREIGN KEY (channel_id)
    REFERENCES dim_channels(channel_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_growth_year CHECK (year_num >= 2020),
  UNIQUE KEY uq_channel_month_year (channel_id, year_num, month_name),
  INDEX idx_growth_year_month (year_num, month_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 6: dim_trending_alerts (Dimension: Real-Time Anomaly & Surge Alerts)
-- Demonstrates NULL vs NOT NULL (channel-wide alerts have video_id = NULL)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_trending_alerts (
  alert_id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NULL,                   -- Explicit NULL: NULL for milestone / competitor alerts
  video_title VARCHAR(255) NULL,
  channel_name VARCHAR(128) NOT NULL,
  category ENUM('bike_review', 'vlog', 'shorts') NULL,
  alert_type ENUM('velocity_surge', 'retention_spike', 'viral_short', 'milestone', 'competitor_breakout') NOT NULL,
  multiplier DECIMAL(4,1) NULL,               -- Explicit NULL: NULL for non-velocity alerts
  metric_value VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  alert_timestamp VARCHAR(64) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority ENUM('critical', 'high', 'medium', 'info') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alerts_read_priority (is_read, priority),
  INDEX idx_alerts_created_at (created_at DESC)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 7: dim_users (Dimension: Multi-Device User Accounts & Security)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_users (
  user_id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(128) NOT NULL UNIQUE,
  password_hash VARCHAR(255) DEFAULT 'pbkdf2_sha256$e10adc3949ba59abbe56e057f20f883e',
  role VARCHAR(64) DEFAULT 'Channel Owner (Ash)',
  avatar_url VARCHAR(512),
  last_login VARCHAR(64),
  settings_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 8: user_device_sessions (Dimension: Cross-Device Sync State)
-- Demonstrates explicit battery_level INT NULL for desktop machines
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_device_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  device_name VARCHAR(128) NOT NULL,
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
  os VARCHAR(64),
  browser VARCHAR(64),
  ip_location VARCHAR(128),
  battery_level INT NULL,                      -- Explicit NULL: NULL for desktops, INT 0-100 for mobile
  is_current BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES dim_users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_battery_level CHECK (battery_level IS NULL OR (battery_level BETWEEN 0 AND 100)),
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 9: user_saved_queries (Dimension: DBMS Workbench Saved SQL Scripts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_saved_queries (
  query_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  sql_query TEXT NOT NULL,
  category VARCHAR(64) DEFAULT 'Analytics',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_queries_user FOREIGN KEY (user_id)
    REFERENCES dim_users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 10: dim_sponsors_partnerships (Dimension: Gear & Brands)
-- Completes N:M ER diagram relation with videos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_sponsors_partnerships (
  sponsor_id VARCHAR(64) PRIMARY KEY,
  brand_name VARCHAR(128) NOT NULL UNIQUE,
  category VARCHAR(64) NOT NULL,              -- e.g. 'Exhaust', 'Helmet Audio', 'Tires', 'Riding Gear'
  contact_email VARCHAR(128),
  discount_code VARCHAR(32),
  royalty_cpm_boost DECIMAL(4,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 11: fact_video_sponsorships (Bridge Table: Video N:M Sponsors)
-- Resolves Many-to-Many relationship between videos and sponsor brands
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_video_sponsorships (
  video_id VARCHAR(64) NOT NULL,
  sponsor_id VARCHAR(64) NOT NULL,
  featured_product VARCHAR(128) NOT NULL,
  payout_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  contract_date DATE NOT NULL,
  PRIMARY KEY (video_id, sponsor_id),
  CONSTRAINT fk_vs_video FOREIGN KEY (video_id)
    REFERENCES fact_video_metrics(video_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_vs_sponsor FOREIGN KEY (sponsor_id)
    REFERENCES dim_sponsors_partnerships(sponsor_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- #####################################################################
-- PHASE 3: DATA QUERYING (VIEWS, STORED PROCEDURES, JOINS, SUBQUERIES)
-- #####################################################################

-- ---------------------------------------------------------------------
-- View 1: v_category_performance_summary
-- Aggregates performance, revenue, and view density by content category
-- Handles NULL via NULLIF to prevent division by zero
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_category_performance_summary AS
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
WHERE c.is_primary = TRUE
GROUP BY v.category;

-- ---------------------------------------------------------------------
-- View 2: v_channel_benchmarks
-- LEFT JOIN aggregating video metrics against competitor channel stats
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_channel_benchmarks AS
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
  COUNT(v.video_id) AS analyzed_videos,
  COALESCE(ROUND(AVG(v.retention_pct), 2), 0.00) AS sample_avg_retention,
  COALESCE(MAX(v.views), 0) AS highest_view_video
FROM dim_channels c
LEFT JOIN fact_video_metrics v ON c.channel_id = v.channel_id
GROUP BY c.channel_id, c.name, c.handle, c.subscribers, c.total_views, c.total_videos, 
         c.avg_views_per_video, c.sub_growth_monthly_pct, c.primary_bike, c.is_primary;

-- ---------------------------------------------------------------------
-- View 3: v_viral_surge_telemetry
-- Combines video metrics and hardware telemetry for trending motovlogs
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_viral_surge_telemetry AS
SELECT 
  v.video_id,
  v.title,
  v.category,
  v.bike_model,
  v.views,
  v.velocity_views_per_hr,
  v.retention_pct,
  COALESCE(t.top_speed_mph, 0.0) AS top_speed_mph,
  COALESCE(t.avg_lean_angle_deg, 0.0) AS avg_lean_angle_deg,
  COALESCE(t.exhaust_sound_db, 0.0) AS exhaust_sound_db,
  COALESCE(t.gps_route_name, 'Standard Route') AS gps_route_name
FROM fact_video_metrics v
LEFT JOIN fact_bike_telemetry t ON v.video_id = t.video_id
WHERE v.is_trending = TRUE OR v.velocity_views_per_hr >= 500;

-- ---------------------------------------------------------------------
-- View 4: v_retention_high_risk_chapters
-- Cross-table JOIN isolating chapters where retention drops below 65%
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_retention_high_risk_chapters AS
SELECT 
  v.video_id,
  v.title,
  v.category,
  r.second_mark,
  CONCAT(FLOOR(r.second_mark / 60), 'm ', (r.second_mark % 60), 's') AS timestamp_formatted,
  r.pct_retention,
  COALESCE(r.chapter_name, 'Untitled Segment') AS chapter_name,
  COALESCE(r.editorial_note, 'Audience dropoff point detected') AS editorial_note
FROM fact_video_retention r
JOIN fact_video_metrics v ON r.video_id = v.video_id
WHERE r.is_drop_point = TRUE OR r.pct_retention < 65.00;

-- ---------------------------------------------------------------------
-- Stored Procedure 1: sp_GetVideoTelemetryReport
-- Returns complete KPI and physical telemetry dossier for a given video
-- ---------------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_GetVideoTelemetryReport(IN p_video_id VARCHAR(64))
BEGIN
  -- Result Set 1: Core video performance metrics
  SELECT 
    v.video_id,
    v.title,
    v.category,
    v.bike_model,
    v.duration_seconds,
    v.views,
    v.likes,
    v.comments,
    v.retention_pct,
    v.ctr_pct,
    v.estimated_revenue_usd,
    v.velocity_views_per_hr,
    COALESCE(v.audio_sound_profile, 'Standard Helmet Mic') AS audio_sound_profile
  FROM fact_video_metrics v
  WHERE v.video_id = p_video_id;

  -- Result Set 2: Physical hardware telemetry if available
  SELECT 
    t.telemetry_id,
    t.bike_model,
    t.top_speed_mph,
    t.avg_lean_angle_deg,
    t.exhaust_sound_db,
    t.g_force_peak,
    t.gps_elevation_gain_ft,
    t.gps_route_name
  FROM fact_bike_telemetry t
  WHERE t.video_id = p_video_id;

  -- Result Set 3: Significant drop and spike markers
  SELECT 
    r.second_mark,
    r.pct_retention,
    r.chapter_name,
    r.is_drop_point,
    r.is_spike_point,
    r.editorial_note
  FROM fact_video_retention r
  WHERE r.video_id = p_video_id AND (r.is_drop_point = TRUE OR r.is_spike_point = TRUE)
  ORDER BY r.second_mark ASC;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- Stored Procedure 2: sp_CalculateChannelGrowthKPIs
-- Computes aggregated revenue and effective RPM via OUT parameters
-- ---------------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_CalculateChannelGrowthKPIs(
  IN p_channel_id VARCHAR(64),
  OUT p_total_revenue DECIMAL(10,2),
  OUT p_avg_rpm DECIMAL(6,2),
  OUT p_total_views BIGINT UNSIGNED
)
BEGIN
  SELECT 
    COALESCE(SUM(g.revenue_est), 0.00),
    COALESCE(ROUND(SUM(g.revenue_est) / NULLIF(SUM(g.views) / 1000, 0), 2), 0.00),
    COALESCE(SUM(g.views), 0)
  INTO p_total_revenue, p_avg_rpm, p_total_views
  FROM fact_monthly_growth g
  WHERE g.channel_id = p_channel_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- Stored Procedure 3: sp_SimulateLiveTrafficSpike (ACID Transaction)
-- Simulates a viral traffic spike updating views, checking thresholds,
-- and inserting a real-time alert within an atomic transaction.
-- ---------------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_SimulateLiveTrafficSpike(
  IN p_video_id VARCHAR(64),
  IN p_additional_views INT
)
proc_label: BEGIN
  DECLARE v_old_views BIGINT UNSIGNED;
  DECLARE v_new_views BIGINT UNSIGNED;
  DECLARE v_title VARCHAR(255);
  DECLARE v_channel_id VARCHAR(64);
  DECLARE v_alert_id VARCHAR(64);

  -- Data Validation Check
  IF p_additional_views <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Data Validation Error: Additional views must be strictly positive.';
  END IF;

  START TRANSACTION;

  -- Pessimistic Lock on target video row
  SELECT views, title, channel_id INTO v_old_views, v_title, v_channel_id
  FROM fact_video_metrics
  WHERE video_id = p_video_id
  FOR UPDATE;

  IF v_old_views IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Target video_id not found in fact_video_metrics.';
  END IF;

  SET v_new_views = v_old_views + p_additional_views;

  -- Update video views
  UPDATE fact_video_metrics
  SET 
    views = v_new_views,
    velocity_views_per_hr = velocity_views_per_hr + FLOOR(p_additional_views / 2),
    is_trending = TRUE,
    trending_score = LEAST(100, trending_score + 15)
  WHERE video_id = p_video_id;

  SAVEPOINT sp_after_views_updated;

  -- Update channel total views
  UPDATE dim_channels
  SET total_views = total_views + p_additional_views
  WHERE channel_id = v_channel_id;

  -- Create alert if spike is significant
  IF p_additional_views >= 5000 THEN
    SET v_alert_id = CONCAT('alert_', UNIX_TIMESTAMP(), '_', SUBSTRING(MD5(RAND()), 1, 6));
    INSERT INTO dim_trending_alerts (
      alert_id, video_id, video_title, channel_name, category, 
      alert_type, multiplier, metric_value, message, alert_timestamp, priority
    ) VALUES (
      v_alert_id, p_video_id, v_title, '@AshRides26', 'vlog',
      'velocity_surge', 3.2, CONCAT('+', p_additional_views, ' views'),
      CONCAT('Live traffic spike of +', p_additional_views, ' views applied atomically via sp_SimulateLiveTrafficSpike.'),
      'Just now', 'critical'
    );
  END IF;

  COMMIT;

  -- Return updated snapshot
  SELECT p_video_id AS video_id, v_old_views AS previous_views, v_new_views AS updated_views, 'TRANSACTION COMMITTED' AS status;
END //
DELIMITER ;

-- #####################################################################
-- PHASE 4: DATA INTEGRITY (TRIGGERS, AUDIT LOGS, TRANSACTION SCRIPT)
-- #####################################################################

-- ---------------------------------------------------------------------
-- Table 12: audit_transaction_log (Integrity: Audit Trail of Operations)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_transaction_log (
  audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_affected VARCHAR(64) NOT NULL,
  operation_type ENUM('INSERT', 'UPDATE', 'DELETE', 'ROLLBACK_SIMULATION') NOT NULL,
  record_id VARCHAR(64) NOT NULL,
  changed_by VARCHAR(128) DEFAULT 'DBMS Engine',
  before_state JSON NULL,
  after_state JSON NULL,
  status ENUM('COMMITTED', 'ROLLED_BACK', 'SAVEPOINT_REVERTED') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Trigger 1: trg_after_video_insert_update_channel
-- Referential integrity automation: keeps channel totals synchronized
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_after_video_insert_update_channel
AFTER INSERT ON fact_video_metrics
FOR EACH ROW
BEGIN
  UPDATE dim_channels
  SET 
    total_videos = total_videos + 1,
    total_views = total_views + NEW.views
  WHERE channel_id = NEW.channel_id;
END //
DELIMITER ;

-- ---------------------------------------------------------------------
-- Trigger 2: trg_before_video_metrics_check
-- Data validation trigger enforcing retention % and duration bounds
-- ---------------------------------------------------------------------
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_before_video_metrics_check
BEFORE INSERT ON fact_video_metrics
FOR EACH ROW
BEGIN
  IF NEW.duration_seconds <= 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Integrity Violation: duration_seconds must be greater than 0';
  END IF;

  IF NEW.retention_pct < 0.00 OR NEW.retention_pct > 100.00 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Integrity Violation: retention_pct must be between 0.00 and 100.00';
  END IF;
END //
DELIMITER ;
