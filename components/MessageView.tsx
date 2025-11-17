import React from 'react';
import type { MessageDetails } from '../types';
import { PaperClipIcon } from './Icons';

interface MessageViewProps {
  message: MessageDetails | null;
}

export default function MessageView({ message }: MessageViewProps) {
  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4 sm:p-6 h-full flex flex-col shadow-lg dark:shadow-cyan-500/5 transition-colors">
      {message ? (
        <div className="flex flex-col h-full">
          <div className="border-b border-gray-200 dark:border-cyan-500/20 pb-4 mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">{message.subject}</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-14 inline-block">From:</span> {message.from}</p>
              <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-14 inline-block">Date:</span> {new Date(message.date).toLocaleString()}</p>
            </div>
          </div>

          {message.attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <PaperClipIcon />
                Attachments ({message.attachments.length})
              </h4>
              <ul className="mt-2 space-y-1 text-sm">
                {message.attachments.map((att) => (
                  <li key={att.filename} className="text-blue-600 dark:text-cyan-400">
                    {/* In a real app, these would be download links */}
                    {att.filename} ({Math.round(att.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-grow overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 rounded-md min-h-[200px]">
            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans text-sm leading-relaxed">
              {/* NOTE: Rendering textBody for security. For htmlBody, use a sanitizer like DOMPurify. */}
              {message.textBody}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <p className="mt-4 text-lg text-gray-500">Select an email to read</p>
            <p className="text-sm">Your inbox is on the left.</p>
          </div>
        </div>
      )}
    </div>
  );
}