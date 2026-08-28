import React, { useState } from 'react';
import { DBMS_SCHEMA, VIDEOS, CHANNELS } from '../data/mockDbmsData';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Database, Play, Save, Download, Sparkles, Terminal, 
  Layers, Code, CheckCircle2, Copy, Check, Table2, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import { SavedQuery, DbmsQueryResult } from '../types/database';

export const DbmsQueryWorkbench: React.FC = () => {
  const { user, addCustomQuery } = useAuthAndSync();
  const [selectedTable, setSelectedTable] = useState<string>('fact_video_metrics');
  const [activeTab, setActiveTab] = useState<'editor' | 'schema' | 'saved'>('editor');
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

  // Execute SQL simulation against actual mock dataset
  const executeQuery = async () => {
    setIsRunning(true);
    await new Promise((res) => setTimeout(res, 350));

    const startTime = performance.now();
    const sql = currentSql.toLowerCase();

    let columns: string[] = [];
    let data: Record<string, any>[] = [];
    let indexesUsed = ['idx_video_cat_retention (BTREE)'];

    if (sql.includes('group by v.category') || sql.includes('category')) {
      columns = ['category', 'total_videos', 'avg_retention_pct', 'avg_duration_sec', 'avg_watch_hours', 'view_density_factor'];
      data = [
        { category: 'shorts', total_videos: 5, avg_retention_pct: '96.56%', avg_duration_sec: '37.6s', avg_watch_hours: '21,060', view_density_factor: '54.21' },
        { category: 'bike_review', total_videos: 6, avg_retention_pct: '66.85%', avg_duration_sec: '1256.6s', avg_watch_hours: '163,016', view_density_factor: '3.12' },
        { category: 'vlog', total_videos: 5, avg_retention_pct: '65.50%', avg_duration_sec: '1288.0s', avg_watch_hours: '123,320', view_density_factor: '2.14' }
      ];
      indexesUsed = ['idx_video_category (BITMAP INDEX)', 'idx_video_retention (BTREE)'];
    } else if (sql.includes('dim_channels') || sql.includes('competitor')) {
      columns = ['channel_name', 'subscribers', 'total_videos', 'avg_views_per_video', 'sub_growth_monthly_pct', 'sample_avg_retention'];
      data = CHANNELS.map((c) => ({
        channel_name: c.name,
        subscribers: c.subscribers.toLocaleString(),
        total_videos: c.total_videos,
        avg_views_per_video: c.avg_views_per_video.toLocaleString(),
        sub_growth_monthly_pct: `+${c.sub_growth_monthly_pct}%`,
        sample_avg_retention: c.is_primary ? '71.8%' : '58.4%'
      }));
      indexesUsed = ['idx_channel_subs (BTREE)', 'idx_channel_pk (HASH)'];
    } else {
      columns = ['video_id', 'title', 'category', 'bike_model', 'views', 'retention_pct', 'velocity_views_per_hr'];
      data = VIDEOS.slice(0, 10).map((v) => ({
        video_id: v.video_id,
        title: v.title.substring(0, 36) + '...',
        category: v.category,
        bike_model: v.bike_model,
        views: v.views.toLocaleString(),
        retention_pct: `${v.retention_pct}%`,
        velocity_views_per_hr: `+${v.velocity_views_per_hr}/hr`
      }));
    }

    const elapsed = Math.max(1.4, Number((performance.now() - startTime).toFixed(1)));

    setQueryResult({
      query_sql: currentSql,
      execution_time_ms: elapsed,
      rows_scanned: 148,
      rows_returned: data.length,
      indexes_used: indexesUsed,
      cost_estimate: 0.42,
      columns,
      data,
      schema_plan: 'Index Scan using idx_video_cat_retention on fact_video_metrics (cost=0.00..8.25 rows=148 width=64)'
    });

    setIsRunning(false);
  };

  const handleSaveQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;

    addCustomQuery({
      title: saveTitle,
      description: 'User-authored query saved from DBMS Workbench',
      sql: currentSql,
      category: 'User Custom'
    });

    setSaveTitle('');
    setShowSaveModal(false);
  };

  const handleExportCsv = () => {
    if (!queryResult) return;
    const header = queryResult.columns.join(',');
    const rows = queryResult.data.map((r) => queryResult.columns.map((col) => `"${r[col]}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ashrides26_dbms_query_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="dbms-workbench-section">
      {/* Header */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Advanced DBMS Query Workbench & Relational Engine
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SQL V2.6 ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive query terminal, relational schema explorer, and indexing execution plans for video performance data
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'editor' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL Editor
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
          </div>
        </div>

        {/* Tab 1: SQL Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            {/* Preset Query Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-mono flex-shrink-0">Sample Queries:</span>
              {user?.custom_queries?.map((sq) => (
                <button
                  key={sq.id}
                  onClick={() => setCurrentSql(sq.sql)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 font-mono text-[11px] transition whitespace-nowrap"
                >
                  ⚡ {sq.title}
                </button>
              ))}
            </div>

            {/* Code Editor Container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#090d16]">
              <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>motovlog_dbms &gt; query_runner.sql</span>
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
                    onClick={() => setShowSaveModal(true)}
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
                placeholder="Write standard SQL queries here..."
                id="dbms-sql-editor-textarea"
              />

              <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Target: AshRides26 Fact & Dim Tables (148 Fact Rows)
                </span>
                <button
                  onClick={executeQuery}
                  disabled={isRunning}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white text-xs font-bold font-mono rounded-lg shadow-md flex items-center gap-2 transition disabled:opacity-50"
                  id="dbms-run-sql-btn"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing SQL...' : 'Run Query (F5)'}</span>
                </button>
              </div>
            </div>

            {/* Results Table & Execution Metrics */}
            {queryResult && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Executed in {queryResult.execution_time_ms}ms
                    </span>
                    <span>•</span>
                    <span>Rows: {queryResult.rows_returned} returned / {queryResult.rows_scanned} scanned</span>
                    <span>•</span>
                    <span className="text-cyan-400">Cost: {queryResult.cost_estimate}</span>
                  </div>

                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export CSV</span>
                  </button>
                </div>

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
                              {row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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

        {/* Tab 2: Schema Explorer */}
        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Table list */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase">Database Tables:</div>
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
                        TABLE {tbl.table_name}
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
                            <th className="px-3 py-2">Data Type</th>
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
            {user?.custom_queries?.map((query) => (
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
            ))}
          </div>
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
