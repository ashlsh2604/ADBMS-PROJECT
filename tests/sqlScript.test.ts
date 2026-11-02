import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { splitSqlScript } from '../server/db/sqlScript.js';

test('migration splitter preserves commented CREATE TABLE statements', () => {
  const ddl = fs.readFileSync('server/db/schema.sql', 'utf8');
  const statements = splitSqlScript(ddl);
  const creates = statements.filter((statement) => /CREATE TABLE/i.test(statement));
  assert.equal(creates.length, 11);
  assert.ok(statements.every((statement) => !statement.startsWith('--')));
  assert.ok(statements.some((statement) => /CREATE TABLE IF NOT EXISTS dim_channels/i.test(statement)));
});

test('splitter respects quotes and block comments', () => {
  const statements = splitSqlScript(`-- header\nSELECT ';'; /* ; */ INSERT INTO t VALUES ('a;b');`);
  assert.deepEqual(statements, [`SELECT ';'`, `INSERT INTO t VALUES ('a;b')`]);
});
