import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Bell, Flame, TrendingUp, Zap, Trophy, Radio, X, CheckCheck, 
  Settings2, Volume2, VolumeX, ShieldAlert, Sparkles, Trash2, ArrowUpRight
} from 'lucide-react';
import { AlertType } from '../types/database';

interface TrendingAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo?: (videoId: string) => void;
}

export const TrendingAlertsDrawer: React.FC<TrendingAlertsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectVideo
}) => {
  const { 
    alerts, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    dismissAlert, 
    triggerSimulatedAlert,
    hasBrowserPermission,
    requestBrowserPermission
  } = useNotifications();

  const { user, updateNotificationSettings } = useAuthAndSync();
  const [filterType, setFilterType] = useState<string>('all');
  const [showSettings, setShowSettings] = useState<boolean>(false);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'all') return true;
    return alert.alert_type === filterType;
  });

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'velocity_surge':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'retention_spike':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'viral_short':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'milestone':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'competitor_breakout':
        return <Radio className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-orange-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">CRITICAL</span>;
      case 'high':
        return <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">HIGH</span>;
      case 'medium':
        return <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">MED</span>;
      default:
        return <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 border border-slate-600/30">INFO</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="trending-alerts-drawer-root">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative z-10 w-full max-w-lg bg-[#0c121e] border-l border-slate-800 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Trending Alerts & Push Feed</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Real-time motovlog viral velocity & retention anomaly triggers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition ${showSettings ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Notification Configuration"
              id="alert-settings-toggle"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              id="alert-drawer-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span>Telemetry Alert Thresholds & Push Webhooks</span>
              <span className="font-mono text-orange-400 text-[11px]">DBMS v2.6</span>
            </div>

            {/* Browser Push Permission */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div>
                <p className="font-medium text-slate-200">Browser Push Notifications</p>
                <p className="text-[11px] text-slate-400">Receive alerts even when dashboard is minimized</p>
              </div>
              <button
                onClick={async () => {
                  const res = await requestBrowserPermission();
                  if (res && user) {
                    updateNotificationSettings({ browser_push_enabled: true });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition ${
                  hasBrowserPermission 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
                id="request-browser-push-btn"
              >
                {hasBrowserPermission ? 'Granted ✓' : 'Enable Web Push'}
              </button>
            </div>

            {/* Velocity Multiplier Slider */}
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Viral Surge Trigger Multiplier:</span>
                <span className="font-mono font-bold text-amber-400">
                  {user?.notification_settings?.velocity_threshold_multiplier || 2.5}x Baseline
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.5"
                value={user?.notification_settings?.velocity_threshold_multiplier || 2.5}
                onChange={(e) => updateNotificationSettings({ velocity_threshold_multiplier: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1.5x (Sensitive)</span>
                <span>3.0x (Moderate)</span>
                <span>5.0x (Extreme Spike)</span>
              </div>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
              <span className="text-slate-300">Audio Chime on High-Priority Alert</span>
              <button
                onClick={() => updateNotificationSettings({ sound_alerts_enabled: !user?.notification_settings?.sound_alerts_enabled })}
                className="p-1.5 rounded bg-slate-700 text-slate-200 hover:text-white"
              >
                {user?.notification_settings?.sound_alerts_enabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          </div>
        )}

        {/* Quick action bar */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'velocity_surge', label: 'Surges' },
              { id: 'retention_spike', label: 'Retention' },
              { id: 'viral_short', label: 'Shorts' },
              { id: 'milestone', label: 'Milestones' },
              { id: 'competitor_breakout', label: 'Competitors' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => triggerSimulatedAlert()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm transition"
              id="simulate-alert-btn"
              title="Simulate a real-time viral velocity trigger"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Alert</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs"
                title="Mark all as read"
                id="mark-all-read-btn"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">No Alerts in this Category</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Click "Simulate Alert" above to trigger a test spike in video velocity or retention!
              </p>
              <button
                onClick={() => triggerSimulatedAlert()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition"
              >
                Trigger Test Anomaly
              </button>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => markAsRead(alert.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  alert.is_read
                    ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    : 'bg-gradient-to-r from-slate-900 via-slate-900/90 to-orange-950/20 border-orange-500/30 hover:border-orange-500/60 shadow-lg'
                }`}
                id={`alert-card-${alert.id}`}
              >
                {!alert.is_read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 flex-shrink-0">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getPriorityBadge(alert.priority)}
                      <span className="text-[11px] font-mono text-slate-400">{alert.timestamp}</span>
                      {alert.category && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {alert.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {alert.video_title && (
                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-1 group-hover:text-amber-300 transition">
                        {alert.video_title}
                      </h4>
                    )}

                    <p className="text-xs text-slate-300 leading-relaxed mb-2">
                      {alert.message}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                          {alert.metric_value}
                        </span>
                        {alert.multiplier && (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            +{((alert.multiplier - 1) * 100).toFixed(0)}% Lift
                          </span>
                        )}
                      </div>

                      {alert.video_id && onSelectVideo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (alert.video_id) onSelectVideo(alert.video_id);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <span>Analyze</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAlert(alert.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition"
                    title="Dismiss alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/60 text-center text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono text-[11px]">Database Anomaly Poller: Active (30s)</span>
          <span className="text-[11px] text-emerald-400 font-mono">Status: NORMAL</span>
        </div>
      </div>
    </div>
  );
};
