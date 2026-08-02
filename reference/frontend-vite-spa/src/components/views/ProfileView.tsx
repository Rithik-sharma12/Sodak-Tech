import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, MapPin, Calendar, Github, Edit3, Trophy, Flame, 
  CheckCircle2, Activity, Award, BarChart2, Shield, Sparkles 
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, setEditProfileModalOpen, theme } = useApp();
  const isDark = theme === 'dark';

  const totalSolved = user.problemsSolved.easy + user.problemsSolved.medium + user.problemsSolved.hard;
  const totalAvailable = user.problemsSolved.totalEasy + user.problemsSolved.totalMedium + user.problemsSolved.totalHard;

  return (
    <div className="space-y-6 pb-12 text-xs">
      
      {/* Top Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 Cols): Identity & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Identity Card Bento Box */}
          <div className={`border rounded-3xl p-6 space-y-5 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center space-x-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-md"
              />
              <div>
                <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{user.name}</h1>
                <p className="font-mono text-blue-600 dark:text-indigo-400 font-bold">@{user.handle}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-indigo-300 border border-blue-500/20 text-[10px] font-bold">
                  {user.role}
                </span>
              </div>
            </div>

            <p className="opacity-80 leading-relaxed text-xs">{user.bio}</p>

            <div className={`space-y-2 pt-4 border-t text-[11px] font-bold ${
              isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 opacity-60" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 opacity-60" />
                <span>Joined {user.joinedDate}</span>
              </div>
              {user.githubUrl && (
                <div className="flex items-center space-x-2">
                  <Github className="w-3.5 h-3.5 opacity-60" />
                  <a href={user.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-indigo-400 hover:underline truncate">
                    {user.githubUrl}
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={() => setEditProfileModalOpen(true)}
              className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02] border shadow-2xs ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details</span>
            </button>
          </div>

          {/* Quick Stats Summary Bento Card */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Rating & Contest Rank</h3>

            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <span className="opacity-50 text-[10px] block uppercase font-black tracking-widest">Rating</span>
                <span className="text-2xl font-black text-blue-600 dark:text-indigo-400 mt-1 block">{user.rating}</span>
                <span className="text-[10px] opacity-70 block mt-1 font-bold">Peak: {user.peakRating}</span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
              }`}>
                <span className="opacity-50 text-[10px] block uppercase font-black tracking-widest">Global Rank</span>
                <span className={`text-2xl font-black mt-1 block ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>#{user.globalRank}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1 font-bold">Top 15%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (8 Cols): Solved Breakdown, Activity Heatmap, Topic Strength */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Solved Problems Breakdown Bento Card */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Solved Problems ({totalSolved} / {totalAvailable})</span>
              </h3>
              <span className="text-[11px] font-mono font-bold opacity-70">
                {Math.round((totalSolved / totalAvailable) * 100)}% Complete
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center font-mono">
              
              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-zinc-950 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
              }`}>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black block uppercase tracking-wider">Easy</span>
                <span className={`text-2xl font-black mt-1 block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{user.problemsSolved.easy}</span>
                <span className="text-[10px] opacity-60 block font-bold mt-0.5">/ {user.problemsSolved.totalEasy}</span>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-zinc-950 border-amber-500/20' : 'bg-amber-50/50 border-amber-200'
              }`}>
                <span className="text-amber-600 dark:text-amber-400 text-xs font-black block uppercase tracking-wider">Medium</span>
                <span className={`text-2xl font-black mt-1 block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{user.problemsSolved.medium}</span>
                <span className="text-[10px] opacity-60 block font-bold mt-0.5">/ {user.problemsSolved.totalMedium}</span>
              </div>

              <div className={`p-5 rounded-2xl border ${
                isDark ? 'bg-zinc-950 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <span className="text-rose-600 dark:text-rose-400 text-xs font-black block uppercase tracking-wider">Hard</span>
                <span className={`text-2xl font-black mt-1 block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{user.problemsSolved.hard}</span>
                <span className="text-[10px] opacity-60 block font-bold mt-0.5">/ {user.problemsSolved.totalHard}</span>
              </div>

            </div>
          </div>

          {/* Submission Activity Heatmap Bento Card */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
                <Activity className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                <span>364 Days Activity Heatmap</span>
              </h3>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-black flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{user.streakDays} Day Active Streak</span>
              </span>
            </div>

            {/* Heatmap Grid */}
            <div className={`p-5 rounded-2xl border overflow-x-auto ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
            }`}>
              <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
                {user.activityHeatmap.map((item, idx) => {
                  const bgClass = isDark ? (
                    item.count === 0 ? 'bg-zinc-900 border border-zinc-800' :
                    item.count === 1 ? 'bg-indigo-950 border border-indigo-800' :
                    item.count === 2 ? 'bg-indigo-700' :
                    item.count === 3 ? 'bg-indigo-500' :
                    'bg-emerald-400'
                  ) : (
                    item.count === 0 ? 'bg-slate-200 border border-slate-300/50' :
                    item.count === 1 ? 'bg-blue-200 border border-blue-300' :
                    item.count === 2 ? 'bg-blue-400' :
                    item.count === 3 ? 'bg-blue-600' :
                    'bg-emerald-500'
                  );

                  return (
                    <div
                      key={idx}
                      title={`${item.date}: ${item.count} submissions`}
                      className={`w-2.5 h-2.5 rounded-sm ${bgClass} hover:ring-2 hover:ring-slate-400 transition-all cursor-pointer`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] opacity-60 mt-3 pt-2 border-t font-mono font-bold border-slate-200 dark:border-zinc-800">
                <span>Less</span>
                <div className="flex items-center space-x-1">
                  <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-slate-200'}`}></span>
                  <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-indigo-950 border border-indigo-800' : 'bg-blue-200'}`}></span>
                  <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-indigo-700' : 'bg-blue-400'}`}></span>
                  <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-indigo-500' : 'bg-blue-600'}`}></span>
                  <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Topic Strength Breakdown Bento Card */}
          <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
              <BarChart2 className="w-4 h-4 text-emerald-500" />
              <span>Topic Mastery & Skill Strengths</span>
            </h3>

            <div className="space-y-3">
              {user.topicMastery.map((tm, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={isDark ? 'text-zinc-300' : 'text-slate-800'}>{tm.topic}</span>
                    <span className="font-mono opacity-60">{tm.percentage}% ({tm.solved} solved)</span>
                  </div>
                  <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200 shadow-2xs'
                  }`}>
                    <div 
                      style={{ width: `${tm.percentage}%` }}
                      className={`h-full rounded-full ${
                        tm.percentage > 75 ? 'bg-emerald-500' :
                        tm.percentage > 50 ? 'bg-blue-600 dark:bg-indigo-500' :
                        'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
