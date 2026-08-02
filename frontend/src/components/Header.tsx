import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Terminal, Search, Bell, Trophy, Shield, User, Settings, LogOut, 
  ChevronDown, Flame, Sparkles, Check, BookOpen, AlertCircle, Sun, Moon
} from 'lucide-react';
import { Role } from '../types';

export const Header: React.FC = () => {
  const { 
    user, role, setRole, activeTab, setActiveTab, 
    setSearchModalOpen, isLoggedIn, setIsLoggedIn,
    setEditProfileModalOpen, theme, toggleTheme
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  const notifications = [
    { id: 1, title: 'Verdict Update', message: 'Submission #a3f9c2e1 on Two Sum was Accepted!', time: '12m ago', unread: true },
    { id: 2, title: 'Contest Starting Soon', message: 'Sodak Weekly Challenge #142 is now LIVE!', time: '1h ago', unread: true },
    { id: 3, title: 'Rating Update', message: 'Your rating changed +42 in Challenge #141', time: '2 days ago', unread: false },
  ];

  const rolesList: Role[] = ['Student', 'Problem Setter', 'Contest Manager', 'Admin', 'Super Admin'];

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b backdrop-blur-md ${
      isDark 
        ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-xl' 
        : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Logo & Navigation Links */}
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-3 group text-left focus:outline-none"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform border border-indigo-400/30">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-300">
                    SODAK<span className="text-indigo-400">-TECH</span>
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    OJ
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium leading-none">University Practice Platform</p>
              </div>
            </button>

            {/* Nav Links */}
            <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-2xl border ${
              isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-slate-100/80 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'dashboard' 
                    ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200/80') 
                    : (isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('problems')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'problems' || activeTab === 'problem-detail'
                    ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200/80') 
                    : (isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
                }`}
              >
                Practice
              </button>

              <button
                onClick={() => setActiveTab('contests')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'contests' || activeTab === 'contest-detail'
                    ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200/80') 
                    : (isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
                }`}
              >
                <span>Contests</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'leaderboard' 
                    ? (isDark ? 'bg-zinc-800 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm border border-slate-200/80') 
                    : (isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/40' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50')
                }`}
              >
                Leaderboard
              </button>

              {/* Admin Portal Tab */}
              {(role === 'Admin' || role === 'Super Admin' || role === 'Problem Setter' || role === 'Contest Manager') && (
                <button
                  onClick={() => setActiveTab('admin-overview')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    activeTab.startsWith('admin')
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                      : (isDark ? 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10' : 'text-amber-600 hover:bg-amber-50')
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Cmd+K Search Bar Trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className={`hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isDark 
                  ? 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search problems, users...</span>
              <kbd className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-white border-slate-300 text-slate-500 shadow-2xs'
              }`}>
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Icon */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Fast Sun/Moon Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700 hover:text-amber-300 shadow-sm'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900 shadow-2xs'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 fill-amber-400/20" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Role Switcher Pill for Demo Flexibility */}
            <div className="relative">
              <button
                onClick={() => setRoleOpen(!roleOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  isDark
                    ? 'bg-indigo-950/60 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/60'
                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Shield className="w-3 h-3 text-blue-500" />
                <span>{role}</span>
                <ChevronDown className="w-3 h-3 text-blue-500" />
              </button>

              {roleOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl py-2 z-50 text-xs ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Switch Active Role
                  </div>
                  {rolesList.map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setRoleOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        role === r 
                          ? (isDark ? 'text-indigo-400 font-bold bg-indigo-950/30' : 'text-blue-600 font-bold bg-blue-50') 
                          : (isDark ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-700 hover:bg-slate-100')
                      }`}
                    >
                      <span>{r}</span>
                      {role === r && <Check className="w-3.5 h-3.5 text-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`relative p-2 rounded-xl transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-zinc-900"></span>
              </button>

              {notificationsOpen && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl py-2 z-50 text-xs ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${
                    isDark ? 'border-zinc-800' : 'border-slate-200'
                  }`}>
                    <span className="font-bold">Notifications</span>
                    <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className={`divide-y max-h-64 overflow-y-auto ${
                    isDark ? 'divide-zinc-800/60' : 'divide-slate-100'
                  }`}>
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 transition-colors ${
                        isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between font-medium">
                          <span>{n.title}</span>
                          <span className="text-[10px] opacity-60">{n.time}</span>
                        </div>
                        <p className="opacity-70 mt-1 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center space-x-2.5 p-1 rounded-2xl transition-colors ${
                    isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100'
                  }`}
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-blue-500/40"
                  />
                  <div className="hidden sm:block text-left">
                    <div className={`text-xs font-bold leading-tight ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{user.name}</div>
                    <div className="text-[10px] text-blue-600 font-mono font-medium">Rating: {user.rating}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 hidden sm:block" />
                </button>

                {profileOpen && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl py-2 z-50 text-xs ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <div className={`px-4 py-2.5 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <p className="font-bold">{user.name}</p>
                      <p className="opacity-60 font-mono text-[11px]">@{user.handle}</p>
                      <div className={`mt-2 flex items-center justify-between pt-1 border-t text-[11px] ${
                        isDark ? 'border-zinc-800/80' : 'border-slate-100'
                      }`}>
                        <span className="opacity-60">Contest Rating</span>
                        <span className="font-mono font-bold text-blue-600">{user.rating} pts</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setProfileOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <User className="w-4 h-4 opacity-60" />
                        <span>My Profile & Stats</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setProfileOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center space-x-2 transition-colors ${
                          isDark ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Settings className="w-4 h-4 opacity-60" />
                        <span>Preferences & Settings</span>
                      </button>

                      {(role === 'Admin' || role === 'Super Admin') && (
                        <button
                          onClick={() => {
                            setActiveTab('admin-overview');
                            setProfileOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 flex items-center space-x-2 text-amber-500 hover:bg-amber-500/10"
                        >
                          <Shield className="w-4 h-4 text-amber-500" />
                          <span>Admin Control Panel</span>
                        </button>
                      )}
                    </div>

                    <div className={`border-t pt-1 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                      <button
                        onClick={() => {
                          setIsLoggedIn(false);
                          setActiveTab('auth');
                          setProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 flex items-center space-x-2 text-rose-500 hover:bg-rose-500/10"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('auth')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-md shadow-indigo-600/30"
              >
                Sign In / Register
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
