import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { AuthAndSyncProvider, useAuthAndSync } from './context/AuthAndSyncContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { FilterState, Video } from './types/database';
import { fetchVideos } from './services/api';
import { Navbar } from './components/Navbar';
import { SearchAndFilterBar } from './components/SearchAndFilterBar';
import { MetricsOverviewCards } from './components/MetricsOverviewCards';
const InteractiveGrowthCharts = React.lazy(() => import('./components/InteractiveGrowthCharts').then((module) => ({ default: module.InteractiveGrowthCharts })));
const VideoComparisonTool = React.lazy(() => import('./components/VideoComparisonTool').then((module) => ({ default: module.VideoComparisonTool })));
import { VideoListAndGrid } from './components/VideoListAndGrid';
const VideoDetailModal = React.lazy(() => import('./components/VideoDetailModal').then((module) => ({ default: module.VideoDetailModal })));
const ChannelBenchmarkView = React.lazy(() => import('./components/ChannelBenchmarkView').then((module) => ({ default: module.ChannelBenchmarkView })));
const DbmsQueryWorkbench = React.lazy(() => import('./components/DbmsQueryWorkbench').then((module) => ({ default: module.DbmsQueryWorkbench })));
import { AuthModal } from './components/AuthModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { TrendingAlertsDrawer } from './components/TrendingAlertsDrawer';
import { NotificationToast } from './components/NotificationToast';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { 
  Gauge, Flame, Bell, RefreshCw, BarChart3, Database, Layers, Globe2, 
  HelpCircle, ExternalLink, Sparkles, Shield, Smartphone 
} from 'lucide-react';

export type TabType = 'dashboard' | 'growth' | 'compare' | 'channels' | 'dbms' | 'login' | 'signup';

const DashboardContent: React.FC = () => {
  const { user, isAuthenticated, isGuest, logout, setGuestMode } = useAuthAndSync();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [redirectTarget, setRedirectTarget] = useState<string>('dashboard');
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  
  // Modals & Drawers state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [comparisonVideoIds, setComparisonVideoIds] = useState<string[]>(['ash_vid_01', 'ash_vid_02']);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);

  const loadVideos = useCallback(() => {
    setVideosLoading(true);
    setVideosError(null);
    fetchVideos()
      .then(setAllVideos)
      .catch((err) => setVideosError(err?.message || 'Could not load videos'))
      .finally(() => setVideosLoading(false));
  }, []);

  useEffect(() => { loadVideos(); }, [loadVideos]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToLogin = (target?: string, notice?: string) => {
    if (activeTab !== 'login' && activeTab !== 'signup') {
      setRedirectTarget(target || activeTab);
    }
    if (notice) {
      setRedirectNotice(notice);
    }
    handleTabChange('login');
  };

  const handleNavigateToSignUp = (target?: string) => {
    if (activeTab !== 'login' && activeTab !== 'signup') {
      setRedirectTarget(target || activeTab);
    }
    handleTabChange('signup');
  };

  const handleLogout = async () => {
    await logout();
    setRedirectNotice('logged_out');
    setRedirectTarget('dashboard');
    handleTabChange('login');
  };

  const handleContinueAsGuest = () => {
    setGuestMode(true);
    const dest = (redirectTarget || 'dashboard') as TabType;
    setRedirectNotice(null);
    handleTabChange(dest);
  };

  const handleAuthSuccessRedirect = (destinationTab?: string) => {
    const dest = (destinationTab || redirectTarget || 'dashboard') as TabType;
    setRedirectNotice(null);
    handleTabChange(dest);
  };

  // Synchronize activeTab with URL hash for direct links and browser history, with auth protection
  useEffect(() => {
    const validTabs: TabType[] = ['dashboard', 'growth', 'compare', 'channels', 'dbms', 'login', 'signup'];
    const currentHash = window.location.hash.replace('#', '') as TabType;

    if (currentHash && validTabs.includes(currentHash)) {
      if (currentHash === 'login' || currentHash === 'signup') {
        setActiveTab(currentHash);
      } else if (!isAuthenticated && !isGuest) {
        // Protected destination: redirect to login and preserve target
        setRedirectTarget(currentHash);
        setRedirectNotice('login_required');
        setActiveTab('login');
        window.location.hash = 'login';
      } else {
        setActiveTab(currentHash);
      }
    } else if (!isAuthenticated && !isGuest) {
      // Unauthenticated first load: redirect to login
      setRedirectTarget('dashboard');
      setActiveTab('login');
      window.location.hash = 'login';
    } else {
      setActiveTab('dashboard');
    }

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabType;
      if (validTabs.includes(hash)) {
        if (hash !== 'login' && hash !== 'signup' && !isAuthenticated && !isGuest) {
          setRedirectTarget(hash);
          setRedirectNotice('login_required');
          setActiveTab('login');
          window.location.hash = 'login';
        } else {
          setActiveTab(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated, isGuest]);

  // Search and filter state
  const [filter, setFilter] = useState<FilterState>({
    category: 'all',
    dateRange: 'all',
    sortBy: 'views',
    sortOrder: 'desc',
    searchQuery: '',
    bikeFilter: '',
  });

  // Filter videos based on current criteria
  const filteredVideos = useMemo(() => {
    return allVideos.filter((video) => {
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
        const now = Date.now();
        const diffDays = (now - upload) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) return false;
        if (filter.dateRange === '7d' && diffDays > 7) return false;
        if (filter.dateRange === '30d' && diffDays > 30) return false;
        if (filter.dateRange === '90d' && diffDays > 90) return false;
        if (filter.dateRange === '1y' && diffDays > 365) return false;
      }

      return true;
    }).sort((a, b) => {
      const direction = filter.sortOrder === 'asc' ? -1 : 1;
      // Sort logic
      switch (filter.sortBy) {
        case 'views':
          return (b.views - a.views) * direction;
        case 'retention_pct':
          return (b.retention_pct - a.retention_pct) * direction;
        case 'watch_time_hours':
          return (b.watch_time_hours - a.watch_time_hours) * direction;
        case 'velocity_views_per_hr':
          return (b.velocity_views_per_hr - a.velocity_views_per_hr) * direction;
        case 'likes':
          return (b.likes - a.likes) * direction;
        case 'comments':
          return (b.comments - a.comments) * direction;
        case 'upload_date':
          return (new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()) * direction;
        default:
          return (b.views - a.views) * direction;
      }
    });
  }, [allVideos, filter]);

  const activeVideoDetail = selectedVideoId
    ? allVideos.find((v) => v.video_id === selectedVideoId) || null
    : null;

  const handleCompareVideo = (videoId: string) => {
    if (!comparisonVideoIds.includes(videoId)) {
      setComparisonVideoIds((prev) => [videoId, ...prev.slice(0, 2)]);
    }
    handleTabChange('compare');
  };

  const handleSelectChannel = (channelId: string) => {
    handleTabChange('channels');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Real-time Notification Toast popup */}
      <NotificationToast onViewAlerts={() => setIsAlertsOpen(true)} />

      {/* Top Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onNavigateToLogin={() => handleNavigateToLogin()}
        onNavigateToSignUp={() => handleNavigateToSignUp()}
        onLogout={handleLogout}
        onOpenSearchFocus={() => {
          handleTabChange('dashboard');
          const input = document.getElementById('video-search-input');
          if (input) input.focus();
        }}
      />

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Suspense fallback={<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">Loading view…</div>}>
        {/* VIEW 1: Main Video Analytics Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {videosError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center justify-between gap-3"><span>{videosError}</span><button onClick={loadVideos} className="px-3 py-1 rounded-lg bg-red-500/20 text-xs font-bold">Retry</button></div>}
            {videosLoading && <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">Loading video telemetry…</div>}
            {/* KPI Cards Strip */}
            <MetricsOverviewCards
              videos={allVideos}
              onSelectCategoryFilter={(cat) => setFilter((prev) => ({ ...prev, category: cat as any }))}
            />

            {/* Search & Dynamic Filter Cockpit */}
            <SearchAndFilterBar
              filter={filter}
              setFilter={setFilter}
              viewMode={viewMode}
              setViewMode={setViewMode}
              totalVideosCount={allVideos.length}
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
            <ChannelBenchmarkView
              onSelectChannelFilter={handleSelectChannel}
              onSelectVideoDetail={(id) => setSelectedVideoId(id)}
              onCompareVideo={handleCompareVideo}
              onVideoAdded={(newVideo) => {
                setAllVideos((prev) => [newVideo, ...prev]);
              }}
              onNavigateToTab={(tab) => handleTabChange(tab as any)}
            />
          </div>
        )}

        {/* VIEW 5: Advanced DBMS SQL Query Workbench */}
        {activeTab === 'dbms' && (
          <div className="space-y-6">
            <DbmsQueryWorkbench
              onRequireAuth={(reason) => handleNavigateToLogin('dbms', reason)}
            />
          </div>
        )}

        {/* VIEW 6: Dedicated Full-Screen Login Page */}
        {activeTab === 'login' && (
          <LoginPage
            onNavigateToSignUp={() => handleNavigateToSignUp()}
            onNavigateToDashboard={(target) => handleAuthSuccessRedirect(target)}
            onContinueAsGuest={handleContinueAsGuest}
            redirectTo={redirectTarget}
            notice={redirectNotice}
          />
        )}

        {/* VIEW 7: Dedicated Full-Screen Sign-Up Page */}
        {activeTab === 'signup' && (
          <SignUpPage
            onNavigateToLogin={() => handleNavigateToLogin()}
            onNavigateToDashboard={(target) => handleAuthSuccessRedirect(target)}
            onContinueAsGuest={handleContinueAsGuest}
            redirectTo={redirectTarget}
          />
        )}
        </Suspense>
      </main>

      {/* Modals & Slide-out Drawers */}
      <Suspense fallback={null}>
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onOpenFullPage={(mode) => handleTabChange(mode)}
      />
      <DeviceSyncModal isOpen={isSyncOpen} onClose={() => setIsSyncOpen(false)} />
      <TrendingAlertsDrawer isOpen={isAlertsOpen} onClose={() => setIsAlertsOpen(false)} />
      
      <VideoDetailModal
        video={activeVideoDetail}
        onClose={() => setSelectedVideoId(null)}
        onCompareVideo={handleCompareVideo}
      />
      </Suspense>

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
            <span>MySQL-backed when configured</span>
            <span>•</span>
            <span>Server-side sessions</span>
            <span>•</span>
            <span>Explicit demo mode</span>
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
