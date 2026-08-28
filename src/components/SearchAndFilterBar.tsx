import React, { useState } from 'react';
import { FilterState, VideoCategory } from '../types/database';
import { CHANNELS } from '../data/mockDbmsData';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Calendar, 
  Bike, Video as VideoIcon, Zap, LayoutGrid, Table2, Globe2, X, Sparkles 
} from 'lucide-react';

interface SearchAndFilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  totalVideosCount: number;
  filteredCount: number;
  onSelectChannel?: (channelId: string) => void;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  filter,
  setFilter,
  viewMode,
  setViewMode,
  totalVideosCount,
  filteredCount,
  onSelectChannel
}) => {
  const [showBikeFilter, setShowBikeFilter] = useState(false);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);

  const bikePresets = [
    'All Bikes',
    'Yamaha YZF-R1M',
    'Kawasaki Ninja ZX-10R',
    'Ducati Panigale V4 S',
    'BMW S1000RR',
    'KTM 890 Duke R',
    'Aprilia RSV4 Factory 1100',
    'Honda CBR1000RR-R'
  ];

  // Channel search matching
  const matchingChannels = filter.searchQuery.trim().length >= 2
    ? CHANNELS.filter((c) =>
        c.name.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        c.handle.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        c.primary_bike.toLowerCase().includes(filter.searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4" id="search-filter-hub">
      {/* Top Search Bar & View Mode Toggles */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search motovlogs, exhaust sound tests, bike models (e.g., Panigale V4, R1M), tags, or discover other channels..."
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition shadow-inner"
            id="video-search-input"
          />
          {filter.searchQuery && (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete / Channel Discovery Dropdown */}
          {matchingChannels.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#0d1527] border border-orange-500/30 rounded-xl shadow-2xl p-2 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-orange-400 px-2 py-1 flex items-center justify-between">
                <span>Matching Motovlog Channels in DBMS:</span>
                <span className="text-slate-400">{matchingChannels.length} found</span>
              </div>
              {matchingChannels.map((ch) => (
                <div
                  key={ch.channel_id}
                  onClick={() => {
                    if (onSelectChannel) onSelectChannel(ch.channel_id);
                    setFilter((prev) => ({ ...prev, searchQuery: ch.name }));
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={ch.avatar_url} alt={ch.name} className="w-6 h-6 rounded-full object-cover" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{ch.name}</span>
                        {ch.is_primary && (
                          <span className="text-[9px] bg-orange-500 text-white font-mono px-1 rounded">THIS CHANNEL</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ch.handle} • {(ch.subscribers / 1000).toFixed(0)}k Subs • {ch.primary_bike}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-400">View Benchmark →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Mode & Video Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <div className="text-xs text-slate-400 font-mono">
            Showing <span className="font-bold text-amber-400">{filteredCount}</span> of {totalVideosCount} videos
          </div>

          <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid Card View"
              id="view-mode-grid-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="DBMS Table View"
              id="view-mode-table-btn"
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Content', icon: Sparkles },
            { id: 'bike_review', label: 'Bike Reviews', icon: Bike },
            { id: 'vlog', label: 'Motovlogs', icon: VideoIcon },
            { id: 'shorts', label: 'Short-Form / Shorts', icon: Zap }
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = filter.category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilter((prev) => ({ ...prev, category: cat.id as any }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
                id={`filter-cat-${cat.id}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Range & Metric Sorters */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Upload Date Range */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter((prev) => ({ ...prev, dateRange: e.target.value as any }))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              id="filter-date-select"
            >
              <option value="all" className="bg-slate-900">All Upload Dates</option>
              <option value="7d" className="bg-slate-900">Last 7 Days</option>
              <option value="30d" className="bg-slate-900">Last 30 Days</option>
              <option value="90d" className="bg-slate-900">Last 90 Days</option>
              <option value="1y" className="bg-slate-900">Past 1 Year</option>
            </select>
          </div>

          {/* Metric Sort By */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              id="filter-sort-select"
            >
              <option value="views" className="bg-slate-900">Highest Views</option>
              <option value="retention_pct" className="bg-slate-900">Top Retention %</option>
              <option value="velocity_views_per_hr" className="bg-slate-900">Viral Velocity (views/hr)</option>
              <option value="watch_time_hours" className="bg-slate-900">Total Watch Time</option>
              <option value="likes" className="bg-slate-900">Most Likes</option>
              <option value="comments" className="bg-slate-900">Most Comments</option>
              <option value="upload_date" className="bg-slate-900">Newest Upload</option>
            </select>
          </div>

          {/* Bike Model Pill Filter Toggle */}
          <button
            onClick={() => setShowBikeFilter(!showBikeFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              filter.bikeFilter
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            id="filter-bike-toggle"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>{filter.bikeFilter || 'Bike Model'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Bike Model Selector */}
      {showBikeFilter && (
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 flex-shrink-0">Filter by Bike:</span>
          {bikePresets.map((b) => (
            <button
              key={b}
              onClick={() => {
                setFilter((prev) => ({ ...prev, bikeFilter: b === 'All Bikes' ? '' : b }));
                if (b === 'All Bikes') setShowBikeFilter(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition whitespace-nowrap ${
                (b === 'All Bikes' && !filter.bikeFilter) || filter.bikeFilter === b
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
