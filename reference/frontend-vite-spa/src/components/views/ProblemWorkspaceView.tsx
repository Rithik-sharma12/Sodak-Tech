import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, Bookmark, RotateCcw, Play, Send, CheckCircle2, XCircle, 
  Clock, Cpu, FileText, BookOpen, History, Copy, Check, ChevronDown, 
  Terminal, Sparkles, AlertCircle
} from 'lucide-react';
import { ProgrammingLanguage, Verdict, Submission } from '../../types';

export const ProblemWorkspaceView: React.FC = () => {
  const { 
    problems, selectedProblemId, setActiveTab, 
    bookmarks, toggleBookmark, submitCode, 
    user, submissions, navigateToSubmission, theme 
  } = useApp();

  const isDark = theme === 'dark';

  const problem = problems.find(p => p.id === selectedProblemId) || problems[0];

  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'editorial' | 'submissions'>('description');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'result'>('testcases');
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  
  // Code execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    type: 'run' | 'submit';
    verdict: Verdict;
    runtimeMs: number;
    memoryMb: number;
    passedTests: number;
    totalTests: number;
    consoleLog?: string;
    cases: {
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
    }[];
  } | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Initialize code when language or problem changes
  useEffect(() => {
    if (problem && problem.starterTemplates[selectedLanguage]) {
      setCode(problem.starterTemplates[selectedLanguage]);
    }
  }, [problem, selectedLanguage]);

  // Timer tick effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleResetCode = () => {
    if (problem && problem.starterTemplates[selectedLanguage]) {
      setCode(problem.starterTemplates[selectedLanguage]);
    }
  };

  /**
   * Run and Submit both go to the server. There is no client-side judging:
   * the verdict, the score, and which test groups passed are computed by the
   * backend against test data the browser never sees (design doc §8.1).
   *
   * The difference between them is what executes — Run covers sample groups
   * only, Submit covers every group and produces the official score.
   */
  const execute = async (kind: 'run' | 'submit') => {
    if (!problem) return;
    setIsExecuting(true);
    setActiveConsoleTab('result');
    setExecutionError(null);

    try {
      const result = await submitCode(problem.slug || problem.id, selectedLanguage, code, kind);

      // Per-group results, not per-case. A group scores its full weight only if
      // every case in it passes, so the group is the unit worth showing.
      const cases = (result.testDetails || []).map((d) => ({
        input: d.input,
        expected: d.expected,
        actual: d.actual,
        passed: d.passed,
      }));

      setExecutionResult({
        type: kind,
        verdict: result.verdict,
        runtimeMs: result.runtimeMs,
        memoryMb: result.memoryMb,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        consoleLog:
          result.verdict === 'Accepted'
            ? `All ${result.totalTests} test group(s) passed.`
            : `${result.passedTests} of ${result.totalTests} test group(s) passed. Score ${result.score ?? 0}.`,
        cases,
      });
    } catch (error) {
      setExecutionResult(null);
      setExecutionError(
        (error as Error).message || 'Could not reach the judge. Your code was not lost — try again.',
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunCode = () => execute('run');
  const handleSubmitCode = () => execute('submit');

  const isBookmarked = bookmarks.includes(problem.id);
  const problemSubmissions = submissions.filter(s => s.problemId === problem.id);

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-100 text-slate-800'
    }`}>
      
      {/* Top IDE Toolbar */}
      <div className={`h-12 px-4 flex items-center justify-between shrink-0 text-xs border-b ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
      }`}>
        
        {/* Left: Back & Problem Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('problems')}
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span className={`font-bold text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{problem.title}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
              problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
              'bg-rose-500/10 text-rose-600 border border-rose-500/20'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <div className={`hidden md:flex items-center space-x-3 text-[11px] font-mono ml-4 border-l pl-4 ${
            isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 opacity-60" />
              <span>Limit: {problem.timeLimit}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3 opacity-60" />
              <span>Mem: {problem.memoryLimit}</span>
            </span>
          </div>
        </div>

        {/* Right: Stopwatch, Bookmark, Reset */}
        <div className="flex items-center space-x-3">
          
          {/* Timer */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl border font-mono text-xs font-bold ${
            isDark ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => toggleBookmark(problem.id)}
            className={`p-1.5 rounded-xl border transition-colors ${
              isBookmarked 
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' 
                : (isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200')
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            title="Reset code to default template"
            className={`p-1.5 rounded-xl border transition-colors ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Main Dual Pane Workspace */}
      <div className="pane flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Pane (6 Columns): Problem Description / Editorial / Submissions */}
        <div className={`pane lg:col-span-6 border-r flex flex-col overflow-hidden ${
          isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-slate-50/60'
        }`}>
          
          {/* Tab Header */}
          <div className={`flex items-center space-x-1 px-3 pt-2 border-b shrink-0 ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeLeftTab === 'description'
                  ? (isDark ? 'border-indigo-500 text-indigo-400 bg-zinc-950/80' : 'border-blue-600 text-blue-600 bg-slate-100/80')
                  : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Question</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('editorial')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeLeftTab === 'editorial'
                  ? (isDark ? 'border-indigo-500 text-indigo-400 bg-zinc-950/80' : 'border-blue-600 text-blue-600 bg-slate-100/80')
                  : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Solution / Editorial</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('submissions')}
              className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-colors ${
                activeLeftTab === 'submissions'
                  ? (isDark ? 'border-indigo-500 text-indigo-400 bg-zinc-950/80' : 'border-blue-600 text-blue-600 bg-slate-100/80')
                  : (isDark ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900')
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions ({problemSubmissions.length})</span>
            </button>
          </div>

          {/* Left Content Area */}
          <div className={`flex-1 overflow-y-auto p-5 space-y-6 text-xs leading-relaxed ${
            isDark ? 'text-zinc-300' : 'text-slate-800'
          }`}>
            
            {/* Description Tab */}
            {activeLeftTab === 'description' && (
              <div className="space-y-6">
                {/* Main Problem Header in Question Panel */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {problem.title}
                    </h1>
                    <p className={`text-xs mt-1 font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      SQL & Algorithm Interview Question
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                    problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                    problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>

                {/* Problem Statement */}
                <div className="space-y-3">
                  <div className={`whitespace-pre-line leading-relaxed font-sans text-xs ${
                    isDark ? 'text-zinc-200' : 'text-slate-800'
                  }`}>
                    {problem.description}
                  </div>
                </div>

                {/* Input Table / Schema Card (Matching reference image) */}
                <div className={`border rounded-2xl overflow-hidden shadow-2xs ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className={`px-4 py-2.5 font-bold text-xs border-b ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    Input Table: <span className="font-mono text-blue-600 font-medium">purchases</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] uppercase font-bold border-b ${
                      isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-slate-100/70 border-slate-200 text-slate-500'
                    }`}>
                      <tr>
                        <th className="py-2.5 px-4">Column Name</th>
                        <th className="py-2.5 px-4">Type</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono text-[11px] ${
                      isDark ? 'divide-zinc-800/60 text-zinc-300' : 'divide-slate-200/80 text-slate-700'
                    }`}>
                      <tr><td className="py-2 px-4 font-bold">order_id</td><td className="py-2 px-4 opacity-75">integer</td></tr>
                      <tr><td className="py-2 px-4 font-bold">user_id</td><td className="py-2 px-4 opacity-75">integer</td></tr>
                      <tr><td className="py-2 px-4 font-bold">product_id</td><td className="py-2 px-4 opacity-75">integer</td></tr>
                      <tr><td className="py-2 px-4 font-bold">quantity</td><td className="py-2 px-4 opacity-75">integer</td></tr>
                      <tr><td className="py-2 px-4 font-bold">order_date</td><td className="py-2 px-4 opacity-75">datetime</td></tr>
                      <tr><td className="py-2 px-4 font-bold">product_type</td><td className="py-2 px-4 opacity-75">string</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Interview Tip Banner (Exact match from reference screenshot!) */}
                <div className={`p-4 rounded-2xl border-l-4 text-xs shadow-2xs ${
                  isDark 
                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200' 
                    : 'bg-sky-50 border-sky-500 text-sky-950 border-y border-r border-sky-200/60'
                }`}>
                  <div className="font-bold text-sky-700 dark:text-indigo-400 mb-1 flex items-center space-x-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-indigo-400" />
                    <span>Interview Tip</span>
                  </div>
                  <p className="italic leading-relaxed text-[11px]">
                    In window functions like <code className="font-mono font-bold bg-sky-100/80 dark:bg-zinc-800 px-1 py-0.5 rounded">SUM(...) OVER (...)</code>, omitting the frame clause defaults to <code className="font-mono font-bold bg-sky-100/80 dark:bg-zinc-800 px-1 py-0.5 rounded">RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> when an ORDER BY is present.
                  </p>
                </div>

                {/* Example Output Table (Matching reference image) */}
                <div className="space-y-3">
                  <h4 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Example Output</h4>
                  <div className={`border rounded-2xl overflow-hidden shadow-2xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'
                  }`}>
                    <table className="w-full text-left text-xs">
                      <thead className={`text-[10px] uppercase font-bold border-b ${
                        isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-slate-100/70 border-slate-200 text-slate-500'
                      }`}>
                        <tr>
                          <th className="py-2.5 px-4">product_type</th>
                          <th className="py-2.5 px-4">cumulative_sum</th>
                          <th className="py-2.5 px-4">order_date</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y font-mono text-[11px] ${
                        isDark ? 'divide-zinc-800/60 text-zinc-300' : 'divide-slate-200/80 text-slate-700'
                      }`}>
                        <tr><td className="py-2 px-4">Laptop</td><td className="py-2 px-4 font-bold text-blue-600">2</td><td className="py-2 px-4 opacity-75">2023-01-01</td></tr>
                        <tr><td className="py-2 px-4">Laptop</td><td className="py-2 px-4 font-bold text-blue-600">5</td><td className="py-2 px-4 opacity-75">2023-01-05</td></tr>
                        <tr><td className="py-2 px-4">Monitor</td><td className="py-2 px-4 font-bold text-blue-600">1</td><td className="py-2 px-4 opacity-75">2023-01-02</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <h4 className={`font-bold text-xs ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>Constraints</h4>
                  <ul className={`list-disc list-inside space-y-1 font-mono text-[11px] ${
                    isDark ? 'text-zinc-400' : 'text-slate-600'
                  }`}>
                    {problem.constraints.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* Topics & Author */}
                <div className={`pt-4 border-t flex items-center justify-between text-[11px] ${
                  isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-500'
                }`}>
                  <div className="flex items-center space-x-1.5">
                    <span>Topics:</span>
                    {problem.topics.map((t, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-md ${
                        isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700 font-medium'
                      }`}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <div>Author: {problem.author || 'Sodak OJ Faculty'}</div>
                </div>
              </div>
            )}

            {/* Editorial Tab */}
            {activeLeftTab === 'editorial' && (
              <div className="space-y-5">
                {problem.editorial ? (
                  <>
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-indigo-950/30 border-indigo-800/40' : 'bg-blue-50 border-blue-200 text-slate-800'
                    }`}>
                      <h4 className="font-bold text-blue-600 dark:text-indigo-300 mb-1">Official Solution Summary</h4>
                      <p className="leading-relaxed text-xs">{problem.editorial.summary}</p>
                    </div>

                    {problem.editorial.approaches.map((app, idx) => (
                      <div key={idx} className={`border rounded-2xl p-4 space-y-3 ${
                        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <h4 className={`font-bold text-xs ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{app.title}</h4>
                        <div className="flex items-center space-x-3 text-[11px] font-mono text-blue-600 dark:text-indigo-400">
                          <span>Time: {app.complexityTime}</span>
                          <span>•</span>
                          <span>Space: {app.complexitySpace}</span>
                        </div>
                        <p className="leading-relaxed">{app.description}</p>
                        
                        <div className={`border rounded-xl p-3 font-mono text-[11px] overflow-x-auto ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}>
                          <pre>{app.codeSnippet[selectedLanguage] || app.codeSnippet['python']}</pre>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    No official editorial published for this problem yet.
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab */}
            {activeLeftTab === 'submissions' && (
              <div className="space-y-3">
                {problemSubmissions.length > 0 ? (
                  problemSubmissions.map(sub => (
                    <div 
                      key={sub.id}
                      onClick={() => navigateToSubmission(sub.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-colors flex items-center justify-between ${
                        isDark ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700' : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            sub.verdict === 'Accepted' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                            'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}>
                            {sub.verdict}
                          </span>
                          <span className="font-mono uppercase text-[10px] font-bold opacity-75">{sub.language}</span>
                        </div>
                        <div className="text-[11px] font-mono mt-1.5 flex items-center space-x-3 opacity-75">
                          <span>Runtime: {sub.runtimeMs}ms</span>
                          <span>Memory: {sub.memoryMb}MB</span>
                          <span>{sub.submittedAt}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs text-blue-600 dark:text-indigo-400 font-bold">
                        View Details →
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    You have not submitted any solutions for this problem yet.
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Pane (6 Columns): Code Editor + Console */}
        <div className={`pane lg:col-span-6 flex flex-col overflow-hidden ${
          isDark ? 'bg-zinc-950' : 'bg-white'
        }`}>
          
          {/* Code Editor Header */}
          <div className={`h-11 px-4 flex items-center justify-between shrink-0 border-b ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-[11px] font-bold opacity-75">Lang:</label>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value as ProgrammingLanguage)}
                className={`border rounded-xl px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-blue-500 ${
                  isDark 
                    ? 'bg-zinc-950 border-zinc-800 text-indigo-300' 
                    : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                }`}
              >
                <option value="python">Python 3.13 / PostgreSQL 14</option>
                <option value="cpp">C++ 20 (GCC 13)</option>
                <option value="java">Java 21</option>
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="go">Go 1.22</option>
                <option value="rust">Rust 1.77</option>
              </select>
            </div>

            <span className="text-[10px] opacity-60 font-mono">Auto-Saved</span>
          </div>

          {/* Monospaced Code Textarea */}
          <div className={`flex-1 relative font-mono text-xs ${
            isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-slate-900'
          }`}>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck={false}
              className={`w-full h-full p-4 font-mono text-xs focus:outline-none resize-none leading-relaxed border-none ${
                isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-slate-900'
              }`}
            />
          </div>

          {/* Bottom Console / Test Cases Panel */}
          <div className={`h-64 border-t flex flex-col shrink-0 ${
            isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-slate-50'
          }`}>
            
            {/* Console Header Tabs & Action Buttons */}
            <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100/90 border-slate-200'
            }`}>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveConsoleTab('testcases')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    activeConsoleTab === 'testcases' 
                      ? (isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-slate-900 shadow-2xs border border-slate-200/80') 
                      : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    activeConsoleTab === 'result' 
                      ? (isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-white text-slate-900 shadow-2xs border border-slate-200/80') 
                      : (isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900')
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Execution Result</span>
                  {executionResult && (
                    <span className={`w-2 h-2 rounded-full ${
                      executionResult.verdict === 'Accepted' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                  )}
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRunCode}
                  disabled={isExecuting}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current text-blue-600 dark:text-zinc-300" />
                  <span>Run Code</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isExecuting}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isExecuting ? 'Judging...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Console Content Body */}
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
              {activeConsoleTab === 'testcases' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {problem.sampleCases.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          selectedCaseIdx === idx 
                            ? 'bg-blue-600 text-white shadow-2xs' 
                            : (isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300/80')
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {problem.sampleCases[selectedCaseIdx] && (
                    <div className="space-y-2 text-[11px]">
                      <div>
                        <span className="opacity-60 block mb-1">Input:</span>
                        <div className={`p-2.5 rounded-xl border ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                        }`}>
                          {problem.sampleCases[selectedCaseIdx].input}
                        </div>
                      </div>
                      <div>
                        <span className="opacity-60 block mb-1">Expected Output:</span>
                        <div className={`p-2.5 rounded-xl border text-emerald-600 dark:text-emerald-400 font-bold ${
                          isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                        }`}>
                          {problem.sampleCases[selectedCaseIdx].expectedOutput}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {isExecuting ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2 opacity-60">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Running your code against the test suite…</span>
                    </div>
                  ) : executionError ? (
                    <div
                      role="alert"
                      className={`p-3 rounded-2xl border text-xs ${
                        isDark
                          ? 'bg-red-950/40 border-red-900/60 text-red-300'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold">Judging failed</span>
                      </div>
                      <p className="mt-1 opacity-90">{executionError}</p>
                    </div>
                  ) : executionResult ? (
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-3 rounded-2xl border ${
                        isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200 shadow-2xs'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {executionResult.verdict === 'Accepted' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500" />
                          )}
                          <span className={`text-sm font-bold ${
                            executionResult.verdict === 'Accepted' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {executionResult.verdict}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 opacity-75 text-[11px]">
                          <span>Runtime: {executionResult.runtimeMs}ms</span>
                          <span>Memory: {executionResult.memoryMb}MB</span>
                          <span>Passed: {executionResult.passedTests}/{executionResult.totalTests}</span>
                        </div>
                      </div>

                      {executionResult.consoleLog && (
                        <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed ${
                          isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                        }`}>
                          {executionResult.consoleLog}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center opacity-60 text-xs">
                      Click "Run Code" or "Submit" to evaluate your solution.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
