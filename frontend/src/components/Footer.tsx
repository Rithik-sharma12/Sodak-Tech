import React from 'react';
import { Terminal, Github, Heart, Shield, Code2, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-400 py-10 mt-auto text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-black text-zinc-100 tracking-tight text-sm">
                SODAK<span className="text-indigo-400">-TECH</span> OJ
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Official University Competitive Programming & Algorithm Practice System. Built for CS students, contest hosts, and problem setters.
            </p>
          </div>

          <div>
            <h4 className="font-black text-zinc-200 uppercase tracking-widest text-[10px] mb-3">Platform</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#problems" className="hover:text-zinc-100 transition-colors">Problem Set</a></li>
              <li><a href="#contests" className="hover:text-zinc-100 transition-colors">Live Contests</a></li>
              <li><a href="#leaderboard" className="hover:text-zinc-100 transition-colors">Global Leaderboard</a></li>
              <li><a href="#editorial" className="hover:text-zinc-100 transition-colors">Solutions & Editorials</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-zinc-200 uppercase tracking-widest text-[10px] mb-3">Resources</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><a href="#documentation" className="hover:text-zinc-100 transition-colors">Supported Languages & Specs</a></li>
              <li><a href="#sandbox" className="hover:text-zinc-100 transition-colors">Judging Sandbox Rules</a></li>
              <li><a href="#faq" className="hover:text-zinc-100 transition-colors">Contest FAQ & Scoring</a></li>
              <li><a href="#api" className="hover:text-zinc-100 transition-colors">Sodak OJ REST API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-zinc-200 uppercase tracking-widest text-[10px] mb-3">System Status</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Judge Engine: Online (0ms queue)</span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Sandboxed Docker Runners: 16 Workers Active
              </p>
              <p className="text-[11px] text-zinc-500">
                Sodak University Dept. of Computer Science
              </p>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px]">
          <p>© 2026 Sodak-Tech University OJ. Built for high-performance algorithm education.</p>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span className="flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span>for Coders</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
