
import React, { useState, useEffect } from 'react';
import type { MessageDetails } from '../types';
import { getAttachmentBlob } from '../services/mailService';
import { summarizeEmail } from '../services/geminiService';
import { PaperClipIcon, DownloadIcon, SparklesIcon, XIcon } from './Icons';
import Spinner from './Spinner';

interface MessageViewProps {
  message: MessageDetails | null;
  isDestructing: boolean;
}

const MessageViewSkeleton = () => (
  <div className="flex flex-col h-full animate-pulse p-6">
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
      <div className="h-8 bg-slate-200 dark:bg-gray-700 rounded-lg w-3/4 mb-4"></div>
      <div className="flex gap-3">
         <div className="h-10 w-10 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
         <div className="space-y-2 flex-grow">
            <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-1/4"></div>
         </div>
      </div>
    </div>
    <div className="flex-grow space-y-4">
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-4/5"></div>
    </div>
  </div>
);

export default function MessageView({ message, isDestructing }: MessageViewProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Reset summary when message changes
  useEffect(() => {
    setSummary(null);
    setSummaryError(null);
    setIsSummarizing(false);
  }, [message?.id]);

  const handleDownload = async (messageId: string, attachmentId: string, filename: string) => {
    if (downloading) return;
    setDownloading(attachmentId);
    try {
      const blob = await getAttachmentBlob(messageId, attachmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download attachment.");
    } finally {
      setDownloading(null);
    }
  };

  const handleSummarize = async () => {
    if (!message) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      // Prefer text body for summarization as it's cleaner, fallback to body (which might contain some HTML text)
      const contentToSummarize = message.textBody || message.body;
      const result = await summarizeEmail(contentToSummarize);
      setSummary(result);
    } catch (error) {
      setSummaryError("Could not generate summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Empty State
  if (!message) {
      return (
        <div className={`glass-panel rounded-xl h-full flex flex-col items-center justify-center shadow-lg transition-all duration-500 p-8 text-center ${isDestructing ? 'animate-destruct' : ''}`}>
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-indigo-400 dark:bg-cyan-500 rounded-full opacity-20 blur-xl animate-pulse-slow"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="relative h-24 w-24 text-slate-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-gray-200 mb-2">No Message Selected</h3>
          <p className="text-slate-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
             Select an email from your inbox on the left to view its contents.
          </p>
        </div>
      );
  }

  return (
    <div className={`glass-panel rounded-xl h-full flex flex-col shadow-2xl transition-all duration-500 overflow-hidden ${isDestructing ? 'animate-destruct' : ''}`}>
       {message.body === 'Loading full message...' ? (
        <MessageViewSkeleton />
      ) : (
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{message.subject}</h3>
              <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-gradient-to-br from-indigo-50 to-white dark:from-purple-900/40 dark:to-gray-900 border border-indigo-200 dark:border-purple-500/50 text-indigo-700 dark:text-purple-300 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-purple-400 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSummarizing ? <Spinner /> : <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-purple-400" />}
                  <span>{isSummarizing ? 'Analyzing...' : 'Summarize'}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-400 dark:from-blue-500 dark:to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {message.from.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow">
                    <p className="text-sm font-medium text-slate-900 dark:text-gray-100">{message.from}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">{new Date(message.date).toLocaleString()}</p>
                </div>
            </div>
          </div>
          
          {/* Content Scroll Area */}
          <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white/40 dark:bg-transparent">
            {/* AI Summary Section */}
            {(summary || summaryError) && (
                <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-purple-500/30 p-5 relative animate-scale-in shadow-inner">
                <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-indigo-800 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wide">
                        <SparklesIcon className="w-4 h-4" /> AI Summary
                    </h4>
                    <button 
                    onClick={() => { setSummary(null); setSummaryError(null); }}
                    className="text-indigo-400 hover:text-indigo-600 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-indigo-200/50 dark:hover:bg-white/10"
                    aria-label="Close summary"
                    >
                    <XIcon className="w-4 h-4" />
                    </button>
                </div>
                {summaryError ? (
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{summaryError}</p>
                ) : (
                    <p className="text-sm text-slate-800 dark:text-gray-200 leading-7 font-medium">{summary}</p>
                )}
                </div>
            )}
            
            {message.attachments.length > 0 && (
                <div className="mb-8">
                <h4 className="text-xs uppercase tracking-widest text-slate-500 dark:text-gray-500 font-bold mb-3 flex items-center gap-2">
                    <PaperClipIcon />
                    Attachments ({message.attachments.length})
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {message.attachments.map((att) => (
                    <li key={att.id}>
                        <button
                        onClick={() => handleDownload(message.id, att.id, att.filename)}
                        disabled={!!downloading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all hover:border-indigo-400 dark:hover:border-cyan-500 group text-left shadow-sm"
                        >
                            <div className="p-2 bg-indigo-100 dark:bg-cyan-900/30 text-indigo-600 dark:text-cyan-400 rounded-lg group-hover:text-white group-hover:bg-indigo-500 dark:group-hover:bg-cyan-500 transition-colors">
                                {downloading === att.id ? <Spinner/> : <DownloadIcon />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-gray-200 truncate">{att.filename}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-500">{Math.round(att.size / 1024)} KB</p>
                            </div>
                        </button>
                    </li>
                    ))}
                </ul>
                </div>
            )}

            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-gray-300 font-sans text-base leading-7">
                {message.htmlBody ? (
                <div className="bg-white dark:bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
                    <iframe
                        srcDoc={message.htmlBody}
                        sandbox="allow-popups"
                        className="w-full min-h-[400px] border-0"
                        title="Email Content"
                        onLoad={(e) => {
                            const iframe = e.currentTarget;
                            // Basic auto-resize
                            if (iframe.contentWindow) {
                                iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 20 + 'px';
                            }
                        }}
                    />
                </div>
                ) : (
                    <div className="whitespace-pre-wrap bg-slate-50/80 dark:bg-black/20 p-6 rounded-xl border border-slate-200 dark:border-gray-800 font-medium">
                        {message.textBody}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
