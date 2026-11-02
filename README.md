# AshRides26 DBMS Analytics

Full-stack YouTube/motovlog analytics dashboard built with React, Vite, Express, and MySQL.

## What changed in this refactor

- **Explicit demo mode** instead of silently pretending to be MySQL.
- **Real MySQL repository** for videos, channels, growth, alerts, users, sessions, and saved workspaces.
- **Comment-aware migration runner** that no longer skips commented `CREATE TABLE` statements.
- **Real authentication**: scrypt password hashing, HttpOnly session cookies, server-side session expiry, per-user data isolation, and role checks.
- **Safer SQL workbench**: authenticated admin-only access, single read-only `SELECT` parsing, analytics table/view allowlist, dangerous-function rejection, read-only transactions, and a 200-row cap.
- **Honest demo SQL**: demo mode runs labeled analytics presets against the seed dataset; custom SQL is disabled unless MySQL is live.
- **Request validation** with Zod, duplicate detection, future-date rejection, and proper JSON API errors.
- **UI fixes**: working guest entry, loading/error states, current-date filtering, mobile navbar overflow, and removal of misleading encryption/WebSocket claims.
- **Performance**: lazy-loaded heavy views/modals and split vendor chunks; the production build no longer emits the large-chunk warning.

## Requirements

- Node.js 22+
- npm
- MySQL 8+ for live mode (optional for demo mode)

## Quick start: demo mode

Demo mode uses an in-memory seed dataset. It is useful for UI evaluation and does **not** persist data across restarts.

```bash
npm install
npm run build
npm run start:demo
```

Open http://localhost:3000.

Demo sign-in options:

- One-click demo profiles on the login page.
- Seeded account password: `demopass123`.
- Or create a new account with a password of at least 8 characters.

For development with hot reload:

```bash
npm run dev:demo
```

## Live MySQL mode

1. Copy `.env.example` to `.env` and configure MySQL credentials.
2. Ensure the MySQL user can create the configured database and tables, or pre-create the database and grant DDL/DML permissions.
3. Build and start:

```bash
npm run build
npm start
```

Production mode **fails fast** if MySQL is unavailable or migrations fail. It does not fall back to fake data.

Optional first-owner bootstrap (only when `dim_users` is empty):

```env
BOOTSTRAP_OWNER_EMAIL=owner@example.com
BOOTSTRAP_OWNER_PASSWORD=a-strong-password
BOOTSTRAP_OWNER_NAME=Channel Owner
```

After bootstrap, remove the password from the environment.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server; defaults to demo mode unless `DEMO_MODE=false` |
| `npm run dev:demo` | Development server explicitly in demo mode |
| `npm run build` | Build frontend and bundle server |
| `npm start` | Production server; requires MySQL unless `DEMO_MODE=true` |
| `npm run start:demo` | Production build with explicit in-memory demo mode |
| `npm run lint` | TypeScript type check |
| `npm test` | Automated unit/API tests |

## Environment

See `.env.example`. Important variables:

- `PORT` — server port (default `3000`).
- `DEMO_MODE` — `true` for in-memory demo, `false` for MySQL. Production defaults to MySQL.
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` — database connection.
- `MYSQL_URL` — optional connection URL alternative.
- `MYSQL_ALLOWED_HOSTS` — comma-separated allowlist for the admin connection tester.
- `SESSION_TTL_HOURS` — session lifetime.
- `APP_URL` — public origin used for CSRF/origin checks.

## Security model

- Passwords are salted and hashed with scrypt.
- Sessions use random tokens; only SHA-256 token hashes are stored server-side.
- Cookies are HttpOnly, SameSite=Lax, and Secure when the request is HTTPS.
- Mutating API routes reject cross-origin requests.
- Signup can create only `Data Analyst` or `Motovlog Editor` accounts. Owner/architect roles must be provisioned server-side.
- SQL execution requires owner/architect role and is limited to read-only analytics tables/views.
- The connection tester uses server-configured credentials and an explicit host allowlist.

For internet-facing deployment, also use HTTPS, a least-privilege MySQL account, rate limiting at the edge, regular dependency updates, and backups.

## Architecture

```text
server.ts                 startup, mode selection, graceful shutdown
server/config.ts          environment parsing and validation
server/app.ts             Express API, auth middleware, CSRF, rate limits, errors
server/validation.ts      Zod request schemas
server/auth/passwords.ts  scrypt hashing and session-token helpers
server/db/sqlScript.ts    comment-aware migration splitter
server/db/init.ts         MySQL connection, migrations, seeding, bootstrap owner
server/db/sqlGuard.ts     read-only analytics SQL validation
server/stores/            DataStore interface + demo/MySQL implementations
server/analytics/         shared video filtering and SQL presets
src/services/api.ts       typed fetch client with explicit errors
src/context/              auth/session and notification state
src/components/           dashboard views and workbench
tests/                    unit and API regression tests
```

## Testing

```bash
npm run lint
npm test
npm run build
```

The automated suite covers migration splitting, SQL guardrails, date filtering/sorting, authentication, per-user isolation, role enforcement, validation, duplicate handling, demo SQL behavior, and JSON API 404s.

Live MySQL integration still requires a reachable MySQL instance; the sandbox verification for this refactor used demo mode plus automated tests.
