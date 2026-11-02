import React, { useEffect, useState } from 'react';
import { Channel, Video, VideoCategory } from '../types/database';
import { createVideoApi, fetchChannels, fetchVideos } from '../services/api';
import { 
  Youtube, ExternalLink, Globe2, Users, Eye, Video as VideoIcon, 
  TrendingUp, Award, CheckCircle2, Search, ArrowRight, Sparkles, 
  Bike, ShieldCheck, Database, Plus, Copy, Check, Compass, 
  MapPin, Wrench, Flame, Calendar, Clock, BarChart2, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, BarChart, Bar 
} from 'recharts';

interface ChannelBenchmarkViewProps {
  onSelectChannelFilter?: (channelId: string) => void;
  onSelectVideoDetail?: (videoId: string) => void;
  onCompareVideo?: (videoId: string) => void;
  onVideoAdded?: (video: Video) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ChannelBenchmarkView: React.FC<ChannelBenchmarkViewProps> = ({
  onSelectChannelFilter,
  onSelectVideoDetail,
  onCompareVideo,
  onVideoAdded,
  onNavigateToTab,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([fetchChannels(), fetchVideos()])
      .then(([channels, loadedVideos]) => { setChannel(channels[0] || null); setVideos(loadedVideos); })
      .catch((err) => setLoadError(err?.message || 'Could not load channel data'));
  }, []);

  // New Video Form State
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoCategory, setNewVideoCategory] = useState<VideoCategory>('vlog');
  const [newVideoBike, setNewVideoBike] = useState('Adventure Sport Rig');
  const [newVideoDuration, setNewVideoDuration] = useState('25');
  const [newVideoViews, setNewVideoViews] = useState('240000');
  const [newVideoTags, setNewVideoTags] = useState('AshRides26, Adventure, Mountain Twisties, Motovlog');

  if (loadError) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{loadError}</div>;
  if (!channel) return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">Loading channel hub…</div>;
  const ashChannel = channel;

  const channelVideos = videos.filter((v) => {
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bike_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyLink = () => {
    const url = ashChannel.channel_url || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedDuration = (parseFloat(newVideoDuration) || 20) * 60;
      const parsedViews = parseInt(newVideoViews, 10) || 10000;
      const tags = newVideoTags.split(',').map((t) => t.trim()).filter(Boolean);

      const created = await createVideoApi({
        title: newVideoTitle,
        category: newVideoCategory,
        bike_model: newVideoBike,
        duration_seconds: parsedDuration,
        views: parsedViews,
        tags: tags.length ? tags : ['AshRides26', 'Motovlog'],
        youtube_url: newVideoUrl || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO',
        thumbnail_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
        upload_date: new Date().toISOString().split('T')[0],
        likes: Math.floor(parsedViews * 0.08),
        comments: Math.floor(parsedViews * 0.005),
        retention_pct: 71.2,
        watch_time_hours: Math.floor((parsedViews * parsedDuration * 0.712) / 3600),
        velocity_views_per_hr: Math.floor(parsedViews * 0.003),
      });

      if (onVideoAdded) {
        onVideoAdded(created);
      }

      setSuccessToast(`"${created.title}" successfully added to DBMS & catalog!`);
      setTimeout(() => setSuccessToast(null), 4000);

      // Reset form
      setNewVideoTitle('');
      setNewVideoUrl('');
      setShowAddVideoForm(false);
    } catch (err: any) {
      alert(`Could not create video: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retention distribution by category data
  const categorySummaryData = [
    { category: 'Adventure & Vlogs', videos: 48, avgViews: '354k', avgRetention: 72.8, fill: '#06b6d4' },
    { category: 'Superbike Reviews', videos: 54, avgViews: '412k', avgRetention: 67.4, fill: '#f97316' },
    { category: 'Trailside & Mods', videos: 26, avgViews: '286k', avgRetention: 69.1, fill: '#eab308' },
    { category: 'Shorts & Teasers', videos: 20, avgViews: '185k', avgRetention: 94.2, fill: '#ec4899' },
  ];

  return (
    <div className="space-y-6" id="channel-hub-view-root">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
        </div>
      )}

      {/* Notice Banner: Channel Exclusive Mode */}
      <div className="bg-gradient-to-r from-orange-950/40 via-[#0e1424] to-slate-900 border border-orange-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 flex-shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                Official YouTube Channel Hub: @ashrides26
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                EXCLUSIVE FOCUS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              International & peer channels removed per your request. The DBMS telemetry engine is now exclusively dedicated to your YouTube channel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <a
            href={ashChannel.channel_url || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            id="hero-open-youtube-btn"
          >
            <Youtube className="w-4 h-4" />
            <span>Open on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <button
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            id="hero-copy-link-btn"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Main Channel Banner & Hero Identity Card */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner with Motovlog imagery */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-slate-900">
          <img
            src={ashChannel.banner_url}
            alt="AshRides26 Banner"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424] via-black/40 to-black/20" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-orange-400" />
              <span>Gainesville & Mountain Passes</span>
            </span>
          </div>
        </div>

        {/* Profile Details & Metadata */}
        <div className="p-5 sm:p-6 -mt-16 sm:-mt-20 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            {/* Avatar & Channel Header */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={ashChannel.avatar_url}
                  alt={ashChannel.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#0e1424] shadow-2xl"
                />
                <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 text-white border-2 border-[#0e1424]">
                  <Youtube className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white font-['Plus_Jakarta_Sans']">
                    {ashChannel.name}
                  </h2>
                  <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Official Creator
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-slate-200 font-bold">{ashChannel.handle}</span>
                  <span>•</span>
                  <span className="text-orange-400">Motorcycle & Adventure Motovlogging</span>
                  <span>•</span>
                  <span>Joined {ashChannel.joined_date}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                id="add-video-toggle-btn"
              >
                <Plus className="w-4 h-4" />
                <span>Add / Import Video</span>
              </button>
              <a
                href="https://youtube.com/@ashrides26?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
                id="subscribe-channel-btn"
              >
                <span>Subscribe</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>

          {/* Description & Machinery Setup */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
            <div className="lg:col-span-2 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-orange-400" />
                Channel Mission & Adventure Focus
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ashChannel.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Mountain Twisties', 'Gainesville to Asheville', 'Superbike Telemetry', 'Trail Alterations', 'Helmet Audio', 'Akrapovic & SC-Project'].map((pill) => (
                  <span key={pill} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                    #{pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-amber-400" />
                Primary Machines & Rig
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Fleet:</span>
                  <span className="font-semibold text-white">Yamaha R1M & ZX-10R</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Touring:</span>
                  <span className="font-semibold text-white">Adventure Touring Rig</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Audio:</span>
                  <span className="font-semibold text-white">Sena 50S + Windslayer POV</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Channel Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-400">Subscribers</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {(ashChannel.subscribers / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">+{ashChannel.sub_growth_monthly_pct}% this mo</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-400">Total Views</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {(ashChannel.total_views / 1000000).toFixed(1)}M
                </div>
                <div className="text-[10px] text-slate-400 font-mono">100% Organic</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <VideoIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-400">Total Videos</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {ashChannel.total_videos}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">All High Res / 4K</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-mono text-slate-400">Avg Views/Video</div>
                <div className="text-base sm:text-lg font-bold text-white">
                  {(ashChannel.avg_views_per_video / 1000).toFixed(0)}k
                </div>
                <div className="text-[10px] text-amber-400 font-mono">Top 5% efficiency</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Video Form (Collapsible) */}
      {showAddVideoForm && (
        <div className="bg-[#0e1424] border border-orange-500/40 rounded-2xl p-5 shadow-2xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Add / Import Video to @ashrides26 DBMS
                </h4>
                <p className="text-xs text-slate-400">
                  Register video telemetry, duration, and performance metrics into the database
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddVideoForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateVideo} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  YouTube Video Link / URL
                </label>
                <input
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={newVideoTitle}
                  onChange={(e) => setNewVideoTitle(e.target.value)}
                  placeholder="e.g. Motorcycle Adventure: Gainesville to Asheville NC Part 2"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Category
                </label>
                <select
                  value={newVideoCategory}
                  onChange={(e) => setNewVideoCategory(e.target.value as VideoCategory)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="vlog">Motovlog / Adventure Tour</option>
                  <option value="bike_review">Bike Review / Telemetry</option>
                  <option value="shorts">YouTube Shorts</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Motorcycle Model
                </label>
                <input
                  type="text"
                  value={newVideoBike}
                  onChange={(e) => setNewVideoBike(e.target.value)}
                  placeholder="e.g. Adventure Sport Rig / Yamaha R1M"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={newVideoDuration}
                  onChange={(e) => setNewVideoDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Current Views
                </label>
                <input
                  type="number"
                  value={newVideoViews}
                  onChange={(e) => setNewVideoViews(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={newVideoTags}
                onChange={(e) => setNewVideoTags(e.target.value)}
                placeholder="AshRides26, Adventure, Mountain Twisties, Motovlog"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddVideoForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSubmitting ? 'Registering...' : 'Register Video in DBMS'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content Pillars & Milestone Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Pillars specific to AshRides26 */}
        <div className="lg:col-span-2 bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-400" />
              Official Content Pillars & Adventure Series
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              4 Core Showcases
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pillar 1: Gainesville to Asheville NC Adventure */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-cyan-500/40 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Adventure Tour Series
                </span>
                <span className="text-[10px] font-mono text-emerald-400">73.5% Ret.</span>
              </div>
              <h5 className="text-xs font-bold text-white">Gainesville to Asheville NC</h5>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Multi-part epic mountain tour through scenic passes, Blue Ridge twisties, trail alterations, and camping.
              </p>
            </div>

            {/* Pillar 2: Superbike Track & Canyon Telemetry */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-orange-500/40 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Telemetry & Apexes
                </span>
                <span className="text-[10px] font-mono text-emerald-400">97 Score</span>
              </div>
              <h5 className="text-xs font-bold text-white">Superbike Canyon & Track Tests</h5>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Yamaha R1M & ZX-10R exhaust audio, SC-Project dyno pulls, lean angle analysis, and apex precision.
              </p>
            </div>

            {/* Pillar 3: Trailside Repairs & Mechanical Rebuilds */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-amber-500/40 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mechanics & Gear
                </span>
                <span className="text-[10px] font-mono text-slate-400">DIY Guides</span>
              </div>
              <h5 className="text-xs font-bold text-white">Trail Repairs & Garage Rebuilds</h5>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Trail alterations, portable tool kit breakdowns, emergency lever replacements, and titanium exhaust installs.
              </p>
            </div>

            {/* Pillar 4: Raw POV Motovlogs & Intercom Banter */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-red-500/40 transition space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                  POV Audio
                </span>
                <span className="text-[10px] font-mono text-amber-400">Binaural 4K</span>
              </div>
              <h5 className="text-xs font-bold text-white">Raw POV & Sena Intercom Rides</h5>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                Windslayer binaural audio, scenic sunset mountain passes, and group intercom commentary.
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Tracker Card */}
        <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Road to 500k Subscribers
              </h4>
              <span className="text-xs font-mono font-bold text-amber-400">
                68.6%
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Silver Play Button upgrade milestone tracking based on current +7.8% monthly momentum.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Current: 342.8k</span>
                <span>Target: 500.0k</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: '68.6%' }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Remaining Subs:</span>
                <span className="text-white font-bold">157,200</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Daily Velocity:</span>
                <span className="text-emerald-400 font-bold">+880 subs/day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Projected Milestone:</span>
                <span className="text-amber-400 font-bold">Early Q1 2027</span>
              </div>
            </div>
          </div>

          <a
            href="https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <span>Visit @ashrides26 on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </div>

      {/* Video Catalog for AshRides26 */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-500" />
              Official @ashrides26 Video Catalog & Telemetry
            </h4>
            <p className="text-xs text-slate-400">
              All {channelVideos.length} uploaded motovlogs, adventure roadtrips, and superbike tests
            </p>
          </div>

          {/* Search & Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, twisties, bikes..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'vlog', label: 'Adventure' },
                { id: 'bike_review', label: 'Reviews' },
                { id: 'shorts', label: 'Shorts' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    filterCategory === tab.id
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {channelVideos.map((video) => (
            <div
              key={video.video_id}
              className="bg-[#0b101d] border border-slate-800/80 hover:border-orange-500/40 rounded-xl p-3.5 flex flex-col justify-between transition group shadow-md"
            >
              <div>
                {/* Thumbnail */}
                <div
                  onClick={() => onSelectVideoDetail && onSelectVideoDetail(video.video_id)}
                  className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-slate-900 cursor-pointer"
                >
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-orange-400 border border-orange-500/30">
                      {video.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[11px] font-mono text-white">
                    <span className="bg-black/80 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                      {video.bike_model}
                    </span>
                    <span className="bg-black/90 px-1.5 py-0.5 rounded font-bold">
                      {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h5
                  onClick={() => onSelectVideoDetail && onSelectVideoDetail(video.video_id)}
                  className="text-xs sm:text-sm font-bold text-white line-clamp-2 mb-2 cursor-pointer group-hover:text-amber-300 transition"
                  title={video.title}
                >
                  {video.title}
                </h5>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono mb-3">
                  <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Views:</span>
                    <span className="font-bold text-white">{(video.views / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">Ret.:</span>
                    <span className="font-bold text-emerald-400">{video.retention_pct}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <a
                  href={video.youtube_url || 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 text-[11px] font-semibold transition flex items-center gap-1"
                  title="Watch on YouTube"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span>Watch</span>
                </a>

                <div className="flex items-center gap-1">
                  {onCompareVideo && (
                    <button
                      onClick={() => onCompareVideo(video.video_id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300 transition"
                      title="Compare Video"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onSelectVideoDetail && (
                    <button
                      onClick={() => onSelectVideoDetail(video.video_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <span>Telemetry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
