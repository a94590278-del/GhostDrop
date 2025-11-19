
import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { CogIcon, BellIcon, SpeakerWaveIcon, SpeakerXMarkIcon, XIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isNotificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

function SettingsModal({ 
  isOpen, 
  onClose, 
  isSoundEnabled, 
  onToggleSound, 
  isNotificationsEnabled, 
  onToggleNotifications 
}: SettingsModalProps) {
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (window.Notification) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleNotificationToggle = () => {
    if (!window.Notification) return;
    
    if (isNotificationsEnabled) {
      // Turning off
      onToggleNotifications();
    } else {
      // Turning on
      if (Notification.permission === 'granted') {
        onToggleNotifications();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            onToggleNotifications();
          }
        });
      }
      // If denied, user must change browser settings manually
    }
  };
  
  if (!isOpen) return null;

  const getPermissionStatusText = () => {
    switch(notificationPermission) {
      case 'granted': return 'Get notified when new emails arrive';
      case 'denied': return 'Permission denied in browser';
      default: return 'Enable desktop notifications';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl relative w-full max-w-md mx-4 animate-scale-in border border-slate-100 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-cyan-500/20 pb-4 mb-5">
          <h2 id="settings-modal-title" className="text-xl font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2">
            <CogIcon /> Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 transition-colors"
            title="Close"
            aria-label="Close settings modal"
          >
            <XIcon />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellIcon />
              <div>
                <p className="font-medium text-slate-800 dark:text-gray-200">Browser Notifications</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">{getPermissionStatusText()}</p>
              </div>
            </div>
            <button
              onClick={handleNotificationToggle}
              disabled={notificationPermission === 'denied'}
              role="switch"
              aria-checked={isNotificationsEnabled}
              className={`${isNotificationsEnabled ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-slate-200 dark:bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className={`${isNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
            </button>
          </div>

          {/* Sound Settings */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
              {isSoundEnabled ? <SpeakerWaveIcon /> : <SpeakerXMarkIcon />}
              <div>
                <p className="font-medium text-slate-800 dark:text-gray-200">Sound Alerts</p>
                <p className="text-sm text-slate-500 dark:text-gray-400">Play sound on new email</p>
              </div>
            </div>
            <button
                onClick={onToggleSound}
                role="switch"
                aria-checked={isSoundEnabled}
                className={`${isSoundEnabled ? 'bg-indigo-600 dark:bg-cyan-500' : 'bg-slate-200 dark:bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
              >
                <span className={`${isSoundEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Header({ 
  isSoundEnabled, 
  onToggleSound, 
  isNotificationsEnabled, 
  onToggleNotifications 
}: { 
  isSoundEnabled: boolean, 
  onToggleSound: () => void,
  isNotificationsEnabled: boolean,
  onToggleNotifications: () => void
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <>
      <header className="flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 tracking-tight filter drop-shadow-sm">
            GhostDrop <span className="text-lg align-top opacity-60 text-slate-500 dark:text-cyan-200/50 font-mono">v4</span>
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1 text-sm sm:text-base font-medium">
            Secure. Disposable. <span className="text-indigo-600 dark:text-cyan-300">Anonymous.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-full text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-gray-950 focus:ring-indigo-500 dark:focus:ring-cyan-500 transition-all"
            aria-label="Open settings"
          >
            <CogIcon />
          </button>
          <ThemeSwitcher />
        </div>
      </header>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        isSoundEnabled={isSoundEnabled}
        onToggleSound={onToggleSound}
        isNotificationsEnabled={isNotificationsEnabled}
        onToggleNotifications={onToggleNotifications}
      />
    </>
  );
}
