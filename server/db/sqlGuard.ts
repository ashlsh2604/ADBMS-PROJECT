import sqlParser from 'node-sql-parser';
import { badRequest } from '../errors.js';

const { Parser } = sqlParser;
const parser = new Parser();

export const ANALYTICS_TABLES = new Set([
  'dim_channels',
  'fact_video_metrics',
  'fact_video_retention',
  'fact_monthly_growth',
  'dim_trending_alerts',
  'v_category_performance_summary',
  'v_channel_benchmarks',
]);

const DENIED_FUNCTIONS = new Set([
  'SLEEP', 'BENCHMARK', 'LOAD_FILE', 'GET_LOCK', 'RELEASE_LOCK', 'RELEASE_ALL_LOCKS',
  'IS_FREE_LOCK', 'IS_USED_LOCK', 'MASTER_POS_WAIT', 'SOURCE_POS_WAIT',
]);

function collectCteNames(ast: any, names = new Set<string>()): Set<string> {
  if (!ast || typeof ast !== 'object') return names;
  if (Array.isArray(ast)) {
    for (const item of ast) collectCteNames(item, names);
    return names;
  }
  if (Array.isArray(ast.with)) {
    for (const cte of ast.with) {
      const name = typeof cte?.name === 'string' ? cte.name : cte?.name?.value;
      if (name) names.add(name.toLowerCase());
      collectCteNames(cte?.stmt, names);
    }
  }
  for (const value of Object.values(ast)) collectCteNames(value, names);
  return names;
}

function functionName(name: any): string {
  if (typeof name === 'string') return name.toUpperCase();
  if (Array.isArray(name?.name)) return name.name.map((part: any) => part?.value ?? '').join('').toUpperCase();
  if (Array.isArray(name)) return name.map((part: any) => part?.value ?? '').join('').toUpperCase();
  return String(name?.value ?? name ?? '').toUpperCase();
}

function inspect(node: any): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach(inspect);
    return;
  }
  if (node.type === 'select' && node.into && (node.into.position || node.into.keyword)) {
    throw badRequest('SELECT INTO is not allowed in the analytics workbench');
  }
  if (node.type === 'function' && DENIED_FUNCTIONS.has(functionName(node.name))) {
    throw badRequest(`Function ${functionName(node.name)} is not allowed`);
  }
  if (node.for_update || node.lock_in_share_mode || node.locking_read) {
    throw badRequest('Locking reads are not allowed');
  }
  Object.values(node).forEach(inspect);
}

/** Validate a single, read-only analytics SELECT before it reaches MySQL. */
export function assertSafeAnalyticsQuery(sql: string): void {
  if (sql.length > 10000) throw badRequest('Query is too long');
  let ast: any;
  let tables: string[];
  try {
    ast = parser.astify(sql, { database: 'MySQL' });
    tables = parser.tableList(sql, { database: 'MySQL' });
  } catch (error: any) {
    throw badRequest(`SQL could not be parsed as a single MySQL SELECT: ${error?.message || 'invalid syntax'}`);
  }
  if (Array.isArray(ast)) throw badRequest('Only one SQL statement is allowed');
  if (ast?.type !== 'select') throw badRequest('Only read-only SELECT queries are allowed');
  inspect(ast);
  const ctes = collectCteNames(ast);
  for (const entry of tables) {
    const [, db, table] = entry.split('::');
    const normalized = (table || '').toLowerCase();
    if (db && db !== 'null') throw badRequest('Cross-database queries are not allowed');
    if (!ANALYTICS_TABLES.has(normalized) && !ctes.has(normalized)) {
      throw badRequest(`Table or view "${table}" is not available in the analytics workbench`);
    }
  }
}

export function withRowLimit(sql: string, limit = 200): string {
  const trimmed = sql.trim().replace(/;\s*$/, '');
  return `SELECT * FROM (${trimmed}) AS analytics_result LIMIT ${limit + 1}`;
}
