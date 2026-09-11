import React, { useState } from 'react';
import { Video } from '../types/database';
import { VIDEOS } from '../data/mockDbmsData';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Layers, Plus, Trash2, Trophy, BarChart3, TrendingUp, 
  Code, Bookmark, Check, ArrowRight, Sparkles, Bike, Zap, Video as VideoIcon,
  Youtube, ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

interface VideoComparisonToolProps {
  initialVideoIds?: string[];
  onSelectVideoDetail?: (videoId: string) => void;
}

export const VideoComparisonTool: React.FC<VideoComparisonToolProps> = ({
  initialVideoIds = ['ash_vid_01', 'ash_vid_02'],
  onSelectVideoDetail
}) => {
  const { user, saveComparison } = useAuthAndSync();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialVideoIds);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [showSqlQuery, setShowSqlQuery] = useState<boolean>(false);

  const selectedVideos: Video[] = selectedIds
    .map((id) => VIDEOS.find((v) => v.video_id === id))
    .filter(Boolean) as Video[];

  const handleAddVideo = (videoId: string) => {
    if (!selectedIds.includes(videoId) && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, videoId]);
    }
  };

  const handleRemoveVideo = (videoId: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((id) => id !== videoId));
    }
  };

  const handlePresetSelect = (presetIds: string[]) => {
    setSelectedIds(presetIds);
  };

  const handleSaveToProfile = () => {
    saveComparison(selectedIds);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  // Generate normalized retention timeline comparison (0% to 100% video progress)
  const normalizedRetentionData = [0, 10, 25, 40, 50, 65, 80, 90, 100].map((pctProgress) => {
    const row: Record<string, any> = { progress: `${pctProgress}%` };

    selectedVideos.forEach((v) => {
      // Find approximate retention point based on percentage of video length
      const curve = v.retention_curve;
      if (curve && curve.length > 0) {
        const totalSecs = v.duration_seconds;
        const targetSec = (pctProgress / 100) * totalSecs;

        // Closest point in curve
        let closest = curve[0];
        let minDiff = Math.abs(closest.second - targetSec);
        for (const pt of curve) {
          const diff = Math.abs(pt.second - targetSec);
          if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
          }
        }
        row[v.video_id] = closest ? closest.pct_retention : v.retention_pct;
      } else {
        row[v.video_id] = v.retention_pct;
      }
    });

    return row;
  });

  const getMetricWinner = (metricKey: keyof Video) => {
    if (selectedVideos.length === 0) return null;
    let winner = selectedVideos[0];
    let maxVal = Number(winner[metricKey]) || 0;

    for (let i = 1; i < selectedVideos.length; i++) {
      const val = Number(selectedVideos[i][metricKey]) || 0;
      if (val > maxVal) {
        maxVal = val;
        winner = selectedVideos[i];
      }
    }
    return winner.video_id;
  };

  const colors = ['#f97316', '#06b6d4', '#eab308'];

  // Generated DBMS SQL comparison query
  const generatedSql = `SELECT 
    v.video_id,
    v.title,
    v.category,
    v.bike_model,
    v.views,
    v.likes,
    v.comments,
    v.retention_pct,
    v.watch_time_hours,
    v.velocity_views_per_hr,
    ROUND(CAST(v.likes + v.comments AS FLOAT) / NULLIF(v.views, 0) * 100, 2) AS engagement_rate_pct,
    ROUND(v.estimated_revenue_usd, 2) AS ad_yield_usd
FROM fact_video_metrics v
WHERE v.video_id IN (${selectedIds.map((id) => `'${id}'`).join(', ')})
ORDER BY v.views DESC;`;

  return (
    <div className="space-y-6" id="video-comparison-tool-root">
      {/* Header & Controls */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-400" />
                Multi-Video Comparative Analytics Workbench
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedVideos.length} / 3 COMPARED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Side-by-side performance differential, audience retention curves, and engagement breakdown
            </p>
          </div>

          {/* Preset Buttons & Save */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handlePresetSelect(['ash_vid_adv_01', 'ash_vid_adv_02'])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-300 transition"
            >
              🏔️ NC Adventure Series
            </button>
            <button
              onClick={() => handlePresetSelect(['ash_vid_01', 'ash_vid_02'])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition"
            >
              🏍️ R1M vs Panigale V4
            </button>
            <button
              onClick={() => handlePresetSelect(['ash_vid_04', 'ash_vid_07', 'ash_vid_10'])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition"
            >
              ⚡ Shorts Trio
            </button>
            <button
              onClick={() => handlePresetSelect(['ash_vid_03', 'ash_vid_06'])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition"
            >
              🎥 Canyon Vlogs
            </button>
            <button
              onClick={handleSaveToProfile}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              id="save-comparison-btn"
            >
              {savedStatus ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{savedStatus ? 'Saved & Synced!' : 'Sync Comparison'}</span>
            </button>
          </div>
        </div>

        {/* Video Selector Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-mono text-slate-400 flex-shrink-0">Add to Compare:</span>
          {VIDEOS.filter((v) => !selectedIds.includes(v.video_id)).map((v) => (
            <button
              key={v.video_id}
              onClick={() => handleAddVideo(v.video_id)}
              disabled={selectedIds.length >= 3}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 transition whitespace-nowrap disabled:opacity-40"
            >
              <Plus className="w-3 h-3 text-orange-400" />
              <span className="truncate max-w-[140px]">{v.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Video Cards Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-${selectedVideos.length} gap-4`}>
        {selectedVideos.map((video, idx) => {
          const color = colors[idx % colors.length];
          const isViewsWinner = getMetricWinner('views') === video.video_id;
          const isRetentionWinner = getMetricWinner('retention_pct') === video.video_id;
          const isWatchTimeWinner = getMetricWinner('watch_time_hours') === video.video_id;
          const isVelocityWinner = getMetricWinner('velocity_views_per_hr') === video.video_id;

          return (
            <div
              key={video.video_id}
              className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group"
              style={{ borderTopColor: color, borderTopWidth: '4px' }}
            >
              <div>
                {/* Header with Remove & Details action */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Slot {idx + 1}
                    </span>
                  </div>

                  {selectedVideos.length > 1 && (
                    <button
                      onClick={() => handleRemoveVideo(video.video_id)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
                      title="Remove from comparison"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Thumbnail & Title */}
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-slate-900 border border-slate-800">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                    {video.bike_model}
                  </div>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                    {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 mb-4 group-hover:text-amber-300 transition">
                  {video.title}
                </h4>

                {/* Metrics Breakdown Table */}
                <div className="space-y-2 text-xs font-mono">
                  {/* Views */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    isViewsWinner ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-900/60 border-slate-800/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {isViewsWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      Views:
                    </span>
                    <span className={`font-bold ${isViewsWinner ? 'text-orange-400' : 'text-white'}`}>
                      {video.views.toLocaleString()}
                    </span>
                  </div>

                  {/* Retention % */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    isRetentionWinner ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {isRetentionWinner && <Trophy className="w-3.5 h-3.5 text-emerald-400" />}
                      Retention %:
                    </span>
                    <span className={`font-bold ${isRetentionWinner ? 'text-emerald-400' : 'text-white'}`}>
                      {video.retention_pct}%
                    </span>
                  </div>

                  {/* Watch Hours */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    isWatchTimeWinner ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/60 border-slate-800/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {isWatchTimeWinner && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                      Watch Time:
                    </span>
                    <span className={`font-bold ${isWatchTimeWinner ? 'text-amber-300' : 'text-white'}`}>
                      {video.watch_time_hours.toLocaleString()} hrs
                    </span>
                  </div>

                  {/* Velocity */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border ${
                    isVelocityWinner ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-900/60 border-slate-800/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      {isVelocityWinner && <Trophy className="w-3.5 h-3.5 text-red-400" />}
                      Live Velocity:
                    </span>
                    <span className={`font-bold ${isVelocityWinner ? 'text-red-400' : 'text-white'}`}>
                      +{video.velocity_views_per_hr.toLocaleString()}/hr
                    </span>
                  </div>

                  {/* Engagement Rate */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-400">Engagement Rate:</span>
                    <span className="font-bold text-cyan-400">
                      {(((video.likes + video.comments) / video.views) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center gap-2">
                <a
                  href={video.youtube_url || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                >
                  <Youtube className="w-3 h-3 text-red-500" />
                  <span>YouTube</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
                {onSelectVideoDetail && (
                  <button
                    onClick={() => onSelectVideoDetail(video.video_id)}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
                  >
                    <span>Full Telemetry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Synchronized Multi-Video Retention Curve Overlay */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Synchronized Audience Retention Curve Overlay
            </h4>
            <p className="text-xs text-slate-400">
              Comparative viewer drop-off trajectories normalized across duration (0% start to 100% end screen)
            </p>
          </div>

          <button
            onClick={() => setShowSqlQuery(!showSqlQuery)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-xs font-mono text-cyan-400 flex items-center gap-1.5 transition"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showSqlQuery ? 'Hide SQL Query' : 'View DBMS SQL Differential'}</span>
          </button>
        </div>

        {/* SQL viewer */}
        {showSqlQuery && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-cyan-400">
              <span>SQL Query Plan: Multi-Video Aggregation Differential</span>
              <span className="text-slate-400">Execution: 1.8ms (Index Seek)</span>
            </div>
            <pre className="text-emerald-300 overflow-x-auto p-2 bg-slate-900/80 rounded border border-slate-800">
              {generatedSql}
            </pre>
          </div>
        )}

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedRetentionData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="progress" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[30, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#0b111e]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs font-mono">
                        <div className="text-slate-400 font-bold mb-1">Progress: {label}</div>
                        {payload.map((p: any) => {
                          const v = selectedVideos.find((vid) => vid.video_id === p.dataKey);
                          return (
                            <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
                              <span className="truncate max-w-[180px]" style={{ color: p.color }}>
                                {v?.title || p.dataKey}:
                              </span>
                              <span className="font-bold text-white">{p.value}%</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {selectedVideos.map((v, i) => (
                <Line
                  key={v.video_id}
                  type="monotone"
                  dataKey={v.video_id}
                  name={v.title.substring(0, 30) + '...'}
                  stroke={colors[i % colors.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
