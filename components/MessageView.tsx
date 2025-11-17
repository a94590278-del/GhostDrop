

import React, { useState, useEffect } from 'react';
import type { MessageDetails } from '../types';
import { getAttachmentBlob } from '../services/mailService';
import { PaperClipIcon, DownloadIcon, SparklesIcon, ReplyIcon } from './Icons';
import Spinner from './Spinner';

interface MessageViewProps {
  message: MessageDetails | null;
  onSummarizeEmail: (text: string) => Promise<string>;
  isDestructing: boolean;
  onReply: () => void;
}

const MessageViewSkeleton = () => (
  <div className="flex flex-col h-full animate-pulse">
    <div className="border-b border-gray-200 dark:border-cyan-500/20 pb-4 mb-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
    <div className="flex-grow bg-gray-50 dark:bg-black/20 p-4 rounded-md">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  </div>
);

export default function MessageView({ message, onSummarizeEmail, isDestructing, onReply }: MessageViewProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  useEffect(() => {
    setSummary(null);
    setIsSummarizing(false);
    setSummaryError(null);
  }, [message?.id]);

  const handleSummarize = async () => {
    if (!message || isSummarizing) return;

    setIsSummarizing(true);
    setSummary(null);
    setSummaryError(null);
    try {
      const result = await onSummarizeEmail(message.textBody || message.body);
      setSummary(result);
    } catch (e) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
      setSummaryError(`Failed to summarize: ${errorMsg}`);
    } finally {
      setIsSummarizing(false);
    }
  };

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

  const renderSummaryHtml = (text: string) => {
    if (!text) return '';
    // Basic markdown to HTML conversion
    return text
      .replace(/<\/?[^>]+(>|$)/g, "") // Basic sanitize
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/^\s*\*/gm, '&bull;') // Bullets
      .replace(/\n/g, '<br />'); // Newlines
  };

  return (
    <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4 sm:p-6 h-full flex flex-col shadow-lg dark:shadow-cyan-500/5 transition-all duration-500 ${isDestructing ? 'animate-destruct' : ''}`}>
      {!message ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <p className="mt-4 text-lg text-gray-500">Select an email to read</p>
            <p className="text-sm">Your inbox is on the left.</p>
          </div>
        </div>
      ) : message.body === 'Loading full message...' ? (
        <MessageViewSkeleton />
      ) : (
        <div className="flex flex-col h-full min-h-0">
          <div className="border-b border-gray-200 dark:border-cyan-500/20 pb-4 mb-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 flex-grow">{message.subject}</h3>
              <div className="flex-shrink-0 flex items-center gap-2">
                <button 
                  onClick={onReply}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 dark:hover:border-cyan-500"
                  title="Reply to email"
                >
                  <ReplyIcon />
                  <span>Reply</span>
                </button>
                <button 
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 dark:hover:border-cyan-500"
                  title="Summarize with Gemini AI"
                >
                  {isSummarizing ? <Spinner /> : <SparklesIcon />}
                  <span>Summarize</span>
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
              <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-14 inline-block">From:</span> {message.from}</p>
              <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-14 inline-block">Date:</span> {new Date(message.date).toLocaleString()}</p>
            </div>
          </div>
          
          {(isSummarizing || summary || summaryError) && (
            <div className="mb-4 p-4 rounded-lg border bg-blue-50/50 border-blue-200 dark:bg-cyan-900/10 dark:border-cyan-500/20 animate-scale-in flex-shrink-0">
              <h4 className="font-bold text-sm text-blue-700 dark:text-cyan-300 flex items-center gap-2 mb-2">
                <SparklesIcon /> Gemini AI Summary
              </h4>
              {isSummarizing && <div className="text-sm text-gray-600 dark:text-gray-400">Thinking...</div>}
              {summaryError && <div className="text-sm text-red-600 dark:text-red-400">{summaryError}</div>}
              {summary && <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: renderSummaryHtml(summary) }}></div>}
            </div>
          )}

          {message.attachments.length > 0 && (
            <div className="mb-4 flex-shrink-0">
              <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <PaperClipIcon />
                Attachments ({message.attachments.length})
              </h4>
              <ul className="mt-2 space-y-2 text-sm">
                {message.attachments.map((att) => (
                  <li key={att.id}>
                    <button
                      onClick={() => handleDownload(message.id, att.id, att.filename)}
                      disabled={!!downloading}
                      className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 hover:underline disabled:opacity-50 disabled:cursor-wait"
                    >
                      {downloading === att.id ? <Spinner/> : <DownloadIcon />}
                      {att.filename} <span className="text-gray-500">({Math.round(att.size / 1024)} KB)</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-grow overflow-hidden bg-gray-50 dark:bg-black/20 rounded-md">
            {message.htmlBody ? (
              <iframe
                srcDoc={message.htmlBody}
                sandbox="allow-popups"
                className="w-full h-full border-0"
                title="Email Content"
              />
            ) : (
              <div className="overflow-y-auto h-full p-4">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans text-sm leading-relaxed">
                  {message.textBody}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
