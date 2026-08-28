import React, { useState } from 'react';
import { MONTHLY_GROWTH_DATA } from '../data/mockDbmsData';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, BarChart, Bar, LineChart, Line, Legend, RadarChart, 
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { Flame, TrendingUp, Sparkles, DollarSign, Clock, Users, Layers, Activity } from 'lucide-react';

export const InteractiveGrowthCharts: React.FC = () => {
  const [metricMode, setMetricMode] = useState<'views_split' | 'subs' | 'watch_time' | 'revenue'>('views_split');

  // Category radar data
  const categoryRadarData = [
    { subject: 'Avg Retention %', bikeReviews: 68.4, vlogs: 65.2, shorts: 96.5 },
    { subject: 'Monetization CPM ($)', bikeReviews: 74.5, vlogs: 62.0, shorts: 18.5 },
    { subject: 'Avg Watch Duration', bikeReviews: 82.0, vlogs: 71.0, shorts: 25.0 },
    { subject: 'Viral Velocity', bikeReviews: 45.0, vlogs: 40.0, shorts: 95.0 },
    { subject: 'CTR Click %', bikeReviews: 65.0, vlogs: 70.0, shorts: 92.0 },
    { subject: 'Comment Density', bikeReviews: 55.0, vlogs: 85.0, shorts: 60.0 },
  ];

  // Hourly velocity stream for last 24h
  const hourlyVelocityData = [
    { hour: '00:00', views: 320, spike: false },
    { hour: '02:00', views: 240, spike: false },
    { hour: '04:00', views: 190, spike: false },
    { hour: '06:00', views: 410, spike: false },
    { hour: '08:00', views: 890, spike: false },
    { hour: '10:00', views: 1420, spike: false },
    { hour: '12:00', views: 2150, spike: true },
    { hour: '14:00', views: 3400, spike: true },
    { hour: '16:00', views: 4850, spike: true }, // Peak shorts explosion
    { hour: '18:00', views: 5400, spike: true },
    { hour: '20:00', views: 4200, spike: true },
    { hour: '22:00', views: 2600, spike: false },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b111e]/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-mono">
          <div className="text-slate-300 font-bold mb-2 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-orange-400">AshRides26 DBMS</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">
                {entry.name.includes('Revenue') ? `$${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="growth-charts-section">
      {/* Top Header & Chart Mode Switcher */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Monthly Channel Growth Trends & Content Mix
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                12-MONTH DBMS TIME-SERIES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive trend tracking across bike reviews, motovlogs, and short-form video releases
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setMetricMode('views_split')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                metricMode === 'views_split'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Split</span>
            </button>
            <button
              onClick={() => setMetricMode('subs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                metricMode === 'subs'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Subscribers</span>
            </button>
            <button
              onClick={() => setMetricMode('watch_time')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                metricMode === 'watch_time'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Watch Hours</span>
            </button>
            <button
              onClick={() => setMetricMode('revenue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                metricMode === 'revenue'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Revenue ($)</span>
            </button>
          </div>
        </div>

        {/* Primary Interactive Chart */}
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {metricMode === 'views_split' ? (
              <AreaChart data={MONTHLY_GROWTH_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bikeReviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="vlogGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="shortsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="bike_review_views" name="Bike Reviews" stackId="1" stroke="#f97316" fill="url(#bikeReviewGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="vlog_views" name="Motovlogs" stackId="1" stroke="#06b6d4" fill="url(#vlogGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="shorts_views" name="Shorts" stackId="1" stroke="#eab308" fill="url(#shortsGrad)" strokeWidth={2} />
              </AreaChart>
            ) : metricMode === 'subs' ? (
              <BarChart data={MONTHLY_GROWTH_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `+${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="subscribers_gained" name="Net Subscribers Gained" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : metricMode === 'watch_time' ? (
              <LineChart data={MONTHLY_GROWTH_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="watch_time_hours" name="Watch Hours" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            ) : (
              <AreaChart data={MONTHLY_GROWTH_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue_est" name="Estimated Revenue ($)" stroke="#06b6d4" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Column: Category Radar & 24h Hourly Velocity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar: Cross-Category Benchmark */}
        <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Category Performance Matrix (Radar)
              </h4>
              <span className="text-[11px] font-mono text-slate-400">Normalized Scale 0-100</span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-dimensional trade-off: Bike Reviews excel in CPM & duration; Shorts dominate viral velocity & retention.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={categoryRadarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                <Radar name="Bike Reviews" dataKey="bikeReviews" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                <Radar name="Motovlogs" dataKey="vlogs" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                <Radar name="Shorts" dataKey="shorts" stroke="#eab308" fill="#eab308" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-Hour Hourly Viral Velocity Wave */}
        <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                24-Hour Live Velocity Wave (/hr)
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PEAK: 5,400/HR
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live traffic flow tracking algorithmic surges during US evening & EU midday peak periods
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="views" 
                  name="Views per Hour" 
                  fill="#f97316"
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
