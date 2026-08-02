import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, Code2, User, Bell, Sliders, Moon, Sun, Save, Check 
} from 'lucide-react';
import { ProgrammingLanguage } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, user, setUser, theme: currentTheme } = useApp();
  const isDark = currentTheme === 'dark';
  const [activeSection, setActiveSection] = useState<'editor' | 'account' | 'appearance' | 'notifications'>('editor');
  
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Local state
  const [defaultLanguage, setDefaultLanguage] = useState<ProgrammingLanguage>(settings.defaultLanguage);
  const [fontSize, setFontSize] = useState<number>(settings.fontSize);
  const [tabSize, setTabSize] = useState<number>(settings.tabSize);
  const [wordWrap, setWordWrap] = useState<boolean>(settings.wordWrap);
  const [lineNumbers, setLineNumbers] = useState<boolean>(settings.lineNumbers);
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme);

  const handleSave = () => {
    updateSettings({
      defaultLanguage,
      fontSize,
      tabSize,
      wordWrap,
      lineNumbers,
      theme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-xs">
      
      {/* Header Bento Card */}
      <div className={`border rounded-3xl p-6 shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <h1 className={`text-xl font-black tracking-tight flex items-center space-x-2 ${
          isDark ? 'text-zinc-100' : 'text-slate-900'
        }`}>
          <Settings className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
          <span>User Preferences & Code Editor Settings</span>
        </h1>
        <p className="text-xs opacity-70 mt-1">
          Customize your IDE code editor configuration, default programming language, and platform notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Nav Rail (4 Cols) */}
        <div className={`md:col-span-4 space-y-1.5 border rounded-3xl p-4 h-fit shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          <button
            onClick={() => setActiveSection('editor')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all ${
              activeSection === 'editor' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : (isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Code Editor IDE</span>
          </button>

          <button
            onClick={() => setActiveSection('account')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all ${
              activeSection === 'account' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : (isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Profile</span>
          </button>

          <button
            onClick={() => setActiveSection('appearance')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all ${
              activeSection === 'appearance' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : (isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </button>

          <button
            onClick={() => setActiveSection('notifications')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all ${
              activeSection === 'notifications' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : (isDark ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Right Settings Content (8 Cols) */}
        <div className={`md:col-span-8 border rounded-3xl p-6 space-y-6 shadow-xl ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
        }`}>
          
          {/* Code Editor Settings */}
          {activeSection === 'editor' && (
            <div className="space-y-5">
              <h2 className={`text-xs font-black uppercase tracking-widest border-b pb-3 ${
                isDark ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-200'
              }`}>
                IDE Code Editor Options
              </h2>

              <div>
                <label className="block font-bold mb-1.5 opacity-90">Default Programming Language</label>
                <select
                  value={defaultLanguage}
                  onChange={e => setDefaultLanguage(e.target.value as ProgrammingLanguage)}
                  className={`w-full border rounded-2xl p-3 font-mono font-bold focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="python">Python 3.13</option>
                  <option value="cpp">C++ 20 (GCC 13)</option>
                  <option value="java">Java 21</option>
                  <option value="javascript">JavaScript / TypeScript</option>
                  <option value="go">Go 1.22</option>
                  <option value="rust">Rust 1.77</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="font-bold opacity-90">Editor Font Size ({fontSize}px)</label>
                  <span className="font-mono font-bold opacity-70">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5 opacity-90">Tab Indent Size</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setTabSize(2)}
                    className={`px-4 py-2 rounded-xl font-mono font-bold text-xs ${
                      tabSize === 2 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : (isDark ? 'bg-zinc-950 text-zinc-400 border border-zinc-800' : 'bg-slate-100 text-slate-700 border border-slate-200')
                    }`}
                  >
                    2 Spaces
                  </button>
                  <button
                    onClick={() => setTabSize(4)}
                    className={`px-4 py-2 rounded-xl font-mono font-bold text-xs ${
                      tabSize === 4 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : (isDark ? 'bg-zinc-950 text-zinc-400 border border-zinc-800' : 'bg-slate-100 text-slate-700 border border-slate-200')
                    }`}
                  >
                    4 Spaces
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}>
                  <div>
                    <span className="font-bold block opacity-90">Word Wrap</span>
                    <span className="text-[11px] opacity-70">Wrap long lines of code inside the editor pane.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={e => setWordWrap(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </div>

                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}>
                  <div>
                    <span className="font-bold block opacity-90">Line Numbers</span>
                    <span className="text-[11px] opacity-70">Display line numbers along the left editor gutter.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineNumbers}
                    onChange={e => setLineNumbers(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeSection === 'account' && (
            <div className="space-y-4">
              <h2 className={`text-xs font-black uppercase tracking-widest border-b pb-3 ${
                isDark ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-200'
              }`}>
                Account Details
              </h2>
              <div>
                <label className="block font-bold mb-1.5 opacity-90">Display Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={e => setUser(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full border rounded-2xl p-3 font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block font-bold mb-1.5 opacity-90">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  onChange={e => setUser(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full border rounded-2xl p-3 font-bold ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-4">
              <h2 className={`text-xs font-black uppercase tracking-widest border-b pb-3 ${
                isDark ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-200'
              }`}>
                Color Theme
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-5 rounded-2xl border flex flex-col items-center space-y-2 transition-all ${
                    theme === 'dark' 
                      ? 'bg-blue-600/10 dark:bg-indigo-950/60 border-blue-600 dark:border-indigo-500 font-bold shadow-2xs' 
                      : (isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                  }`}
                >
                  <Moon className="w-6 h-6 text-blue-600 dark:text-indigo-400" />
                  <span className={theme === 'dark' ? (isDark ? 'text-white' : 'text-blue-600') : ''}>Dark Theme (Default)</span>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`p-5 rounded-2xl border flex flex-col items-center space-y-2 transition-all ${
                    theme === 'light' 
                      ? 'bg-blue-600/10 border-blue-600 font-bold shadow-2xs' 
                      : (isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600')
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className={theme === 'light' ? 'text-blue-600 dark:text-white' : ''}>Light Theme</span>
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-4">
              <h2 className={`text-xs font-black uppercase tracking-widest border-b pb-3 ${
                isDark ? 'text-zinc-400 border-zinc-800' : 'text-slate-500 border-slate-200'
              }`}>
                Notification Preferences
              </h2>
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}>
                  <span className="font-bold opacity-90">Email Contest Reminders</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                </div>
                <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}>
                  <span className="font-bold opacity-90">Submission Verdict Alerts</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600" />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className={`pt-4 border-t flex items-center justify-between ${
            isDark ? 'border-zinc-800' : 'border-slate-200'
          }`}>
            {savedSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Preferences saved successfully!</span>
              </span>
            ) : <span />}

            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
