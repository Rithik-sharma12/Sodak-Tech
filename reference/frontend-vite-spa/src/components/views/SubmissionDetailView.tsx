import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, Cpu, Copy, Check, 
  Code2, ExternalLink, RefreshCcw
} from 'lucide-react';

export const SubmissionDetailView: React.FC = () => {
  const { submissions, selectedSubmissionId, navigateToProblem, theme } = useApp();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const sub = submissions.find(s => s.id === selectedSubmissionId) || submissions[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sub.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-xs">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateToProblem(sub.problemId)}
          className={`flex items-center space-x-2 font-bold transition-colors ${
            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Problem IDE ({sub.problemTitle})</span>
        </button>

        <span className="font-mono opacity-60 font-bold">Submission ID: #{sub.id}</span>
      </div>

      {/* Verdict Banner Bento Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl ${
        sub.verdict === 'Accepted'
          ? (isDark ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900')
          : (isDark ? 'bg-rose-950/40 border-rose-800/60 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900')
      }`}>
        <div className="flex items-center space-x-4">
          {sub.verdict === 'Accepted' ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0 shadow-md">
              <XCircle className="w-8 h-8" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight">{sub.verdict}</h1>
            <p className="opacity-80 text-xs mt-1">
              Submitted by <span className="font-bold opacity-100">{sub.userName}</span> (@{sub.userHandle}) • {sub.submittedAt}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateToProblem(sub.problemId)}
          className={`px-5 py-3 rounded-2xl border font-bold flex items-center space-x-2 transition-transform hover:scale-105 self-start sm:self-auto shadow-md ${
            isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
          }`}
        >
          <RefreshCcw className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
          <span>Edit & Re-submit</span>
        </button>
      </div>

      {/* 4 Stats Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border rounded-3xl p-5 shadow-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'}`}>
          <div className="opacity-60 font-bold mb-1">Language</div>
          <div className={`text-xl font-mono font-black uppercase ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{sub.language}</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'}`}>
          <div className="opacity-60 font-bold mb-1">Runtime</div>
          <div className={`text-xl font-mono font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{sub.runtimeMs} ms</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Faster than 88.4% of submissions</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'}`}>
          <div className="opacity-60 font-bold mb-1">Memory Usage</div>
          <div className={`text-xl font-mono font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{sub.memoryMb} MB</div>
          <div className="text-[10px] text-blue-600 dark:text-indigo-400 font-bold mt-1">Beats 92.1% memory distribution</div>
        </div>

        <div className={`border rounded-3xl p-5 shadow-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'}`}>
          <div className="opacity-60 font-bold mb-1">Test Suite Score</div>
          <div className={`text-xl font-mono font-black ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{sub.passedTests} / {sub.totalTests}</div>
          <div className="text-[10px] opacity-70 font-bold mt-1">
            {sub.score ? `${sub.score}% points earned` : '100% full credit'}
          </div>
        </div>

      </div>

      {/* Submitted Code Window */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`flex items-center space-x-2 font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
            <Code2 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <span>Submitted Source Code</span>
          </div>

          <button
            onClick={handleCopyCode}
            className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center space-x-1.5 transition-colors ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className={`p-5 font-mono text-xs overflow-x-auto leading-relaxed ${
          isDark ? 'bg-zinc-950 text-zinc-200' : 'bg-slate-900 text-slate-100'
        }`}>
          <pre>{sub.code}</pre>
        </div>
      </div>

      {/* Test Cases Details Table */}
      {sub.testDetails && sub.testDetails.length > 0 && (
        <div className={`border rounded-3xl p-6 space-y-4 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="font-black uppercase tracking-widest text-xs opacity-60">Test Cases Execution Breakdown</h3>
          <div className="space-y-3">
            {sub.testDetails.map(tc => (
              <div key={tc.caseNumber} className={`p-4 rounded-2xl border font-mono text-[11px] space-y-2 ${
                isDark ? 'bg-zinc-950 border-zinc-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>Case #{tc.caseNumber}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    tc.passed 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {tc.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <div className="opacity-70">Input: <span className="opacity-100 font-bold">{tc.input}</span></div>
                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <div>Expected: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tc.expected}</span></div>
                  <div>Output: <span className={`font-bold ${tc.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{tc.actual}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
