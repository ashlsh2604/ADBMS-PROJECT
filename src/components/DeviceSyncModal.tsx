import React, { useState } from 'react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  Laptop, Smartphone, HardDrive, RefreshCw, CheckCircle2, ShieldCheck, 
  Download, Upload, X, Copy, Check, Trash2, Edit2, Sparkles, Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    isSyncing, 
    lastSyncTime, 
    syncSuccessMessage, 
    forceSyncNow, 
    exportSyncPayload, 
    importSyncPayload, 
    unlinkDevice,
    renameDevice 
  } = useAuthAndSync();

  const [activeTab, setActiveTab] = useState<'devices' | 'backup'>('devices');
  const [copied, setCopied] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');

  if (!isOpen || !user) return null;

  const handleForceSync = async () => {
    await forceSyncNow();
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 }
    });
  };

  const handleCopyPayload = () => {
    const payload = exportSyncPayload();
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    const ok = importSyncPayload(importJson);
    if (ok) {
      setImportStatus('Replication successful! Data merged from imported checkpoint.');
      setImportJson('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus('Invalid JSON format. Please verify the sync token.');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-amber-400" />;
      case 'tablet':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      default:
        return <Laptop className="w-5 h-5 text-orange-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="device-sync-modal-root">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0c1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top telemetry band */}
        <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-orange-500 h-1 w-full" />

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Cross-Device Data Synchronization
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time DBMS state replication across {user.connected_devices.length} paired hardware devices
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              id="sync-modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sync status summary card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Replication Checkpoint</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Last Synced: {lastSyncTime.toLocaleTimeString()} ({lastSyncTime.toLocaleDateString()})
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleForceSync}
                disabled={isSyncing}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/10 flex items-center gap-2 transition disabled:opacity-50"
                id="force-sync-action-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Replicating...' : 'Force Sync Now'}</span>
              </button>
            </div>
          </div>

          {syncSuccessMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
          )}

          {/* Synchronized Inventory Summary */}
          <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="text-lg font-bold font-mono text-amber-400">{user.saved_video_ids.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Saved Videos</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="text-lg font-bold font-mono text-cyan-400">{user.saved_comparisons.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Comparisons</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="text-lg font-bold font-mono text-orange-400">{user.custom_queries.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">SQL Queries</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-4">
            <button
              onClick={() => setActiveTab('devices')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'devices'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Connected Hardware Devices ({user.connected_devices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'backup'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>JSON Backup & Portability</span>
            </button>
          </div>

          {/* Devices List Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {user.connected_devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    device.is_current
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-md'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0">
                      {getDeviceIcon(device.device_type)}
                    </div>
                    <div className="min-w-0">
                      {editingDeviceId === device.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingDeviceName}
                            onChange={(e) => setEditingDeviceName(e.target.value)}
                            className="bg-slate-800 border border-orange-500 rounded px-2 py-0.5 text-xs text-white"
                          />
                          <button
                            onClick={() => {
                              renameDevice(device.id, editingDeviceName);
                              setEditingDeviceId(null);
                            }}
                            className="text-xs text-emerald-400 font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {device.device_name}
                          </h4>
                          {device.is_current && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              THIS DEVICE
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{device.os} • {device.browser}</span>
                        <span>•</span>
                        <span>{device.ip_location}</span>
                        <span>•</span>
                        <span className="text-emerald-400">{device.last_synced_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingDeviceId(device.id);
                        setEditingDeviceName(device.device_name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      title="Rename Device"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!device.is_current && (
                      <button
                        onClick={() => unlinkDevice(device.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition"
                        title="Unlink Device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Backup & Portability Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Export */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-orange-400" />
                    Export Sync Checkpoint
                  </span>
                  <button
                    onClick={handleCopyPayload}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied JSON!' : 'Copy Payload'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Export complete saved videos, custom SQL queries, and comparison presets into a portable cryptographic JSON payload.
                </p>
              </div>

              {/* Import */}
              <form onSubmit={handleImportSubmit} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Import / Restore Sync Token
                </span>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder="Paste JSON sync checkpoint here..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                {importStatus && (
                  <p className="text-[11px] font-mono text-emerald-300">{importStatus}</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Merge & Replicate
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
