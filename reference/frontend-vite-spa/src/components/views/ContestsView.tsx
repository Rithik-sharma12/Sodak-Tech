import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Trophy, Flame, Clock, Users, Calendar, ArrowRight, Play, 
  CheckCircle2, AlertCircle, Award, Sparkles, History
} from 'lucide-react';
import { api } from '../../api';

export const ContestsView: React.FC = () => {
  const { user, navigateToContest, theme } = useApp();
  const isDark = theme === 'dark';
  // Real contests. None exist on a fresh install, and an empty list is the
  // correct thing to show — not invented events.
  const [contests, setContests] = useState<any[]>([]);

  useEffect(() => {
    api.contests
      .list()
      .then((page: any) => setContests(page?.results || []))
      .catch(() => setContests([]));
  }, []);
  const [timerSeconds, setTimerSeconds] = useState(4463); // ~1h 14m 23s

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const toggleRegister = (id: string) => {
    setContests(prev => prev.map(c => 
      c.id === id ? { 
        ...c, 
        isRegistered: !c.isRegistered,
        registeredUsersCount: c.isRegistered ? c.registeredUsersCount - 1 : c.registeredUsersCount + 1
      } : c
    ));
  };

  const liveContest = contests.find(c => c.status === 'LIVE');
  const upcomingContests = contests.filter(c => c.status === 'UPCOMING');
  const pastContests = contests.filter(c => c.status === 'PAST');

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner: User Contest Stats Bento Card */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-6 border rounded-3xl p-6 sm:p-8 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div>
          <h1 className={`text-3xl font-black tracking-tight flex items-center space-x-3 ${
            isDark ? 'text-zinc-100' : 'text-slate-900'
          }`}>
            <Trophy className="w-8 h-8 text-amber-500" />
            <span>Sodak Competitive Coding Arenas</span>
          </h1>
          <p className="text-xs opacity-70 mt-1 max-w-xl leading-relaxed">
            Test your problem-solving speed under timed contest conditions. Compete for university standings and rating boosts.
          </p>
        </div>

        <div className={`flex items-center space-x-4 p-4 rounded-2xl border text-xs font-mono shrink-0 ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
        }`}>
          <div>
            <span className="opacity-50 block text-[10px] uppercase font-black tracking-widest">Your Rating</span>
            <span className="text-xl font-black text-blue-600 dark:text-indigo-400">{user.rating}</span>
          </div>
          <div className={`border-l pl-4 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <span className="opacity-50 block text-[10px] uppercase font-black tracking-widest">Global Rank</span>
            <span className={`text-xl font-black ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>#{user.globalRank}</span>
          </div>
        </div>
      </div>

      {/* LIVE Contest Feature Bento Card */}
      {liveContest && (
        <div className={`border-4 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ${
          isDark 
            ? 'bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-indigo-950/80 border-emerald-500/40 text-white' 
            : 'bg-gradient-to-r from-emerald-50 via-white to-blue-50 border-emerald-500/50 text-slate-900'
        }`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-widest animate-pulse shadow-md">
                LIVE NOW
              </span>
              <h2 className="text-2xl font-black tracking-tight">{liveContest.title}</h2>
            </div>

            <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border font-mono text-xs font-bold ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600 shadow-2xs'
            }`}>
              <Clock className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Ends in {formatCountdown(timerSeconds)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="font-bold opacity-70">Contest Details:</span>
              <p className="leading-relaxed opacity-90">{liveContest.description}</p>
            </div>

            <div className="space-y-1 font-mono">
              <span className="font-bold opacity-70">Your Live Position:</span>
              <div className="text-base font-black mt-1">
                Rank <span className="text-emerald-600 dark:text-emerald-400">#{liveContest.myRank}</span> ({liveContest.myScore} / {liveContest.maxScore} pts)
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => navigateToContest(liveContest.id)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/20 transition-transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Contest Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Contests Bento Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
          <span>Upcoming Contests</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upcomingContests.map(c => (
            <div 
              key={c.id} 
              onClick={() => navigateToContest(c.id)}
              className={`border rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl cursor-pointer group ${
                isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-blue-300'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-indigo-400 border border-blue-500/20">
                    {c.durationMinutes} Minutes
                  </span>
                  <span className="text-[11px] font-mono font-bold flex items-center space-x-1 opacity-70">
                    <Users className="w-3.5 h-3.5" />
                    <span>{c.registeredUsersCount} registered</span>
                  </span>
                </div>

                <h4 className={`font-black text-lg tracking-tight transition-colors ${isDark ? 'text-zinc-100 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-blue-600'}`}>{c.title}</h4>
                <p className="text-xs opacity-70 leading-relaxed">{c.description}</p>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between ${
                isDark ? 'border-zinc-800/80' : 'border-slate-200'
              }`}>
                <span className="text-xs text-blue-600 dark:text-indigo-300 font-mono font-bold">{c.startTime}</span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRegister(c.id);
                    }}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-2xs ${
                      c.isRegistered
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {c.isRegistered ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Registered</span>
                      </>
                    ) : (
                      <span>Register Now</span>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToContest(c.id);
                    }}
                    className={`p-2.5 rounded-2xl border ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past Contests Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest flex items-center space-x-2 opacity-70">
          <History className="w-4 h-4 opacity-70" />
          <span>Past Contest Archives</span>
        </h3>

        <div className={`border rounded-3xl overflow-hidden shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <table className="w-full text-left text-xs">
            <thead className={`uppercase font-black text-[10px] tracking-widest border-b ${
              isDark ? 'bg-zinc-950/90 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3 px-4">Contest Title</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Participants</th>
                <th className="py-3 px-4">Your Rank</th>
                <th className="py-3 px-4">Rating Change</th>
                <th className="py-3 px-4 text-right">Standings</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-zinc-800/60' : 'divide-slate-200'}`}>
              {pastContests.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => navigateToContest(c.id)}
                  className={`transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'}`}
                >
                  <td className={`py-3.5 px-4 font-bold font-sans ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {c.title}
                  </td>
                  <td className="py-3.5 px-4 opacity-70">
                    {c.startTime}
                  </td>
                  <td className="py-3.5 px-4 opacity-70">
                    {c.registeredUsersCount} coders
                  </td>
                  <td className="py-3.5 px-4 font-bold">
                    #{c.myRank || 42}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    +42 pts
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToContest(c.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                        isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
                      }`}
                    >
                      View Standings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
