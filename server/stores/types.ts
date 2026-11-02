import type { Channel, DbmsQueryResult, MonthlyGrowth, TrendingAlert, UserAccount, Video } from '../../src/types/database.js';
import type { CreateAlertInput, CreateVideoInput, SyncInput } from '../validation.js';
import type { QueryPreset } from '../analytics/presets.js';

export interface AuthRecord extends UserAccount {
  password_hash: string | null;
}

export interface StoreStats {
  tablesCount: number;
  totalRows: number;
}

export interface DataStore {
  readonly mode: 'demo' | 'mysql';
  readonly engineLabel: string;
  getVideos(filter?: Record<string, unknown>): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | null>;
  createVideo(input: CreateVideoInput): Promise<Video>;
  getChannels(): Promise<Channel[]>;
  getGrowth(): Promise<MonthlyGrowth[]>;
  getAlerts(): Promise<TrendingAlert[]>;
  markAlertRead(id: string): Promise<boolean>;
  createAlert(input: CreateAlertInput): Promise<TrendingAlert>;
  findAuthUserByEmail(email: string): Promise<AuthRecord | null>;
  createUser(input: { name: string; email: string; passwordHash: string; role: UserAccount['role'] }): Promise<UserAccount>;
  getUserById(id: string): Promise<UserAccount | null>;
  recordLogin(id: string): Promise<void>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  getUserBySession(tokenHash: string): Promise<UserAccount | null>;
  deleteSession(tokenHash: string): Promise<void>;
  syncWorkspace(userId: string, input: SyncInput): Promise<UserAccount>;
  runPreset(preset: QueryPreset): Promise<DbmsQueryResult>;
  runQuery(sql: string): Promise<DbmsQueryResult>;
  getStats(): Promise<StoreStats>;
  close(): Promise<void>;
}

export const ADMIN_ROLES = new Set<UserAccount['role']>(['Channel Owner (Ash)', 'DBMS Lead Architect']);
export const WRITE_ROLES = new Set<UserAccount['role']>(['Channel Owner (Ash)', 'DBMS Lead Architect', 'Motovlog Editor']);
