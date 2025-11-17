import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardIcon, QrCodeIcon, CheckIcon, XIcon, SparklesIcon } from './Icons';
import { useTheme } from '../hooks/useTheme';
import Spinner from './Spinner';

interface EmailDisplayProps {
  email: string | null;
  domains: string[];
  onCreateCustom: (alias: string, domain: string) => void;
  isLoading: boolean;
  error: string | null;
  isCustomMode: boolean;
  isDestructing: boolean;
}

export default function EmailDisplay({ email, domains, onCreateCustom, isLoading, error, isCustomMode, isDestructing }: EmailDisplayProps) {
  const [alias, setAlias] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [theme] = useTheme();

  useEffect(() => {
    if (email) {
      const [aliasPart, domainPart] = email.split('@');
      setAlias(aliasPart);
      setSelectedDomain(domainPart);
    } else {
      setAlias('');
    }
  }, [email]);

  useEffect(() => {
    if (!selectedDomain && domains.length > 0) {
      setSelectedDomain(domains[0]);
    }
  }, [domains, selectedDomain]);

  const handleCopy = () => {
    if (copied || !email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = useCallback(() => {
    if (!isLoading && alias.trim() && selectedDomain) {
      onCreateCustom(alias, selectedDomain);
    }
  }, [isLoading, alias, selectedDomain, onCreateCustom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQr(false);
      }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && isCustomMode) {
        handleCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomMode, handleCreate]);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=mailto:${encodeURIComponent(
    email ?? ''
  )}&bgcolor=${theme === 'light' ? 'ffffff' : '111827'}&color=${
    theme === 'light' ? '030712' : 'f9fafb'
  }&margin=2`;

  const isUnchanged = email === `${alias}@${selectedDomain}`;

  return (
    <div className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4 flex flex-col items-center shadow-lg dark:shadow-cyan-500/5 transition-all duration-500 ${isDestructing ? 'animate-destruct' : ''}`}>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Your temporary email address:</p>
      
      {isCustomMode ? (
        <div className="flex items-stretch gap-2 w-full">
            <div className="flex-grow flex items-center bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all">
            <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="choose-an-alias"
                className="flex-shrink min-w-0 w-full bg-transparent text-blue-600 dark:text-cyan-400 text-sm sm:text-base p-2 font-mono focus:outline-none"
                aria-label="Email alias"
            />
            <span className="text-gray-400 dark:text-gray-500 font-mono text-sm sm:text-base">@</span>
            <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-transparent text-blue-600 dark:text-cyan-400 text-sm sm:text-base p-2 font-mono focus:outline-none appearance-none cursor-pointer pr-6 bg-no-repeat bg-right"
                style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`}}
                aria-label="Email domain"
            >
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                {selectedDomain && !domains.includes(selectedDomain) && <option key={selectedDomain} value={selectedDomain}>{selectedDomain}</option>}
            </select>
            </div>
            <button
            onClick={handleCreate}
            disabled={isLoading || isUnchanged}
            title="Create Address (Ctrl+Enter)"
            className="flex-shrink-0 flex items-center justify-center p-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 bg-blue-600 text-white border-transparent hover:bg-blue-700 dark:bg-purple-600 dark:hover:bg-purple-700 focus:ring-blue-500 dark:focus:ring-purple-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
            {isLoading ? <Spinner /> : <SparklesIcon />}
            </button>
        </div>
      ) : (
        <div className="h-11 flex items-center justify-center w-full">
          {isLoading && !email ? (
            <>
              <Spinner />
              <span className="ml-4 text-gray-600 dark:text-gray-400">Generating address...</span>
            </>
          ) : email ? (
            <p className="font-mono text-lg text-blue-600 dark:text-cyan-400 truncate py-2">{email}</p>
          ) : (
            <p className="text-gray-500">Click a button below to start</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 h-4 w-full">
        <div className="text-xs">
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          {copied && <p className="text-green-600 dark:text-green-400">Copied to clipboard!</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowQr(true)}
            disabled={!email}
            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-cyan-500/20 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Show QR Code"
          >
            <QrCodeIcon />
          </button>
          <button
            onClick={handleCopy}
            disabled={copied || !email}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            className={`p-1.5 rounded-md transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              copied
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-cyan-500/20 hover:text-blue-600 dark:hover:text-cyan-400'
            }`}
          >
            {copied ? <CheckIcon /> : <ClipboardIcon />}
          </button>
        </div>
      </div>
      {showQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl relative w-full max-w-sm mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 id="qr-modal-title" className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                Scan QR Code
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Open your camera app to scan.</p>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-md inline-block border border-gray-200 dark:border-gray-700">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${email}`}
                  width="256"
                  height="256"
                  className="block"
                />
              </div>
              <p
                className="text-gray-600 dark:text-gray-300 text-center mt-4 text-xs font-mono break-all"
                aria-label="Current email address"
              >
                {email}
              </p>
            </div>
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-2 right-2 p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
              title="Close"
              aria-label="Close QR code modal"
            >
              <XIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}