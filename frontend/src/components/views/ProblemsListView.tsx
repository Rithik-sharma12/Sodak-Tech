import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, Filter, CheckCircle2, Bookmark, Shuffle, Code2, 
  ArrowUpDown, ChevronRight, Tag, BookOpen, Clock
} from 'lucide-react';
import { Difficulty } from '../../types';

export const ProblemsListView: React.FC = () => {
  const { problems, solvedProblemIds, bookmarks, toggleBookmark, navigateToProblem, theme } = useApp();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const topicsList = ['All', 'Arrays', 'Hash Table', 'Graph Theory', 'Dynamic Programming', 'Sorting & Searching'];

  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesDifficulty = selectedDifficulty === 'All' || p.difficulty === selectedDifficulty;
    const matchesTopic = selectedTopic === 'All' || p.topics.includes(selectedTopic);
    
    const isSolved = solvedProblemIds.includes(p.id);
    const isBookmarked = bookmarks.includes(p.id);

    const matchesStatus = 
      selectedStatus === 'All' ? true :
      selectedStatus === 'Solved' ? isSolved :
      selectedStatus === 'Todo' ? !isSolved :
      selectedStatus === 'Bookmarked' ? isBookmarked : true;

    return matchesSearch && matchesDifficulty && matchesTopic && matchesStatus;
  });

  const pickRandomProblem = () => {
    if (problems.length === 0) return;
    const randomIndex = Math.floor(Math.random() * problems.length);
    navigateToProblem(problems[randomIndex].id);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bento Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border-4 border-slate-900/10 dark:border-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white shadow-sm">
              Curated Problem Archive
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center space-x-3">
            <Code2 className="w-8 h-8 text-indigo-300" />
            <span>Problem Archive</span>
          </h1>
          <p className="text-xs text-indigo-100 mt-1 max-w-xl leading-relaxed">
            Browse through Sodak University’s curated library of data structures & algorithm problems. Filter by topic, difficulty, or solved status.
          </p>
        </div>

        <button
          onClick={pickRandomProblem}
          className="px-5 py-3 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900 text-white font-bold text-xs flex items-center space-x-2 border border-white/20 shadow-xl shrink-0 transition-transform hover:scale-105"
        >
          <Shuffle className="w-4 h-4 text-indigo-300" />
          <span>Pick Random Problem</span>
        </button>
      </div>

      {/* Filter Controls Bento Bar */}
      <div className={`border rounded-3xl p-5 space-y-4 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search problems by title, keywords, or topic tag..."
              className={`w-full border rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 ${
                isDark 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <label className="text-xs font-bold shrink-0 opacity-70">Difficulty:</label>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className={`border rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-bold ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="All">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <label className="text-xs font-bold shrink-0 opacity-70">Status:</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className={`border rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-bold ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="All">All Problems</option>
              <option value="Solved">Solved</option>
              <option value="Todo">Todo (Unsolved)</option>
              <option value="Bookmarked">Bookmarked</option>
            </select>
          </div>
        </div>

        {/* Topic Chips */}
        <div className={`flex items-center space-x-2 overflow-x-auto pt-3 border-t pb-1 scrollbar-none ${
          isDark ? 'border-zinc-800/80' : 'border-slate-200'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-widest shrink-0 flex items-center space-x-1.5 mr-1 opacity-70">
            <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
            <span>Topics:</span>
          </span>
          {topicsList.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedTopic === topic
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : (isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

      </div>

      {/* Problems Table Bento Box */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase font-black text-[10px] tracking-widest border-b ${
              isDark ? 'bg-zinc-950/90 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-4 px-5 w-14 text-center">Status</th>
                <th className="py-4 px-5">Title</th>
                <th className="py-4 px-5">Difficulty</th>
                <th className="py-4 px-5">Acceptance</th>
                <th className="py-4 px-5">Topics</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-200'}`}>
              {filteredProblems.map(p => {
                const isSolved = solvedProblemIds.includes(p.id);
                const isBookmarked = bookmarks.includes(p.id);

                return (
                  <tr 
                    key={p.id}
                    onClick={() => navigateToProblem(p.id)}
                    className={`cursor-pointer transition-colors group ${
                      isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Status */}
                    <td className="py-4 px-5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-2">
                        {isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-slate-300'}`}></span>
                        )}
                        <button
                          onClick={() => toggleBookmark(p.id)}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    </td>

                    {/* Title */}
                    <td className={`py-4 px-5 font-bold transition-colors ${
                      isDark ? 'text-zinc-100 group-hover:text-indigo-400' : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span>{p.title}</span>
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>

                    {/* Acceptance */}
                    <td className="py-4 px-5 font-mono font-bold opacity-75">
                      {p.acceptanceRate}%
                    </td>

                    {/* Topics */}
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-1.5">
                        {p.topics.map((t, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 text-right">
                      <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center space-x-1 transition-all shadow-2xs">
                        <span>Solve</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredProblems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center opacity-60 text-xs">
                    No problems match your filter criteria. Try adjusting your search query or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
