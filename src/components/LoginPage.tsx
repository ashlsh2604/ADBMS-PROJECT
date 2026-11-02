import React, { useState } from 'react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { fetchAppConfig } from '../services/api';
import { 
  ShieldCheck, Lock, Mail, User, Eye, EyeOff, ArrowRight, ArrowLeft, 
  Sparkles, CheckCircle2, Database, Gauge, KeyRound, Smartphone, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginPageProps {
  onNavigateToSignUp: () => void;
  onNavigateToDashboard: (targetTab?: any) => void;
  redirectTo?: string;
  notice?: string;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignUp,
  onNavigateToDashboard,
  redirectTo,
  notice,
  onContinueAsGuest,
}) => {
  const { login, demoLogin, isSyncing } = useAuthAndSync();
  const [demoMode, setDemoMode] = useState(false);

  React.useEffect(() => { fetchAppConfig().then((config) => setDemoMode(config.demoMode)).catch(() => setDemoMode(false)); }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Channel Owner (Ash)' | 'DBMS Lead Architect' | 'Data Analyst' | 'Motovlog Editor'>('Channel Owner (Ash)');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCount, setRedirectCount] = useState(1);

  const destinationName = redirectTo 
    ? (redirectTo === 'dbms' ? 'DBMS SQL Workbench' : redirectTo === 'growth' ? 'Monthly Growth Analytics' : redirectTo === 'compare' ? 'Video Comparison Tool' : redirectTo === 'channels' ? 'Channel Benchmarks' : 'Dashboard')
    : 'Dashboard';

  const triggerRedirect = (target?: string) => {
    setIsRedirecting(true);
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.6 }
    });

    let count = 1;
    const interval = setInterval(() => {
      count -= 1;
      setRedirectCount(Math.max(0, count));
      if (count <= 0) {
        clearInterval(interval);
        onNavigateToDashboard(target || redirectTo || 'dashboard');
      }
    }, 900);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        triggerRedirect();
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (profile: 'owner' | 'architect' | 'editor') => {
    setError(null);
    setIsLoading(true);
    try {
      await demoLogin(profile);
      triggerRedirect();
    } catch (err: any) {
      setError(err?.message || 'Quick demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-6 sm:py-12" id="login-page-container">
      {/* Top Breadcrumb & Return Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateToDashboard}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          id="login-back-to-dashboard-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>AshRides26</span>
          <span>/</span>
          <span>Security</span>
          <span>/</span>
          <span className="text-orange-400 font-bold">Sign In</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="bg-[#0b101d] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Interactive Form (7 cols on lg) */}
          <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Heading */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-inner">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                    Sign In to DBMS Account
                  </h1>
                  <p className="text-xs text-slate-400 font-mono">
                    Motovlog Telemetry & Cross-Device Sync Gateway
                  </p>
                </div>
              </div>

              {/* Notice Banner if redirected or logged out */}
              {notice === 'logged_out' && (
                <div className="mb-5 p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200" id="login-logout-notice">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>You have been safely signed out. Choose a 1-click profile below or enter credentials to sign back in.</span>
                </div>
              )}

              {notice === 'login_required' && (
                <div className="mb-5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200" id="login-required-notice">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Authentication Required: Please sign in to access {destinationName}.</span>
                </div>
              )}

              {notice === 'save_required' && (
                <div className="mb-5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-center gap-2.5 animate-in fade-in duration-200" id="login-save-notice">
                  <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Please sign in to save custom SQL queries, comparisons, and sync telemetry across devices.</span>
                </div>
              )}

              {/* Redirect target indicator */}
              {redirectTo && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-950/30 border border-orange-500/30 text-orange-300 text-xs font-mono">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>After login, you will be redirected to: <strong className="text-white">{destinationName}</strong></span>
                </div>
              )}

              {/* Active Redirection Progress Card */}
              {isRedirecting ? (
                <div className="my-8 p-8 rounded-2xl bg-slate-900/95 border border-orange-500/40 text-center space-y-4 shadow-2xl animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                    Authentication Verified!
                  </h3>
                  <p className="text-xs font-mono text-slate-300">
                    Establishing a secure server session...
                  </p>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full w-full animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-orange-400 pt-2">
                    <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    <span>Redirecting to {destinationName.toUpperCase()} in {redirectCount}s...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToDashboard(redirectTo || 'dashboard')}
                    className="text-xs text-slate-400 hover:text-white underline underline-offset-4 pt-1 font-mono transition"
                  >
                    Click here to redirect immediately →
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick Demo Fill Profiles */}
                  {demoMode && <div className="mb-6 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        1-Click Fast Demo Credentials:
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Auto-signs in & redirects</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('owner')}
                        className="p-2 rounded-lg bg-slate-800/70 hover:bg-orange-950/40 border border-slate-700/60 hover:border-orange-500/40 text-left transition group"
                        id="demo-login-ash"
                      >
                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-orange-400 truncate">Ash (Owner)</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">YZF-R1M • Creator</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemo('architect')}
                        className="p-2 rounded-lg bg-slate-800/70 hover:bg-cyan-950/40 border border-slate-700/60 hover:border-cyan-500/40 text-left transition group"
                        id="demo-login-analyst"
                      >
                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-400 truncate">Elena (Analyst)</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">SQL & Retention</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickDemo('editor')}
                        className="p-2 rounded-lg bg-slate-800/70 hover:bg-amber-950/40 border border-slate-700/60 hover:border-amber-500/40 text-left transition group"
                        id="demo-login-editor"
                      >
                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 truncate">Marcus (Editor)</div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">Shorts & Spikes</div>
                      </button>
                    </div>
                  </div>}

                  {/* Error Notice */}
                  {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                        Email Address <span className="text-orange-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ash@ashrides26.com"
                          required
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                          id="login-email-input"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-300 font-mono">
                          Password <span className="text-orange-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotHint(!showForgotHint)}
                          className="text-[11px] text-orange-400 hover:text-orange-300 font-mono transition"
                        >
                          {showForgotHint ? 'Hide hint' : 'Forgot password?'}
                        </button>
                      </div>

                      {showForgotHint && (
                        <div className="mb-2 p-2.5 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 text-[11px] font-mono space-y-1">
                          <div className="text-amber-400 font-bold">Demo Mode Active:</div>
                          <p>You can enter any password (e.g. <code>demopass123</code>) or click any 1-Click demo profile above for instant authentication.</p>
                        </div>
                      )}

                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                          id="login-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                        Channel / Workspace Role
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as any)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono appearance-none"
                          id="login-role-select"
                        >
                          <option value="Channel Owner (Ash)">Channel Owner (Ash)</option>
                          <option value="DBMS Lead Architect">DBMS Lead Architect</option>
                          <option value="Data Analyst">Data Analyst</option>
                          <option value="Motovlog Editor">Motovlog Editor</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-xs text-slate-300">
                          Remember this browser session
                        </span>
                      </label>

                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-slate-400" />
                        Server session
                      </span>
                    </div>

                    {/* Submit Action */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || isSyncing}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        id="login-submit-btn"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Authenticating with MySQL DBMS...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In & Redirect to {destinationName}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Bottom switch to SignUp & Guest */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 font-mono">
                Don't have an account on AshRides26 DBMS?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="text-orange-400 hover:text-orange-300 font-bold underline underline-offset-4 transition ml-1"
                  id="link-to-signup"
                >
                  Create an account
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={onContinueAsGuest || (() => onNavigateToDashboard('dashboard'))}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono transition inline-flex items-center gap-1.5 hover:underline"
                  id="link-continue-guest"
                >
                  <span>Prefer to explore as guest without logging in?</span>
                  <span className="text-orange-400 font-bold">Continue as Guest Analyst →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Motovlog Channel Showcase (5 cols on lg) */}
          <div className="p-8 sm:p-10 lg:col-span-5 bg-gradient-to-b from-[#0e1628] to-[#070b14] border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Gauge className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white tracking-wide text-sm font-mono">
                  AshRides26 Telemetry
                </span>
              </div>

              {/* Stat card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Primary Channel</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80"
                    alt="AshRides26"
                    className="w-10 h-10 rounded-full object-cover border border-orange-500/40"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">AshRides26 Motovlogs</div>
                    <div className="text-[11px] font-mono text-slate-400">Yamaha R1M & ZX-10R</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <div className="text-slate-400 text-[10px]">Total Subscribers</div>
                    <div className="text-white font-bold">342.8K</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Total Views</div>
                    <div className="text-emerald-400 font-bold">48.9M</div>
                  </div>
                </div>
              </div>

              {/* Feature bullet list */}
              <div className="space-y-3 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  DBMS Project Features
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>MySQL 8.0 Engine</strong>: 3NF normalized video performance and retention telemetry tables.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Cross-Device Sync</strong>: Saved video comparisons and custom queries sync automatically.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Audience Drop Curves</strong>: Second-by-second viewer engagement diagnostics.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Realtime Push Alerts</strong>: Algorithm surge detection and viral short notifications.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote / Security badge */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>Server-side session</span>
              </div>
              <span>HttpOnly session cookie with server-side session lookup and expiry.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
