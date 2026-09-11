import React, { createContext, useContext, useState, useEffect } from 'react';
import { TrendingAlert, AlertType, AlertPriority } from '../types/database';
import { INITIAL_TRENDING_ALERTS, VIDEOS } from '../data/mockDbmsData';
import { fetchAlerts, markAlertAsReadApi, triggerNewAlertApi } from '../services/api';

interface NotificationContextType {
  alerts: TrendingAlert[];
  unreadCount: number;
  activeToast: TrendingAlert | null;
  hasBrowserPermission: boolean;
  requestBrowserPermission: () => Promise<boolean>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (id: string) => void;
  triggerSimulatedAlert: (customType?: AlertType) => void;
  clearToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<TrendingAlert[]>(() => {
    const saved = localStorage.getItem('ashrides26_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse alerts', e);
      }
    }
    return INITIAL_TRENDING_ALERTS;
  });

  const [activeToast, setActiveToast] = useState<TrendingAlert | null>(null);
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(false);

  useEffect(() => {
    fetchAlerts()
      .then((data) => {
        if (data && data.length > 0) {
          setAlerts(data);
        }
      })
      .catch((err) => console.warn('Could not fetch alerts from MySQL backend', err));
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setHasBrowserPermission(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ashrides26_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      setHasBrowserPermission(granted);
      return granted;
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return false;
    }
  };

  const showSystemNotification = (alert: TrendingAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔥 AshRides26 Alert: ${alert.alert_type.toUpperCase().replace('_', ' ')}`, {
          body: `${alert.video_title || alert.channel_name}: ${alert.message}`,
          icon: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
          badge: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
          tag: alert.id
        });
      } catch (e) {
        console.log('Browser notification fallback', e);
      }
    }
  };

  const markAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    markAlertAsReadApi(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearToast = () => {
    setActiveToast(null);
  };

  const triggerSimulatedAlert = (customType?: AlertType) => {
    const types: AlertType[] = ['velocity_surge', 'retention_spike', 'viral_short', 'milestone', 'competitor_breakout'];
    const selectedType = customType || types[Math.floor(Math.random() * types.length)];
    const randomVideo = VIDEOS[Math.floor(Math.random() * VIDEOS.length)];

    let title = randomVideo.title;
    let message = '';
    let metricValue = '';
    let multiplier = 1.0;
    let priority: AlertPriority = 'high';

    switch (selectedType) {
      case 'velocity_surge':
        multiplier = Number((Math.random() * 3 + 2.2).toFixed(1));
        metricValue = `+${Math.floor(multiplier * 1100)} views/hr (${multiplier}x normal)`;
        message = `Live Velocity Spike! Algorithm feed impressions surge detected on ${randomVideo.category.replace('_', ' ')}.`;
        priority = 'critical';
        break;
      case 'retention_spike':
        multiplier = 1.5;
        metricValue = `${(Math.random() * 15 + 82).toFixed(1)}% Retention`;
        message = `Audience hook performance exceeded expectations! High replay rate on canyon exhaust section.`;
        priority = 'high';
        break;
      case 'viral_short':
        multiplier = 6.2;
        metricValue = 'Shorts Feed Breakout (12.4k/hr)';
        message = `Short-form algorithm explosion! Reached top 5 trending motorcycle reels.`;
        priority = 'critical';
        break;
      case 'milestone':
        metricValue = 'New Milestone: 500K Views!';
        message = `The video crossed major DBMS database milestone threshold. Engagement rate 14.8%.`;
        priority = 'medium';
        break;
      case 'competitor_breakout':
        title = 'Yammie Noob';
        metricValue = 'Uploaded: "Best Beginner Superbikes 2026"';
        message = `Competitor channel published a directly competing topic. Real-time watch traffic shifting.`;
        priority = 'info';
        break;
    }

    const newAlert: TrendingAlert = {
      id: `alert_${Date.now()}`,
      video_id: randomVideo.video_id,
      video_title: title,
      channel_name: 'AshRides26',
      category: randomVideo.category,
      alert_type: selectedType,
      multiplier,
      metric_value: metricValue,
      message,
      timestamp: 'Just now',
      is_read: false,
      priority
    };

    setAlerts((prev) => [newAlert, ...prev]);
    setActiveToast(newAlert);
    showSystemNotification(newAlert);

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === newAlert.id ? null : curr));
    }, 6000);
  };

  return (
    <NotificationContext.Provider
      value={{
        alerts,
        unreadCount,
        activeToast,
        hasBrowserPermission,
        requestBrowserPermission,
        markAsRead,
        markAllAsRead,
        dismissAlert,
        triggerSimulatedAlert,
        clearToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
