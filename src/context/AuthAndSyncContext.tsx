import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, DeviceSession, SavedQuery } from '../types/database';
import { INITIAL_USER_ACCOUNT } from '../data/mockDbmsData';

interface AuthAndSyncContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncTime: Date;
  syncSuccessMessage: string | null;
  login: (email: string, role?: string, name?: string) => Promise<boolean>;
  signup: (name: string, email: string, role?: string) => Promise<boolean>;
  logout: () => void;
  forceSyncNow: () => Promise<void>;
  toggleSaveVideo: (videoId: string) => void;
  isVideoSaved: (videoId: string) => boolean;
  saveComparison: (videoIds: string[]) => void;
  removeComparison: (index: number) => void;
  addCustomQuery: (query: Omit<SavedQuery, 'id' | 'created_at'>) => void;
  updateNotificationSettings: (settings: Partial<UserAccount['notification_settings']>) => void;
  exportSyncPayload: () => string;
  importSyncPayload: (payloadJson: string) => boolean;
  unlinkDevice: (deviceId: string) => void;
  renameDevice: (deviceId: string, newName: string) => void;
}

const STORAGE_KEY = 'ashrides26_dbms_user_session';

const AuthAndSyncContext = createContext<AuthAndSyncContextType | undefined>(undefined);

export const AuthAndSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored session', e);
      }
    }
    return INITIAL_USER_ACCOUNT;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, role: string = 'Channel Owner (Ash)', name?: string): Promise<boolean> => {
    setIsSyncing(true);
    await new Promise((res) => setTimeout(res, 600));

    const loggedInUser: UserAccount = {
      ...INITIAL_USER_ACCOUNT,
      email,
      name: name || (email.includes('ash') ? 'Ash (AshRides26)' : email.split('@')[0]),
      role: role as any,
      last_login: 'Just now'
    };

    setUser(loggedInUser);
    setLastSyncTime(new Date());
    setIsSyncing(false);
    setSyncSuccessMessage('Logged in & synchronized profile across devices');
    setTimeout(() => setSyncSuccessMessage(null), 3500);
    return true;
  };

  const signup = async (name: string, email: string, role: string = 'Data Analyst'): Promise<boolean> => {
    setIsSyncing(true);
    await new Promise((res) => setTimeout(res, 700));

    const newUser: UserAccount = {
      id: `usr_${Date.now().toString(36)}`,
      name,
      email,
      role: role as any,
      avatar: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
      last_login: 'Just now',
      created_at: new Date().toISOString().split('T')[0],
      connected_devices: [
        {
          id: `dev_${Date.now()}`,
          device_name: 'Current Browser Session (Web Client)',
          device_type: 'desktop',
          os: 'Web Platform',
          browser: 'Modern Browser',
          ip_location: 'Detected IP (US-West)',
          last_synced_at: 'Just now',
          is_current: true
        }
      ],
      saved_video_ids: ['ash_vid_01', 'ash_vid_02'],
      saved_comparisons: [['ash_vid_01', 'ash_vid_02']],
      custom_queries: INITIAL_USER_ACCOUNT.custom_queries,
      notification_settings: INITIAL_USER_ACCOUNT.notification_settings
    };

    setUser(newUser);
    setLastSyncTime(new Date());
    setIsSyncing(false);
    setSyncSuccessMessage('Account created! Initialized cross-device data synchronization');
    setTimeout(() => setSyncSuccessMessage(null), 3500);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const forceSyncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    await new Promise((res) => setTimeout(res, 900));

    const updatedDevices = user.connected_devices.map((dev) =>
      dev.is_current
        ? { ...dev, last_synced_at: 'Just now' }
        : dev
    );

    setUser({
      ...user,
      connected_devices: updatedDevices
    });
    setLastSyncTime(new Date());
    setIsSyncing(false);
    setSyncSuccessMessage(`Synced ${user.saved_video_ids.length} videos & ${user.custom_queries.length} queries to 3 devices`);
    setTimeout(() => setSyncSuccessMessage(null), 4000);
  };

  const toggleSaveVideo = (videoId: string) => {
    if (!user) return;
    const exists = user.saved_video_ids.includes(videoId);
    const updated = exists
      ? user.saved_video_ids.filter((id) => id !== videoId)
      : [...user.saved_video_ids, videoId];

    setUser({
      ...user,
      saved_video_ids: updated
    });
    setLastSyncTime(new Date());
  };

  const isVideoSaved = (videoId: string) => {
    return user ? user.saved_video_ids.includes(videoId) : false;
  };

  const saveComparison = (videoIds: string[]) => {
    if (!user) return;
    setUser({
      ...user,
      saved_comparisons: [...user.saved_comparisons, videoIds]
    });
    setLastSyncTime(new Date());
  };

  const removeComparison = (index: number) => {
    if (!user) return;
    const updated = [...user.saved_comparisons];
    updated.splice(index, 1);
    setUser({
      ...user,
      saved_comparisons: updated
    });
  };

  const addCustomQuery = (query: Omit<SavedQuery, 'id' | 'created_at'>) => {
    if (!user) return;
    const newQuery: SavedQuery = {
      ...query,
      id: `query_${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setUser({
      ...user,
      custom_queries: [newQuery, ...user.custom_queries]
    });
  };

  const updateNotificationSettings = (settings: Partial<UserAccount['notification_settings']>) => {
    if (!user) return;
    setUser({
      ...user,
      notification_settings: {
        ...user.notification_settings,
        ...settings
      }
    });
  };

  const exportSyncPayload = (): string => {
    if (!user) return '{}';
    return JSON.stringify(
      {
        account_id: user.id,
        exported_at: new Date().toISOString(),
        checksum: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        saved_videos: user.saved_video_ids,
        saved_comparisons: user.saved_comparisons,
        custom_queries: user.custom_queries,
        notification_settings: user.notification_settings
      },
      null,
      2
    );
  };

  const importSyncPayload = (payloadJson: string): boolean => {
    try {
      const parsed = JSON.parse(payloadJson);
      if (!user) return false;
      setUser({
        ...user,
        saved_video_ids: parsed.saved_videos || user.saved_video_ids,
        saved_comparisons: parsed.saved_comparisons || user.saved_comparisons,
        custom_queries: parsed.custom_queries || user.custom_queries,
        notification_settings: parsed.notification_settings || user.notification_settings
      });
      setLastSyncTime(new Date());
      setSyncSuccessMessage('Successfully imported & merged device synchronization payload');
      setTimeout(() => setSyncSuccessMessage(null), 3500);
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  const unlinkDevice = (deviceId: string) => {
    if (!user) return;
    setUser({
      ...user,
      connected_devices: user.connected_devices.filter((d) => d.id !== deviceId)
    });
  };

  const renameDevice = (deviceId: string, newName: string) => {
    if (!user) return;
    setUser({
      ...user,
      connected_devices: user.connected_devices.map((d) => (d.id === deviceId ? { ...d, device_name: newName } : d))
    });
  };

  return (
    <AuthAndSyncContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSyncing,
        lastSyncTime,
        syncSuccessMessage,
        login,
        signup,
        logout,
        forceSyncNow,
        toggleSaveVideo,
        isVideoSaved,
        saveComparison,
        removeComparison,
        addCustomQuery,
        updateNotificationSettings,
        exportSyncPayload,
        importSyncPayload,
        unlinkDevice,
        renameDevice
      }}
    >
      {children}
    </AuthAndSyncContext.Provider>
  );
};

export const useAuthAndSync = () => {
  const context = useContext(AuthAndSyncContext);
  if (!context) {
    throw new Error('useAuthAndSync must be used within an AuthAndSyncProvider');
  }
  return context;
};
