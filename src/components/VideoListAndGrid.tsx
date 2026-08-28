import React from 'react';
import { Video } from '../types/database';
import { VideoCard } from './VideoCard';
import { 
  Eye, Percent, Clock, Heart, MessageSquare, Flame, 
  Layers, Bookmark, Check, ArrowUpRight, Bike, Zap, Video as VideoIcon, Sparkles 
} from 'lucide-react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';

interface VideoListAndGridProps {
  videos: Video[];
  viewMode: 'grid' | 'table';
  onSelectVideo: (videoId: string) => void;
  onCompareVideo: (videoId: string) => void;
}

export const VideoListAndGrid: React.FC<VideoListAndGridProps> = ({
  videos,
  viewMode,
  onSelectVideo,
  onCompareVideo
}) => {
  const { isVideoSaved, toggleSaveVideo } = useAuthAndSync();

  if (videos.length === 0) {
    return (
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-12 text-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Eye className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">No Videos Match Selected Filters</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
          Try adjusting your search query, switching categories, or resetting the bike model filter.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="video-grid-container">
        {videos.map((video) => (
          <VideoCard
            key={video.video_id}
            video={video}
            onSelectVideo={onSelectVideo}
            onCompareVideo={onCompareVideo}
          />
        ))}
      </div>
    );
  }

  // Relational Table View
  return (
    <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden" id="video-dbms-table-container">
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
            fact_video_metrics Relational Grid
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {videos.length} RECORDS LOADED
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">PK / Video</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Bike Model</th>
              <th className="px-4 py-3 text-right">Views</th>
              <th className="px-4 py-3 text-right">Retention %</th>
              <th className="px-4 py-3 text-right">Watch Time</th>
              <th className="px-4 py-3 text-right">Velocity</th>
              <th className="px-4 py-3 text-right">Likes</th>
              <th className="px-4 py-3 text-right">CPM ($)</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {videos.map((v, i) => {
              const isSaved = isVideoSaved(v.video_id);
              return (
                <tr
                  key={v.video_id}
                  className="hover:bg-slate-800/40 transition group cursor-pointer"
                  onClick={() => onSelectVideo(v.video_id)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        className="w-12 h-8 rounded object-cover flex-shrink-0 bg-slate-900 border border-slate-700"
                      />
                      <div className="min-w-0 max-w-xs">
                        <div className="text-white font-bold truncate group-hover:text-amber-300 font-sans text-xs">
                          {v.title}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {v.video_id} • {v.upload_date}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.category === 'bike_review' ? 'bg-orange-500/20 text-orange-400' :
                      v.category === 'vlog' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {v.category.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                    {v.bike_model}
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-white whitespace-nowrap">
                    {v.views.toLocaleString()}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`font-bold ${
                      v.retention_pct >= 75 ? 'text-emerald-400' :
                      v.retention_pct >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {v.retention_pct}%
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right text-slate-300 whitespace-nowrap">
                    {v.watch_time_hours.toLocaleString()} hrs
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-orange-400 whitespace-nowrap">
                    +{v.velocity_views_per_hr}/hr
                  </td>

                  <td className="px-4 py-3.5 text-right text-slate-300 whitespace-nowrap">
                    {v.likes.toLocaleString()}
                  </td>

                  <td className="px-4 py-3.5 text-right text-cyan-300 font-bold whitespace-nowrap">
                    ${v.cpm_usd.toFixed(2)}
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => toggleSaveVideo(v.video_id)}
                        className={`p-1.5 rounded transition ${
                          isSaved ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Bookmark"
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onCompareVideo(v.video_id)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 transition"
                        title="Compare"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectVideo(v.video_id)}
                        className="p-1.5 text-slate-400 hover:text-orange-400 transition"
                        title="View Telemetry"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
