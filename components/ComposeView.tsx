
import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';
import Spinner from './Spinner';

interface ComposeViewProps {
  initialTo?: string;
  initialSubject?: string;
  onSend: (data: { to: string; subject: string; body: string }) => Promise<void>;
  onClose: () => void;
}

export default function ComposeView({ initialTo = '', initialSubject = '', onSend, onClose }: ComposeViewProps) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setTo(initialTo);
    setSubject(initialSubject);
    setBody(''); // Reset body when props change
  }, [initialTo, initialSubject]);
  
  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSend = async () => {
    setIsSending(true);
    await onSend({ to, subject, body });
    setIsSending(false);
  };
  
  const isFormValid = to.trim() !== '' && subject.trim() !== '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl relative w-full max-w-2xl mx-4 animate-scale-in flex flex-col h-[70vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-cyan-500/20 pb-3 mb-4">
          <h2 id="compose-modal-title" className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Compose Message
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
            title="Close"
            aria-label="Close compose modal"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex-grow flex flex-col gap-4 min-h-0">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <label htmlFor="compose-to" className="text-sm font-medium text-gray-500 dark:text-gray-400">To:</label>
            <input
              id="compose-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none"
              placeholder="recipient@example.com"
            />
          </div>
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <label htmlFor="compose-subject" className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject:</label>
            <input
              id="compose-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none"
              placeholder="Message subject"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-grow w-full bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-200 dark:border-gray-700"
            placeholder="Write your message here..."
            aria-label="Email body"
          ></textarea>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border rounded-lg transition-colors bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 dark:hover:border-cyan-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isFormValid || isSending}
            className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 bg-blue-600 text-white border-transparent hover:bg-blue-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 focus:ring-blue-500 dark:focus:ring-cyan-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isSending ? <Spinner /> : null}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
