import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Flame, TrendingUp, Zap, Trophy, Radio, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationToast: React.FC = () => {
  const { activeToast, clearToast } = useNotifications();

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.alert_type) {
      case 'velocity_surge':
        return <Flame className="w-5 h-5 text-orange-400 animate-pulse" />;
      case 'retention_spike':
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'viral_short':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'milestone':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'competitor_breakout':
        return <Radio className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-orange-400" />;
    }
  };

  const getBorderColor = () => {
    switch (activeToast.priority) {
      case 'critical':
        return 'border-orange-500/60 bg-gradient-to-r from-orange-950/90 via-slate-900/95 to-slate-900/95';
      case 'high':
        return 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-slate-900/95';
      case 'medium':
        return 'border-yellow-500/50 bg-gradient-to-r from-yellow-950/90 via-slate-900/95 to-slate-900/95';
      default:
        return 'border-cyan-500/50 bg-gradient-to-r from-cyan-950/90 via-slate-900/95 to-slate-900/95';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        id="notification-toast-hud"
        className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-xl border shadow-2xl backdrop-blur-xl ${getBorderColor()}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-white/10 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {activeToast.alert_type.replace('_', ' ')}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{activeToast.timestamp}</span>
            </div>
            {activeToast.video_title && (
              <h4 className="text-xs font-semibold text-white truncate mb-1">
                {activeToast.video_title}
              </h4>
            )}
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {activeToast.message}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                {activeToast.metric_value}
              </span>
              {activeToast.multiplier && (
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  🚀 {activeToast.multiplier}x Benchmark
                </span>
              )}
            </div>
          </div>
          <button
            onClick={clearToast}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
