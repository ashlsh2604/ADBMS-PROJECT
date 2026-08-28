import React from 'react';
import { Video } from '../types/database';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Eye, Percent, Clock, Heart, MessageSquare, Flame, 
  Layers, Bookmark, Check, ArrowUpRight, Bike, Zap, Video as VideoIcon 
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onSelectVideo: (videoId: string) => void;
  onCompareVideo: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelectVideo,
  onCompareVideo
}) => {
  const { isVideoSaved, toggleSaveVideo } = useAuthAndSync();
  const isSaved = isVideoSaved(video.video_id);

  const getCategoryBadge = () => {
    switch (video.category) {
      case 'bike_review':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Bike className="w-3 h-3" />
            <span>Bike Review</span>
          </span>
        );
      case 'vlog':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <VideoIcon className="w-3 h-3" />
            <span>Motovlog</span>
          </span>
        );
      case 'shorts':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Zap className="w-3 h-3" />
            <span>Shorts</span>
          </span>
        );
    }
  };

  const getRetentionColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (pct >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div 
      className="bg-[#0e1424] border border-slate-800/90 hover:border-orange-500/40 rounded-2xl p-4 transition duration-200 shadow-xl flex flex-col justify-between group"
      id={`video-card-${video.video_id}`}
    >
      <div>
        {/* Thumbnail Container */}
        <div 
          onClick={() => onSelectVideo(video.video_id)}
          className="relative aspect-video rounded-xl overflow-hidden mb-3.5 bg-slate-900 cursor-pointer"
        >
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Top Chips */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            {getCategoryBadge()}
            {video.is_trending && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-md animate-pulse">
                <Flame className="w-3 h-3" />
                <span>HOT</span>
              </span>
            )}
          </div>

          {/* Bottom Duration & Bike Model */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono text-white">
            <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 truncate max-w-[170px]">
              {video.bike_model}
            </span>
            <span className="bg-black/90 px-1.5 py-0.5 rounded font-bold">
              {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 
          onClick={() => onSelectVideo(video.video_id)}
          className="text-xs sm:text-sm font-bold text-white line-clamp-2 mb-3 cursor-pointer group-hover:text-amber-300 transition"
          title={video.title}
        >
          {video.title}
        </h4>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
          {/* Views */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3 text-orange-400" />
              Views:
            </span>
            <span className="font-bold text-white">{(video.views / 1000).toFixed(0)}k</span>
          </div>

          {/* Retention */}
          <div className={`p-2 rounded-lg border flex items-center justify-between ${getRetentionColor(video.retention_pct)}`}>
            <span className="flex items-center gap-1">
              <Percent className="w-3 h-3" />
              Ret.:
            </span>
            <span className="font-bold">{video.retention_pct}%</span>
          </div>

          {/* Watch Time */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Hours:
            </span>
            <span className="font-bold text-slate-200">{(video.watch_time_hours / 1000).toFixed(1)}k</span>
          </div>

          {/* Live Velocity */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-red-400" />
              Veloc.:
            </span>
            <span className="font-bold text-orange-400">+{video.velocity_views_per_hr}/h</span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSaveVideo(video.video_id)}
            className={`p-1.5 rounded-lg border transition ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
            }`}
            title={isSaved ? 'Bookmarked to sync profile' : 'Bookmark video'}
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onCompareVideo(video.video_id)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 transition"
            title="Add to Comparison Workbench"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onSelectVideo(video.video_id)}
          className="flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
        >
          <span>Deep Telemetry</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
