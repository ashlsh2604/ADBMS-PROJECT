import React, { createContext, useContext, useState, useEffect } from 'react';
import { TrendingAlert, AlertType, AlertPriority } from '../types/database';
import { Video } from '../types/database';
import { fetchAlerts, fetchVideos, markAlertAsReadApi, triggerNewAlertApi } from '../services/api';

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
  const [alerts, setAlerts] = useState<TrendingAlert[]>([]);

  const [activeToast, setActiveToast] = useState<TrendingAlert | null>(null);
  const [hasBrowserPermission, setHasBrowserPermission] = useState<boolean>(false);

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch((err) => console.warn('Could not fetch alerts', err));
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setHasBrowserPermission(Notification.permission === 'granted');
    }
  }, []);

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

  const markAllAsRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    await Promise.all(unread.map((a) => markAlertAsReadApi(a.id)));
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearToast = () => {
    setActiveToast(null);
  };

  const triggerSimulatedAlert = async (customType?: AlertType) => {
    const videos = await fetchVideos({});
    if (!videos.length) return;
    const randomVideo: Video = videos[Math.floor(Math.random() * videos.length)];
    const types: AlertType[] = ['velocity_surge', 'retention_spike', 'viral_short', 'milestone', 'competitor_breakout'];
    const selectedType = customType || types[Math.floor(Math.random() * types.length)];
    const newAlert = await triggerNewAlertApi({
      video_id: randomVideo.video_id,
      video_title: randomVideo.title,
      channel_name: 'AshRides26',
      category: randomVideo.category,
      alert_type: selectedType,
      multiplier: 2.5,
      metric_value: 'Simulated telemetry spike',
      message: 'Simulated alert generated from the dashboard and persisted by the API.',
      priority: 'high',
      timestamp: new Date().toISOString()
    });

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
