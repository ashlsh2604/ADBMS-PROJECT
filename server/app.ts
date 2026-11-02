import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { parse as parseCookie } from 'cookie';
import mysql from 'mysql2/promise';
import { ZodError } from 'zod';
import type { AppConfig } from './config.js';
import { ApiError, badRequest, forbidden, notFound, unauthorized } from './errors.js';
import { hashPassword, hashSessionToken, newSessionToken, verifyPassword } from './auth/passwords.js';
import { createAlertSchema, createVideoSchema, demoLoginSchema, loginSchema, querySchema, signupSchema, syncSchema, videoFilterSchema } from './validation.js';
import { findPreset, QUERY_PRESETS } from './analytics/presets.js';
import { ADMIN_ROLES, WRITE_ROLES, type DataStore } from './stores/types.js';
import type { UserAccount } from '../src/types/database.js';

const SESSION_COOKIE = 'ashrides_session';
const TABLE_NAMES = ['dim_channels', 'fact_video_metrics', 'fact_video_retention', 'fact_monthly_growth', 'dim_trending_alerts', 'dim_users', 'auth_sessions', 'user_device_sessions', 'user_saved_queries', 'user_saved_videos', 'user_saved_comparisons'];

function rateLimit(bucket: string, max: number, windowMs = 60000) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 10000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      return next();
    }
    entry.count++;
    if (entry.count > max) return next(new ApiError(429, 'Too many requests. Please try again shortly.', 'RATE_LIMITED'));
    next();
  };
}

export function createApp(store: DataStore, config: AppConfig): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb' }));

  app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const origin = req.get('origin');
      if (origin) {
        try {
          const allowed = new Set([req.get('host'), config.appUrl ? new URL(config.appUrl).host : ''].filter(Boolean));
          if (!allowed.has(new URL(origin).host)) return next(forbidden('Cross-origin request rejected'));
        } catch { return next(forbidden('Invalid Origin header')); }
      }
      if (req.get('sec-fetch-site') === 'cross-site') return next(forbidden('Cross-site request rejected'));
    }
    next();
  });

  const sessionToken = (req: Request) => parseCookie(req.headers.cookie || '')[SESSION_COOKIE];
  const setSession = (req: Request, res: Response, token: string, expires: Date) => {
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/', expires });
  };
  const startSession = async (req: Request, res: Response, userId: string) => {
    const token = newSessionToken();
    const expires = new Date(Date.now() + config.sessionTtlHours * 3600000);
    await store.createSession(userId, hashSessionToken(token), expires);
    await store.recordLogin(userId);
    setSession(req, res, token, expires);
  };
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = sessionToken(req);
      const user = token ? await store.getUserBySession(hashSessionToken(token)) : null;
      if (!user) throw unauthorized();
      res.locals.user = user;
      next();
    } catch (error) { next(error); }
  };
  const requireRole = (roles: Set<UserAccount['role']>) => [requireAuth, (req: Request, res: Response, next: NextFunction) => {
    if (!roles.has((res.locals.user as UserAccount).role)) return next(forbidden());
    next();
  }];
  const currentUser = (res: Response) => res.locals.user as UserAccount;

  app.get('/api/config', (req, res) => res.json({ demoMode: store.mode === 'demo', engine: store.engineLabel, presets: QUERY_PRESETS.map(({ id, title, sql }) => ({ id, title, sql })) }));
  app.get('/api/health', async (req, res, next) => {
    try {
      const stats = await store.getStats();
      res.json({ status: 'ok', timestamp: new Date().toISOString(), mysql: { connected: store.mode === 'mysql', mode: store.mode, engine: store.engineLabel, database: config.db.database, ...stats } });
    } catch (error) { next(error); }
  });

  const authLimiter = rateLimit('auth', 20);
  app.post('/api/auth/signup', authLimiter, async (req, res, next) => {
    try {
      const input = signupSchema.parse(req.body);
      const user = await store.createUser({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: input.role });
      await startSession(req, res, user.id);
      res.status(201).json({ success: true, user });
    } catch (error) { next(error); }
  });
  app.post('/api/auth/login', authLimiter, async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const record = await store.findAuthUserByEmail(input.email);
      if (!record || !(await verifyPassword(input.password, record.password_hash))) throw unauthorized('Invalid email or password');
      const { password_hash, ...user } = record;
      await startSession(req, res, user.id);
      res.json({ success: true, user });
    } catch (error) { next(error); }
  });
  app.post('/api/auth/demo', authLimiter, async (req, res, next) => {
    try {
      if (store.mode !== 'demo') throw notFound('Demo login is disabled outside demo mode');
      const { profile } = demoLoginSchema.parse(req.body);
      const email = { owner: 'ash@ashrides26.motovlog', architect: 'analyst@dbms.project', editor: 'editor@ashrides26.motovlog' }[profile];
      const record = await store.findAuthUserByEmail(email);
      if (!record) throw notFound('Demo profile not found');
      const { password_hash, ...user } = record;
      await startSession(req, res, user.id);
      res.json({ success: true, user, demo: true });
    } catch (error) { next(error); }
  });
  app.post('/api/auth/logout', async (req, res, next) => {
    try {
      const token = sessionToken(req);
      if (token) await store.deleteSession(hashSessionToken(token));
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ success: true });
    } catch (error) { next(error); }
  });
  app.get('/api/auth/me', requireAuth, (req, res) => res.json(currentUser(res)));
  app.post('/api/auth/sync', requireAuth, async (req, res, next) => {
    try {
      const input = syncSchema.parse(req.body);
      res.json({ success: true, user: await store.syncWorkspace(currentUser(res).id, input) });
    } catch (error) { next(error); }
  });

  app.get('/api/videos', async (req, res, next) => {
    try { res.json(await store.getVideos(videoFilterSchema.parse(req.query))); } catch (error) { next(error); }
  });
  app.post('/api/videos', requireRole(WRITE_ROLES), async (req, res, next) => {
    try { res.status(201).json(await store.createVideo(createVideoSchema.parse(req.body))); } catch (error) { next(error); }
  });
  app.get('/api/videos/compare', async (req, res, next) => {
    try {
      const ids = String(req.query.ids || '').split(',').map((id) => id.trim()).filter(Boolean).slice(0, 3);
      const videos = await Promise.all(ids.map((id) => store.getVideoById(id)));
      res.json(videos.filter(Boolean));
    } catch (error) { next(error); }
  });
  app.get('/api/videos/:id', async (req, res, next) => {
    try {
      const video = await store.getVideoById(req.params.id);
      if (!video) throw notFound('Video not found');
      res.json(video);
    } catch (error) { next(error); }
  });
  app.get('/api/channels', async (req, res, next) => { try { res.json(await store.getChannels()); } catch (error) { next(error); } });
  app.get('/api/channels/:id', async (req, res, next) => {
    try {
      const channel = (await store.getChannels()).find((item) => item.channel_id === req.params.id);
      if (!channel) throw notFound('Channel not found');
      res.json(channel);
    } catch (error) { next(error); }
  });
  app.get('/api/growth', async (req, res, next) => { try { res.json(await store.getGrowth()); } catch (error) { next(error); } });
  app.get('/api/alerts', async (req, res, next) => { try { res.json(await store.getAlerts()); } catch (error) { next(error); } });
  app.put('/api/alerts/:id/read', requireAuth, async (req, res, next) => {
    try {
      const success = await store.markAlertRead(req.params.id);
      if (!success) throw notFound('Alert not found');
      res.json({ success });
    } catch (error) { next(error); }
  });
  app.post('/api/alerts/trigger', requireRole(WRITE_ROLES), async (req, res, next) => {
    try { res.status(201).json(await store.createAlert(createAlertSchema.parse(req.body))); } catch (error) { next(error); }
  });

  app.get('/api/db/status', async (req, res, next) => {
    try {
      const stats = await store.getStats();
      res.json({ connected: store.mode === 'mysql', mode: store.mode, engine: store.engineLabel, host: config.db.host, port: config.db.port, database: config.db.database, ...stats });
    } catch (error) { next(error); }
  });
  app.get('/api/db/schema', requireAuth, (req, res) => res.json({ database: config.db.database, engine: store.engineLabel, tables: TABLE_NAMES, demoMode: store.mode === 'demo' }));
  app.post('/api/db/query', requireRole(ADMIN_ROLES), rateLimit('sql', 30), async (req, res, next) => {
    try {
      const input = querySchema.parse(req.body);
      if (input.presetId) {
        const preset = findPreset(input.presetId);
        if (!preset) throw badRequest('Unknown analytics preset');
        return res.json(await store.runPreset(preset));
      }
      res.json(await store.runQuery(input.sql!));
    } catch (error) { next(error); }
  });
  app.post('/api/db/test-connection', requireRole(ADMIN_ROLES), rateLimit('db-test', 10), async (req, res, next) => {
    try {
      if (store.mode !== 'mysql') throw badRequest('Connection testing is available only when the server is running in MySQL mode');
      const host = String(req.body?.host || config.db.host).toLowerCase();
      const port = Number(req.body?.port || config.db.port);
      const database = String(req.body?.database || config.db.database);
      if (!config.allowedDbHosts.includes(host)) throw forbidden('This database host is not allowlisted');
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw badRequest('Invalid port');
      if (!/^[A-Za-z0-9_]+$/.test(database)) throw badRequest('Invalid database name');
      const started = performance.now();
      const connection = await mysql.createConnection({ host, port, user: config.db.user, password: config.db.password, database, connectTimeout: 3000 });
      try {
        const [rows] = await connection.query('SELECT VERSION() AS version, DATABASE() AS db, NOW() AS server_time');
        const row = (rows as any[])[0];
        res.json({ success: true, latencyMs: Math.round(performance.now() - started), version: row.version, database: row.db, serverTime: row.server_time });
      } finally { await connection.end(); }
    } catch (error) { next(error); }
  });

  app.use('/api', (req, res) => res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}`, code: 'NOT_FOUND' }));
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(error);
    if (error instanceof ZodError) return res.status(400).json({ error: error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; '), code: 'VALIDATION_ERROR' });
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code });
    if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A record with this identifier already exists', code: 'CONFLICT' });
    if (error?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' });
    console.error('[API] Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });
  return app;
}
