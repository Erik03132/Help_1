
import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  activeMode: AppMode;
}

const Header: React.FC<HeaderProps> = ({ activeMode }) => {
  const getTitle = () => {
    switch (activeMode) {
      case AppMode.CHAT: return 'Интеллектуальный Чат';
      case AppMode.VOICE: return 'Голосовой Помощник (Live)';
      case AppMode.SEARCH: return 'Поиск с Обоснованием';
      default: return 'Assistant';
    }
  };

  const getDescription = () => {
    switch (activeMode) {
      case AppMode.CHAT: return 'Работает на Gemini 3 Pro';
      case AppMode.VOICE: return 'Реальное время через Gemini Live';
      case AppMode.SEARCH: return 'Gemini 3 Flash + Google Search';
      default: return '';
    }
  };

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 z-10">
      <div>
        <h2 className="text-xl font-semibold">{getTitle()}</h2>
        <p className="text-xs text-white/40">{getDescription()}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-white/5 rounded-full p-2 px-3 text-xs border border-white/10 text-white/60">
          v2.5 Pro & v3 Flash
        </div>
      </div>
    </header>
  );
};

export default Header;
