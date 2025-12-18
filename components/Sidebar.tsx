
import React from 'react';
import { AppMode } from '../types';

interface SidebarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange }) => {
  const navItems = [
    { mode: AppMode.CHAT, label: 'Чат', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { mode: AppMode.VOICE, label: 'Голос', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
    { mode: AppMode.SEARCH, label: 'Поиск', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  ];

  return (
    <nav className="w-16 md:w-64 glass h-full flex flex-col p-4 border-r border-white/10 z-20">
      <div className="mb-8 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-xl font-bold">G</span>
        </div>
        <h1 className="hidden md:block mt-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Gemini Assistant
        </h1>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => onModeChange(item.mode)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
              activeMode === item.mode 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 shadow-sm' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="hidden md:block ml-3 font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="hidden md:block px-2 text-xs text-white/30 uppercase tracking-wider mb-2">Статус</div>
        <div className="flex items-center px-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
          <span className="hidden md:block text-sm text-green-500 font-medium">Система онлайн</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
