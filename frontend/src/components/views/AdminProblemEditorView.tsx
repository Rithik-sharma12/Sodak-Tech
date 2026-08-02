import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, Save, Eye, Code, Plus, Trash2, Tag, 
  CheckCircle2, AlertCircle, FileText, Check
} from 'lucide-react';
import { Problem, Difficulty, TestCase } from '../../types';

export const AdminProblemEditorView: React.FC = () => {
  const { addProblem, setActiveTab, user, theme } = useApp();
  const isDark = theme === 'dark';

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [timeLimit, setTimeLimit] = useState('2.0s');
  const [memoryLimit, setMemoryLimit] = useState('256MB');
  const [topics, setTopics] = useState<string[]>(['Dynamic Programming', 'Arrays']);
  const [newTopicTag, setNewTopicTag] = useState('');

  const [description, setDescription] = useState(`Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return *its sum*.`);
  const [inputFormat, setInputFormat] = useState(`Line 1: An integer array \`nums\`.`);
  const [outputFormat, setOutputFormat] = useState(`Return maximum subarray sum integer.`);
  const [constraintsText, setConstraintsText] = useState(`1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4`);

  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 'tc_1', input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isSample: true, explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }
  ]);

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleAddTopicTag = () => {
    if (newTopicTag.trim() && !topics.includes(newTopicTag.trim())) {
      setTopics(prev => [...prev, newTopicTag.trim()]);
      setNewTopicTag('');
    }
  };

  const handleRemoveTopicTag = (t: string) => {
    setTopics(prev => prev.filter(item => item !== t));
  };

  const handleAddTestCase = () => {
    const newTc: TestCase = {
      id: 'tc_' + Math.random().toString(36).substring(2, 7),
      input: '',
      expectedOutput: '',
      isSample: false
    };
    setTestCases(prev => [...prev, newTc]);
  };

  const handleRemoveTestCase = (id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const handleSaveProblem = () => {
    const constraints = constraintsText.split('\n').filter(line => line.trim().length > 0);
    const newProblem: Problem = {
      id: slug || 'new-problem-' + Math.random().toString(36).substring(2, 7),
      slug: slug || 'new-problem',
      title: title || 'Untitled Problem',
      difficulty,
      acceptanceRate: 50.0,
      solvedCount: 0,
      totalSubmissions: 0,
      timeLimit,
      memoryLimit,
      topics,
      description,
      inputFormat,
      outputFormat,
      constraints,
      sampleCases: testCases,
      starterTemplates: {
        python: `# Solution class template\nclass Solution:\n    def solve(self):\n        pass\n`,
        cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n    }\n};\n`,
        java: `class Solution {\n    public void solve() {\n    }\n}\n`,
        javascript: `/**\n * @return {void}\n */\nvar solve = function() {\n};\n`,
        go: `func solve() {\n}\n`,
        rust: `impl Solution {\n    pub font solve() {}\n}\n`
      },
      author: user.name,
      isPublished
    };

    addProblem(newProblem);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setActiveTab('admin-overview');
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-xs">
      
      {/* Top Header Bento Box */}
      <div className={`flex items-center justify-between border rounded-3xl p-6 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('admin-overview')}
            className={`p-2.5 rounded-2xl transition-all border shadow-2xs ${
              isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700' : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className={`text-base font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Author New Algorithm Problem</h1>
            <p className="text-[11px] opacity-70">Define problem statements, constraints, and test suite data.</p>
          </div>
        </div>

        <button
          onClick={handleSaveProblem}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.02]"
        >
          {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Problem Published!' : 'Save & Publish Problem'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Editor Form (8 Cols) */}
        <div className={`lg:col-span-8 space-y-5 border rounded-3xl p-6 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          
          {/* Title & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5 opacity-90">Problem Title</label>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Maximum Subarray Sum"
                className={`w-full border rounded-2xl p-3 font-bold focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold mb-1.5 opacity-90">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className={`w-full border rounded-2xl p-3 font-mono font-bold focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-300 text-slate-600'
                }`}
              />
            </div>
          </div>

          {/* Statement Editor with Live Preview Tab */}
          <div className="space-y-2">
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <label className="font-bold flex items-center space-x-2 opacity-90">
                <FileText className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
                <span>Problem Statement (Markdown Supported)</span>
              </label>

              <div className={`flex items-center space-x-1 p-1 rounded-xl border ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    !isPreviewMode 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : (isDark ? 'text-zinc-400' : 'text-slate-600')
                  }`}
                >
                  Raw Edit
                </button>
                <button
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    isPreviewMode 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : (isDark ? 'text-zinc-400' : 'text-slate-600')
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {isPreviewMode ? (
              <div className={`w-full border rounded-2xl p-4 min-h-40 font-sans leading-relaxed whitespace-pre-line ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
              }`}>
                {description}
              </div>
            ) : (
              <textarea
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`w-full border rounded-2xl p-3.5 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            )}
          </div>

          {/* Input & Output Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1.5 opacity-90">Input Format Specification</label>
              <textarea
                rows={3}
                value={inputFormat}
                onChange={e => setInputFormat(e.target.value)}
                className={`w-full border rounded-2xl p-3 font-mono text-xs ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold mb-1.5 opacity-90">Output Format Specification</label>
              <textarea
                rows={3}
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                className={`w-full border rounded-2xl p-3 font-mono text-xs ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Constraints */}
          <div>
            <label className="block font-bold mb-1.5 opacity-90">Constraints (1 per line)</label>
            <textarea
              rows={3}
              value={constraintsText}
              onChange={e => setConstraintsText(e.target.value)}
              className={`w-full border rounded-2xl p-3 font-mono text-xs ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Test Suite Manager */}
          <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-black ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Test Cases & Judging Data ({testCases.length})</h3>
              <button
                onClick={handleAddTestCase}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 border shadow-2xs ${
                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div key={tc.id} className={`border rounded-2xl p-4 space-y-2 relative ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono opacity-80">Case #{idx + 1}</span>
                    <button
                      onClick={() => handleRemoveTestCase(tc.id)}
                      className="opacity-60 hover:opacity-100 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-bold block mb-1 opacity-70">Input Data</span>
                      <input
                        type="text"
                        value={tc.input}
                        onChange={e => {
                          const newTc = [...testCases];
                          newTc[idx].input = e.target.value;
                          setTestCases(newTc);
                        }}
                        className={`w-full border rounded-xl p-2.5 font-mono text-[11px] ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="font-bold block mb-1 opacity-70">Expected Output</span>
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={e => {
                          const newTc = [...testCases];
                          newTc[idx].expectedOutput = e.target.value;
                          setTestCases(newTc);
                        }}
                        className={`w-full border rounded-xl p-2.5 font-mono text-[11px] font-bold ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sidebar Metadata (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className={`border rounded-3xl p-6 space-y-5 shadow-xl ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-60">Problem Metadata</h3>

            {/* Difficulty */}
            <div>
              <label className="block font-bold mb-1.5 opacity-90">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Difficulty)}
                className={`w-full border rounded-2xl p-3 font-bold ${
                  isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Time & Memory Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1.5 opacity-90">Time Limit</label>
                <input
                  type="text"
                  value={timeLimit}
                  onChange={e => setTimeLimit(e.target.value)}
                  className={`w-full border rounded-2xl p-3 font-mono font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5 opacity-90">Memory Limit</label>
                <input
                  type="text"
                  value={memoryLimit}
                  onChange={e => setMemoryLimit(e.target.value)}
                  className={`w-full border rounded-2xl p-3 font-mono font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Topics Tags */}
            <div>
              <label className="block font-bold mb-1.5 opacity-90">Topic Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {topics.map(t => (
                  <span key={t} className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 border ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <span>{t}</span>
                    <button onClick={() => handleRemoveTopicTag(t)} className="opacity-60 hover:opacity-100 hover:text-rose-500">×</button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={newTopicTag}
                  onChange={e => setNewTopicTag(e.target.value)}
                  placeholder="Add tag..."
                  className={`w-full border rounded-xl p-2.5 text-[11px] font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleAddTopicTag}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Status Switch */}
            <div className={`pt-3 border-t flex items-center justify-between ${
              isDark ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <span className="font-bold opacity-90">Public Visibility</span>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
