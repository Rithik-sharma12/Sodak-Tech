import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, Search, Shield, User, UserX, CheckCircle2, 
  ChevronDown, Filter, Lock
} from 'lucide-react';
import { api, toRole } from '../../api';
import { Role } from '../../types';

export const AdminUsersView: React.FC = () => {
  const { setActiveTab, theme } = useApp();
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.admin.users
      .list()
      .then((page: any) =>
        setUsers(
          (page.results || []).map((u: any) => ({
            id: u.id,
            name: u.display_name || u.username,
            handle: u.username,
            email: u.email,
            role: toRole(u.role),
            status: u.is_active ? 'Active' : 'Disabled',
            problemsSolved: u.solved_count ?? 0,
            submissions: u.submission_count ?? 0,
            joinedAt: u.created_at,
          })),
        ),
      )
      .catch(() => setUsers([]));
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (id: string, newRole: Role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleToggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' } : u
    ));
  };

  return (
    <div className="space-y-6 pb-12 text-xs">
      
      {/* Header Bento Box */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-3xl p-6 shadow-xl ${
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
            <h1 className={`text-base font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>User Role & Access Management</h1>
            <p className="text-[11px] opacity-70">Manage Sodak OJ platform permissions, roles, and account statuses.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 opacity-60 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search user name or email..."
              className={`w-full border rounded-2xl pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className={`border rounded-2xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Admin">Admin</option>
            <option value="Problem Setter">Problem Setter</option>
            <option value="Contest Manager">Contest Manager</option>
            <option value="Student">Student</option>
          </select>
        </div>
      </div>

      {/* Users Table Bento Card */}
      <div className={`border rounded-3xl overflow-hidden shadow-xl ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
      }`}>
        <table className={`w-full text-left text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
          <thead className={`uppercase font-black text-[10px] tracking-widest border-b ${
            isDark ? 'bg-zinc-950/80 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <tr>
              <th className="py-3.5 px-5">User</th>
              <th className="py-3.5 px-5">Assigned Role</th>
              <th className="py-3.5 px-5 text-center">Solved</th>
              <th className="py-3.5 px-5 text-center">Submissions</th>
              <th className="py-3.5 px-5">Joined</th>
              <th className="py-3.5 px-5 text-center">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${
            isDark ? 'divide-zinc-800/60' : 'divide-slate-100'
          }`}>
            {filteredUsers.map(u => (
              <tr key={u.id} className={isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'}>
                <td className="py-4 px-5 font-sans">
                  <div className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{u.name}</div>
                  <div className="text-[10px] opacity-70 font-mono">@{u.handle} • {u.email}</div>
                </td>
                
                <td className="py-4 px-5 font-sans">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                    className={`border rounded-xl px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-indigo-300' : 'bg-slate-50 border-slate-300 text-blue-600'
                    }`}
                  >
                    <option value="Student">Student</option>
                    <option value="Problem Setter">Problem Setter</option>
                    <option value="Contest Manager">Contest Manager</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </td>

                <td className="py-4 px-5 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  {u.solved}
                </td>

                <td className="py-4 px-5 text-center font-bold opacity-80">
                  {u.submissions}
                </td>

                <td className="py-4 px-5 opacity-80 font-sans">
                  {u.joined}
                </td>

                <td className="py-4 px-5 text-center font-sans">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    u.status === 'Active' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {u.status}
                  </span>
                </td>

                <td className="py-4 px-5 text-right font-sans">
                  <button
                    onClick={() => handleToggleStatus(u.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      u.status === 'Active' 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    {u.status === 'Active' ? 'Disable Account' : 'Activate Account'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
