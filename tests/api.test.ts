import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { createDemoStore } from '../server/stores/demoStore.js';

let server: Server;
let base: string;
const config = loadConfig({ NODE_ENV: 'test', DEMO_MODE: 'true', PORT: '3001' } as any, []);

async function request(path: string, options: RequestInit & { cookie?: string } = {}) {
  const { cookie, ...init } = options;
  const res = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { status: res.status, body, cookie: res.headers.get('set-cookie')?.split(';')[0] || '' };
}

before(async () => {
  const store = await createDemoStore();
  const app = createApp(store, config);
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}/api`;
});

after(() => new Promise<void>((resolve) => server.close(() => resolve())));

test('health and unknown API routes are explicit', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.mysql.connected, false);
  assert.equal(health.body.mysql.mode, 'demo');
  const missing = await request('/does-not-exist');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, 'NOT_FOUND');
});

test('video filters and validation work', async () => {
  const videos = await request('/videos');
  assert.equal(videos.body.length, 18);
  const shorts = await request('/videos?category=shorts');
  assert.equal(shorts.body.length, 5);
  const invalid = await request('/videos', { method: 'POST', body: JSON.stringify({ title: 'Bad', category: 'nope', duration_seconds: -1 }) });
  assert.equal(invalid.status, 401); // unauthenticated writes are rejected before validation
});

test('signup, login, sessions, and per-user isolation work', async () => {
  const weak = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Weak User', email: 'weak@example.com', password: 'short' }) });
  assert.equal(weak.status, 400);

  const alice = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Alice Analyst', email: 'alice@example.com', password: 'correct horse battery' }) });
  assert.equal(alice.status, 201);
  assert.ok(alice.cookie.includes('ashrides_session='));
  const me = await request('/auth/me', { cookie: alice.cookie });
  assert.equal(me.body.email, 'alice@example.com');

  const sync = await request('/auth/sync', { method: 'POST', cookie: alice.cookie, body: JSON.stringify({ saved_video_ids: ['ash_vid_01'], custom_queries: [] }) });
  assert.deepEqual(sync.body.user.saved_video_ids, ['ash_vid_01']);

  const bob = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Bob Editor', email: 'bob@example.com', password: 'another strong password', role: 'Motovlog Editor' }) });
  assert.equal(bob.status, 201);
  const bobMe = await request('/auth/me', { cookie: bob.cookie });
  assert.deepEqual(bobMe.body.saved_video_ids, []);
  const aliceStill = await request('/auth/me', { cookie: alice.cookie });
  assert.deepEqual(aliceStill.body.saved_video_ids, ['ash_vid_01']);

  const badLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'alice@example.com', password: 'wrong' }) });
  assert.equal(badLogin.status, 401);
  const logout = await request('/auth/logout', { method: 'POST', cookie: alice.cookie });
  assert.equal(logout.status, 200);
  const afterLogout = await request('/auth/me', { cookie: alice.cookie });
  assert.equal(afterLogout.status, 401);
});

test('SQL workbench is authenticated, role-limited, and honest in demo mode', async () => {
  assert.equal((await request('/db/query', { method: 'POST', body: JSON.stringify({ presetId: 'video-count' }) })).status, 401);

  const owner = await request('/auth/demo', { method: 'POST', body: JSON.stringify({ profile: 'owner' }) });
  assert.equal(owner.status, 200);
  const count = await request('/db/query', { method: 'POST', cookie: owner.cookie, body: JSON.stringify({ presetId: 'video-count' }) });
  assert.equal(count.status, 200);
  assert.equal(count.body.data[0].total_videos, 18);

  const custom = await request('/db/query', { method: 'POST', cookie: owner.cookie, body: JSON.stringify({ sql: 'SELECT * FROM nope' }) });
  assert.equal(custom.status, 400);
  assert.equal(custom.body.code, 'DEMO_SQL_DISABLED');

  const analyst = await request('/auth/signup', { method: 'POST', body: JSON.stringify({ name: 'Query Analyst', email: 'query@example.com', password: 'strong password 123' }) });
  const forbidden = await request('/db/query', { method: 'POST', cookie: analyst.cookie, body: JSON.stringify({ presetId: 'video-count' }) });
  assert.equal(forbidden.status, 403);
});

test('authenticated writes validate payloads and reject duplicates', async () => {
  const owner = await request('/auth/demo', { method: 'POST', body: JSON.stringify({ profile: 'owner' }) });
  const invalid = await request('/videos', { method: 'POST', cookie: owner.cookie, body: JSON.stringify({ title: 'Bad', category: 'nope', duration_seconds: -1 }) });
  assert.equal(invalid.status, 400);
  const payload = { video_id: 'test_video_1', title: 'Test Video', category: 'vlog', duration_seconds: 60, upload_date: '2026-01-01' };
  const created = await request('/videos', { method: 'POST', cookie: owner.cookie, body: JSON.stringify(payload) });
  assert.equal(created.status, 201);
  const duplicate = await request('/videos', { method: 'POST', cookie: owner.cookie, body: JSON.stringify(payload) });
  assert.equal(duplicate.status, 409);
  const future = await request('/videos', { method: 'POST', cookie: owner.cookie, body: JSON.stringify({ ...payload, video_id: 'test_video_2', upload_date: '2027-01-01' }) });
  assert.equal(future.status, 400);

  const emptyAlert = await request('/alerts/trigger', { method: 'POST', cookie: owner.cookie, body: JSON.stringify({}) });
  assert.equal(emptyAlert.status, 400);
  const missingRead = await request('/alerts/nope/read', { method: 'PUT', cookie: owner.cookie });
  assert.equal(missingRead.status, 404);
});

test('cross-origin mutations are rejected', async () => {
  const res = await request('/auth/demo', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: JSON.stringify({ profile: 'owner' }) });
  assert.equal(res.status, 403);
});
