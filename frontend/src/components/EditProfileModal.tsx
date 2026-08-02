import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Save, User, Github, MapPin, AlignLeft, Image } from 'lucide-react';

export const EditProfileModal: React.FC = () => {
  const { user, setUser, editProfileModalOpen, setEditProfileModalOpen, theme } = useApp();
  const isDark = theme === 'dark';

  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [githubUrl, setGithubUrl] = useState(user.githubUrl || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  if (!editProfileModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      name,
      handle,
      bio,
      location,
      githubUrl,
      avatarUrl,
    }));
    setEditProfileModalOpen(false);
  };

  return (
    <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
      isDark ? 'bg-zinc-950/80' : 'bg-slate-900/40'
    }`}>
      <div 
        className={`border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600 dark:text-indigo-400" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Edit Student Profile</h3>
          </div>
          <button 
            onClick={() => setEditProfileModalOpen(false)}
            className={`p-1.5 rounded-xl ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 opacity-90">Full Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 opacity-90">Username Handle</label>
              <input
                type="text"
                value={handle}
                onChange={e => setHandle(e.target.value)}
                className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1 opacity-90">Location / Campus</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 opacity-90">Bio / Status</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-bold mb-1 opacity-90">GitHub Profile Link</label>
            <input
              type="url"
              value={githubUrl}
              onChange={e => setGithubUrl(e.target.value)}
              className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div>
            <label className="block font-bold mb-1 opacity-90">Avatar Image URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              className={`w-full border rounded-xl p-2.5 font-mono focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          <div className={`pt-3 border-t flex justify-end space-x-2 ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setEditProfileModalOpen(false)}
              className={`px-4 py-2 rounded-xl border font-bold ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
