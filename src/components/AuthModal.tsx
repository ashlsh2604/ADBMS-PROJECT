import React, { useEffect, useState } from 'react';
import { fetchAppConfig } from '../services/api';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  ShieldCheck, Lock, Mail, User, KeyRound, Smartphone, CheckCircle2, 
  ArrowRight, X, Sparkles, RefreshCw, Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullPage?: (mode: 'login' | 'signup') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenFullPage }) => {
  const { login, signup, demoLogin, isSyncing } = useAuthAndSync();
  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => { fetchAppConfig().then((c) => setDemoMode(c.demoMode)).catch(() => setDemoMode(false)); }, []);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('Data Analyst');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name) {
          setError('Please provide your name');
          return;
        }
        await signup(name, email, password, role);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleQuickDemoLogin = async (profile: 'owner' | 'architect') => {
    setError(null);
    try {
      await demoLogin(profile);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 }
    });
    onClose();
    } catch (err: any) { setError(err?.message || 'Demo login failed'); }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="auth-modal-root">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md bg-[#0c1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top telemetry band */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-cyan-500 h-1 w-full" />

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {mode === 'login' ? 'Channel DBMS Login' : 'Create DBMS Account'}
                </h3>
                <p className="text-xs text-slate-400">
                  Cross-Device Sync & Telemetry Security
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              id="auth-modal-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="auth-tab-login"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="auth-tab-signup"
            >
              Register New Account
            </button>
          </div>

          {/* Quick 1-Click Evaluation Presets */}
          {demoMode && <div className="mb-6 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Quick 1-Click Evaluation Sign-In:
              </span>
              <span className="text-emerald-400">Ready</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('owner')}
                className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-orange-500/30 hover:border-orange-500/60 rounded-lg text-xs transition group"
                id="demo-login-ash"
              >
                <div className="font-bold text-white group-hover:text-amber-300">🏍️ Ash (Owner)</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">Full Channel Admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('architect')}
                className="p-2 text-left bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500/60 rounded-lg text-xs transition group"
                id="demo-login-analyst"
              >
                <div className="font-bold text-white group-hover:text-cyan-300">📊 DBMS Architect</div>
                <div className="text-[10px] text-slate-400 font-mono truncate">SQL & Schema Lead</div>
              </button>
            </div>
          </div>}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name / Call-Sign
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ash Rider"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Channel / Academic Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ashrides26.motovlog"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Access Key / Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                System Role & DBMS Access Tier
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              >
                <option value="Data Analyst">Data Analyst</option>
                <option value="Motovlog Editor">Motovlog Editor</option>
              </select>
            </div>

            {/* Sync security checklist */}
            <div className="pt-2 pb-1 text-[11px] text-slate-400 space-y-1.5 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Device Sync Checkpoint Handshake enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Passwords are salted and hashed with scrypt</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
              id="auth-submit-btn"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing Session State...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Authenticate & Synchronize' : 'Create & Link Devices'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onOpenFullPage && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFullPage(mode);
                  }}
                  className="text-xs font-mono text-slate-400 hover:text-orange-400 transition underline underline-offset-4"
                  id="auth-open-full-page-btn"
                >
                  Prefer dedicated full-screen page? Open {mode === 'login' ? 'Login Page' : 'Sign Up Page'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
