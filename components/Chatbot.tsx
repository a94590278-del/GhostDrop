import React, { useState, useEffect, useRef } from 'react';
import { XIcon, PaperAirplaneIcon, SparklesIcon, RefreshIcon } from './Icons';
import { getChatbotResponse } from '../services/chatbotService';
import type { ChatHistoryContent } from '../services/chatbotService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-3">
    <span className="text-gray-500 dark:text-gray-400 text-sm">Ghosty is typing</span>
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
  </div>
);

const initialMessage: Message = { role: 'model', text: "Hi there! I'm Ghosty (V3), the GhostDrop support assistant. This version helps debug caching issues. How can I help you today?" };

export default function Chatbot({ isOpen, onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [history, setHistory] = useState<ChatHistoryContent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('animate-slide-in-bottom-right');
      setTimeout(() => inputRef.current?.focus(), 300); // Focus after animation
    } else {
      setAnimationClass('animate-fade-out');
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const { responseText, newHistory } = await getChatbotResponse(currentInput, history);
      const modelMessage: Message = { role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);
      setHistory(newHistory);
    } catch (error) {
      console.error("Chatbot component error:", error);
      const errorMessage: Message = { role: 'model', text: "Sorry, an error occurred. If you're seeing this, the V3 code is running. The issue is likely with your API key configuration in your deployment settings." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = () => {
    setMessages([initialMessage]);
    setHistory([]);
    setInput('');
    setIsLoading(false);
    inputRef.current?.focus();
  };

  if (!isOpen && animationClass === '') return null;

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 w-[calc(100%-3rem)] max-w-sm h-[70vh] max-h-[600px] ${animationClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
    >
      <div className="bg-white dark:bg-gray-900 h-full rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-cyan-500/20">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-cyan-500/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <h2 id="chatbot-title" className="font-bold text-gray-800 dark:text-gray-200">GhostDrop Support AI</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
                onClick={handleNewChat}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                title="Start new chat"
                aria-label="Start new chat"
            >
                <RefreshIcon className="h-6 w-6" />
            </button>
            <button
                onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                title="Close chat"
                aria-label="Close chat"
            >
                <XIcon className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 dark:bg-cyan-500 text-white rounded-br-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-lg'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <footer className="p-4 border-t border-gray-200 dark:border-cyan-500/20 flex-shrink-0">
          <form onSubmit={handleSend} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <button
              type="submit"
              disabled={input.trim() === '' || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-blue-600 dark:bg-cyan-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 hover:scale-110 disabled:hover:scale-100 transition-transform duration-200"
              aria-label="Send message"
            >
              <PaperAirplaneIcon />
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-2 flex items-center justify-center gap-1">
            <SparklesIcon className="h-4 w-4" /> Powered by Gemini
          </p>
        </footer>
      </div>
    </div>
  );
}
