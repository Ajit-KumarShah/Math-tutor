
import React, { useState, useCallback } from 'react';
import { EducationLevel, MathTopic } from './types';
import LevelSelector from './components/LevelSelector';
import ChatWindow from './components/ChatWindow';

const App: React.FC = () => {
  const [isChatStarted, setIsChatStarted] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | null>(null);

  const handleStartChat = useCallback((level: EducationLevel, topic: MathTopic) => {
    setSelectedLevel(level);
    setSelectedTopic(topic);
    setIsChatStarted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400">
            AI Math Tutor
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Your personal guide to mastering mathematics.
          </p>
        </header>
        
        <main className="bg-gray-800 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-700 overflow-hidden">
          {!isChatStarted || !selectedLevel || !selectedTopic ? (
            <LevelSelector onStartChat={handleStartChat} />
          ) : (
            <ChatWindow level={selectedLevel} topic={selectedTopic} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
