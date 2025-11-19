
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateRandomMailbox, fetchMessages, fetchMessage, getDomains, generateCustomMailbox } from './services/mailService';
import { useInterval } from './hooks/useInterval';
import type { Message, MessageDetails } from './types';
import Header from './components/Header';
import EmailDisplay from './components/EmailDisplay';
import Actions from './components/Actions';
import Inbox from './components/Inbox';
import MessageView from './components/MessageView';
import ComposeView from './components/ComposeView';
import Spinner from './components/Spinner';
import InfoSection from './components/InfoSection';
import Footer from './components/Footer';

const POLLING_INTERVAL = 5000; // 5 seconds

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden transition-colors duration-500 bg-[#f0f4f8] dark:bg-[#05050a]">
      {/* Glowing Orbs - tuned for visibility in light mode */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-blue-400/20 dark:bg-cyan-900/10 rounded-full blur-[90px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-purple-400/20 dark:bg-purple-900/10 rounded-full blur-[90px] animate-pulse-slow" style={{animationDelay: '1.5s'}}></div>
      <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] bg-cyan-300/15 dark:opacity-0 rounded-full blur-[70px] animate-pulse-slow" style={{animationDelay: '0.8s'}}></div>
      
      {/* Grid Overlay - slightly darker in light mode for definition */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#64748b15_1px,transparent_1px),linear-gradient(to_bottom,#64748b15_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"></div>
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
  
  // Settings State
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('soundEnabled') === 'true' : false;
  });
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('notificationsEnabled') === 'true' : false;
  });

  const [domains, setDomains] = useState<string[]>([]);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isDestructing, setIsDestructing] = useState<boolean>(false);
  const [newlyArrivedMessageIds, setNewlyArrivedMessageIds] = useState<Set<string>>(new Set());
  const [composeData, setComposeData] = useState<{ to: string; subject: string; } | null>(null);
  
  const isInitialMount = useRef(true);
  const knownMessageIds = useRef(new Set<string>());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Effect to hide the static preloader when the app is ready
  useEffect(() => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      if (!isLoading) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.remove();
        }, 500); // Match CSS transition duration
      }
    }
  }, [isLoading]);

  const handleToggleNotifications = useCallback(() => {
    setIsNotificationsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notificationsEnabled', String(newValue));
      return newValue;
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        try {
          audioContextRef.current = new AudioContext();
        } catch (e) {
          console.error("Could not create AudioContext", e);
          return; 
        }
      }
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A6 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Keep volume low

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const handleGenerateEmail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    setCurrentEmail(null);
    setSelectedMessage(null);
    setSearchTerm('');
    setReadStatus({});
    knownMessageIds.current.clear();
    setIsCustomMode(false);
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

  const handleCreateCustomEmail = useCallback(async (alias: string, domain: string) => {
    if (!alias.trim() || !domain) {
      setError("Alias and domain cannot be empty.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessages([]);
    // Do not clear currentEmail here, so the form doesn't flicker
    setSelectedMessage(null);
    setSearchTerm('');
    setReadStatus({});
    knownMessageIds.current.clear();
    
    try {
      const fullAddress = `${alias}@${domain}`;
      const email = await generateCustomMailbox(fullAddress);
      setCurrentEmail(email);
      setIsCustomMode(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to create email. ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelfDestruct = useCallback(() => {
    if (!currentEmail || isLoading || isDestructing) return;
    setIsDestructing(true);
    setTimeout(() => {
      handleGenerateEmail().then(() => {
        // Animation is 600ms, reset state after it's done.
        setIsDestructing(false);
      });
    }, 600);
  }, [currentEmail, isLoading, isDestructing, handleGenerateEmail]);

  useEffect(() => {
    const initializeApp = async () => {
      await handleGenerateEmail();
      try {
        const domainList = await getDomains();
        setDomains(domainList);
      } catch (e) {
        console.error("Failed to get domains for UI after initial generation.", e);
      }
    };

    initializeApp();
  }, [handleGenerateEmail]);
  
  const handleFetchMessages = useCallback(async () => {
    if (!currentEmail || isFetchingMessages) return;

    setIsFetchingMessages(true);
    try {
      const fetchedMessages = await fetchMessages();
      
      const trulyNewMessages = fetchedMessages.filter(m => !knownMessageIds.current.has(m.id));
      
      if (trulyNewMessages.length > 0) {
        setMessages(fetchedMessages);
        
        const newIds = new Set<string>();
        trulyNewMessages.forEach(msg => {
          knownMessageIds.current.add(msg.id);
          newIds.add(msg.id);
        });
        setNewlyArrivedMessageIds(newIds);

        if (isSoundEnabled) {
          playNotificationSound();
        }

        // Only show notification if enabled by user AND permission granted
        if (isNotificationsEnabled && window.Notification && Notification.permission === 'granted') {
          trulyNewMessages.forEach(msg => {
            new Notification('New Email Received', {
              body: `From: ${msg.from}\nSubject: ${msg.subject}`,
              icon: '/favicon.svg',
              silent: true,
            });
          });
        }
      } else if (fetchedMessages.length !== messages.length) {
        setMessages(fetchedMessages);
      }

    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsFetchingMessages(false);
    }
  }, [currentEmail, isFetchingMessages, messages, isSoundEnabled, isNotificationsEnabled, playNotificationSound]);

  // Effect to clear the new message animation state
  useEffect(() => {
    if (newlyArrivedMessageIds.size > 0) {
      const timer = setTimeout(() => {
        setNewlyArrivedMessageIds(new Set());
      }, 2000); // Animation is 0.5s, keep highlight for a bit
      return () => clearTimeout(timer);
    }
  }, [newlyArrivedMessageIds]);


  useInterval(handleFetchMessages, currentEmail ? POLLING_INTERVAL : null);

  const handleSelectMessage = async (id: string) => {
    if (selectedMessage && selectedMessage.id === id && selectedMessage.body !== 'Loading full message...') {
        return;
    }
    
    const existingMessage = messages.find(m => m.id === id);
    if (!existingMessage) return;

    setReadStatus(prev => ({ ...prev, [id]: true }));

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
    } catch (err)      {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setError(`Failed to load message. ${message}`);
      console.error(err);
      setSelectedMessage(null);
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

  const handleCloseCompose = () => {
    setComposeData(null);
  };
  
  const handleSendMessage = async (data: { to: string; subject: string; body: string }) => {
    // The current backend (mail.gw) does not support sending emails.
    // This function shows an alert to inform the user.
    console.log("Attempting to send email:", data);
    alert("Sending functionality is not supported by this temporary mail service. This is a UI demonstration.");
    handleCloseCompose();
  };

  const filteredMessages = messages.filter(message =>
    message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-gray-200 flex flex-col selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-cyan-900 dark:selection:text-cyan-200">
      <AnimatedBackground />
      <div className="relative z-10 flex-grow flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <Header 
          isSoundEnabled={isSoundEnabled} 
          onToggleSound={() => {
            const newSoundState = !isSoundEnabled;
            setIsSoundEnabled(newSoundState);
            localStorage.setItem('soundEnabled', String(newSoundState));
          }} 
          isNotificationsEnabled={isNotificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
        />

        <main className="flex-grow mt-8 flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Left Column (Sidebar) */}
          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-5 animate-fade-in-up">
            <EmailDisplay 
              email={currentEmail}
              domains={domains}
              onCreateCustom={handleCreateCustomEmail}
              isLoading={isLoading}
              error={error}
              isCustomMode={isCustomMode}
              isDestructing={isDestructing}
            />
            <Actions 
              onNewEmail={handleGenerateEmail}
              onRefresh={handleManualRefresh}
              onSelfDestruct={handleSelfDestruct}
              isRefreshing={isFetchingMessages}
              disabled={isLoading || !currentEmail}
              isCreating={isLoading}
              onToggleCustomMode={() => setIsCustomMode(prev => !prev)}
              isCustomMode={isCustomMode}
            />
            <Inbox 
              messages={filteredMessages} 
              isLoading={isLoading && !!currentEmail}
              onSelectMessage={handleSelectMessage}
              selectedMessageId={selectedMessage?.id ?? null}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              readStatus={readStatus}
              onToggleReadStatus={handleToggleReadStatus}
              isDestructing={isDestructing}
              newlyArrivedMessageIds={newlyArrivedMessageIds}
            />
          </div>

          {/* Right Column (Message View) */}
          <div className="w-full md:w-3/5 lg:w-2/3 flex-grow h-[650px] md:h-auto min-h-[500px] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <MessageView 
              message={selectedMessage} 
              isDestructing={isDestructing}
            />
          </div>
        </main>
        
        {composeData && (
          <ComposeView 
            initialTo={composeData.to}
            initialSubject={composeData.subject}
            onSend={handleSendMessage}
            onClose={handleCloseCompose}
          />
        )}

        <InfoSection />
        <Footer />
      </div>
    </div>
  );
}
