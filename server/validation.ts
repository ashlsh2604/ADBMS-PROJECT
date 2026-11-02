import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const today = () => new Date().toISOString().slice(0, 10);

export const videoFilterSchema = z.object({
  category: z.enum(['all', 'bike_review', 'vlog', 'shorts']).optional(),
  bike: z.string().trim().max(128).optional(),
  search: z.string().trim().max(200).optional(),
  dateRange: z.enum(['all', '7d', '30d', '90d', '1y']).optional(),
  sortBy: z.enum(['views', 'retention_pct', 'watch_time_hours', 'likes', 'comments', 'velocity_views_per_hr', 'upload_date']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createVideoSchema = z.object({
  video_id: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/).optional(),
  title: z.string().trim().min(1).max(255),
  thumbnail_url: z.string().url().max(512).optional(),
  category: z.enum(['bike_review', 'vlog', 'shorts']).default('vlog'),
  bike_model: z.string().trim().min(1).max(128).default('Adventure Sport Rig'),
  duration_seconds: z.number().int().positive().max(86400).default(1200),
  upload_date: isoDate.refine((value) => value <= today(), 'Upload date cannot be in the future').default(today),
  views: z.number().int().nonnegative().default(0),
  likes: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
  retention_pct: z.number().min(0).max(100).default(70),
  watch_time_hours: z.number().nonnegative().default(0),
  ctr_pct: z.number().min(0).max(100).default(0),
  cpm_usd: z.number().nonnegative().default(0),
  estimated_revenue_usd: z.number().nonnegative().default(0),
  velocity_views_per_hr: z.number().int().nonnegative().default(0),
  tags: z.array(z.string().trim().min(1).max(64)).max(24).default(['AshRides26', 'Motovlog']),
  youtube_url: z.string().url().max(512).optional(),
});

export const createAlertSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/).optional(),
  video_id: z.string().max(64).optional(),
  video_title: z.string().max(255).optional(),
  channel_name: z.string().trim().min(1).max(128),
  category: z.enum(['bike_review', 'vlog', 'shorts']).optional(),
  alert_type: z.enum(['velocity_surge', 'retention_spike', 'viral_short', 'milestone', 'competitor_breakout']),
  multiplier: z.number().nonnegative().optional(),
  metric_value: z.string().trim().min(1).max(64),
  message: z.string().trim().min(1).max(2000),
  timestamp: z.string().trim().min(1).max(64).default('Just now'),
  priority: z.enum(['critical', 'high', 'medium', 'info']).default('medium'),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(128),
  email: z.string().trim().email().max(128).toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['Data Analyst', 'Motovlog Editor']).default('Data Analyst'),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(128).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const demoLoginSchema = z.object({
  profile: z.enum(['owner', 'architect', 'editor']).default('owner'),
});

const savedQuerySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(128),
  description: z.string().max(1000).default(''),
  sql: z.string().min(1).max(10000),
  category: z.string().max(64).default('User Custom'),
  created_at: z.string().max(32),
});

const deviceSchema = z.object({
  id: z.string().min(1).max(64),
  device_name: z.string().trim().min(1).max(128),
  device_type: z.enum(['desktop', 'mobile', 'tablet']).default('desktop'),
  os: z.string().max(64).default('Unknown'),
  browser: z.string().max(64).default('Unknown'),
  ip_location: z.string().max(128).default('Unknown'),
  last_synced_at: z.string().max(64).default(new Date().toISOString()),
  is_current: z.boolean().default(false),
  battery_level: z.number().int().min(0).max(100).optional(),
});

export const syncSchema = z.object({
  saved_video_ids: z.array(z.string().max(64)).max(500).optional(),
  saved_comparisons: z.array(z.array(z.string().max(64)).min(1).max(3)).max(100).optional(),
  custom_queries: z.array(savedQuerySchema).max(100).optional(),
  notification_settings: z.object({
    velocity_alerts: z.boolean(),
    retention_milestones: z.boolean(),
    viral_shorts: z.boolean(),
    competitor_tracking: z.boolean(),
    browser_push_enabled: z.boolean(),
    sound_alerts_enabled: z.boolean(),
    velocity_threshold_multiplier: z.number().min(1).max(20),
  }).optional(),
  device: deviceSchema.optional(),
  remove_device_id: z.string().max(64).optional(),
  rename_device: z.object({ id: z.string().max(64), device_name: z.string().trim().min(1).max(128) }).optional(),
});

export const querySchema = z.object({
  sql: z.string().trim().min(1).max(10000).optional(),
  presetId: z.string().max(64).optional(),
}).refine((value) => value.sql || value.presetId, 'Provide sql or presetId');

export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
