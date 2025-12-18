
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppMode, Message, VoiceState } from './types';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import SearchInterface from './components/SearchInterface';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [searchHistory, setSearchHistory] = useState<Message[]>([]);
  
  const handleSendMessage = useCallback((content: string, mode: AppMode, response: Message) => {
    if (mode === AppMode.CHAT) {
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }, response]);
    } else if (mode === AppMode.SEARCH) {
      setSearchHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content, timestamp: Date.now() }, response]);
    }
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden gradient-bg text-white">
      {/* Side Navigation */}
      <Sidebar activeMode={activeMode} onModeChange={setActiveMode} />

      <div className="flex-1 flex flex-col relative">
        <Header activeMode={activeMode} />

        <main className="flex-1 overflow-hidden p-4 md:p-6 relative">
          {activeMode === AppMode.CHAT && (
            <ChatInterface 
              messages={chatHistory} 
              onNewMessage={(content, res) => handleSendMessage(content, AppMode.CHAT, res)} 
            />
          )}
          {activeMode === AppMode.VOICE && (
            <VoiceInterface />
          )}
          {activeMode === AppMode.SEARCH && (
            <SearchInterface 
              messages={searchHistory} 
              onNewMessage={(content, res) => handleSendMessage(content, AppMode.SEARCH, res)} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
