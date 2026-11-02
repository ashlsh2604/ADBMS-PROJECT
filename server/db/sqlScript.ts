/** Split a trusted SQL migration file into statements without discarding commented DDL. */
export function splitSqlScript(script: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: "'" | '"' | '`' | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    const next = script[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
        current += ch;
      }
      continue;
    }
    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (!quote && ch === '-' && next === '-') {
      lineComment = true;
      i++;
      continue;
    }
    if (!quote && ch === '#') {
      lineComment = true;
      continue;
    }
    if (!quote && ch === '/' && next === '*') {
      blockComment = true;
      i++;
      continue;
    }
    if (quote) {
      current += ch;
      if (ch === '\\' && next) {
        current += next;
        i++;
      } else if (ch === quote) {
        if (next === quote) {
          current += next;
          i++;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }
    current += ch;
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}
