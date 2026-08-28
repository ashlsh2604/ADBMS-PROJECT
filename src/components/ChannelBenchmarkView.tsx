import React, { useState } from 'react';
import { Channel } from '../types/database';
import { CHANNELS } from '../data/mockDbmsData';
import { 
  Globe2, Users, Eye, Video, TrendingUp, Award, 
  CheckCircle2, Search, ArrowRight, Sparkles, Bike, ShieldCheck, Database 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

interface ChannelBenchmarkViewProps {
  onSelectChannelFilter?: (channelId: string) => void;
}

export const ChannelBenchmarkView: React.FC<ChannelBenchmarkViewProps> = ({
  onSelectChannelFilter
}) => {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('chase_on_two_wheels');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const ashChannel = CHANNELS.find((c) => c.is_primary)!;
  const competitorChannel = CHANNELS.find((c) => c.channel_id === selectedCompetitorId) || CHANNELS[1];

  const filteredChannels = CHANNELS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.primary_bike.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Comparison chart data
  const comparisonData = [
    {
      metric: 'Subscribers (k)',
      AshRides26: Number((ashChannel.subscribers / 1000).toFixed(0)),
      [competitorChannel.name]: Number((competitorChannel.subscribers / 1000).toFixed(0)),
    },
    {
      metric: 'Avg Views/Video (k)',
      AshRides26: Number((ashChannel.avg_views_per_video / 1000).toFixed(0)),
      [competitorChannel.name]: Number((competitorChannel.avg_views_per_video / 1000).toFixed(0)),
    },
    {
      metric: 'Monthly Growth %',
      AshRides26: ashChannel.sub_growth_monthly_pct * 10,
      [competitorChannel.name]: competitorChannel.sub_growth_monthly_pct * 10,
    },
    {
      metric: 'Catalog Volume',
      AshRides26: ashChannel.total_videos,
      [competitorChannel.name]: competitorChannel.total_videos,
    }
  ];

  return (
    <div className="space-y-6" id="channel-benchmarking-view-root">
      {/* Header */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                Motovlog Channel Explorer & Peer Benchmarking
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MULTI-CHANNEL DBMS ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Benchmark AshRides26 video throughput, views efficiency, and subscriber momentum against established motorcycle creators
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search peer channels..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Channels Grid Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-2">
          {filteredChannels.map((ch) => {
            const isSelected = ch.channel_id === selectedCompetitorId;
            return (
              <div
                key={ch.channel_id}
                onClick={() => !ch.is_primary && setSelectedCompetitorId(ch.channel_id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative group ${
                  ch.is_primary
                    ? 'bg-gradient-to-br from-orange-950/30 via-slate-900 to-slate-900 border-orange-500/50 shadow-lg'
                    : isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {ch.is_primary && (
                  <span className="absolute top-3 right-3 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white">
                    OUR CHANNEL
                  </span>
                )}

                <div className="flex items-center gap-3 mb-2.5">
                  <img
                    src={ch.avatar_url}
                    alt={ch.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      <span>{ch.name}</span>
                      {ch.verified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{ch.handle}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-300 mb-2">
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Subscribers</div>
                    <div className="font-bold text-white">{(ch.subscribers / 1000).toFixed(0)}k</div>
                  </div>
                  <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">Avg Views/Vid</div>
                    <div className="font-bold text-amber-400">{(ch.avg_views_per_video / 1000).toFixed(0)}k</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                  <Bike className="w-3 h-3 text-orange-400 flex-shrink-0" />
                  <span className="truncate">{ch.primary_bike}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Channel Benchmark Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Comparison Head-to-Head */}
        <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Head-to-Head Benchmarking Matrix
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              AshRides26 vs {competitorChannel.name}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Subscribers */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Subscribers Scale</span>
                <span>
                  <strong className="text-orange-400">{(ashChannel.subscribers / 1000).toFixed(0)}k</strong> vs{' '}
                  <strong className="text-cyan-400">{(competitorChannel.subscribers / 1000).toFixed(0)}k</strong>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: `${(ashChannel.subscribers / (ashChannel.subscribers + competitorChannel.subscribers)) * 100}%` }}
                />
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${(competitorChannel.subscribers / (ashChannel.subscribers + competitorChannel.subscribers)) * 100}%` }}
                />
              </div>
            </div>

            {/* Average Views Per Video (Efficiency) */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Views Density / Efficiency (Avg per Video)</span>
                <span>
                  <strong className="text-orange-400">{(ashChannel.avg_views_per_video / 1000).toFixed(0)}k</strong> vs{' '}
                  <strong className="text-cyan-400">{(competitorChannel.avg_views_per_video / 1000).toFixed(0)}k</strong>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: `${(ashChannel.avg_views_per_video / (ashChannel.avg_views_per_video + competitorChannel.avg_views_per_video)) * 100}%` }}
                />
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${(competitorChannel.avg_views_per_video / (ashChannel.avg_views_per_video + competitorChannel.avg_views_per_video)) * 100}%` }}
                />
              </div>
              {ashChannel.avg_views_per_video > competitorChannel.avg_views_per_video && (
                <div className="text-[10px] text-emerald-400">
                  🔥 AshRides26 delivers +{((ashChannel.avg_views_per_video / competitorChannel.avg_views_per_video - 1) * 100).toFixed(0)}% higher views per video released!
                </div>
              )}
            </div>

            {/* Monthly Growth Velocity */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Monthly Subscriber Growth Momentum</span>
                <span>
                  <strong className="text-orange-400">+{ashChannel.sub_growth_monthly_pct}%</strong> vs{' '}
                  <strong className="text-cyan-400">+{competitorChannel.sub_growth_monthly_pct}%</strong>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full"
                  style={{ width: `${(ashChannel.sub_growth_monthly_pct / (ashChannel.sub_growth_monthly_pct + competitorChannel.sub_growth_monthly_pct)) * 100}%` }}
                />
                <div
                  className="bg-cyan-500 h-full"
                  style={{ width: `${(competitorChannel.sub_growth_monthly_pct / (ashChannel.sub_growth_monthly_pct + competitorChannel.sub_growth_monthly_pct)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Benchmark Comparison Bar Chart */}
        <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="mb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Comparative Distribution Metrics
            </h4>
            <p className="text-xs text-slate-400">
              Normalized benchmark comparing AshRides26 and {competitorChannel.name}
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b111e]/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs font-mono">
                          <div className="text-slate-300 font-bold mb-1">{label}</div>
                          {payload.map((entry: any) => (
                            <div key={entry.name} className="flex justify-between gap-4 py-0.5">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-bold text-white">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="AshRides26" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey={competitorChannel.name} fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
