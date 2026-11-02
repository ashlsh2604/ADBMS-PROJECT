# ADBMS Project — Run & Issue Report

**Test date:** 2 November 2026  
**Repository:** `ashlsh2604/ADBMS-PROJECT`  
**Tested commit:** `6841ae075537f945ed396801e4cc4160e8fdfc05` (`main`)  
**Working branch:** `arena/4a2dc772-adbms-project`

## Verdict

**The application runs and the dashboard is usable as an interactive demo. It is not yet a working, production-ready MySQL backend.**

The frontend builds, TypeScript passes, sample data loads, and the main dashboard views render. However, authentication is simulated, the SQL workbench fabricates results when MySQL is unavailable, ordinary data endpoints use in-memory arrays rather than database reads, and the migration loader skips every `CREATE TABLE` statement.

The live preview is running on **port 3000** using the production build. Use **Ash (Owner)** on the login page to explore it. The login page's **Continue as Guest Analyst** button is currently broken.

## Source tested

I downloaded the GitHub source ZIP for the exact commit above and compared it with the checkout; the application files matched.

- Archive SHA-256: `57132e9792cc9232820d36f185665119dcc4d3bc2669f68c8849477d23bc2fe5`
- No separately uploaded ZIP named “adbms project backend” was present in the repository, and the repository had no releases.
- If that named ZIP is stored elsewhere on GitHub, its link is needed to verify that exact archive. This report covers the matching repository source.

## Commands and build results

Node.js `v22.22.3` and npm `10.9.8` were used. The repository contains a Bun lockfile; installation was performed with npm without replacing that lockfile.

```bash
npm install --package-lock=false --no-audit --no-fund
npm run lint
npm run build
NODE_ENV=production npm start
```

| Check | Result |
|---|---|
| Dependency installation | Passed |
| `npm run lint` (`tsc --noEmit`) | Passed |
| Development server (`npm run dev`) | Started successfully |
| `npm run build` | Passed |
| Production server (`npm start`) | Started successfully on `0.0.0.0:3000` |
| Preview-host request | HTTP 200 |
| MySQL connection | **Unavailable:** `ECONNREFUSED 127.0.0.1:3306` |
| Production JavaScript bundle | **1,074.83 kB** before gzip; Vite emitted its large-chunk warning |
| npm dependency audit | 0 known advisories in a separate npm lock resolution; the exact Bun lock graph was not audited |

## What works

These checks ran against the production build with MySQL unavailable:

- Demo owner login reaches the dashboard.
- Dashboard renders **18 videos**: 7 vlogs, 6 bike reviews, and 5 shorts.
- API and UI search work; `Ducati` returns 5 videos and a nonexistent search returns none.
- Category filtering works; Shorts returns 5 videos.
- API ascending/descending view sorting is correct.
- Video detail, grid/table switching, comparison, channel, and SQL workbench views open.
- Growth charts render after their animation completes.
- API returns 1 channel, 12 growth records, and 5 initial alerts.
- Unknown video IDs return 404; empty SQL returns 400.
- The MySQL connection tester correctly reports the unavailable local database.
- No uncaught JavaScript runtime exceptions were observed in the tested browser flows.
- External image and font requests were blocked by the sandbox. Broken thumbnails/web fonts in screenshots are an environment limitation, not evidence that those URLs fail in a normal browser.

The final API audit recorded **27 checks: 11 passed and 16 exposed issues or missing production behavior**. Several findings below combine related audit checks.

## Findings, in priority order

### P0 — Fix before any real deployment

#### 1. Authentication is simulated and all visitors share one server-side account

**Evidence:**

- Login with an unregistered email and no password returned HTTP 200 and `success: true`.
- The caller could choose a role, and the global `/api/auth/me` account changed.
- Signup replaced that same global account instead of creating an independent account.
- No session cookie was issued.
- The frontend also creates a successful local login when the API fails.

**Locations:** `server/api.ts:190–232`, `server/db/mysql.ts:576–582`, `src/context/AuthAndSyncContext.tsx:73–155`.

**Fix:** Persist individual users, verify salted password hashes, issue secure server-controlled sessions, derive roles server-side, and remove successful authentication fallbacks. Protect every user-owned endpoint.

#### 2. Raw SQL and database connection testing are unauthenticated

`POST /api/db/query` accepts arbitrary SQL, and `POST /api/db/test-connection` accepts arbitrary connection settings. With a live database, the query endpoint is not restricted to read-only analytics. The connection tester can also be abused to probe hosts reachable from the server.

**Locations:** `server/api.ts:42–62`, `server/db/mysql.ts:247–345`.

**Fix:** Require administrator authorization, use a read-only database account, restrict the workbench to an allowlisted query surface, validate/allowlist connection targets, and add rate limits. No destructive SQL or external host probing was performed during this audit.

#### 3. The migration loader skips all eight table-creation statements

The loader splits SQL on semicolons, then discards every chunk starting with `--`. Because each table is preceded by a comment block, its entire chunk is discarded.

Executing the exact filtering logic against `server/db/schema.sql` produced:

```text
CREATE TABLE statements in file: 8
CREATE TABLE statements surviving: 0
Total statements surviving: 2
  - USE ashrides26_db
  - CREATE OR REPLACE VIEW v_channel_benchmarks ...
```

Migration errors are then swallowed, seeding errors are caught, and the server still marks itself `mysql_live` after a successful connection.

**Locations:** `server/db/mysql.ts:98–139`, especially `117–134`.

**Fix:** Use a proper migration runner or comment-aware SQL parsing, fail startup on migration errors, verify the expected tables, and only then advertise a live database. Also remove the hardcoded `USE ashrides26_db` so custom database names work.

### P1 — Core correctness and persistence

#### 4. The fallback “SQL engine” returns fabricated successful results

**Observed:**

- `SELECT COUNT(*) FROM fact_video_metrics` returned 10 video rows instead of the count 18.
- Invalid syntax returned HTTP 200 with fake rows.
- A nonexistent table/column returned HTTP 200 with fake rows.
- The UI displayed those rows as a successful MySQL execution.
- Rows scanned, index names, execution plans, and costs are canned in fallback mode.
- Even in live mode, a failed SQL query falls through to this fake engine instead of returning the database error.

**Locations:** `server/db/mysql.ts:291–429`; evidence: [SQL screenshot](screenshots/sql-invalid-query.png).

**Fix:** Return real SQL errors. If a demo mode is retained, label it explicitly and do not present canned output as SQL execution or real optimizer statistics.

#### 5. Ordinary backend endpoints do not read MySQL, and writes are not reliably persisted

`getVideos`, `getVideoById`, `getChannels`, `getMonthlyGrowth`, `getAlerts`, and user functions read in-memory arrays even when `dbMode` is `mysql_live`. Video creation attempts a database insert but still reports success if that insert fails. Alerts and user changes are not written to MySQL. Growth and channel components also import mock data directly.

Restarting the server removed the test videos and restored the original account and alert count, confirming that the tested writes were memory-only.

**Locations:** `server/db/mysql.ts:435–583`, `src/components/InteractiveGrowthCharts.tsx:2`, `src/components/ChannelBenchmarkView.tsx:3`.

**Fix:** Implement real database-backed reads and writes for every endpoint, propagate write failures, and store saved videos/queries/comparisons per user. The current sync endpoint ignores the workspace fields sent by the client and only modifies `connected_devices`.

#### 6. “Continue as Guest Analyst” on the login page always returns to login

Reproduced in three fresh browser sessions. The URL changed to `#dashboard` and immediately back to `#login`; guest mode was never stored.

**Root cause:** `LoginPage` is rendered without the `onContinueAsGuest` prop. Its button therefore calls the ordinary dashboard-navigation fallback without enabling guest mode, so the route guard rejects it. The signup page passes the prop correctly, and its guest button worked.

**Locations:** `src/App.tsx:323–339`, `src/components/LoginPage.tsx:397–405`.

**Fix:** Pass `onContinueAsGuest={handleContinueAsGuest}` to `LoginPage`, just as the signup page already does.

Evidence: [guest redirect failure](screenshots/guest-redirect-failure.png).

#### 7. Missing payload validation permits corrupt data and a reproducible HTTP 500

**Observed:**

- A video with an invalid category, negative duration/views, and a string instead of tags was accepted with HTTP 201.
- A duplicate video ID was accepted, producing two records with the same ID.
- An empty alert object was accepted with HTTP 201.
- Querying alerts afterward returned HTTP 500: `Cannot read properties of undefined (reading 'toUpperCase')`.

**Locations:** `server/api.ts:88–96,179–187`, `server/db/mysql.ts:389–399,495–574`.

**Fix:** Validate request bodies and enums/ranges, reject duplicate IDs, validate alerts before storage, and map database constraint failures to proper 4xx responses.

### P2 — Usability, consistency, and deployment

#### 8. Date filtering is hardcoded and includes future uploads

On 2 November 2026, “last 7 days” returned videos dated 24 and 28 August because the code uses `2026-08-28` as “now.” A test upload dated 1 January 2027 also appeared in recent history because negative age passes the upper-bound check.

**Locations:** `server/db/mysql.ts:461–470`, `src/App.tsx:176–185`.

**Fix:** Use one consistent current-date source and require `0 <= age <= window`, or use an explicit configurable demo clock.

#### 9. Schema, status, and security claims do not match the implementation

- Schema API exposes 4 mock tables while the SQL file defines 8 and the status claims 8.
- Mock schema/status counts include 148 videos/174 rows while the seed contains 18 videos.
- The dashboard claims benchmarking against 6 peer channels, but the dataset contains only 1 channel.
- “Live WebSocket Sync,” “End-to-End Encrypted Sessions,” and similar claims are not backed by corresponding implementation.
- The exported “SHA256” checksum is generated with `Math.random()`, not a hash.
- `/api/health` reports `ok` even when MySQL is disconnected.

**Locations:** `src/data/mockDbmsData.ts:810–882`, `server/db/mysql.ts:224–245`, `src/components/MetricsOverviewCards.tsx:42`, `src/App.tsx:374–376`, `src/context/AuthAndSyncContext.tsx:265`, `server/api.ts:20–28`.

**Fix:** Derive metadata from the actual data source and clearly distinguish demo simulations from live, encrypted, or synchronized features.

#### 10. Mobile navigation overflows and clips the logout control

At a 390 px viewport, the document width was 428 px. The authenticated navbar action cluster extended beyond the screen, including the logout button.

**Location:** `src/components/Navbar.tsx:145–219`; evidence: [mobile screenshot](screenshots/dashboard-mobile.png).

**Fix:** Compact or collapse the authenticated action cluster on small screens and retest at 320/360/390 px widths.

#### 11. Unknown API routes return the SPA as HTTP 200 HTML

`GET /api/nonexistent` returned `text/html` with HTTP 200 rather than a JSON 404. This makes client failures harder to detect and can trigger misleading fallback behavior.

**Locations:** `server.ts:25–40`, `src/services/api.ts:25–46`.

**Fix:** Add an API-only 404 handler after the API router and before the SPA fallback. Avoid silently turning authentication or server failures into successful demo operations.

#### 12. Port is hardcoded and the main bundle is large

The server ignores `PORT` and always binds to 3000. The production build also emits a 1,074.83 kB main JavaScript chunk.

**Locations:** `server.ts:12`, `package.json` build script.

**Fix:** Read and validate `PORT`, and lazy-load heavy views/chart code to reduce initial download size.

## Screenshots

- [Login page](screenshots/login-desktop.png)
- [Dashboard with clean seed data](screenshots/dashboard-desktop.png)
- [Growth charts](screenshots/growth-desktop.png)
- [Video detail](screenshots/video-detail.png)
- [Comparison view](screenshots/comparison-desktop.png)
- [Invalid SQL incorrectly shown as successful](screenshots/sql-invalid-query.png)
- [MySQL connection failure](screenshots/mysql-connection-failure.png)
- [Guest-entry failure](screenshots/guest-redirect-failure.png)
- [Mobile overflow](screenshots/dashboard-mobile.png)

## Recommended repair order

1. Fix migrations and prove the schema against a real MySQL 8 instance.
2. Replace simulated authentication with real users, password verification, sessions, and authorization.
3. Make endpoint reads/writes database-backed; remove fake SQL success and fabricated optimizer metrics.
4. Add request validation and protect the SQL/connection-test endpoints.
5. Fix the guest prop, date filtering, mobile navbar, API 404s, and misleading status labels.
6. Add regression tests for migrations, auth isolation, SQL errors, persistence, validation, and guest navigation.

## Test limits and cleanup

- A real MySQL daemon and credentials were not available, so live MySQL execution was **not** verified. The migration defect was confirmed by executing the repository's exact statement-filtering logic.
- No destructive SQL, external connection probing, or load testing was performed.
- Mutation probes used disposable in-memory demo data. The server was restarted afterward and verified to contain 18 videos, 5 alerts, the original account, and no probe videos.
- Application source files were not changed. The added files are test reports, machine-readable results, and screenshots under `reports/`.

## Machine-readable evidence

- [API results](api-results.json)
- [Browser results](browser-results.json)
- [Dependency audit](dependency-audit.json)
- [Post-test reset verification](reset-verification.json)
