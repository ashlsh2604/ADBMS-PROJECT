import React, { createContext, useContext, useEffect, useState } from 'react';
import type { DeviceSession, SavedQuery, UserAccount } from '../types/database';
import { demoLoginApi, fetchCurrentUser, loginUserApi, logoutUserApi, signupUserApi, syncWorkspaceApi } from '../services/api';

interface AuthAndSyncContextType {
  user: UserAccount | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  setGuestMode: (val: boolean) => void;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncSuccessMessage: string | null;
  syncError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<boolean>;
  demoLogin: (profile: 'owner' | 'architect' | 'editor') => Promise<boolean>;
  logout: () => Promise<void>;
  forceSyncNow: () => Promise<void>;
  toggleSaveVideo: (videoId: string) => void;
  isVideoSaved: (videoId: string) => boolean;
  saveComparison: (videoIds: string[]) => void;
  removeComparison: (index: number) => void;
  addCustomQuery: (query: Omit<SavedQuery, 'id' | 'created_at'>) => void;
  updateNotificationSettings: (settings: Partial<UserAccount['notification_settings']>) => void;
  exportSyncPayload: () => Promise<string>;
  importSyncPayload: (payloadJson: string) => boolean;
  unlinkDevice: (deviceId: string) => void;
  renameDevice: (deviceId: string, newName: string) => void;
}

const GUEST_KEY = 'ashrides26_guest_mode';
const AuthAndSyncContext = createContext<AuthAndSyncContextType | undefined>(undefined);

function currentDevice(): DeviceSession {
  const ua = navigator.userAgent;
  const mobile = /Mobi|Android/i.test(ua);
  return {
    id: 'dev_current_browser',
    device_name: mobile ? 'Current mobile browser' : 'Current desktop browser',
    device_type: mobile ? 'mobile' : 'desktop',
    os: /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : /Android/i.test(ua) ? 'Android' : 'Unknown',
    browser: /Firefox/i.test(ua) ? 'Firefox' : /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'Unknown',
    ip_location: 'Not collected',
    last_synced_at: new Date().toISOString(),
    is_current: true,
  };
}

export const AuthAndSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const setGuestMode = (val: boolean) => {
    setIsGuest(val);
    if (val) localStorage.setItem(GUEST_KEY, 'true');
    else localStorage.removeItem(GUEST_KEY);
  };

  const flashSuccess = (message: string) => {
    setSyncSuccessMessage(message);
    window.setTimeout(() => setSyncSuccessMessage(null), 3500);
  };

  const login = async (email: string, password: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { user: account } = await loginUserApi(email, password);
      setUser(account);
      setGuestMode(false);
      setLastSyncTime(new Date());
      flashSuccess('Signed in securely.');
      return true;
    } catch (error: any) {
      setSyncError(error?.message || 'Login failed');
      throw error;
    } finally { setIsSyncing(false); }
  };

  const signup = async (name: string, email: string, password: string, role?: string) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { user: account } = await signupUserApi(name, email, password, role);
      setUser(account);
      setGuestMode(false);
      setLastSyncTime(new Date());
      flashSuccess('Account created.');
      return true;
    } catch (error: any) {
      setSyncError(error?.message || 'Signup failed');
      throw error;
    } finally { setIsSyncing(false); }
  };

  const demoLogin = async (profile: 'owner' | 'architect' | 'editor') => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { user: account } = await demoLoginApi(profile);
      setUser(account);
      setGuestMode(false);
      flashSuccess('Signed in to the demo workspace.');
      return true;
    } catch (error: any) {
      setSyncError(error?.message || 'Demo login failed');
      throw error;
    } finally { setIsSyncing(false); }
  };

  const logout = async () => {
    try { await logoutUserApi(); } catch { /* Clear local state even if the network is unavailable. */ }
    setUser(null);
    setGuestMode(false);
  };

  const forceSyncNow = async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const { user: updated } = await syncWorkspaceApi({
        saved_video_ids: user.saved_video_ids,
        saved_comparisons: user.saved_comparisons,
        custom_queries: user.custom_queries,
        notification_settings: user.notification_settings,
        device: { ...currentDevice(), last_synced_at: new Date().toISOString() },
      });
      setUser(updated);
      setLastSyncTime(new Date());
      flashSuccess(`Saved ${updated.saved_video_ids.length} videos and ${updated.custom_queries.length} queries to your account.`);
    } catch (error: any) {
      setSyncError(error?.message || 'Sync failed');
      throw error;
    } finally { setIsSyncing(false); }
  };

  const toggleSaveVideo = (videoId: string) => {
    if (!user) return;
    const exists = user.saved_video_ids.includes(videoId);
    setUser({ ...user, saved_video_ids: exists ? user.saved_video_ids.filter((id) => id !== videoId) : [...user.saved_video_ids, videoId] });
  };
  const isVideoSaved = (videoId: string) => Boolean(user?.saved_video_ids.includes(videoId));
  const saveComparison = (videoIds: string[]) => { if (user) setUser({ ...user, saved_comparisons: [...user.saved_comparisons, videoIds] }); };
  const removeComparison = (index: number) => { if (user) setUser({ ...user, saved_comparisons: user.saved_comparisons.filter((_, i) => i !== index) }); };
  const addCustomQuery = (query: Omit<SavedQuery, 'id' | 'created_at'>) => {
    if (!user) return;
    const newQuery: SavedQuery = { ...query, id: `query_${Date.now()}`, created_at: new Date().toISOString().slice(0, 10) };
    setUser({ ...user, custom_queries: [newQuery, ...user.custom_queries] });
  };
  const updateNotificationSettings = (settings: Partial<UserAccount['notification_settings']>) => {
    if (user) setUser({ ...user, notification_settings: { ...user.notification_settings, ...settings } });
  };

  const exportSyncPayload = async (): Promise<string> => {
    if (!user) return '{}';
    const payload = {
      version: 1,
      account_id: user.id,
      exported_at: new Date().toISOString(),
      saved_videos: user.saved_video_ids,
      saved_comparisons: user.saved_comparisons,
      custom_queries: user.custom_queries,
      notification_settings: user.notification_settings,
    };
    const json = JSON.stringify(payload, null, 2);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
    const checksum = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return JSON.stringify({ ...payload, checksum_sha256: checksum }, null, 2);
  };

  const importSyncPayload = (payloadJson: string): boolean => {
    try {
      const parsed = JSON.parse(payloadJson);
      if (!user || !Array.isArray(parsed.saved_videos) || !Array.isArray(parsed.custom_queries)) return false;
      setUser({
        ...user,
        saved_video_ids: parsed.saved_videos.filter((id: unknown) => typeof id === 'string'),
        saved_comparisons: Array.isArray(parsed.saved_comparisons) ? parsed.saved_comparisons : user.saved_comparisons,
        custom_queries: parsed.custom_queries,
        notification_settings: parsed.notification_settings || user.notification_settings,
      });
      flashSuccess('Workspace imported. Use Force Sync to save it to your account.');
      return true;
    } catch { return false; }
  };

  const unlinkDevice = (deviceId: string) => { if (user) setUser({ ...user, connected_devices: user.connected_devices.filter((device) => device.id !== deviceId) }); };
  const renameDevice = (deviceId: string, newName: string) => { if (user) setUser({ ...user, connected_devices: user.connected_devices.map((device) => device.id === deviceId ? { ...device, device_name: newName } : device) }); };

  return (
    <AuthAndSyncContext.Provider value={{ user, isAuthenticated: Boolean(user), isGuest, setGuestMode, isSyncing, lastSyncTime, syncSuccessMessage, syncError, login, signup, demoLogin, logout, forceSyncNow, toggleSaveVideo, isVideoSaved, saveComparison, removeComparison, addCustomQuery, updateNotificationSettings, exportSyncPayload, importSyncPayload, unlinkDevice, renameDevice }}>
      {children}
    </AuthAndSyncContext.Provider>
  );
};

export const useAuthAndSync = () => {
  const context = useContext(AuthAndSyncContext);
  if (!context) throw new Error('useAuthAndSync must be used within an AuthAndSyncProvider');
  return context;
};
