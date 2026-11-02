import React, { useEffect, useState } from 'react';
import { fetchDbStatus } from '../services/api';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Gauge, Flame, Bell, RefreshCw, User, Database, BarChart3, 
  Layers, Search, Globe2, Sparkles, Shield, LogOut, Check, Youtube
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'growth' | 'compare' | 'channels' | 'dbms' | 'login' | 'signup';
  setActiveTab: (tab: 'dashboard' | 'growth' | 'compare' | 'channels' | 'dbms' | 'login' | 'signup') => void;
  onOpenAuth: () => void;
  onOpenSync: () => void;
  onOpenAlerts: () => void;
  onOpenSearchFocus: () => void;
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenSync,
  onOpenAlerts,
  onOpenSearchFocus,
  onNavigateToLogin,
  onNavigateToSignUp,
  onLogout,
}) => {
  const { user, isAuthenticated, isGuest, logout, isSyncing, lastSyncTime } = useAuthAndSync();
  const { unreadCount } = useNotifications();
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  useEffect(() => { fetchDbStatus().then((status) => setDbConnected(status.connected)).catch(() => setDbConnected(false)); }, []);

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      onNavigateToLogin();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 border-b border-slate-800/90 backdrop-blur-xl" id="main-navigation-bar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Channel Identity */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
              id="brand-home-link"
            >
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 group-hover:scale-105 transition">
                <Gauge className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090d16] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-base font-['Plus_Jakarta_Sans'] group-hover:text-amber-400 transition">
                    AshRides26
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    DBMS
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>342.8K Subs</span>
                  <span>•</span>
                  <span className="text-emerald-400">48.9M Views</span>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              id="nav-tab-dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Video Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('growth')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'growth'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              id="nav-tab-growth"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Monthly Growth</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'compare'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              id="nav-tab-compare"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Video Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'channels'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              id="nav-tab-channels"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('dbms')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'dbms'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-800/50'
              }`}
              id="nav-tab-dbms"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL Workbench</span>
            </button>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* MySQL Database Engine Indicator */}
            <button
              onClick={() => setActiveTab('dbms')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 transition"
              title={dbConnected ? "Live MySQL connection" : "Demo mode or MySQL unavailable"}
              id="nav-mysql-status-btn"
            >
              <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span>{dbConnected ? "MySQL live" : "Demo / offline"}</span>
            </button>

            {/* Cross-Device Sync Status Button */}
            <button
              onClick={onOpenSync}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition"
              title="Cross-Device Sync Manager"
              id="nav-sync-btn"
            >
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing...' : `${user?.connected_devices?.length || 0} Devices`}
              </span>
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Trending Push Alert Bell */}
            <button
              onClick={onOpenAlerts}
              className="relative p-1.5 sm:p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-orange-400 transition"
              title="Trending Alerts & Push Notifications"
              id="nav-alerts-btn"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-center rounded-full text-[10px] font-mono font-bold bg-orange-500 text-white shadow-md">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Account Profile / Auth Button Cluster */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 pl-1.5 pr-1.5 sm:pl-2 sm:pr-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl transition group"
                  id="nav-user-profile-btn"
                  title="View Profile & Notification Settings"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-orange-500/40"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-white leading-tight group-hover:text-amber-300 truncate max-w-[100px]">
                      {user.name}
                    </div>
                    <div className="text-[9px] font-mono text-orange-400 leading-none">
                      {user.role.split(' ')[0]}
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleLogoutAction}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition"
                  title="Sign Out & Redirect to Login"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {isGuest && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Guest Analyst
                  </span>
                )}
                <button
                  onClick={onNavigateToLogin}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600'
                  }`}
                  id="nav-login-btn"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={onNavigateToSignUp}
                  className={`hidden sm:flex px-3 py-1.5 rounded-lg font-bold text-xs transition items-center gap-1.5 ${
                    activeTab === 'signup'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20'
                  }`}
                  id="nav-signup-btn"
                >
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 text-[11px]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-1 px-2 rounded font-semibold ${activeTab === 'dashboard' ? 'text-orange-400' : 'text-slate-400'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`py-1 px-2 rounded font-semibold ${activeTab === 'growth' ? 'text-orange-400' : 'text-slate-400'}`}
        >
          Growth
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`py-1 px-2 rounded font-semibold ${activeTab === 'compare' ? 'text-orange-400' : 'text-slate-400'}`}
        >
          Compare
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`py-1 px-2 rounded font-semibold ${activeTab === 'channels' ? 'text-orange-400' : 'text-slate-400'}`}
        >
          YouTube
        </button>
        <button
          onClick={() => setActiveTab('dbms')}
          className={`py-1 px-2 rounded font-semibold ${activeTab === 'dbms' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          SQL DBMS
        </button>
      </div>
    </header>
  );
};
