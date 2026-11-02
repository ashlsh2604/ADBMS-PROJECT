import React, { useEffect, useMemo, useState } from 'react';
import { Database, Play, Save, Download, Server, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DbmsQueryResult } from '../types/database';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { executeDbQuery, fetchAppConfig, fetchDbSchema, fetchDbStatus, testMySqlConnectionApi, type AppConfig, type DbStatusInfo } from '../services/api';

interface Props { onRequireAuth?: (reason: string) => void; }
const ADMIN_ROLES = new Set(['Channel Owner (Ash)', 'DBMS Lead Architect']);

export const DbmsQueryWorkbench: React.FC<Props> = ({ onRequireAuth }) => {
  const { user, addCustomQuery } = useAuthAndSync();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [status, setStatus] = useState<DbStatusInfo | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [tab, setTab] = useState<'editor' | 'schema' | 'saved' | 'mysql'>('editor');
  const [sql, setSql] = useState('');
  const [presetId, setPresetId] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<DbmsQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const isAdmin = Boolean(user && ADMIN_ROLES.has(user.role));
  const presets = config?.presets || [];

  useEffect(() => {
    fetchAppConfig().then((appConfig) => {
      setConfig(appConfig);
      if (appConfig.presets[0]) { setSql(appConfig.presets[0].sql); setPresetId(appConfig.presets[0].id); }
    }).catch((err) => setError(err.message));
    fetchDbStatus().then(setStatus).catch(() => {});
    if (user) fetchDbSchema().then((schema) => setTables(schema.tables)).catch(() => {});
  }, [user?.id]);

  const runQuery = async () => {
    if (!user) { onRequireAuth?.('save_required'); return; }
    if (!isAdmin) { setError('Only the channel owner or DBMS architect can run SQL queries.'); return; }
    setRunning(true); setError(null);
    try {
      const selected = presets.find((preset) => preset.id === presetId);
      const usePreset = selected && selected.sql.trim() === sql.trim() ? selected.id : undefined;
      const response = await executeDbQuery(usePreset ? undefined : sql, usePreset);
      setResult(response);
      fetchDbStatus().then(setStatus).catch(() => {});
    } catch (err: any) {
      setResult(null);
      setError(err?.message || 'Query failed');
    } finally { setRunning(false); }
  };

  const exportCsv = () => {
    if (!result) return;
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [result.columns.map(escape).join(','), ...result.data.map((row) => result.columns.map((column) => escape(row[column])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = `ashrides26_query_${Date.now()}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  const saveQuery = (event: React.FormEvent) => {
    event.preventDefault();
    if (!saveTitle.trim()) return;
    addCustomQuery({ title: saveTitle, description: 'Saved from the SQL workbench', sql, category: 'User Custom' });
    setSaveTitle(''); setShowSave(false);
  };

  const testConnection = async (event: React.FormEvent) => {
    event.preventDefault();
    setTesting(true); setTestResult(null);
    try {
      const response = await testMySqlConnectionApi({ host: status?.host, port: status?.port, database: status?.database });
      setTestResult(`Connected to MySQL ${response.version} in ${response.latencyMs}ms.`);
    } catch (err: any) { setTestResult(err?.message || 'Connection test failed'); }
    finally { setTesting(false); }
  };

  const banner = useMemo(() => status?.connected ? 'Live MySQL pool' : config?.demoMode ? 'Demo mode — presets only, no MySQL' : 'MySQL unavailable', [status, config]);

  return (
    <div className="space-y-6" id="dbms-workbench-section">
      <div className="bg-[#0b101d] border border-cyan-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400"><Server className="w-5 h-5" /></div>
          <div>
            <div className="text-sm font-bold text-white font-mono">{status?.engine || config?.engine || 'Loading engine…'}</div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{banner} • {status?.totalRows ?? 0} rows • {status?.tablesCount ?? 0} tables</div>
          </div>
        </div>
        <button onClick={() => setTab('mysql')} className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 font-mono text-xs">MySQL Settings</button>
      </div>

      <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          {(['editor', 'schema', 'saved', 'mysql'] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`px-3 py-1.5 rounded-lg text-xs font-mono ${tab === item ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              {item === 'editor' ? 'SQL Editor' : item === 'schema' ? 'Schema' : item === 'saved' ? `Saved Queries (${user?.custom_queries.length || 0})` : 'MySQL Config'}
            </button>
          ))}
        </div>

        {tab === 'editor' && (
          <div className="space-y-4">
            {!isAdmin && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">Sign in as the channel owner or DBMS architect to run queries. Guests can browse the dashboard but cannot execute SQL.</div>}
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button key={preset.id} onClick={() => { setSql(preset.sql); setPresetId(preset.id); setError(null); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border ${presetId === preset.id ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                  {preset.title}
                </button>
              ))}
            </div>
            <textarea id="dbms-sql-editor-textarea" value={sql} onChange={(event) => { setSql(event.target.value); setPresetId(undefined); }} rows={10} spellCheck={false} className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs text-emerald-300 font-mono focus:outline-none focus:border-cyan-500" placeholder="SELECT … FROM fact_video_metrics" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">{config?.demoMode ? 'Demo mode runs labeled presets against the seed dataset. Custom SQL requires MySQL.' : 'Custom SQL is restricted to read-only analytics tables/views.'}</span>
              <div className="flex gap-2">
                <button onClick={() => setShowSave(true)} disabled={!user} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40" title="Save query"><Save className="w-4 h-4" /></button>
                <button onClick={runQuery} disabled={running || !isAdmin} className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 disabled:opacity-50"><Play className="w-3.5 h-3.5" />{running ? 'Running…' : 'Run Query (F5)'}</button>
              </div>
            </div>
            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            {result && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Executed in {result.execution_time_ms}ms • {result.rows_returned} rows returned</span>
                  <button onClick={exportCsv} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800"><Download className="w-3 h-3" />Export CSV</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400"><tr>{result.columns.map((column) => <th key={column} className="px-3 py-2">{column}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-800">{result.data.map((row, index) => <tr key={index}>{result.columns.map((column) => <td key={column} className="px-3 py-2 text-slate-200">{String(row[column] ?? '')}</td>)}</tr>)}</tbody>
                  </table>
                </div>
                {result.schema_plan && <pre className="whitespace-pre-wrap rounded-lg bg-slate-950 border border-slate-800 p-3 text-[11px] text-slate-400">{result.schema_plan}</pre>}
              </div>
            )}
          </div>
        )}

        {tab === 'schema' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map((table) => <div key={table} className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs font-mono text-cyan-300 flex items-center gap-2"><Database className="w-4 h-4" />{table}</div>)}
            {!tables.length && <p className="text-xs text-slate-500">Sign in to inspect the schema.</p>}
          </div>
        )}

        {tab === 'saved' && (
          <div className="space-y-3">
            {(user?.custom_queries || []).map((query) => (
              <button key={query.id} onClick={() => { setSql(query.sql); setPresetId(undefined); setTab('editor'); }} className="w-full text-left rounded-xl bg-slate-900 border border-slate-800 p-3">
                <div className="text-xs font-bold text-white">{query.title}</div>
                <pre className="mt-2 text-[11px] text-emerald-300 whitespace-pre-wrap">{query.sql}</pre>
              </button>
            ))}
            {!user?.custom_queries.length && <p className="text-xs text-slate-500">No saved queries yet.</p>}
          </div>
        )}

        {tab === 'mysql' && (
          <form onSubmit={testConnection} className="max-w-lg space-y-3 text-xs font-mono">
            <p className="text-slate-400">The server uses the MySQL credentials configured in its environment. For safety, the browser cannot supply arbitrary credentials or probe unlisted hosts.</p>
            <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-slate-300">Host: {status?.host}:{status?.port}<br />Database: {status?.database}</div>
            <button type="submit" disabled={testing || !isAdmin || !status?.connected} className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-bold disabled:opacity-50">{testing ? 'Testing…' : 'Ping & Verify MySQL'}</button>
            {testResult && <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-slate-200">{testResult}</div>}
          </form>
        )}
      </div>

      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowSave(false)} />
          <form onSubmit={saveQuery} className="relative z-10 w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4">
            <h4 className="text-sm font-bold text-white">Save query</h4>
            <input value={saveTitle} onChange={(event) => setSaveTitle(event.target.value)} required placeholder="Query title" className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs text-white" />
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowSave(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button><button type="submit" className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-bold">Save</button></div>
          </form>
        </div>
      )}
    </div>
  );
};
