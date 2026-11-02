import React, { useState } from 'react';
import { useAuthAndSync } from '../context/AuthAndSyncContext';
import { 
  UserPlus, Lock, Mail, User, Eye, EyeOff, ArrowRight, ArrowLeft, 
  Sparkles, CheckCircle2, Database, Gauge, KeyRound, Smartphone, AlertCircle, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SignUpPageProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: (targetTab?: any) => void;
  redirectTo?: string;
  onContinueAsGuest?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard,
  redirectTo,
  onContinueAsGuest,
}) => {
  const { signup, isSyncing } = useAuthAndSync();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Channel Owner (Ash)' | 'DBMS Lead Architect' | 'Data Analyst' | 'Motovlog Editor'>('Data Analyst');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [enableSync, setEnableSync] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCount, setRedirectCount] = useState(1);

  const destinationName = redirectTo 
    ? (redirectTo === 'dbms' ? 'DBMS SQL Workbench' : redirectTo === 'growth' ? 'Monthly Growth Analytics' : redirectTo === 'compare' ? 'Video Comparison Tool' : redirectTo === 'channels' ? 'Channel Benchmarks' : 'Dashboard')
    : 'Dashboard';

  const triggerRedirect = () => {
    setIsRedirecting(true);
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 }
    });

    let count = 1;
    const interval = setInterval(() => {
      count -= 1;
      setRedirectCount(Math.max(0, count));
      if (count <= 0) {
        clearInterval(interval);
        onNavigateToDashboard(redirectTo || 'dashboard');
      }
    }, 900);
  };

  // Compute password strength score (0 to 4)
  const passwordStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  })();

  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-slate-700',
    'bg-red-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-emerald-500',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name or creator handle.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid work or channel email.');
      return;
    }
    if (!password) {
      setError('Please choose a password.');
      return;
    }
    if (password.length < 8) {
      setError('Password should be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the DBMS Telemetry and Data Protection terms.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await signup(name, email, password, role);
      if (success) {
        triggerRedirect();
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your data and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSampleFill = () => {
    const randomNum = Math.floor(Math.random() * 900 + 100);
    setName(`Alex Vance #${randomNum}`);
    setEmail(`alex.vance${randomNum}@ashrides26.com`);
    setPassword('AshRides2026!');
    setConfirmPassword('AshRides2026!');
    setRole('Data Analyst');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-6 sm:py-12" id="signup-page-container">
      {/* Top Breadcrumb & Return Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateToDashboard}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700"
          id="signup-back-to-dashboard-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span>AshRides26</span>
          <span>/</span>
          <span>Security</span>
          <span>/</span>
          <span className="text-orange-400 font-bold">Sign Up</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full px-4">
        <div className="bg-[#0b101d] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Sign Up Form (7 cols on lg) */}
          <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Heading */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-inner">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                      Create DBMS Account
                    </h1>
                    <p className="text-xs text-slate-400 font-mono">
                      Personalized Analytics & Multi-Device Sync
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickSampleFill}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-amber-400 transition"
                  title="Auto-fill with sample creator profile"
                  id="signup-quick-sample-fill-btn"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Fill Sample</span>
                </button>
              </div>

              {/* Target Redirect Indicator */}
              {redirectTo && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-950/30 border border-orange-500/30 text-orange-300 text-xs font-mono">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>After account creation, you will be redirected to: <strong className="text-white">{destinationName}</strong></span>
                </div>
              )}

              {/* Active Redirection Progress Card */}
              {isRedirecting ? (
                <div className="my-8 p-8 rounded-2xl bg-slate-900/95 border border-orange-500/40 text-center space-y-4 shadow-2xl animate-in fade-in duration-300">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans']">
                    Account Created Successfully!
                  </h3>
                  <p className="text-xs font-mono text-slate-300">
                    Registering device session in MySQL 8.0 & provisioning workspace...
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
                  {/* Error Alert */}
                  {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4" id="signup-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Full Name / Handle <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ash Carter"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                        id="signup-name-input"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Channel / Work Email <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@ashrides26.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                        id="signup-email-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                    Workspace Role & Permissions
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                    id="signup-role-select"
                  >
                    <option value="Channel Owner (Ash)">Channel Owner (Ash) - Full Channel & MySQL Admin</option>
                    <option value="DBMS Lead Architect">DBMS Lead Architect - SQL Optimization & Index Tuning</option>
                    <option value="Data Analyst">Data Analyst - Retention Diagnostics & Benchmark Queries</option>
                    <option value="Motovlog Editor">Motovlog Editor - Video Timestamps & Spikes Telemetry</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Password <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition font-mono"
                        id="signup-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength meter */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength >= step ? strengthColors[passwordStrength] : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span>Strength:</span>
                          <span className={passwordStrength >= 3 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                            {strengthLabels[passwordStrength]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                      Confirm Password <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        required
                        className={`w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none transition font-mono ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-slate-700/80 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                        }`}
                        id="signup-confirm-password-input"
                      />
                    </div>
                    {confirmPassword && confirmPassword === password && (
                      <div className="mt-1.5 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableSync}
                      onChange={(e) => setEnableSync(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs text-slate-300">
                      Enable <strong>Cross-Device Session Synchronization</strong> (auto-sync saved queries, comparisons, and alert filters).
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-xs text-slate-300">
                      I agree to the <strong>DBMS Telemetry & Security Protocols</strong> for YouTube channel performance data.
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading || isSyncing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    id="signup-submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Registering user with MySQL DBMS...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Redirect to {destinationName}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
              </>
            )}
            </div>

            {/* Bottom switch to Login & Guest */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400 font-mono">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-orange-400 hover:text-orange-300 font-bold underline underline-offset-4 transition ml-1"
                  id="link-to-login"
                >
                  Sign In
                </button>
              </p>

              <div>
                <button
                  type="button"
                  onClick={onContinueAsGuest || (() => onNavigateToDashboard('dashboard'))}
                  className="text-xs text-slate-500 hover:text-slate-300 font-mono transition inline-flex items-center gap-1.5 hover:underline"
                  id="link-continue-guest-signup"
                >
                  <span>Prefer to explore as guest without registering?</span>
                  <span className="text-orange-400 font-bold">Continue as Guest Analyst →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Account Benefits (5 cols on lg) */}
          <div className="p-8 sm:p-10 lg:col-span-5 bg-gradient-to-b from-[#0e1628] to-[#070b14] border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white tracking-wide text-sm font-mono">
                  Personalized Account Benefits
                </span>
              </div>

              {/* Benefits list */}
              <div className="space-y-4 mb-6 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-2 mb-1">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Personalized SQL Queries</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Save and catalog complex SQL aggregations, EXPLAIN cost plans, and custom motovlog telemetry filters directly in MySQL.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-2 mb-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cross-Device State Sync</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Save your workspace to your account and sync it explicitly across browsers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="font-bold text-white flex items-center gap-2 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-orange-400" />
                    <span>Tailored Push Alerts</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Configure custom velocity multipliers (e.g. 3.0x threshold) to receive instant alerts when your videos hit YouTube's Browse recommendations.
                  </p>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>MySQL 8.0 ACID Compliant</span>
              </div>
              <span>Accounts are stored with normalized integrity constraints and unique email indexing.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
