export type VideoCategory = 'bike_review' | 'vlog' | 'shorts';

export interface Channel {
  channel_id: string;
  name: string;
  handle: string;
  avatar_url: string;
  banner_url: string;
  subscribers: number;
  total_views: number;
  total_videos: number;
  country: string;
  primary_bike: string;
  joined_date: string;
  verified: boolean;
  is_primary: boolean; // true for AshRides26
  description: string;
  avg_views_per_video: number;
  sub_growth_monthly_pct: number;
}

export interface RetentionPoint {
  second: number;
  pct_retention: number;
  chapter_name?: string;
  is_drop_point?: boolean;
  is_spike_point?: boolean;
  note?: string;
}

export interface Video {
  video_id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string;
  category: VideoCategory;
  bike_model: string;
  duration_seconds: number;
  upload_date: string;
  views: number;
  likes: number;
  comments: number;
  retention_pct: number;
  watch_time_hours: number;
  ctr_pct: number;
  cpm_usd: number;
  estimated_revenue_usd: number;
  velocity_views_per_hr: number;
  tags: string[];
  is_trending: boolean;
  trending_score: number; // 0-100
  audio_sound_profile?: string; // e.g. "Akrapovic Full Titanium", "SC-Project CR-T", "Austin Racing GP1R"
  top_demographic?: string;
  retention_curve: RetentionPoint[];
}

export interface MonthlyGrowth {
  month: string;
  year: number;
  views: number;
  subscribers_gained: number;
  watch_time_hours: number;
  revenue_est: number;
  bike_review_views: number;
  vlog_views: number;
  shorts_views: number;
}

export interface DeviceSession {
  id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  ip_location: string;
  last_synced_at: string;
  is_current: boolean;
  battery_level?: number;
}

export interface SavedQuery {
  id: string;
  title: string;
  description: string;
  sql: string;
  category: string;
  created_at: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Channel Owner (Ash)' | 'DBMS Lead Architect' | 'Data Analyst' | 'Motovlog Editor';
  avatar: string;
  last_login: string;
  created_at: string;
  connected_devices: DeviceSession[];
  saved_video_ids: string[];
  saved_comparisons: string[][];
  custom_queries: SavedQuery[];
  notification_settings: {
    velocity_alerts: boolean;
    retention_milestones: boolean;
    viral_shorts: boolean;
    competitor_tracking: boolean;
    browser_push_enabled: boolean;
    sound_alerts_enabled: boolean;
    velocity_threshold_multiplier: number; // e.g. 2.5x
  };
}

export type AlertType = 'velocity_surge' | 'retention_spike' | 'viral_short' | 'milestone' | 'competitor_breakout';
export type AlertPriority = 'critical' | 'high' | 'medium' | 'info';

export interface TrendingAlert {
  id: string;
  video_id?: string;
  video_title?: string;
  channel_name: string;
  category?: VideoCategory;
  alert_type: AlertType;
  multiplier?: number;
  metric_value: string;
  message: string;
  timestamp: string;
  is_read: boolean;
  priority: AlertPriority;
}

export interface DbmsQueryResult {
  query_sql: string;
  execution_time_ms: number;
  rows_scanned: number;
  rows_returned: number;
  indexes_used: string[];
  cost_estimate: number;
  columns: string[];
  data: Record<string, any>[];
  schema_plan?: string;
}

export interface FilterState {
  searchQuery: string;
  category: 'all' | VideoCategory;
  dateRange: 'all' | '7d' | '30d' | '90d' | '1y';
  sortBy: 'views' | 'retention_pct' | 'watch_time_hours' | 'likes' | 'comments' | 'velocity_views_per_hr' | 'upload_date';
  sortOrder: 'desc' | 'asc';
  bikeFilter: string;
  selectedChannelId: string;
}
