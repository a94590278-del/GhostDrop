import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateRandomMailbox, fetchMessages, fetchMessage } from './services/mailService';
import { useInterval } from './hooks/useInterval';
import type { Message, MessageDetails } from './types';
import Header from './components/Header';
import EmailDisplay from './components/EmailDisplay';
import Actions from './components/Actions';
import Inbox from './components/Inbox';
import MessageView from './components/MessageView';
import Spinner from './components/Spinner';

const POLLING_INTERVAL = 5000; // 5 seconds

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-gray-950">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
    </div>
  );
}

export default function App() {
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMessages, setIsFetchingMessages] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});

  const isInitialMount = useRef(true);

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setCurrentEmail(null);
    setSelectedMessage(null);
    setSearchTerm('');
    setReadStatus({});
    try {
      const email = await generateRandomMailbox();
      setCurrentEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to generate new email. ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleGenerateEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleFetchMessages = useCallback(async () => {
    if (!currentEmail) return;
    if (isFetchingMessages) return;

    setIsFetchingMessages(true);
    try {
      const newMessages = await fetchMessages();
      // Simple check to see if messages have changed to avoid re-renders
      if (newMessages.length !== messages.length || JSON.stringify(newMessages) !== JSON.stringify(messages)) {
        setMessages(newMessages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      // Don't set a visible error for polling failures to avoid being intrusive
    } finally {
      setIsFetchingMessages(false);
    }
  }, [currentEmail, messages, isFetchingMessages]);

  useInterval(handleFetchMessages, currentEmail ? POLLING_INTERVAL : null);

  const handleSelectMessage = async (id: string) => {
    const existingMessage = messages.find(m => m.id === id);
    if (!existingMessage) return;

    // Mark as read when selected
    setReadStatus(prev => ({ ...prev, [id]: true }));

    // Show preview immediately to improve perceived performance
    setSelectedMessage({
        id: existingMessage.id,
        from: existingMessage.from,
        subject: existingMessage.subject,
        date: existingMessage.date,
        attachments: [],
        body: 'Loading full message...',
        textBody: 'Loading full message...',
        htmlBody: ''
    });

    try {
      const fullMessage = await fetchMessage(id);
      setSelectedMessage(fullMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to load message. ${message}`);
      console.error(err);
      setSelectedMessage(null); // Clear selection on error
    }
  };

  const handleToggleReadStatus = (id: string) => {
    setReadStatus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleManualRefresh = () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    handleFetchMessages();
  };

  const filteredMessages = messages.filter(message =>
    message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-transparent text-gray-800 dark:text-gray-200 font-sans p-4 sm:p-6 lg:p-8 flex flex-col selection:bg-cyan-300 selection:text-cyan-900">
      <AnimatedBackground />
      <div className="relative z-10 flex-grow flex flex-col max-w-7xl mx-auto w-full">
        <Header />

        <main className="flex-grow mt-8 flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-6">
            {isLoading ? (
              <div className="h-24 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4">
                <Spinner /> 
                <span className="ml-4 text-gray-600 dark:text-gray-400">Generating address...</span>
              </div>
            ) : error ? (
              <div className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 p-4 rounded-lg">{error}</div>
            ) : (
              currentEmail && <EmailDisplay email={currentEmail} />
            )}
            <Actions 
              onNewEmail={handleGenerateEmail}
              onRefresh={handleManualRefresh}
              isRefreshing={isFetchingMessages}
              disabled={isLoading || !currentEmail}
            />
            <Inbox 
              messages={filteredMessages} 
              onSelectMessage={handleSelectMessage}
              selectedMessageId={selectedMessage?.id ?? null}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              readStatus={readStatus}
              onToggleReadStatus={handleToggleReadStatus}
            />
          </div>

          {/* Right Column */}
          <div className="w-full md:w-3/5 lg:w-2/3 flex-grow">
            <MessageView message={selectedMessage} />
          </div>
        </main>
      </div>
    </div>
  );
}