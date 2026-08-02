import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, Clock, Trophy, CheckCircle2, AlertCircle, Play, 
  ChevronRight, Lock, Flame, Shield, Sparkles, Calendar, Users
} from 'lucide-react';
import { api } from '../../api';

export const ContestWorkspaceView: React.FC = () => {
  const { setActiveTab, navigateToProblem, selectedContestId, theme } = useApp();
  const isDark = theme === 'dark';
  const [timerSeconds, setTimerSeconds] = useState(4463);

  const [contests, setContests] = useState<any[]>([]);

  useEffect(() => {
    api.contests
      .list()
      .then((page: any) => setContests(page?.results || []))
      .catch(() => setContests([]));
  }, []);

  const activeContest = contests.find((c: any) => c.id === selectedContestId || c.slug === selectedContestId) || contests[0];

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

  const standings = [
    { rank: 1, name: 'Gennady K.', handle: 'tourist', score: 600, penalty: '00:42:10' },
    { rank: 2, name: 'Benjamin Q.', handle: 'Benq', score: 600, penalty: '00:54:18' },
    { rank: 3, name: 'Neal W.', handle: 'ecnerwala', score: 450, penalty: '00:38:05' },
    { rank: 4, name: 'Tatsuyuki K.', handle: 'rng_58', score: 450, penalty: '00:44:12' },
    { rank: activeContest.myRank || 87, name: 'Priya Sharma', handle: 'priya_s', score: activeContest.myScore || 100, penalty: '00:14:02', isUser: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Bento Card */}
      <div className={`border rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('contests')}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                activeContest.status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                activeContest.status === 'UPCOMING' ? 'bg-blue-500/10 text-blue-600 dark:text-indigo-400 border-blue-500/20' :
                'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
              }`}>
                {activeContest.status === 'LIVE' ? 'LIVE CONTEST' : activeContest.status === 'UPCOMING' ? 'UPCOMING CONTEST' : 'PAST ARCHIVE'}
              </span>
              <h1 className={`text-xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{activeContest.title}</h1>
            </div>
            <p className="text-xs opacity-70 mt-1">{activeContest.problems.length} Problems • {activeContest.durationMinutes} Minutes • Standard Penalty Rules</p>
          </div>
        </div>

        {/* Live Timer or Status */}
        <div className="flex items-center space-x-3 shrink-0">
          {activeContest.status === 'LIVE' ? (
            <>
              <div className={`px-4 py-2 rounded-2xl border font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-2 ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <Clock className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Ends in {formatCountdown(timerSeconds)}</span>
              </div>

              <div className={`px-4 py-2 rounded-2xl border font-mono text-xs font-bold ${
                isDark ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                Live Rank: <span className={`font-black ${isDark ? 'text-white' : 'text-blue-900'}`}>#{activeContest.myRank || 87}</span>
              </div>
            </>
          ) : activeContest.status === 'UPCOMING' ? (
            <div className={`px-4 py-2 rounded-2xl border font-mono text-xs font-bold flex items-center space-x-2 ${
              isDark ? 'bg-blue-950/60 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Starts: {activeContest.startTime}</span>
            </div>
          ) : (
            <div className={`px-4 py-2 rounded-2xl border font-mono text-xs font-bold ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              Final Rank: <span className="font-black">#{activeContest.myRank || 42}</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning/Info Banner */}
      {activeContest.status === 'LIVE' ? (
        <div className={`rounded-2xl p-4 flex items-center space-x-3 text-xs border ${
          isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Standings are now frozen for the final 15 minutes!</strong> Your own submissions and verdicts continue updating live.
          </span>
        </div>
      ) : activeContest.status === 'UPCOMING' ? (
        <div className={`rounded-2xl p-4 flex items-center space-x-3 text-xs border ${
          isDark ? 'bg-blue-950/40 border-blue-800/60 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            <strong>You are registered for this upcoming contest!</strong> The workspace and submission queues will unlock at <strong>{activeContest.startTime}</strong>.
          </span>
        </div>
      ) : (
        <div className={`rounded-2xl p-4 flex items-center space-x-3 text-xs border ${
          isDark ? 'bg-zinc-800/40 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-800'
        }`}>
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Contest Concluded.</strong> Review problem statements, editorial solutions, and test your code in practice mode below.
          </span>
        </div>
      )}

      {/* Main Grid: Problem List (Left 65%) + Progress & Standings (Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Problems List Bento Box */}
        <div className={`lg:col-span-8 border rounded-3xl p-6 space-y-4 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <h2 className="text-xs font-black opacity-60 uppercase tracking-widest">Contest Problems</h2>

          <div className="space-y-3">
            {activeContest.problems.map(cp => (
              <div 
                key={cp.problemId}
                className={`border rounded-2xl p-4 flex items-center justify-between transition-all ${
                  isDark ? 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-2xl border font-mono font-black flex items-center justify-center text-sm ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}>
                    {cp.label}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{cp.title}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        cp.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        cp.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}>
                        {cp.difficulty}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-70 font-mono mt-0.5">
                      Points: <span className="text-amber-500 font-bold">{cp.points} pts</span> • Solved: {cp.solvedCount} coders
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigateToProblem(cp.problemId)}
                    className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-md shadow-blue-600/20"
                  >
                    <span>{activeContest.status === 'LIVE' ? 'Solve' : 'Practice'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Scorecard & Live Standings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Your Contest Scorecard */}
          <div className={`border rounded-3xl p-6 space-y-3 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="text-xs font-black opacity-60 uppercase tracking-widest">
              {activeContest.status === 'PAST' ? 'Your Final Result' : activeContest.status === 'UPCOMING' ? 'Contest Info' : 'Your Live Scorecard'}
            </h3>
            
            <div className="flex justify-between items-end font-mono">
              <span className={`text-3xl font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{activeContest.myScore || 0}</span>
              <span className="opacity-60 text-xs font-bold">/ {activeContest.maxScore || 600} Max Pts</span>
            </div>

            <div className={`h-3 w-full rounded-full overflow-hidden border ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${Math.min(100, Math.max(10, ((activeContest.myScore || 0) / (activeContest.maxScore || 600)) * 100))}%` }}
              ></div>
            </div>

            <p className="text-[11px] opacity-70 leading-relaxed">
              {activeContest.status === 'LIVE' ? 'Solved 1 of 4 problems in 14m 02s penalty time.' :
               activeContest.status === 'PAST' ? 'Finished Rank #42 with +42 rating boost.' :
               'Registration confirmed. Prepare your IDE before contest start!'}
            </p>
          </div>

          {/* Standings Preview */}
          <div className={`border rounded-3xl p-6 space-y-3 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="text-xs font-black opacity-60 uppercase tracking-widest">Contest Leaderboard</h3>

            <div className="space-y-2 font-mono text-xs">
              {standings.map(st => (
                <div 
                  key={st.rank}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    st.isUser 
                      ? (isDark ? 'bg-indigo-950/60 border-indigo-700/80 text-white font-bold' : 'bg-blue-50 border-blue-300 text-blue-950 font-bold')
                      : (isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-800')
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="opacity-60 w-5 text-center font-black">#{st.rank}</span>
                    <span className="font-sans font-medium">{st.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold block">{st.score} pts</span>
                    <span className="text-[10px] opacity-60">{st.penalty}</span>
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

