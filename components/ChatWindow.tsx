// Add type definitions for the Web Speech API to resolve TypeScript errors
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
  };
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EducationLevel, MathTopic, Message, Role } from '../types';
import { startChatSession, sendMessage } from '../services/geminiService';
import MessageComponent from './Message';

interface ChatWindowProps {
  level: EducationLevel;
  topic: MathTopic;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
  </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ level, topic }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const storageKey = `chatHistory-${level}-${topic}`;

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prevInput => prevInput ? `${prevInput} ${transcript}` : transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  const initializeNewChat = useCallback(async () => {
    setIsLoading(true);
    const initialUserMessage = `I'm at a ${level} level and I need help with ${topic}.`;
    const userMsgObj: Message = { role: Role.USER, text: initialUserMessage };
    
    setMessages([userMsgObj]);

    try {
        const stream = await sendMessage(initialUserMessage);
        let newModelMessage: Message = { role: Role.MODEL, text: "" };
        setMessages(prev => [...prev, newModelMessage]);

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            newModelMessage.text += chunkText;
            setMessages(prev => {
                const updatedMessages = [...prev];
                updatedMessages[updatedMessages.length - 1] = {...newModelMessage};
                return updatedMessages;
            });
        }
    } catch (error) {
        console.error("Failed to get response from Gemini:", error);
        const errorMessage: Message = {
            role: Role.MODEL,
            text: "Sorry, I'm having trouble connecting right now. Please try again later."
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [level, topic]);

  // Effect to load chat from localStorage or initialize a new chat
  useEffect(() => {
    startChatSession(level);
    const savedHistory = localStorage.getItem(storageKey);

    if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
        setIsLoading(false);
    } else {
        initializeNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, topic, storageKey, initializeNewChat]);

  // Effect to save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && !isLoading) { // Only save when not loading to avoid saving partial states
        localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey, isLoading]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: Role.USER, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const stream = await sendMessage(input);
      let newModelMessage: Message = { role: Role.MODEL, text: "" };
      setMessages(prev => [...prev, newModelMessage]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        newModelMessage.text += chunkText;
        setMessages(prev => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {...newModelMessage};
            return updatedMessages;
        });
      }
    } catch (error) {
        console.error("Failed to send message:", error);
        const errorMessage: Message = {
            role: Role.MODEL,
            text: "An error occurred while sending your message. Please try again."
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateProblem = async () => {
    if (isLoading) return;

    const prompt = `Please generate a practice problem for me about ${topic}. I am at the ${level} level.`;

    const userMessage: Message = { role: Role.USER, text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const stream = await sendMessage(prompt);
        let newModelMessage: Message = { role: Role.MODEL, text: "" };
        setMessages(prev => [...prev, newModelMessage]);

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            newModelMessage.text += chunkText;
            setMessages(prev => {
                const updatedMessages = [...prev];
                updatedMessages[updatedMessages.length - 1] = { ...newModelMessage };
                return updatedMessages;
            });
        }
    } catch (error) {
        console.error("Failed to generate practice problem:", error);
        const errorMessage: Message = {
            role: Role.MODEL,
            text: "Sorry, I couldn't generate a practice problem right now. Please try again."
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleExplainTopic = async () => {
    if (isLoading) return;

    const prompt = `Please give me a brief explanation of the topic: ${topic}. I'm at the ${level} level.`;

    const userMessage: Message = { role: Role.USER, text: prompt };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const stream = await sendMessage(prompt);
      let newModelMessage: Message = { role: Role.MODEL, text: "" };
      setMessages(prev => [...prev, newModelMessage]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        newModelMessage.text += chunkText;
        setMessages(prev => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = { ...newModelMessage };
            return updatedMessages;
        });
      }
    } catch (error) {
      console.error("Failed to explain topic:", error);
      const errorMessage: Message = {
        role: Role.MODEL,
        text: "Sorry, I couldn't generate an explanation right now. Please try again."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the entire chat history? This action cannot be undone.")) {
      localStorage.removeItem(storageKey);
      initializeNewChat();
    }
  };
  
  return (
    <div className="flex flex-col h-[80vh] max-h-[800px]">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <MessageComponent key={index} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === Role.USER && (
          <div className="flex justify-start">
             <div className="bg-gray-700 rounded-2xl rounded-bl-none p-4 max-w-lg">
                <LoadingIndicator />
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a math question..."
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-full px-5 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={isLoading}
            title={isListening ? "Stop listening" : "Use voice input"}
            className={`text-white rounded-full p-3 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-500/50 ${
              isListening 
                ? 'bg-red-600 animate-pulse' 
                : 'bg-gray-600 hover:bg-gray-500'
            } disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleExplainTopic}
            disabled={isLoading}
            title="Explain the current topic"
            className="bg-gray-600 text-white rounded-full p-3 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-500/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
           <button
            type="button"
            onClick={handleGenerateProblem}
            disabled={isLoading}
            title="Generate a practice problem"
            className="bg-gray-600 text-white rounded-full p-3 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-500/50"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            disabled={isLoading}
            title="Clear chat history"
            className="bg-gray-600 text-white rounded-full p-3 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors focus:outline-none focus:ring-4 focus:ring-red-500/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 text-white rounded-full p-3 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;