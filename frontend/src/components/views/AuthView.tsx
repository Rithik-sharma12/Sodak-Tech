import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Terminal, Shield, Eye, EyeOff, CheckCircle2, Lock, 
  Mail, User, ArrowRight, Sparkles
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, authError, authPending, theme } = useApp();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  
  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [signUpName, setSignUpName] = useState('');
  const [signUpHandle, setSignUpHandle] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpNotice, setSignUpNotice] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    // login() sets the session cookie, loads the profile, and routes to the
    // dashboard. It throws on bad credentials; the error surfaces via authError
    // so the form does not need its own error state.
    try {
      await login(email, password);
    } catch {
      /* authError already carries the message */
    }
  };

  // Self-registration has no backend endpoint yet. Rather than fake an
  // account that vanishes on reload, the form says so plainly.
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpNotice(
      'Self-registration is not enabled yet. Ask an administrator to create your account.',
    );
  };

  return (
    <div className="min-h-full flex items-center justify-center py-10 px-4">
      <div className={`border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        
        {/* Left Value Prop Panel (5 Cols) */}
        <div className={`p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border-zinc-800' 
            : 'bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 border-slate-200 text-white'
        }`}>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="font-black text-white text-base tracking-tight">
                SODAK<span className="text-blue-400">-TECH</span>
              </span>
            </div>

            <div className="space-y-2 pt-4">
              <h2 className="text-xl font-black text-white tracking-tight leading-snug">
                Practice. Compete. Master Algorithms.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Join Sodak University's official online judge. Access 300+ problems, live weekly challenges, real-time code execution, and university leaderboard standings.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs text-slate-200 font-bold">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-language Sandboxed Judge Engine</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Weekly Live University Contests</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Detailed Editorial Solutions & Data Structures</span>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-400 font-mono font-bold relative z-10">
            Sodak Dept. of Computer Science
          </div>
        </div>

        {/* Right Form Panel (7 Cols) */}
        <div className={`p-8 space-y-6 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
          
          {/* Sign In vs Sign Up Tabs */}
          <div className={`flex items-center justify-between border-b pb-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <div className={`flex items-center space-x-1 p-1.5 rounded-2xl border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setMode('signin')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signin' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mode === 'signup' 
                    ? 'bg-blue-600 text-white shadow-2xs' 
                    : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                Create Account
              </button>
            </div>

            <span className="text-[11px] opacity-60 font-mono font-bold">CS Portal Access</span>
          </div>

          {/* Form Content */}
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              {authError && (
                <div
                  role="alert"
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    isDark
                      ? 'border-red-900/60 bg-red-950/40 text-red-300'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {authError}
                </div>
              )}
              <div>
                <label className="block font-bold mb-1.5 opacity-90">University Email / Handle</label>
                <div className="relative">
                  <Mail className="w-4 h-4 opacity-50 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full border rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                    }`}
                    placeholder="student@sodak.edu"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-bold opacity-90">Password</label>
                  <a href="#forgot" className="text-[11px] text-blue-600 dark:text-indigo-400 hover:underline font-bold">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 opacity-50 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full border rounded-2xl pl-10 pr-10 py-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 opacity-50 hover:opacity-100"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input type="checkbox" id="remember" className="rounded text-blue-600 focus:ring-0" defaultChecked />
                <label htmlFor="remember" className="opacity-70 text-[11px]">Remember login session</label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.01]"
               disabled={authPending}>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className={`pt-4 text-center border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className={`w-full py-2.5 rounded-2xl border font-bold flex items-center justify-center space-x-2 text-xs transition-colors shadow-2xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo Quick Login (Priya Sharma)</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4 text-xs">
              {signUpNotice && (
                <div
                  role="status"
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    isDark
                      ? 'border-amber-900/60 bg-amber-950/40 text-amber-300'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {signUpNotice}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1.5 opacity-90">Full Name</label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    placeholder="Alex Chen"
                    className={`w-full border rounded-2xl p-2.5 focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="font-bold opacity-90">Handle</label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Available</span>
                  </div>
                  <input
                    type="text"
                    value={signUpHandle}
                    onChange={e => setSignUpHandle(e.target.value)}
                    placeholder="achen99"
                    className={`w-full border rounded-2xl p-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1.5 opacity-90">University Email</label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={e => setSignUpEmail(e.target.value)}
                  placeholder="achen@sodak.edu"
                  className={`w-full border rounded-2xl p-2.5 focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-bold opacity-90">Password</label>
                  <span className="text-[10px] text-blue-600 dark:text-indigo-400 font-mono font-bold">Strength: Good</span>
                </div>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={e => setSignUpPassword(e.target.value)}
                  className={`w-full border rounded-2xl p-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.01]"
              >
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
