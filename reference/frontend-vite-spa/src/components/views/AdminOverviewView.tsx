import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Shield, AlertTriangle, Users, FileCode, CheckCircle2, 
  BarChart3, Plus, ArrowRight, Activity, Clock
} from 'lucide-react';

export const AdminOverviewView: React.FC = () => {
  const { setActiveTab, role, problems, submissions, theme } = useApp();
  const isDark = theme === 'dark';

  const auditLogs = [
    { id: 1, user: 'Dr. Vance (Super Admin)', action: 'Published new problem "Optimal Wooden Partition"', time: '2 hours ago' },
    { id: 2, user: 'Prof. Miller (Admin)', action: 'Scheduled Weekly Challenge #143 for next Friday', time: '5 hours ago' },
    { id: 3, user: 'Sarah Chen (Contest Manager)', action: 'Updated standings freeze window for Challenge #142', time: '1 day ago' },
    { id: 4, user: 'Alexey Ivanov (Problem Setter)', action: 'Added 12 hidden test cases to "Two Sum II"', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6 pb-12 text-xs">
      
      {/* Permanent Warning Banner */}
      <div className={`border-2 rounded-3xl p-5 flex items-center space-x-3 shadow-xl ${
        isDark ? 'bg-amber-950/50 border-amber-600/60 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div className="leading-relaxed font-medium">
          <span className="font-bold text-amber-600 dark:text-amber-300">Admin Judging Warning:</span> Code evaluation is executed within sandboxed Linux Docker runners. Ensure custom test case inputs and outputs adhere strictly to Sodak OJ standard IO specifications.
        </div>
      </div>

      {/* Admin Subnav Bento Box */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border rounded-3xl p-5 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-base font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Sodak OJ Admin Control Center</h1>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
              {role}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('admin-new-problem')}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Problem</span>
          </button>

          <button
            onClick={() => setActiveTab('admin-users')}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 transition-colors border shadow-2xs ${
              isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 opacity-70" />
            <span>User Management</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border rounded-3xl p-5 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="opacity-60 font-black uppercase text-[10px] tracking-widest mb-1">Registered Coders</div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>128</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">+14 new this month</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="opacity-60 font-black uppercase text-[10px] tracking-widest mb-1">Total Problems</div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{problems.length}</div>
          <div className="text-[10px] text-blue-600 dark:text-indigo-400 font-bold mt-1">34 Published • 2 Drafts</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="opacity-60 font-black uppercase text-[10px] tracking-widest mb-1">Evaluated Submissions</div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>2,451</div>
          <div className="text-[10px] opacity-70 font-bold mt-1">Avg Judge Latency: 42ms</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="opacity-60 font-black uppercase text-[10px] tracking-widest mb-1">Active Contests</div>
          <div className={`text-3xl font-black font-mono ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>1</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Weekly #142 (184 Users)</div>
        </div>

      </div>

      {/* Main Grid: Verdict Distribution + Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Verdict Distribution (6 Cols) */}
        <div className={`lg:col-span-6 border rounded-3xl p-6 space-y-4 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <span>Global Verdict Distribution</span>
          </h3>

          <div className="space-y-4 font-mono">
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Accepted (64.2%)</span>
                <span className="opacity-60">1,573 submissions</span>
              </div>
              <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200 shadow-2xs'
              }`}>
                <div className="h-full bg-emerald-500 rounded-full w-[64.2%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-rose-600 dark:text-rose-400">Wrong Answer (22.5%)</span>
                <span className="opacity-60">551 submissions</span>
              </div>
              <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200 shadow-2xs'
              }`}>
                <div className="h-full bg-rose-500 rounded-full w-[22.5%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-amber-600 dark:text-amber-400">Time Limit Exceeded (9.8%)</span>
                <span className="opacity-60">240 submissions</span>
              </div>
              <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200 shadow-2xs'
              }`}>
                <div className="h-full bg-amber-500 rounded-full w-[9.8%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5 font-bold">
                <span className="text-purple-600 dark:text-purple-400">Compilation Error (3.5%)</span>
                <span className="opacity-60">87 submissions</span>
              </div>
              <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200 shadow-2xs'
              }`}>
                <div className="h-full bg-purple-500 rounded-full w-[3.5%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Feed (6 Cols) */}
        <div className={`lg:col-span-6 border rounded-3xl p-6 space-y-4 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Recent Admin Audit Log</span>
          </h3>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className={`p-4 rounded-2xl border space-y-1 ${
                isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{log.user}</span>
                  <span className="text-[10px] opacity-60 font-mono">{log.time}</span>
                </div>
                <p className="opacity-70 text-[11px] leading-relaxed">{log.action}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
