-- =====================================================================
-- AshRides26 Advanced DBMS Project - MySQL 8.0 Relational Schema
-- YouTube Video Performance & Motovlogging Telemetry Analytics Engine
-- Normalized 3NF Schema with Fact & Dimension Tables, Indexes & Views
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ashrides26_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ashrides26_db;

-- ---------------------------------------------------------------------
-- Table 1: dim_channels (Dimension: YouTube Motovlogging Channels)
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
  INDEX idx_channels_is_primary (is_primary)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 2: fact_video_metrics (Fact: Motovlog Videos & Telemetry KPIs)
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
  audio_sound_profile VARCHAR(128),
  top_demographic VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_videos_channel FOREIGN KEY (channel_id)
    REFERENCES dim_channels(channel_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
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
-- Table 3: fact_video_retention (Granular Second-by-Second Retention Curve)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_video_retention (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id VARCHAR(64) NOT NULL,
  second_mark INT UNSIGNED NOT NULL,
  pct_retention DECIMAL(5,2) NOT NULL,
  chapter_name VARCHAR(128),
  is_drop_point BOOLEAN DEFAULT FALSE,
  is_spike_point BOOLEAN DEFAULT FALSE,
  editorial_note VARCHAR(255),
  CONSTRAINT fk_retention_video FOREIGN KEY (video_id)
    REFERENCES fact_video_metrics(video_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_retention_video_second (video_id, second_mark),
  INDEX idx_retention_spikes (video_id, is_spike_point)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 4: fact_monthly_growth (Aggregated Monthly Channel Growth)
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
  UNIQUE KEY uq_channel_month_year (channel_id, year_num, month_name),
  INDEX idx_growth_year_month (year_num, month_name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 5: dim_trending_alerts (Real-Time Trend Surge Alerts)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_trending_alerts (
  alert_id VARCHAR(64) PRIMARY KEY,
  video_id VARCHAR(64) NULL,
  video_title VARCHAR(255) NULL,
  channel_name VARCHAR(128) NOT NULL,
  category ENUM('bike_review', 'vlog', 'shorts') NULL,
  alert_type ENUM('velocity_surge', 'retention_spike', 'viral_short', 'milestone', 'competitor_breakout') NOT NULL,
  multiplier DECIMAL(4,1) NULL,
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
-- Table 6: dim_users (Personalized Accounts & Security)
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
-- Table 7: user_device_sessions (Cross-Device Data Synchronization)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_device_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  device_name VARCHAR(128) NOT NULL,
  device_type ENUM('desktop', 'mobile', 'tablet') DEFAULT 'desktop',
  os VARCHAR(64),
  browser VARCHAR(64),
  ip_location VARCHAR(128),
  battery_level INT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES dim_users(user_id)
    ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Table 8: user_saved_queries (DBMS Workbench Saved SQL Queries)
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
-- Advanced DBMS Analytical Views
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
  ROUND(AVG(v.retention_pct), 2) AS sample_avg_retention,
  MAX(v.views) AS highest_view_video
FROM dim_channels c
LEFT JOIN fact_video_metrics v ON c.channel_id = v.channel_id
GROUP BY c.channel_id, c.name, c.handle, c.subscribers, c.total_views, c.total_videos, 
         c.avg_views_per_video, c.sub_growth_monthly_pct, c.primary_bike, c.is_primary;
