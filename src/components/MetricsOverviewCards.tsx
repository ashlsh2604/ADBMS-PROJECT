import React from 'react';
import { Video } from '../types/database';
import { 
  Eye, Percent, Clock, Heart, Flame, DollarSign, TrendingUp, 
  Bike, Video as VideoIcon, Zap, Award, BarChart2 
} from 'lucide-react';

interface MetricsOverviewCardsProps {
  videos: Video[];
  onSelectCategoryFilter?: (cat: string) => void;
}

export const MetricsOverviewCards: React.FC<MetricsOverviewCardsProps> = ({
  videos,
  onSelectCategoryFilter
}) => {
  // Aggregate metrics from current dataset
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalLikes = videos.reduce((acc, v) => acc + v.likes, 0);
  const totalComments = videos.reduce((acc, v) => acc + v.comments, 0);
  const totalWatchHours = videos.reduce((acc, v) => acc + v.watch_time_hours, 0);
  const avgRetention = videos.length > 0 ? (videos.reduce((acc, v) => acc + v.retention_pct, 0) / videos.length).toFixed(1) : '0';
  const totalVelocity = videos.reduce((acc, v) => acc + v.velocity_views_per_hr, 0);
  const totalEstimatedRevenue = videos.reduce((acc, v) => acc + v.estimated_revenue_usd, 0);
  const engagementRate = totalViews > 0 ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2) : '0';

  // Category counts
  const bikeReviewsCount = videos.filter((v) => v.category === 'bike_review').length;
  const vlogsCount = videos.filter((v) => v.category === 'vlog').length;
  const shortsCount = videos.filter((v) => v.category === 'shorts').length;

  return (
    <div className="space-y-4" id="metrics-overview-cockpit">
      {/* Top Telemetry Header Ribbon */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300 font-semibold uppercase tracking-wider">DBMS Telemetry Stream</span>
          <span className="hidden sm:inline">• Live DB Pipeline: 60fps</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>Benchmarked against 6 Peer Motovlog Channels</span>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Views */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-orange-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Video Views</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight mb-1">
            {(totalViews / 1000000).toFixed(2)}M
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.8% vs last month</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Avg Retention % */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-emerald-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Avg Retention %</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight mb-1">
            {avgRetention}%
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              HIGH OCTANE
            </span>
            <span>(Industry: 52%)</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Total Watch Time */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-amber-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Watch Hours</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight mb-1">
            {(totalWatchHours / 1000).toFixed(1)}k hrs
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+22.4% MoM Lift</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Engagement Rate */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-rose-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Engagement Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight mb-1">
            {engagementRate}%
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {(totalLikes / 1000).toFixed(0)}k likes • {(totalComments / 1000).toFixed(1)}k comments
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Viral Velocity */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-orange-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Viral Velocity</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-orange-400 font-mono tracking-tight mb-1">
            +{totalVelocity.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/hr</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
            <span>🔥 4 videos in viral spike</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Est. Monetization Yield */}
        <div className="bg-[#0e1424] border border-slate-800/90 hover:border-cyan-500/40 rounded-2xl p-4 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Est. Monetization</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono tracking-tight mb-1">
            ${(totalEstimatedRevenue).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Avg RPM: <span className="text-white font-bold">$7.24</span> (Superbike Niche)
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>
      </div>

      {/* Category Performance Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div 
          onClick={() => onSelectCategoryFilter && onSelectCategoryFilter('bike_review')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-orange-950/20 border border-slate-800 hover:border-orange-500/40 cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">🏍️ Bike Reviews ({bikeReviewsCount})</div>
              <div className="text-[11px] text-slate-400 font-mono">Highest CPM ($7.45) • 68.2% Avg Retention</div>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-orange-400">3.75M Views</div>
            <div className="text-[10px] text-slate-500">62% Watch Time</div>
          </div>
        </div>

        <div 
          onClick={() => onSelectCategoryFilter && onSelectCategoryFilter('vlog')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/20 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <VideoIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">🎥 Canyon & Garage Vlogs ({vlogsCount})</div>
              <div className="text-[11px] text-slate-400 font-mono">Highest Comments (4.2k/vid) • 65.5% Retention</div>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-cyan-400">2.82M Views</div>
            <div className="text-[10px] text-slate-500">26% Watch Time</div>
          </div>
        </div>

        <div 
          onClick={() => onSelectCategoryFilter && onSelectCategoryFilter('shorts')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">⚡ Short-Form / Shorts ({shortsCount})</div>
              <div className="text-[11px] text-slate-400 font-mono">Peak Viral Retention (96.5%) • Top Subscriber Driver</div>
            </div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-amber-400">10.2M Views</div>
            <div className="text-[10px] text-slate-500">12% Watch Time</div>
          </div>
        </div>
      </div>
    </div>
  );
};
