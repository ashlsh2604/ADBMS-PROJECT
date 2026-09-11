import { Router } from 'express';
import {
  getDbStatus,
  getSchema,
  executeSqlQuery,
  testMySqlConnection,
  getVideos,
  getVideoById,
  createVideo,
  getChannels,
  getMonthlyGrowth,
  getAlerts,
  markAlertRead,
  createAlert,
  getUserAccount,
  updateUserAccount,
} from './db/mysql.js';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  const status = getDbStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mysql: status,
  });
});

// DBMS Status
apiRouter.get('/db/status', (req, res) => {
  res.json(getDbStatus());
});

// DBMS Schema
apiRouter.get('/db/schema', (req, res) => {
  res.json({
    database: 'ashrides26_db',
    engine: 'MySQL 8.0 InnoDB',
    tables: getSchema(),
  });
});

// Test Connection to custom MySQL host/credentials
apiRouter.post('/db/test-connection', async (req, res) => {
  try {
    const result = await testMySqlConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Execute Raw SQL Query
apiRouter.post('/db/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL statement is required' });
  }

  try {
    const result = await executeSqlQuery(sql);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Videos with filtering and sorting
apiRouter.get('/videos', async (req, res) => {
  try {
    const { category, bike, search, dateRange, sortBy, sortOrder } = req.query;

    const videos = await getVideos({
      category: category as any,
      bikeFilter: bike as string,
      searchQuery: search as string,
      dateRange: dateRange as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    res.json(videos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create / Import Video for @ashrides26
apiRouter.post('/videos', async (req, res) => {
  try {
    const created = await createVideo(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compare Videos by IDs (?ids=ash_vid_01,ash_vid_02)
apiRouter.get('/videos/compare', async (req, res) => {
  try {
    const ids = (req.query.ids as string)?.split(',').filter(Boolean) || [];
    const allVideos = await getVideos();
    const matched = allVideos.filter((v) => ids.includes(v.video_id));
    res.json(matched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Video by ID
apiRouter.get('/videos/:id', async (req, res) => {
  try {
    const video = await getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Channels & Benchmarks
apiRouter.get('/channels', async (req, res) => {
  try {
    const channels = await getChannels();
    res.json(channels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Channel by ID
apiRouter.get('/channels/:id', async (req, res) => {
  try {
    const channels = await getChannels();
    const ch = channels.find((c) => c.channel_id === req.params.id);
    if (!ch) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    res.json(ch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Monthly Growth
apiRouter.get('/growth', async (req, res) => {
  try {
    const growth = await getMonthlyGrowth();
    res.json(growth);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Alerts
apiRouter.get('/alerts', async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Alert as Read
apiRouter.put('/alerts/:id/read', async (req, res) => {
  try {
    const success = await markAlertRead(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger New Real-time Alert
apiRouter.post('/alerts/trigger', async (req, res) => {
  try {
    const alert = await createAlert(req.body);
    res.status(201).json(alert);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auth / User Management
apiRouter.get('/auth/me', async (req, res) => {
  try {
    const user = await getUserAccount();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, role, name } = req.body;
    const currentUser = await getUserAccount();
    const updated = await updateUserAccount({
      ...currentUser,
      email: email || currentUser.email,
      name: name || (email ? email.split('@')[0] : currentUser.name),
      role: role || currentUser.role,
      last_login: 'Just now (via MySQL Auth)',
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const currentUser = await getUserAccount();
    const updated = await updateUserAccount({
      ...currentUser,
      id: `usr_${Date.now().toString(36)}`,
      name: name || 'New Motovlog Analyst',
      email: email || 'analyst@ashrides26.com',
      role: role || 'Data Analyst',
      last_login: 'Just now (New Account)',
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/auth/sync', async (req, res) => {
  try {
    const { deviceSession } = req.body;
    const currentUser = await getUserAccount();
    const devices = currentUser.connected_devices || [];
    if (deviceSession) {
      devices.unshift(deviceSession);
    }
    const updated = await updateUserAccount({
      ...currentUser,
      connected_devices: devices.slice(0, 10),
    });
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
