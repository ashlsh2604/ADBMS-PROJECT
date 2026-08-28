import React, { useState } from 'react';
import { Video } from '../types/database';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  X, Eye, Percent, Clock, Heart, MessageSquare, Flame, 
  TrendingUp, Sparkles, Bookmark, Check, Share2, Bike, Volume2, Database, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceDot 
} from 'recharts';

interface VideoDetailModalProps {
  video: Video | null;
  onClose: () => void;
  onCompareVideo?: (videoId: string) => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  video,
  onClose,
  onCompareVideo
}) => {
  const { isVideoSaved, toggleSaveVideo } = useAuthAndSync();
  const [activeTab, setActiveTab] = useState<'retention' | 'sources' | 'dbms_record'>('retention');

  if (!video) return null;

  const isSaved = isVideoSaved(video.video_id);

  // Traffic sources data simulation based on category
  const trafficSources = video.category === 'shorts' ? [
    { name: 'Shorts Feed', pct: 78.4, views: Math.floor(video.views * 0.784) },
    { name: 'YouTube Search', pct: 12.1, views: Math.floor(video.views * 0.121) },
    { name: 'Channel Pages', pct: 6.2, views: Math.floor(video.views * 0.062) },
    { name: 'External & Social', pct: 3.3, views: Math.floor(video.views * 0.033) },
  ] : [
    { name: 'YouTube Search', pct: 44.2, views: Math.floor(video.views * 0.442) },
    { name: 'Suggested Videos', pct: 34.6, views: Math.floor(video.views * 0.346) },
    { name: 'Browse Features', pct: 14.8, views: Math.floor(video.views * 0.148) },
    { name: 'External (Reddit / Forums)', pct: 6.4, views: Math.floor(video.views * 0.064) },
  ];

  const CustomRetentionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const mins = Math.floor(data.second / 60);
      const secs = (data.second % 60).toString().padStart(2, '0');

      return (
        <div className="bg-[#0b111e]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="text-orange-400 font-bold mb-1">
            Time: {mins}:{secs} ({data.second}s)
          </div>
          <div className="text-white font-semibold">
            Retention: <span className="text-emerald-400">{data.pct_retention}%</span>
          </div>
          {data.chapter_name && (
            <div className="text-slate-300 text-[11px] mt-1 pt-1 border-t border-slate-800">
              📌 {data.chapter_name}
            </div>
          )}
          {data.note && (
            <div className="text-amber-300 text-[10px] mt-0.5">
              🔥 {data.note}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="video-detail-modal-root">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0c1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {video.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {video.video_id}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Uploaded: {video.upload_date}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {video.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => toggleSaveVideo(video.video_id)}
              className={`p-2 rounded-lg border transition ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title={isSaved ? 'Bookmarked & Synced' : 'Bookmark to Account'}
              id="detail-save-video-btn"
            >
              {isSaved ? <Check className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
            </button>

            {onCompareVideo && (
              <button
                onClick={() => {
                  onCompareVideo(video.video_id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
                id="detail-compare-action-btn"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Compare</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              id="detail-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center font-mono">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Views</div>
              <div className="text-base font-bold text-white">{video.views.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Retention %</div>
              <div className="text-base font-bold text-emerald-400">{video.retention_pct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Watch Hours</div>
              <div className="text-base font-bold text-amber-300">{video.watch_time_hours.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Likes & Comments</div>
              <div className="text-base font-bold text-rose-400">{(video.likes / 1000).toFixed(1)}k / {video.comments.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Live Velocity</div>
              <div className="text-base font-bold text-orange-400">+{video.velocity_views_per_hr}/hr</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Est. Revenue</div>
              <div className="text-base font-bold text-cyan-300">${video.estimated_revenue_usd.toLocaleString()}</div>
            </div>
          </div>

          {/* Motovlog Bike & Exhaust Hardware Specs */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400">Featured Motorcycle:</span>
              <span className="font-bold text-white font-mono">{video.bike_model}</span>
            </div>
            {video.audio_sound_profile && (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Acoustic Setup:</span>
                <span className="font-semibold text-cyan-300 font-mono">{video.audio_sound_profile}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('retention')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'retention'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Audience Retention Timeline & Moments
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'sources'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Traffic Ingestion Sources
            </button>
            <button
              onClick={() => setActiveTab('dbms_record')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                activeTab === 'dbms_record'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              DBMS Normalized Row Inspector
            </button>
          </div>

          {/* Tab 1: Retention Timeline */}
          {activeTab === 'retention' && (
            <div className="space-y-4">
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={video.retention_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="detailRetentionGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="second"
                      stroke="#64748b"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      tickFormatter={(sec) => {
                        const m = Math.floor(sec / 60);
                        const s = (sec % 60).toString().padStart(2, '0');
                        return `${m}:${s}`;
                      }}
                    />
                    <YAxis domain={[30, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomRetentionTooltip />} />
                    <Area type="monotone" dataKey="pct_retention" name="Retention %" stroke="#10b981" fill="url(#detailRetentionGrad)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Key Chapters & Anomaly Moments */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Key Chapter Benchmarks & Replay Hotspots:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {video.retention_curve.map((pt, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 font-mono ${
                        pt.is_spike_point
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                          : pt.is_drop_point
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px]">
                          {Math.floor(pt.second / 60)}:{(pt.second % 60).toString().padStart(2, '0')}
                        </span>
                        <span className="truncate">{pt.chapter_name}</span>
                      </div>
                      <span className="font-bold flex-shrink-0">{pt.pct_retention}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Traffic Sources */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              {trafficSources.map((src) => (
                <div key={src.name} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{src.name}</span>
                    <span className="text-orange-400 font-semibold">{src.pct}% ({src.views.toLocaleString()} views)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                      style={{ width: `${src.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: DBMS Row Inspector */}
          {activeTab === 'dbms_record' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-cyan-300">
                <span className="text-slate-400">TABLE:</span> fact_video_metrics (PK: {video.video_id})
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                <pre>{JSON.stringify(video, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
