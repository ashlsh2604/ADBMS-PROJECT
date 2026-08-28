import React, { useState, useMemo } from 'react';
import { AuthAndSyncProvider, useAuthAndSync } from './context/AuthAndSyncContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { VIDEOS, CHANNELS } from './data/mockDbmsData';
import { FilterState, Video } from './types/database';
import { Navbar } from './components/Navbar';
import { SearchAndFilterBar } from './components/SearchAndFilterBar';
import { MetricsOverviewCards } from './components/MetricsOverviewCards';
import { InteractiveGrowthCharts } from './components/InteractiveGrowthCharts';
import { VideoComparisonTool } from './components/VideoComparisonTool';
import { VideoListAndGrid } from './components/VideoListAndGrid';
import { VideoDetailModal } from './components/VideoDetailModal';
import { ChannelBenchmarkView } from './components/ChannelBenchmarkView';
import { DbmsQueryWorkbench } from './components/DbmsQueryWorkbench';
import { AuthModal } from './components/AuthModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { TrendingAlertsDrawer } from './components/TrendingAlertsDrawer';
import { NotificationToast } from './components/NotificationToast';
import { 
  Gauge, Flame, Bell, RefreshCw, BarChart3, Database, Layers, Globe2, 
  HelpCircle, ExternalLink, Sparkles, Shield, Smartphone 
} from 'lucide-react';

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'growth' | 'compare' | 'channels' | 'dbms'>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Modals & Drawers state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>(['ash_vid_01', 'ash_vid_02']);

  // Search and filter state
  const [filter, setFilter] = useState<FilterState>({
    category: 'all',
    dateRange: 'all',
    sortBy: 'views',
    searchQuery: '',
    bikeFilter: '',
  });

  // Filter videos based on current criteria
  const filteredVideos = useMemo(() => {
    return VIDEOS.filter((video) => {
      // Category filter
      if (filter.category !== 'all' && video.category !== filter.category) {
        return false;
      }

      // Bike model filter
      if (filter.bikeFilter && !video.bike_model.toLowerCase().includes(filter.bikeFilter.toLowerCase())) {
        return false;
      }

      // Search query (title, bike model, tags, category)
      if (filter.searchQuery.trim()) {
        const query = filter.searchQuery.toLowerCase();
        const matchesTitle = video.title.toLowerCase().includes(query);
        const matchesBike = video.bike_model.toLowerCase().includes(query);
        const matchesCat = video.category.toLowerCase().includes(query);
        const matchesTags = video.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesBike && !matchesCat && !matchesTags) {
          return false;
        }
      }

      // Date range filter
      if (filter.dateRange !== 'all') {
        const upload = new Date(video.upload_date).getTime();
        const now = new Date('2026-08-28').getTime();
        const diffDays = (now - upload) / (1000 * 60 * 60 * 24);

        if (filter.dateRange === '7d' && diffDays > 7) return false;
        if (filter.dateRange === '30d' && diffDays > 30) return false;
        if (filter.dateRange === '90d' && diffDays > 90) return false;
        if (filter.dateRange === '1y' && diffDays > 365) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort logic
      switch (filter.sortBy) {
        case 'views':
          return b.views - a.views;
        case 'retention_pct':
          return b.retention_pct - a.retention_pct;
        case 'watch_time_hours':
          return b.watch_time_hours - a.watch_time_hours;
        case 'velocity_views_per_hr':
          return b.velocity_views_per_hr - a.velocity_views_per_hr;
        case 'likes':
          return b.likes - a.likes;
        case 'comments':
          return b.comments - a.comments;
        case 'upload_date':
          return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
        default:
          return b.views - a.views;
      }
    });
  }, [filter]);

  const activeVideoDetail = selectedVideoId
    ? VIDEOS.find((v) => v.video_id === selectedVideoId) || null
    : null;

  const handleCompareVideo = (videoId: string) => {
    if (!comparisonVideoIds.includes(videoId)) {
      setComparisonVideoIds((prev) => [videoId, ...prev.slice(0, 2)]);
    }
    setActiveTab('compare');
  };

  const handleSelectChannel = (channelId: string) => {
    setActiveTab('channels');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Real-time Notification Toast popup */}
      <NotificationToast onViewAlerts={() => setIsAlertsOpen(true)} />

      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSearchFocus={() => {
          setActiveTab('dashboard');
          const input = document.getElementById('video-search-input');
          if (input) input.focus();
        }}
      />

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: Main Video Analytics Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards Strip */}
            <MetricsOverviewCards
              videos={VIDEOS}
              onSelectCategoryFilter={(cat) => setFilter((prev) => ({ ...prev, category: cat as any }))}
            />

            {/* Search & Dynamic Filter Cockpit */}
            <SearchAndFilterBar
              filter={filter}
              setFilter={setFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              totalVideosCount={VIDEOS.length}
              filteredCount={filteredVideos.length}
              onSelectChannel={handleSelectChannel}
            />

            {/* Video Cards Grid or Relational DBMS Table */}
            <VideoListAndGrid
              videos={filteredVideos}
              viewMode={viewMode}
              onSelectVideo={(id) => setSelectedVideoId(id)}
              onCompareVideo={handleCompareVideo}
            />
          </div>
        )}

        {/* VIEW 2: Monthly Growth Trends */}
        {activeTab === 'growth' && (
          <div className="space-y-6">
            <InteractiveGrowthCharts />
          </div>
        )}

        {/* VIEW 3: Multi-Video Comparison Workbench */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <VideoComparisonTool
              initialVideoIds={comparisonVideoIds}
              onSelectVideoDetail={(id) => setSelectedVideoId(id)}
            />
          </div>
        )}

        {/* VIEW 4: Channel Explorer & Benchmarking */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            <ChannelBenchmarkView onSelectChannelFilter={handleSelectChannel} />
          </div>
        )}

        {/* VIEW 5: Advanced DBMS SQL Query Workbench */}
        {activeTab === 'dbms' && (
          <div className="space-y-6">
            <DbmsQueryWorkbench />
          </div>
        )}
      </main>

      {/* Modals & Slide-out Drawers */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <DeviceSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} />
      <TrendingAlertsDrawer isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
      
      <VideoDetailModal
        video={activeVideoDetail}
        onClose={() => setSelectedVideoId(null)}
        onCompareVideo={handleCompareVideo}
      />

      {/* Persistent Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] mt-12 py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">AshRides26 Analytics Engine</span>
              <span className="text-slate-400 ml-2">v2.6 • Advanced DBMS Project</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Normalized 3NF DBMS Architecture</span>
            <span>•</span>
            <span>Live WebSocket Sync</span>
            <span>•</span>
            <span>End-to-End Encrypted Sessions</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthAndSyncProvider>
      <NotificationProvider>
        <DashboardContent />
      </NotificationProvider>
    </AuthAndSyncProvider>
  );
}

export default App;
