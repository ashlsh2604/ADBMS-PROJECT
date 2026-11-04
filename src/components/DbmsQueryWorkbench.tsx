import React, { useState, useEffect, useRef } from 'react';
import { DBMS_SCHEMA } from '../data/mockDbmsData';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Database, Play, Save, Download, Terminal, 
  CheckCircle2, Copy, Check, Server, 
  Cpu, Zap, AlertCircle, FileSpreadsheet, FileJson, ChevronDown, Table,
  Layers, ShieldCheck
} from 'lucide-react';
import { DbmsQueryResult } from '../types/database';
import { 
  executeDbQuery, 
  fetchDbStatus, 
  testMySqlConnectionApi, 
  DbStatusInfo, 
  fetchBackendQueriesList, 
  runBackendQueryApi, 
  BackendQueryDef 
} from '../services/api';
import { 
  Code2, 
  FileCode, 
  Sparkles, 
  ListFilter 
} from 'lucide-react';
import { AdbmsPhasesWorkbench } from './AdbmsPhasesWorkbench';

interface DbmsQueryWorkbenchProps {
  onRequireAuth?: (reason: string) => void;
}

export const DbmsQueryWorkbench: React.FC<DbmsQueryWorkbenchProps> = ({ onRequireAuth }) => {
  const { user, addCustomQuery } = useAuthAndSync();
  const [selectedTable, setSelectedTable] = useState<string>('fact_video_metrics');
  const [activeTab, setActiveTab] = useState<'editor' | 'adbms' | 'backend' | 'schema' | 'saved' | 'mysql'>('editor');
  const [backendQueries, setBackendQueries] = useState<BackendQueryDef[]>([]);
  const [selectedBackendCategory, setSelectedBackendCategory] = useState<string>('All');
  const [currentSql, setCurrentSql] = useState<string>(
    user?.custom_queries[0]?.sql || `SELECT 
    v.category,
    COUNT(v.video_id) AS total_videos,
    ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
    ROUND(AVG(v.duration_seconds), 1) AS avg_duration_sec,
    ROUND(AVG(v.watch_time_hours), 0) AS avg_watch_hours,
    ROUND(SUM(v.views) / SUM(v.duration_seconds), 2) AS view_density_factor
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@AshRides26'
GROUP BY v.category
ORDER BY avg_retention_pct DESC;`
  );

  const [queryResult, setQueryResult] = useState<DbmsQueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Query Result Export states
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // MySQL Connection Test state
  const [testHost, setTestHost] = useState('127.0.0.1');
  const [testPort, setTestPort] = useState(3306);
  const [testUser, setTestUser] = useState('root');
  const [testPassword, setTestPassword] = useState('');
  const [testDb, setTestDb] = useState('ashrides26_db');
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; latencyMs?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Load database status and backend queries catalog
  useEffect(() => {
    fetchDbStatus()
      .then((status) => setDbStatus(status))
      .catch((err) => console.error('Failed to load DB status', err));

    fetchBackendQueriesList()
      .then((list) => {
        if (list && list.length > 0) {
          setBackendQueries(list);
        }
      })
      .catch((err) => console.error('Failed to load backend queries', err));
  }, []);

  // Execute SQL via Express MySQL backend
  const executeQuery = async () => {
    setIsRunning(true);
    setQueryError(null);

    try {
      const result = await executeDbQuery(currentSql);
      setQueryResult(result);
      // Refresh status to update query counts
      fetchDbStatus().then(setDbStatus).catch(() => {});
    } catch (err: any) {
      setQueryError(err?.message || 'SQL execution failed. Check syntax and schema.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testMySqlConnectionApi({
        host: testHost,
        port: testPort,
        user: testUser,
        password: testPassword,
        database: testDb,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    addCustomQuery({
      title: saveTitle,
      description: 'User-authored query saved from MySQL DBMS Workbench',
      sql: currentSql,
      category: 'User Custom'
    });

    setSaveTitle('');
    setShowSaveModal(false);
  };

  // Helper: Format query results to RFC 4180 compliant CSV / TSV string
  const formatQueryResultToCsv = (result: DbmsQueryResult, delimiter: string = ','): string => {
    const { columns, data } = result;
    if (!columns || columns.length === 0) return '';

    const escapeCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = columns.map(escapeCell).join(delimiter);
    const rows = data.map((row) =>
      columns.map((col) => escapeCell(row[col])).join(delimiter)
    );

    // \uFEFF is the UTF-8 Byte Order Mark (BOM) to ensure correct character encoding in Excel & Numbers
    return '\uFEFF' + [header, ...rows].join('\r\n');
  };

  // Helper: Format query results to JSON (pretty printed with 2 spaces)
  const formatQueryResultToJson = (result: DbmsQueryResult, mode: 'records' | 'full' = 'records'): string => {
    if (mode === 'records') {
      return JSON.stringify(result.data, null, 2);
    }
    return JSON.stringify(
      {
        export_metadata: {
          database: 'ashrides26_db',
          rdbms_engine: 'MySQL 8.0.36 InnoDB',
          exported_at: new Date().toISOString(),
          query_sql: result.query_sql,
          execution_time_ms: result.execution_time_ms,
          rows_returned: result.rows_returned,
          rows_scanned: result.rows_scanned,
          cost_estimate: result.cost_estimate,
          indexes_used: result.indexes_used,
          optimizer_plan: result.schema_plan || null
        },
        columns: result.columns,
        data: result.data
      },
      null,
      2
    );
  };

  // Helper: Trigger browser file download via Blob and Object URL
  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Helper: Generate structured export filename
  const getExportFilename = (extension: 'csv' | 'json' | 'tsv', suffix?: string) => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const match = currentSql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    const table = match ? match[1] : 'query_result';
    return `ashrides26_${table}${suffix ? `_${suffix}` : ''}_${stamp}.${extension}`;
  };

  // Export handlers
  const handleExportCsv = (delimiter: string = ',') => {
    if (!queryResult) return;
    if (queryResult.data.length === 0) {
      setExportFeedback('Notice: Query returned 0 rows to export');
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }
    try {
      const csvData = formatQueryResultToCsv(queryResult, delimiter);
      const ext = delimiter === '\t' ? 'tsv' : 'csv';
      const mime = ext === 'tsv' ? 'text/tab-separated-values;charset=utf-8;' : 'text/csv;charset=utf-8;';
      const filename = getExportFilename(ext);
      triggerFileDownload(csvData, filename, mime);
      setExportFeedback(`✓ Exported ${ext.toUpperCase()}: ${filename} (${queryResult.rows_returned || queryResult.data.length} rows)`);
      setTimeout(() => setExportFeedback(null), 4000);
      setShowExportMenu(false);
    } catch (err: any) {
      setExportFeedback(`Export failed: ${err?.message || 'unknown error'}`);
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const handleExportJson = (mode: 'records' | 'full' = 'records') => {
    if (!queryResult) return;
    if (queryResult.data.length === 0) {
      setExportFeedback('Notice: Query returned 0 rows to export');
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }
    try {
      const jsonData = formatQueryResultToJson(queryResult, mode);
      const filename = getExportFilename('json', mode === 'full' ? 'full_package' : 'records');
      triggerFileDownload(jsonData, filename, 'application/json;charset=utf-8;');
      const label = mode === 'full' ? 'Full JSON Package (Metadata + Data)' : 'Formatted JSON Records';
      setExportFeedback(`✓ Exported ${label}: ${filename} (${queryResult.rows_returned || queryResult.data.length} rows)`);
      setTimeout(() => setExportFeedback(null), 4000);
      setShowExportMenu(false);
    } catch (err: any) {
      setExportFeedback(`Export failed: ${err?.message || 'unknown error'}`);
      setTimeout(() => setExportFeedback(null), 4000);
    }
  };

  const handleCopyFormatted = async (format: 'csv' | 'json') => {
    if (!queryResult || queryResult.data.length === 0) {
      setExportFeedback('Notice: No query rows to copy');
      setTimeout(() => setExportFeedback(null), 3500);
      return;
    }
    try {
      const text = format === 'csv'
        ? formatQueryResultToCsv(queryResult, ',')
        : formatQueryResultToJson(queryResult, 'records');
      await navigator.clipboard.writeText(text);
      setExportFeedback(`✓ Copied formatted ${format.toUpperCase()} (${queryResult.data.length} rows) to clipboard!`);
      setTimeout(() => setExportFeedback(null), 3500);
      setShowExportMenu(false);
    } catch (err: any) {
      setExportFeedback('Failed to copy to clipboard');
      setTimeout(() => setExportFeedback(null), 3500);
    }
  };

  const sampleQueries = [
    {
      title: 'Category Retention & View Density',
      sql: `SELECT 
    v.category,
    COUNT(v.video_id) AS total_videos,
    ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
    ROUND(AVG(v.duration_seconds), 1) AS avg_duration_sec,
    ROUND(AVG(v.watch_time_hours), 0) AS avg_watch_hours,
    ROUND(SUM(v.views) / SUM(v.duration_seconds), 2) AS view_density_factor
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@AshRides26'
GROUP BY v.category
ORDER BY avg_retention_pct DESC;`
    },
    {
      title: 'Retention Drop Point Analysis (JOIN)',
      sql: `SELECT 
    v.title,
    r.second_mark,
    r.pct_retention,
    r.chapter_name,
    r.editorial_note
FROM fact_video_retention r
JOIN fact_video_metrics v ON r.video_id = v.video_id
WHERE r.is_drop_point = TRUE
ORDER BY r.pct_retention ASC
LIMIT 6;`
    },
    {
      title: 'High Velocity Spikes (Trending)',
      sql: `SELECT 
    video_id,
    title,
    bike_model,
    velocity_views_per_hr,
    retention_pct,
    views
FROM fact_video_metrics
WHERE is_trending = TRUE
ORDER BY velocity_views_per_hr DESC;`
    },
    {
      title: 'Competitor Channel Benchmarks',
      sql: `SELECT 
    name,
    subscribers,
    total_videos,
    avg_views_per_video,
    sub_growth_monthly_pct,
    primary_bike
FROM dim_channels
ORDER BY subscribers DESC;`
    },
    {
      title: 'Monthly Revenue vs Watch Time',
      sql: `SELECT 
    month_name,
    year_num,
    views,
    subscribers_gained,
    watch_time_hours,
    revenue_est
FROM fact_monthly_growth
ORDER BY year_num DESC, views DESC;`
    }
  ];

  return (
    <div className="space-y-6" id="dbms-workbench-section">
      {/* MySQL Engine Status Banner */}
      <div className="bg-[#0b101d] border border-cyan-500/20 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">
                {dbStatus?.engine || 'MySQL 8.0 Relational Engine'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                dbStatus?.connected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                {dbStatus?.connected ? 'LIVE MYSQL POOL' : 'MYSQL COMPATIBLE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Host: {dbStatus?.host || '127.0.0.1'}:{dbStatus?.port || 3306} • Database: {dbStatus?.database || 'ashrides26_db'} • 3NF Normalized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="text-right">
            <div className="text-slate-200 font-bold">{dbStatus?.totalRows || 174} Rows</div>
            <div className="text-[10px] text-slate-500">8 Relational Tables</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-cyan-400 font-bold">{dbStatus?.totalQueriesExecuted || 0} Queries</div>
            <div className="text-[10px] text-slate-500">Executed on Server</div>
          </div>
          <button
            onClick={() => setActiveTab('mysql')}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-mono text-xs transition"
          >
            MySQL Settings
          </button>
        </div>
      </div>

      {/* Main Workbench Container */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Advanced DBMS Query Workbench & MySQL Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MySQL 8.0 DDL & DML
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive query terminal, relational schema explorer, and indexing execution plans for motovlog telemetry
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'editor' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL Editor
            </button>
            <button
              onClick={() => setActiveTab('adbms')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'adbms' 
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-900/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              <span>ADBMS 4-Phase Suite</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                Phases 1-4
              </span>
            </button>
            <button
              onClick={() => setActiveTab('backend')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'backend' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Backend SQL Library</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                {backendQueries.length || 9}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'schema' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Schema Explorer
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'saved' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved Queries ({user?.custom_queries?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('mysql')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'mysql' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              MySQL Config & DDL
            </button>
          </div>
        </div>

        {/* Tab 1: SQL Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            {/* Preset Query Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-mono flex-shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Backend Queries:
              </span>
              {(backendQueries.length > 0 ? backendQueries : sampleQueries.map((s, idx) => ({ id: `sq_${idx}`, name: s.title, sql: s.sql }))).map((bq: any) => (
                <button
                  key={bq.id || bq.name}
                  onClick={() => setCurrentSql(bq.sql)}
                  className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition whitespace-nowrap flex items-center gap-1.5 ${
                    currentSql.trim() === bq.sql.trim()
                      ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-300'
                  }`}
                >
                  <span>⚡</span>
                  <span>{bq.name || bq.title}</span>
                </button>
              ))}
            </div>

            {/* Code Editor Container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
              <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>mysql &gt; ashrides26_db.sql</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentSql);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:text-white transition"
                    title="Copy SQL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!user && onRequireAuth) {
                        onRequireAuth('save_required');
                        return;
                      }
                      setShowSaveModal(true);
                    }}
                    className="p-1 hover:text-amber-400 transition"
                    title="Save Query to Synced Profile"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={currentSql}
                onChange={(e) => setCurrentSql(e.target.value)}
                rows={7}
                className="w-full bg-[#090d16] text-emerald-400 font-mono text-xs p-4 focus:outline-none resize-y leading-relaxed"
                placeholder="Write standard MySQL queries here..."
                id="dbms-sql-editor-textarea"
              />

              <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Target: MySQL 8.0 InnoDB (AshRides26 Fact & Dim Tables)
                </span>
                <button
                  onClick={executeQuery}
                  disabled={isRunning}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-bold font-mono rounded-lg shadow-md flex items-center gap-2 transition disabled:opacity-50"
                  id="dbms-run-sql-btn"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing on MySQL...' : 'Run Query (F5)'}</span>
                </button>
              </div>
            </div>

            {/* Query Error Banner */}
            {queryError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {/* Results Table & Execution Metrics */}
            {queryResult && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                {/* Export Feedback Notification */}
                {exportFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 transition">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-mono text-[11px]">{exportFeedback}</span>
                    </div>
                    <button 
                      onClick={() => setExportFeedback(null)}
                      className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Executed in {queryResult.execution_time_ms}ms
                    </span>
                    <span>•</span>
                    <span>Rows: {queryResult.rows_returned} returned / {queryResult.rows_scanned} scanned</span>
                    <span>•</span>
                    <span className="text-cyan-400">Cost: {queryResult.cost_estimate}</span>
                    <span>•</span>
                    <span className="text-slate-400">{queryResult.columns.length} cols</span>
                  </div>

                  {/* Export Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap" ref={exportMenuRef}>
                    {/* Primary Export CSV */}
                    <button
                      onClick={() => handleExportCsv(',')}
                      disabled={queryResult.data.length === 0}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 text-xs font-mono rounded-lg border border-emerald-500/40 flex items-center gap-1.5 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Export query results as formatted RFC 4180 CSV with UTF-8 BOM"
                      id="dbms-export-csv-btn"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export CSV</span>
                    </button>

                    {/* Primary Export JSON */}
                    <button
                      onClick={() => handleExportJson('records')}
                      disabled={queryResult.data.length === 0}
                      className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 text-xs font-mono rounded-lg border border-cyan-500/40 flex items-center gap-1.5 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Export query results as formatted JSON array (pretty-printed 2 spaces)"
                      id="dbms-export-json-btn"
                    >
                      <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export JSON</span>
                    </button>

                    {/* Options / More Formats Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={queryResult.data.length === 0}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="More export choices (TSV, Full JSON package, copy to clipboard)"
                        id="dbms-export-options-btn"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span className="hidden md:inline">Formats</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showExportMenu && (
                        <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5 space-y-1 text-xs font-mono">
                          <div className="px-2.5 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Download Formats
                          </div>
                          <button
                            onClick={() => handleExportCsv(',')}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-emerald-300 flex items-center justify-between group transition"
                          >
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                              <div>
                                <div className="font-semibold text-white">CSV File</div>
                                <div className="text-[10px] text-slate-400">RFC 4180 • UTF-8 BOM</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">.csv</span>
                          </button>

                          <button
                            onClick={() => handleExportJson('records')}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-cyan-300 flex items-center justify-between group transition"
                          >
                            <div className="flex items-center gap-2">
                              <FileJson className="w-4 h-4 text-cyan-400" />
                              <div>
                                <div className="font-semibold text-white">JSON Records</div>
                                <div className="text-[10px] text-slate-400">Formatted array of objects</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">.json</span>
                          </button>

                          <button
                            onClick={() => handleExportJson('full')}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-amber-300 flex items-center justify-between group transition"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-amber-400" />
                              <div>
                                <div className="font-semibold text-white">Full JSON Bundle</div>
                                <div className="text-[10px] text-slate-400">With SQL, stats & plan</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">.json</span>
                          </button>

                          <button
                            onClick={() => handleExportCsv('\t')}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-purple-300 flex items-center justify-between group transition"
                          >
                            <div className="flex items-center gap-2">
                              <Table className="w-4 h-4 text-purple-400" />
                              <div>
                                <div className="font-semibold text-white">TSV Spreadsheet</div>
                                <div className="text-[10px] text-slate-400">Tab-separated values</div>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">.tsv</span>
                          </button>

                          <div className="border-t border-slate-800 my-1" />

                          <div className="px-2.5 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Copy to Clipboard
                          </div>

                          <button
                            onClick={() => handleCopyFormatted('json')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Copy Formatted JSON</span>
                          </button>

                          <button
                            onClick={() => handleCopyFormatted('csv')}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-2 transition"
                          >
                            <Copy className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copy Formatted CSV</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {queryResult.data.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                    Query executed successfully, but returned 0 rows matching criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-cyan-400 uppercase text-[10px] border-b border-slate-800 sticky top-0">
                        <tr>
                          {queryResult.columns.map((col) => (
                            <th key={col} className="px-3 py-2 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 text-slate-200">
                        {queryResult.data.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/50">
                            {queryResult.columns.map((col) => (
                              <td key={col} className="px-3 py-2 whitespace-nowrap">
                                {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {queryResult.schema_plan && (
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 space-y-1">
                    <div className="text-slate-400 font-bold">MySQL EXPLAIN Optimizer Plan:</div>
                    <pre className="whitespace-pre-wrap">{queryResult.schema_plan}</pre>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-2">
                  <span>Indexes:</span>
                  {queryResult.indexes_used.map((idxName) => (
                    <span key={idxName} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {idxName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Backend SQL Library */}
        {activeTab === 'backend' && (
          <div className="space-y-5">
            {/* Header and Category Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white font-mono">
                    Production Backend MySQL Queries (`server/db/queries.ts`)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Parameterized, indexed analytical and transactional queries running on Express.js with MySQL 8.0 InnoDB
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['All', 'Aggregation', 'Window Functions', 'Cross-Table Joins', 'Time Series', 'Real-Time Telemetry', 'Optimization'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBackendCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                      selectedBackendCategory === cat
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Queries List */}
            <div className="space-y-4">
              {backendQueries
                .filter((q) => selectedBackendCategory === 'All' || q.category === selectedBackendCategory)
                .map((query) => (
                  <div
                    key={query.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3.5 hover:border-cyan-500/40 transition shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-bold text-white font-mono">{query.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {query.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">ID: `{query.id}`</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{query.description}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setCurrentSql(query.sql);
                            setActiveTab('editor');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-mono rounded-lg transition border border-slate-700 flex items-center gap-1.5"
                        >
                          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Load in Editor</span>
                        </button>
                        <button
                          onClick={async () => {
                            setCurrentSql(query.sql);
                            setIsRunning(true);
                            setActiveTab('editor');
                            setQueryError(null);
                            try {
                              const result = await executeDbQuery(query.sql);
                              setQueryResult(result);
                              fetchDbStatus().then(setDbStatus).catch(() => {});
                            } catch (err: any) {
                              setQueryError(err?.message || 'Query execution failed');
                            } finally {
                              setIsRunning(false);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs font-mono rounded-lg transition shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Execute Live</span>
                        </button>
                      </div>
                    </div>

                    {/* SQL Code Block */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#070b13]">
                      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400">MySQL 8.0 Query Syntax</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500">API: `POST /api/queries/run` ({query.id})</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(query.sql);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="hover:text-white transition flex items-center gap-1 text-[10px]"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy SQL</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                        {query.sql}
                      </pre>
                    </div>

                    {/* Index Coverage & Performance Specs */}
                    {query.indexesUsed && query.indexesUsed.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                        <span className="text-slate-500 text-[10px] uppercase">Indexed B-Tree Keys:</span>
                        {query.indexesUsed.map((idx, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 text-[10px]"
                          >
                            {idx}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 3: Schema Explorer */}
        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Table list */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">MySQL 8.0 Tables:</div>
              {DBMS_SCHEMA.map((t) => (
                <button
                  key={t.table_name}
                  onClick={() => setSelectedTable(t.table_name)}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-mono transition flex items-center justify-between ${
                    selectedTable === t.table_name
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="truncate">{t.table_name}</span>
                  <span className="text-[10px] text-slate-500">{t.row_count} rows</span>
                </button>
              ))}
            </div>

            {/* Table Details */}
            <div className="md:col-span-3 bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4">
              {(() => {
                const tbl = DBMS_SCHEMA.find((t) => t.table_name === selectedTable);
                if (!tbl) return null;
                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold font-mono text-cyan-400">
                        TABLE {tbl.table_name} (InnoDB)
                      </h4>
                      <span className="text-xs font-mono text-slate-400">
                        {tbl.row_count} Sample Rows Indexed
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-4">{tbl.description}</p>

                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="px-3 py-2">Column Name</th>
                            <th className="px-3 py-2">MySQL Type</th>
                            <th className="px-3 py-2">Constraint</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300">
                          {tbl.columns.map((col) => (
                            <tr key={col.name}>
                              <td className="px-3 py-2 text-white font-bold">{col.name}</td>
                              <td className="px-3 py-2 text-cyan-300">{col.type}</td>
                              <td className="px-3 py-2 text-amber-400 text-[11px]">{col.constraint}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="text-xs font-mono text-slate-400 space-y-1">
                      <div>Primary Key: <span className="text-emerald-400">{tbl.primary_key}</span></div>
                      <div>Active B-Tree Indexes: <span className="text-slate-300">{tbl.indexes.join(', ')}</span></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab 3: Saved Queries */}
        {activeTab === 'saved' && (
          <div className="space-y-3">
            {!user ? (
              <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                    Sign in to Access Saved Queries
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Custom MySQL scripts, views, and queries are encrypted and synced across all your connected devices in real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRequireAuth?.('save_required')}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
                  id="saved-queries-signin-btn"
                >
                  Sign In to Sync Queries & Redirect Back
                </button>
              </div>
            ) : user.custom_queries?.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs font-mono">
                No custom queries saved yet. Write an SQL query in the editor and click the save disk icon!
              </div>
            ) : (
              user.custom_queries?.map((query) => (
                <div
                  key={query.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{query.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {query.category}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentSql(query.sql);
                        setActiveTab('editor');
                      }}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded-lg transition"
                    >
                      Load in Editor
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{query.description}</p>
                  <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] font-mono overflow-x-auto">
                    {query.sql}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: MySQL Config & DDL */}
        {activeTab === 'mysql' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Connection configuration details */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white font-mono">MySQL Engine Architecture</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  AshRides26 uses a 3NF Normalized MySQL 8.0 schema with InnoDB storage engine, foreign keys, secondary B-tree indexes, and aggregated analytics views.
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Driver:</span>
                    <span className="text-cyan-300">mysql2 (Promise Pool)</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Default Database:</span>
                    <span className="text-cyan-300">{dbStatus?.database || 'ashrides26_db'}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Character Set:</span>
                    <span className="text-cyan-300">utf8mb4_unicode_ci</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Storage Engine:</span>
                    <span className="text-cyan-300">InnoDB (ACID Compliant)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Import Schema via CLI:</span>
                  <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-emerald-400 text-[11px] font-mono select-all">
                    mysql -u root -p ashrides26_db &lt; schema.sql
                  </pre>
                </div>
              </div>

              {/* Test custom MySQL credentials */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white font-mono">Test MySQL Connection</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Verify connectivity to an external MySQL server, AWS RDS, Google Cloud SQL, or local instance:
                </p>

                <form onSubmit={handleTestConnection} className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-slate-400 block mb-1 text-[11px]">Host / IP</label>
                      <input
                        type="text"
                        value={testHost}
                        onChange={(e) => setTestHost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px]">Port</label>
                      <input
                        type="number"
                        value={testPort}
                        onChange={(e) => setTestPort(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px]">User</label>
                      <input
                        type="text"
                        value={testUser}
                        onChange={(e) => setTestUser(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 text-[11px]">Database</label>
                      <input
                        type="text"
                        value={testDb}
                        onChange={(e) => setTestDb(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Password</label>
                    <input
                      type="password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      placeholder="Leave empty if none"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isTesting}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition disabled:opacity-50"
                  >
                    {isTesting ? 'Testing MySQL Handshake...' : 'Ping & Verify MySQL'}
                  </button>
                </form>

                {testResult && (
                  <div className={`p-3 rounded-lg border text-xs font-mono ${
                    testResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="font-bold">{testResult.success ? '✓ Connection Verified' : '✕ Connection Notice'}</div>
                    <div className="text-[11px] mt-0.5">{testResult.message}</div>
                    {testResult.latencyMs !== undefined && (
                      <div className="text-[10px] text-slate-400 mt-1">Roundtrip Latency: {testResult.latencyMs}ms</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: ADBMS 4-Phase Suite */}
        {activeTab === 'adbms' && (
          <AdbmsPhasesWorkbench
            currentSql={currentSql}
            onLoadSql={(sql) => {
              setCurrentSql(sql);
              setActiveTab('editor');
            }}
            onRunSql={async (sql) => {
              setCurrentSql(sql);
              setActiveTab('editor');
              setIsRunning(true);
              setQueryError(null);
              try {
                const result = await executeDbQuery(sql);
                setQueryResult(result);
                fetchDbStatus().then(setDbStatus).catch(() => {});
              } catch (err: any) {
                setQueryError(err?.message || 'Query execution failed');
              } finally {
                setIsRunning(false);
              }
            }}
          />
        )}
      </div>

      {/* Modal to save custom query */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Save Query to Sync Profile</h4>
            <form onSubmit={handleSaveQuerySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Query Title</label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g. 30-Day Retention Delta"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
