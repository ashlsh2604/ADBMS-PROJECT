import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { loadConfig } from './server/config.js';
import { createApp } from './server/app.js';
import { createDemoStore } from './server/stores/demoStore.js';
import { createMySqlStore } from './server/db/init.js';

dotenv.config({ quiet: true });

async function startServer() {
  const config = loadConfig();
  const store = config.demoMode ? await createDemoStore() : await createMySqlStore(config);
  const app = createApp(store, config);

  if (!config.isProduction) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[AshRides26] ${config.demoMode ? 'DEMO MODE (in-memory, not MySQL)' : 'MYSQL MODE'} listening on http://0.0.0.0:${config.port}`);
  });

  const shutdown = async () => {
    server.close();
    await store.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('[AshRides26] Startup failed:', error instanceof Error ? error.message : error);
  if (!process.env.DEMO_MODE && process.env.NODE_ENV === 'production') {
    console.error('To explore without MySQL, run: npm run start:demo');
  }
  process.exit(1);
});
