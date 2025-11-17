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
  <ul className="space-y-2 overflow-y-auto -mr-2 pr-2">
    {[...Array(3)].map((_, i) => (
      <li key={i} className="flex items-start p-3 rounded-md transition-all duration-200 border border-transparent group relative animate-pulse">
        <div className="flex-grow ml-5">
          <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mt-2"></div>
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
    <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4 flex-grow flex flex-col min-h-[200px] shadow-lg dark:shadow-cyan-500/5 transition-all duration-500 ${isDestructing ? 'animate-destruct' : ''}`}>
      <h2 className="text-lg font-bold text-blue-600 dark:text-cyan-400 mb-3 border-b border-gray-200 dark:border-cyan-500/20 pb-2">Inbox</h2>
      
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
          <SearchIcon />
        </span>
        <input
          type="text"
          placeholder="Search by sender or subject..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
          aria-label="Search inbox"
        />
      </div>

      {isLoading ? (
        <InboxSkeleton />
      ) : messages.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          {searchTerm ? (
            <p className="text-gray-500 dark:text-gray-500">No messages found for "{searchTerm}"</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-500">Waiting for emails...</p>
          )}
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto -mr-2 pr-2">
          {messages.map((message) => {
            const isRead = readStatus[message.id];
            const isSelected = selectedMessageId === message.id;
            const isNew = newlyArrivedMessageIds.has(message.id);

            return (
              <li
                key={message.id}
                onClick={() => onSelectMessage(message.id)}
                className={`flex items-start p-3 rounded-md cursor-pointer transition-all duration-200 border border-transparent group relative ${
                  isSelected
                    ? 'bg-blue-100 dark:bg-cyan-900/40 border-blue-300 dark:border-cyan-500/50'
                    : isRead 
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800/70'
                    : 'bg-blue-50/50 dark:bg-cyan-900/10 hover:bg-blue-100/70 dark:hover:bg-cyan-900/20'
                } ${isNew ? 'animate-new-email' : ''}`}
              >
                {!isRead && <span className="flex-shrink-0 w-2 h-2 bg-blue-500 dark:bg-cyan-400 rounded-full mt-2 mr-3"></span>}
                
                <div className={`flex-grow ${isRead ? '' : 'ml-5'}`}>
                  <div className="flex justify-between items-start">
                    <p className={`truncate pr-2 ${isRead ? 'font-normal text-gray-500 dark:text-gray-400' : 'font-semibold text-gray-800 dark:text-gray-200'}`}>{message.from}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">{formatDate(message.date)}</p>
                  </div>
                  <p className={`text-sm truncate mt-1 ${isRead ? 'text-gray-500 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'}`}>{message.subject}</p>
                </div>
                
                <button 
                  onClick={(e) => handleToggleClick(e, message.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title={isRead ? 'Mark as unread' : 'Mark as read'}
                >
                  {isRead ? <EnvelopeOpenIcon /> : <EnvelopeIcon />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  );
}