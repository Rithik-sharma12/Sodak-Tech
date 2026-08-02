import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Flame, CheckCircle2, Trophy, Target, ArrowUpRight, Play, 
  BarChart3, Activity, Clock, ChevronRight, Zap, Sparkles
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, submissions, navigateToProblem, navigateToSubmission, setActiveTab, theme } = useApp();
  const isDark = theme === 'dark';

  const recommendedProblems = [
    { id: 'course-schedule-ii', title: 'Course Schedule II', difficulty: 'Medium', topics: ['Graph Theory', 'Arrays'], acceptance: '51.8%' },
    { id: 'network-delay-time', title: 'Network Delay Time', difficulty: 'Medium', topics: ['Graph Theory'], acceptance: '53.4%' },
    { id: 'coin-change', title: 'Coin Change', difficulty: 'Medium', topics: ['Dynamic Programming'], acceptance: '42.1%' },
  ];

  const weeklyActivity = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 7 },
    { day: 'Wed', count: 3 },
    { day: 'Thu', count: 8 },
    { day: 'Fri', count: 2 },
    { day: 'Sat', count: 11 },
    { day: 'Sun', count: 5 },
  ];

  const maxWeeklyCount = Math.max(...weeklyActivity.map(w => w.count));

  return (
    <div className="space-y-6 pb-12">
      
      {/* Bento Grid Top Hero Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border-4 border-slate-900/10 dark:border-zinc-900 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl text-white">
        <div className="absolute -right-10 -top-10 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -bottom-10 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white shadow-sm">
                Sodak University OJ
              </span>
              <span className="text-xs text-indigo-100 font-medium">• Fall Semester 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-sm text-indigo-100 mt-1 max-w-xl leading-relaxed">
              You are on a <span className="text-amber-300 font-extrabold">{user.streakDays}-day problem solving streak</span>! Keep pushing your algorithm mastery and competitive rating.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-zinc-950/40 backdrop-blur-xl p-4 rounded-2xl border border-white/15 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center border border-amber-400/40">
              <Flame className="w-7 h-7 fill-amber-300" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-indigo-200 tracking-wider">Current Streak</div>
              <div className="text-xl font-black text-white font-mono tracking-tight">{user.streakDays} Days Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Bento Card 1: Problems Solved */}
        <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest">Problems Solved</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {user.problemsSolved.easy + user.problemsSolved.medium + user.problemsSolved.hard}
              <span className="text-xs opacity-50 font-normal ml-1.5">/ 312</span>
            </div>
            <div className={`mt-3 text-[11px] flex items-center space-x-2 pt-2 border-t ${
              isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user.problemsSolved.easy} Easy</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{user.problemsSolved.medium} Med</span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{user.problemsSolved.hard} Hard</span>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Highlight Accent (Accuracy Rate) */}
        <div className={`rounded-3xl p-6 flex flex-col justify-between shadow-xl ${
          isDark ? 'bg-zinc-100 text-zinc-950' : 'bg-blue-50/90 border border-blue-200 text-blue-950'
        }`}>
          <div className="flex items-center justify-between mb-3 opacity-80">
            <span className="text-[10px] font-black uppercase tracking-widest">Accuracy Rate</span>
            <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">68.4%</div>
            <p className="mt-2 text-[11px] font-semibold opacity-90">
              Top <span className="font-black text-blue-600 dark:text-indigo-700">12%</span> accuracy among CS candidates
            </p>
          </div>
        </div>

        {/* Bento Card 3: Contest Rating */}
        <div className={`border rounded-3xl p-6 flex flex-col justify-between transition-all shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest">Contest Rating</span>
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.rating}</div>
            <p className="mt-2 text-[11px] opacity-70">
              Global Rank <span className="font-mono font-bold">#{user.globalRank}</span> (Candidate Master)
            </p>
          </div>
        </div>

        {/* Bento Card 4: Highlight Emerald Accent (Live Contests) */}
        <div className="bg-emerald-500 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-3 opacity-90">
            <span className="text-[10px] font-black uppercase tracking-widest">Live Status</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-mono tracking-tight">{user.contestsAttended} <span className="text-xs font-normal opacity-80">Contests</span></div>
            <p className="mt-2 text-[11px] font-bold flex items-center space-x-1 opacity-90">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next Challenge Today @ 14:00</span>
            </p>
          </div>
        </div>

      </div>

      {/* Middle Bento Row: Activity Bar & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Weekly Activity & Topic Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bento Box: Weekly Submissions Bar Chart */}
          <div className={`border rounded-3xl p-6 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Weekly Activity</h3>
                  <p className="text-[11px] opacity-60">Total 40 submissions logged this week</p>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-black text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                Live Analytics
              </span>
            </div>

            <div className="flex items-end justify-between h-40 pt-6 px-3 gap-3">
              {weeklyActivity.map((w, i) => {
                const heightPct = Math.max(15, Math.round((w.count / maxWeeklyCount) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <span className="text-[10px] font-mono font-bold opacity-60 mb-1 group-hover:opacity-100 transition-opacity">
                      {w.count}
                    </span>
                    <div className={`w-full rounded-2xl overflow-hidden flex items-end h-32 p-1 border ${
                      isDark ? 'bg-zinc-950/90 border-zinc-800/60' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-xl group-hover:from-blue-500 group-hover:to-indigo-400 transition-all shadow-md"
                      />
                    </div>
                    <span className="text-[11px] font-bold opacity-75 mt-2">{w.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bento Box: Topic Mastery Progress Bars */}
          <div className={`border rounded-3xl p-6 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Topic Mastery Breakdown</h3>
              </div>
              <button 
                onClick={() => setActiveTab('problems')}
                className="text-[11px] text-blue-600 hover:underline font-bold flex items-center space-x-1"
              >
                <span>View all topics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {user.topicMastery.map((tm, idx) => (
                <div key={idx} className={`space-y-1.5 p-3 rounded-2xl border ${
                  isDark ? 'bg-zinc-950/60 border-zinc-800/60' : 'bg-slate-50 border-slate-200/80'
                }`}>
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDark ? 'text-zinc-200' : 'text-slate-800'}>{tm.topic}</span>
                    <span className="font-mono opacity-60">{tm.percentage}% ({tm.solved} solved)</span>
                  </div>
                  <div className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 ${
                    isDark ? 'bg-zinc-800/80' : 'bg-slate-200'
                  }`}>
                    <div 
                      style={{ width: `${tm.percentage}%` }}
                      className={`h-full rounded-full transition-all ${
                        tm.percentage > 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                        tm.percentage > 50 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                        'bg-gradient-to-r from-amber-500 to-orange-400'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Recent Submissions Bento Card */}
        <div className={`border rounded-3xl p-6 flex flex-col justify-between shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-zinc-800' : 'bg-slate-100'
                }`}>
                  <Clock className="w-4 h-4 opacity-60" />
                </div>
                <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Recent Submissions</h3>
              </div>
              <span className="text-[10px] opacity-60 font-mono">Live Sync</span>
            </div>

            <div className="space-y-2.5">
              {submissions.slice(0, 4).map(sub => (
                <button
                  key={sub.id}
                  onClick={() => navigateToSubmission(sub.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all group ${
                    isDark 
                      ? 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50' 
                      : 'bg-slate-50 border-slate-200 hover:border-blue-300 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold transition-colors ${
                      isDark ? 'text-zinc-200 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      {sub.problemTitle}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      sub.verdict === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      sub.verdict === 'Wrong Answer' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    }`}>
                      {sub.verdict}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono opacity-60">
                    <span className="uppercase font-bold">{sub.language}</span>
                    <span>{sub.runtimeMs}ms</span>
                    <span>{sub.submittedAt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`pt-5 border-t mt-5 ${isDark ? 'border-zinc-800/80' : 'border-slate-200'}`}>
            <button
              onClick={() => setActiveTab('problems')}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors shadow-2xs ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>Explore All Submissions</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Bento Box: Recommended Problems */}
      <div className={`border rounded-3xl p-6 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className={`text-sm font-black flex items-center space-x-2 tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-slate-900'
            }`}>
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
              <span>Recommended for Your Skill Level (Rating 1450)</span>
            </h3>
            <p className="text-xs opacity-60 mt-0.5">Targeted problem suggestions to boost your weak areas in Graphs and DP.</p>
          </div>
          <button
            onClick={() => setActiveTab('problems')}
            className="text-xs text-blue-600 hover:underline font-bold self-start sm:self-auto"
          >
            Browse all problems
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedProblems.map(rp => (
            <div 
              key={rp.id}
              className={`border rounded-2xl p-5 flex flex-col justify-between transition-all group ${
                isDark ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700' : 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {rp.difficulty}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono font-bold">Pass: {rp.acceptance}</span>
                </div>
                <h4 className={`font-bold text-sm transition-colors ${
                  isDark ? 'text-zinc-100 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-blue-600'
                }`}>{rp.title}</h4>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {rp.topics.map((t, idx) => (
                    <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                      isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigateToProblem(rp.id)}
                className="mt-5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-md shadow-blue-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Solve Problem</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
