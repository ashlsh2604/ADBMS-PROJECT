import path from 'node:path';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  demoMode: boolean;
  isProduction: boolean;
  appUrl?: string;
  db: DbConfig;
  allowedDbHosts: string[];
  sessionTtlHours: number;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

export function getDbConfig(env: NodeJS.ProcessEnv = process.env): DbConfig {
  const url = env.MYSQL_URL || env.DATABASE_URL;
  if (url) {
    const parsed = new URL(url);
    if (!['mysql:', 'mariadb:'].includes(parsed.protocol)) {
      throw new Error('MYSQL_URL must use mysql:// or mariadb://');
    }
    return {
      host: parsed.hostname,
      port: parsePort(parsed.port, 3306),
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'ashrides26_db'),
    };
  }
  return {
    host: env.MYSQL_HOST || '127.0.0.1',
    port: parsePort(env.MYSQL_PORT, 3306),
    user: env.MYSQL_USER || 'root',
    password: env.MYSQL_PASSWORD || '',
    database: env.MYSQL_DATABASE || 'ashrides26_db',
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env, argv: string[] = process.argv): AppConfig {
  const isProduction = env.NODE_ENV === 'production' || argv.includes('--production');
  const explicitDemo = argv.includes('--demo') || env.DEMO_MODE === 'true';
  const explicitMysql = env.DEMO_MODE === 'false';
  if (explicitDemo && explicitMysql) throw new Error('DEMO_MODE cannot be both true and false');
  const demoMode = explicitDemo || (!explicitMysql && !isProduction);
  const db = getDbConfig(env);
  const allowedDbHosts = (env.MYSQL_ALLOWED_HOSTS || db.host)
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return {
    port: parsePort(env.PORT, 3000),
    demoMode,
    isProduction,
    appUrl: env.APP_URL,
    db,
    allowedDbHosts,
    sessionTtlHours: Math.max(1, Number(env.SESSION_TTL_HOURS || 12)),
  };
}

export const projectRoot = process.cwd();
export const schemaPath = path.join(projectRoot, 'server', 'db', 'schema.sql');
