import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './ThemeSwitcher';
import { CogIcon, BellIcon, SpeakerWaveIcon, SpeakerXMarkIcon, XIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

function SettingsModal({ isOpen, onClose, isSoundEnabled, onToggleSound }: SettingsModalProps) {
  const [notificationPermission, setNotificationPermission] = useState('default');

  useEffect(() => {
    if (window.Notification) {
      setNotificationPermission(Notification.permission);
    }
  }, [isOpen]);

  const handleRequestNotificationPermission = () => {
    if (window.Notification && Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  };
  
  if (!isOpen) return null;

  const getPermissionStatusText = () => {
    switch(notificationPermission) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Denied';
      default: return 'Default';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl relative w-full max-w-md mx-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-cyan-500/20 pb-3 mb-4">
          <h2 id="settings-modal-title" className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CogIcon /> Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
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
                <p className="font-medium text-gray-800 dark:text-gray-200">Browser Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status: {getPermissionStatusText()}</p>
              </div>
            </div>
            <button
              onClick={handleRequestNotificationPermission}
              disabled={notificationPermission === 'granted' || notificationPermission === 'denied'}
              className="px-4 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white/70 text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700 dark:hover:border-cyan-500"
            >
              {notificationPermission === 'granted' ? 'Allowed' : 'Request'}
            </button>
          </div>

          {/* Sound Settings */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
              {isSoundEnabled ? <SpeakerWaveIcon /> : <SpeakerXMarkIcon />}
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Sound Alerts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Play sound on new email</p>
              </div>
            </div>
            <button
                onClick={onToggleSound}
                role="switch"
                aria-checked={isSoundEnabled}
                className={`${isSoundEnabled ? 'bg-blue-600 dark:bg-cyan-500' : 'bg-gray-200 dark:bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
              >
                <span className={`${isSoundEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Header({ isSoundEnabled, onToggleSound }: { isSoundEnabled: boolean, onToggleSound: () => void }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  return (
    <>
      <header className="flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-cyan-400 tracking-wider">
            GhostDrop v4
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
            Disposable inbox that disappears on demand.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 focus:ring-cyan-500 transition-colors"
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
      />
    </>
  );
}