import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, Code, Trophy, User, ArrowRight, ExternalLink } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { 
    searchModalOpen, setSearchModalOpen, 
    problems, navigateToProblem, navigateToContest, setActiveTab 
  } = useApp();

  const [query, setQuery] = useState('');

  if (!searchModalOpen) return null;

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.topics.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
    p.difficulty.toLowerCase().includes(query.toLowerCase())
  );

  const filteredContests = [].filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = [].filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center space-x-3 bg-zinc-900/90">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search problems by name or tag, contests, users..."
            className="w-full bg-transparent text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setSearchModalOpen(false)}
            className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono font-bold"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto space-y-6 divide-y divide-zinc-800/60">
          
          {/* Problems Section */}
          {filteredProblems.length > 0 && (
            <div>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                <span>Problems ({filteredProblems.length})</span>
              </div>
              <div className="space-y-1">
                {filteredProblems.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      navigateToProblem(p.id);
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-zinc-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        p.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        p.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {p.difficulty}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center space-x-2 mt-0.5">
                          <span>Acceptance: {p.acceptanceRate}%</span>
                          <span>•</span>
                          <span>{p.topics.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contests Section */}
          {filteredContests.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Contests ({filteredContests.length})</span>
              </div>
              <div className="space-y-1">
                {filteredContests.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      navigateToContest(c.id);
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-amber-400 flex items-center space-x-2">
                        <span>{c.title}</span>
                        {c.status === 'LIVE' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {filteredUsers.length > 0 && (
            <div className="pt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Users ({filteredUsers.length})</span>
              </div>
              <div className="space-y-1">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setActiveTab('profile');
                      setSearchModalOpen(false);
                    }}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={u.avatarUrl} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-blue-400">
                          {u.name} <span className="font-mono text-slate-400 font-normal">@{u.handle}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Rating: {u.rating} | {u.cohort}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredProblems.length === 0 && filteredContests.length === 0 && filteredUsers.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching problems, contests, or users found for "{query}".
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
