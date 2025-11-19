
import React from 'react';
import type { Message } from '../types';
import { SearchIcon, EnvelopeIcon, EnvelopeOpenIcon } from './Icons';

interface InboxProps {
  messages: Message[];
  isLoading: boolean;
  onSelectMessage: (id: string) => void;
  selectedMessageId: string | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  readStatus: Record<string, boolean>;
  onToggleReadStatus: (id: string) => void;
  isDestructing: boolean;
  newlyArrivedMessageIds: Set<string>;
}

const InboxSkeleton = () => (
  <ul className="space-y-3 overflow-hidden px-1 py-2">
    {[...Array(4)].map((_, i) => (
      <li key={i} className="flex items-start p-4 rounded-xl bg-white/60 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 animate-pulse">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-2">
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </li>
    ))}
  </ul>
);

export default function Inbox({ messages, isLoading, onSelectMessage, selectedMessageId, searchTerm, onSearchChange, readStatus, onToggleReadStatus, isDestructing, newlyArrivedMessageIds }: InboxProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const handleToggleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleReadStatus(id);
  }

  return (
    <div className={`glass-panel rounded-xl flex-grow flex flex-col min-h-[300px] shadow-lg overflow-hidden transition-all duration-500 ${isDestructing ? 'animate-destruct' : ''}`}>
      <div className="p-4 border-b border-slate-200 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/50 backdrop-blur-md z-10">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Inbox 
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300 border border-slate-200 dark:border-transparent">
                    {messages.length}
                </span>
            </h2>
        </div>
        
        <div className="relative group">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-gray-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-cyan-400 transition-colors">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Filter messages..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950/50 text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-400 shadow-sm"
            aria-label="Search inbox"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {isLoading ? (
          <InboxSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
            <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-gray-500">
                <EnvelopeIcon />
            </div>
            {searchTerm ? (
              <p className="text-slate-500 dark:text-gray-400">No matches found.</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-gray-200">Inbox is empty</p>
                <p className="text-sm text-slate-500 dark:text-gray-500">Waiting for incoming transmissions...</p>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2 pb-2">
            {messages.map((message, index) => {
              const isRead = readStatus[message.id];
              const isSelected = selectedMessageId === message.id;
              const isNew = newlyArrivedMessageIds.has(message.id);

              return (
                <li
                  key={message.id}
                  onClick={() => onSelectMessage(message.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`relative flex items-start p-3.5 rounded-xl cursor-pointer transition-all duration-200 group border animate-fade-in-up ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-cyan-900/20 border-indigo-200 dark:border-cyan-500/40 shadow-md ring-1 ring-indigo-100 dark:ring-0'
                      : isRead 
                      ? 'bg-transparent hover:bg-white dark:hover:bg-gray-800/40 border-transparent hover:border-slate-200 dark:hover:border-gray-700 opacity-75 hover:opacity-100'
                      : 'bg-white dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/80 border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-cyan-500/50 shadow-sm'
                  } ${isNew ? 'animate-new-email ring-2 ring-indigo-400 dark:ring-cyan-400' : ''}`}
                >
                   {/* Active Indicator Line */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 dark:bg-cyan-400 rounded-r-full"></div>
                  )}

                  {/* Unread Dot */}
                  {!isRead && (
                     <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-600 dark:bg-cyan-400 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm z-10"></div>
                  )}
                  
                  <div className={`flex-grow min-w-0 ${isSelected ? 'pl-2' : ''} transition-all`}>
                    <div className="flex justify-between items-baseline mb-1">
                      <p className={`truncate pr-6 text-sm ${!isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-gray-400'}`}>
                          {message.from}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-gray-500 flex-shrink-0 font-mono">{formatDate(message.date)}</p>
                    </div>
                    <p className={`text-sm truncate ${!isRead ? 'text-slate-700 dark:text-gray-300' : 'text-slate-500 dark:text-gray-500'}`}>
                        {message.subject}
                    </p>
                  </div>
                  
                  {/* Action Buttons showing on hover */}
                  <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                        onClick={(e) => handleToggleClick(e, message.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-cyan-900/30 transition-colors"
                        title={isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                        {isRead ? <EnvelopeOpenIcon /> : <EnvelopeIcon />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
