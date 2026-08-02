import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Trophy, Flame, Search, Medal, Award, Sparkles, Filter, 
  User, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../../api';

export const LeaderboardView: React.FC = () => {
  const { user, setActiveTab, theme } = useApp();
  const isDark = theme === 'dark';
  const [timeframe, setTimeframe] = useState<'overall' | 'weekly' | 'monthly'>('overall');
  const [searchQuery, setSearchQuery] = useState('');
  // Real standings. An empty platform legitimately has an empty board, so the
  // list starts empty rather than pre-filled with invented ranks.
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress
      .leaderboard(100)
      .then((data: any) => setRows(Array.isArray(data) ? data : data?.results || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const leaderboard = rows.map((r: any, i: number) => ({
    rank: r.rank ?? i + 1,
    name: r.display_name || r.username || '',
    handle: r.username || '',
    avatarUrl: r.avatar_url || '',
    score: r.score ?? r.points ?? 0,
    problemsSolved: r.problems_solved ?? r.solved ?? 0,
    streak: r.streak ?? 0,
    change: r.rank_change ?? 0,
    department: r.department || '',
    isCurrentUser: (r.username || '') === user?.handle,
  }));

  const filteredUsers = leaderboard.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.cohort.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = leaderboard.slice(0, 3);
  const currentUserRow = leaderboard.find(u => u.isCurrentUser);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner Bento Card */}
      <div className={`border rounded-3xl p-8 text-center max-w-3xl mx-auto relative overflow-hidden shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-2xs">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
          Sodak University Competitive Leaderboard
        </h1>
        <p className="text-xs sm:text-sm opacity-70 mt-2 max-w-lg mx-auto leading-relaxed">
          Top student algorithmic competitive coders ranked by contest rating, problems solved, and consistency.
        </p>
      </div>

      {/* Top 3 Podium Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        
        {/* Silver 2nd Place */}
        {top3[1] && (
          <div className={`border rounded-3xl p-6 text-center flex flex-col items-center justify-between relative md:mt-4 transition-all shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}>
            <div className={`absolute -top-3 px-3.5 py-0.5 rounded-full font-black text-[10px] flex items-center space-x-1 shadow-md ${
              isDark ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              <Medal className="w-3.5 h-3.5 opacity-70" />
              <span>Rank #2</span>
            </div>

            <div className="mt-3">
              <img src={top3[1].avatarUrl} alt={top3[1].name} className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-400/30 mx-auto" />
              <h3 className={`font-extrabold text-sm mt-3 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{top3[1].name}</h3>
              <p className="opacity-60 text-xs font-mono">@{top3[1].handle}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold ${
                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {top3[1].cohort}
              </span>
            </div>

            <div className={`mt-4 pt-4 border-t w-full grid grid-cols-2 gap-2 text-xs font-mono ${
              isDark ? 'border-zinc-800/80' : 'border-slate-200'
            }`}>
              <div>
                <span className="opacity-50 text-[10px] block uppercase font-bold">Rating</span>
                <span className="font-black text-blue-600 dark:text-indigo-400">{top3[1].rating}</span>
              </div>
              <div>
                <span className="opacity-50 text-[10px] block uppercase font-bold">Solved</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{top3[1].solvedCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Gold 1st Place */}
        {top3[0] && (
          <div className={`border-4 rounded-3xl p-6 text-center flex flex-col items-center justify-between relative shadow-2xl transition-all ${
            isDark 
              ? 'bg-gradient-to-b from-indigo-950/80 via-zinc-900 to-zinc-900 border-amber-500/40' 
              : 'bg-gradient-to-b from-amber-50/80 via-white to-white border-amber-500/60'
          }`}>
            <div className="absolute -top-3.5 px-4 py-1 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center space-x-1 shadow-lg tracking-wider">
              <Trophy className="w-3.5 h-3.5 fill-current" />
              <span>#1 CHAMPION</span>
            </div>

            <div className="mt-3">
              <img src={top3[0].avatarUrl} alt={top3[0].name} className="w-20 h-20 rounded-full object-cover ring-4 ring-amber-400/80 mx-auto shadow-xl" />
              <h3 className={`font-black text-base mt-3 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{top3[0].name}</h3>
              <p className="text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">@{top3[0].handle}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
                {top3[0].cohort}
              </span>
            </div>

            <div className={`mt-5 pt-4 border-t w-full grid grid-cols-2 gap-2 text-xs font-mono ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <div>
                <span className="opacity-60 text-[10px] block uppercase font-black">Rating</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-base">{top3[0].rating} pts</span>
              </div>
              <div>
                <span className="opacity-60 text-[10px] block uppercase font-black">Solved</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">{top3[0].solvedCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bronze 3rd Place */}
        {top3[2] && (
          <div className={`border rounded-3xl p-6 text-center flex flex-col items-center justify-between relative md:mt-4 transition-all shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}>
            <div className="absolute -top-3 px-3.5 py-0.5 rounded-full bg-amber-800/20 text-amber-700 dark:text-amber-300 border border-amber-600/30 font-black text-[10px] flex items-center space-x-1 shadow-md">
              <Medal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Rank #3</span>
            </div>

            <div className="mt-3">
              <img src={top3[2].avatarUrl} alt={top3[2].name} className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-600/30 mx-auto" />
              <h3 className={`font-extrabold text-sm mt-3 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{top3[2].name}</h3>
              <p className="opacity-60 text-xs font-mono">@{top3[2].handle}</p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold ${
                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {top3[2].cohort}
              </span>
            </div>

            <div className={`mt-4 pt-4 border-t w-full grid grid-cols-2 gap-2 text-xs font-mono ${
              isDark ? 'border-zinc-800/80' : 'border-slate-200'
            }`}>
              <div>
                <span className="opacity-50 text-[10px] block uppercase font-bold">Rating</span>
                <span className="font-black text-blue-600 dark:text-indigo-400">{top3[2].rating}</span>
              </div>
              <div>
                <span className="opacity-50 text-[10px] block uppercase font-bold">Solved</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{top3[2].solvedCount}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Sticky "YOUR RANK" Highlight Banner */}
      {currentUserRow && (
        <div className={`border rounded-3xl p-5 flex items-center justify-between max-w-4xl mx-auto shadow-xl ${
          isDark 
            ? 'bg-indigo-950/50 border-indigo-700/60' 
            : 'bg-blue-50/90 border-blue-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-4">
            <span className="px-3.5 py-1.5 rounded-2xl bg-blue-600 font-mono font-black text-white text-xs shadow-md">
              YOUR RANK #{currentUserRow.rank}
            </span>
            <div className="flex items-center space-x-3">
              <img src={currentUserRow.avatarUrl} alt={currentUserRow.name} className="w-9 h-9 rounded-full object-cover" />
              <div>
                <div className="font-bold text-xs">{currentUserRow.name} (YOU)</div>
                <div className="text-[10px] opacity-70 font-mono">Rating: {currentUserRow.rating} • Solved: {currentUserRow.solvedCount}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs"
          >
            <span>View Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Leaderboard Table & Filters */}
      <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Timeframe Tabs */}
          <div className={`flex items-center p-1.5 rounded-2xl border ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setTimeframe('overall')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'overall' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              Overall Rating
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'weekly' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              Weekly Sprint
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'monthly' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              Monthly Contest
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search student or cohort..."
              className={`w-full border rounded-2xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase font-black text-[10px] tracking-widest border-b ${
              isDark ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Rank</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Cohort / Program</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-center">Solved</th>
                <th className="py-3.5 px-4 text-center">Streak</th>
                <th className="py-3.5 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-zinc-800/60' : 'divide-slate-200'}`}>
              {filteredUsers.map(u => (
                <tr 
                  key={u.id}
                  className={`transition-colors ${
                    u.isCurrentUser 
                      ? (isDark ? 'bg-indigo-950/30 border-l-2 border-indigo-500 font-bold' : 'bg-blue-50 border-l-2 border-blue-600 font-bold') 
                      : (isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50')
                  }`}
                >
                  <td className="py-4 px-4 text-center font-black opacity-70">
                    #{u.rank}
                  </td>
                  <td className="py-4 px-4 font-sans">
                    <div className="flex items-center space-x-3">
                      <img src={u.avatarUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className={`font-bold flex items-center space-x-1.5 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          <span>{u.name}</span>
                          {u.isCurrentUser && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-indigo-300 text-[9px] font-black border border-blue-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] opacity-60 font-mono">@{u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-sans opacity-70">
                    {u.cohort}
                  </td>
                  <td className="py-4 px-4 text-center font-black text-blue-600 dark:text-indigo-400">
                    {u.rating}
                  </td>
                  <td className="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400 font-black">
                    {u.solvedCount}
                  </td>
                  <td className="py-4 px-4 text-center text-amber-600 dark:text-amber-400">
                    <span className="inline-flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{u.streakDays}d</span>
                    </span>
                  </td>
                  <td className={`py-4 px-4 text-right font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {u.points.toLocaleString()} pts
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
