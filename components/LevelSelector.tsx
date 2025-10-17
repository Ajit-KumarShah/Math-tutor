
import React, { useState } from 'react';
import { EducationLevel, MathTopic } from '../types';
import { EDUCATION_LEVELS, MATH_TOPICS } from '../constants';

interface LevelSelectorProps {
  onStartChat: (level: EducationLevel, topic: MathTopic) => void;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ onStartChat }) => {
  const [level, setLevel] = useState<EducationLevel>(EDUCATION_LEVELS[2]);
  const [topic, setTopic] = useState<MathTopic>(MATH_TOPICS[1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartChat(level, topic);
  };

  return (
    <div className="p-8 md:p-12">
      <h2 className="text-2xl font-semibold text-gray-200 mb-2">Welcome!</h2>
      <p className="text-gray-400 mb-6">Let's get started. Please select your level and the topic you need help with.</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-300 mb-2">
            Your Education Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as EducationLevel)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          >
            {EDUCATION_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
            Math Topic
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as MathTopic)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          >
            {MATH_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
        >
          Start Tutoring Session
        </button>
      </form>
    </div>
  );
};

export default LevelSelector;
