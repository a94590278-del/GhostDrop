

import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardIcon, QrCodeIcon, CheckIcon, XIcon, SparklesIcon, PencilSquareIcon, ListBulletIcon } from './Icons';
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
  const [isManualDomain, setIsManualDomain] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    if (!selectedDomain && domains.length > 0 && !isManualDomain) {
      setSelectedDomain(domains[0]);
    }
  }, [domains, selectedDomain, isManualDomain]);

  // Reset domain selection/input when toggling modes
  useEffect(() => {
      if (!isManualDomain && domains.length > 0) {
          // If switching back to list mode and current input isn't in list, reset to first default
          if (!domains.includes(selectedDomain)) {
              setSelectedDomain(domains[0]);
          }
      } else if (isManualDomain) {
          // If switching to manual, clear if it was a default value, or keep if user wants to edit it
          if (domains.includes(selectedDomain)) {
             setSelectedDomain('');
          }
      }
      setValidationError(null);
  }, [isManualDomain, domains]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    if (copied || !email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = useCallback(() => {
    setValidationError(null);
    if (!isLoading && alias.trim() && selectedDomain.trim()) {
        // Basic Domain Validation
        if (isManualDomain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(selectedDomain)) {
            setValidationError("Invalid domain format (e.g., example.com)");
            return;
        }
        onCreateCustom(alias, selectedDomain);
    }
  }, [isLoading, alias, selectedDomain, onCreateCustom, isManualDomain]);

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
    theme === 'light' ? '0f172a' : 'f9fafb'
  }&margin=2`;

  const isUnchanged = email === `${alias}@${selectedDomain}`;

  return (
    <div className={`glass-panel rounded-xl p-5 flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-500 relative overflow-hidden group ${isDestructing ? 'animate-destruct' : ''}`}>
      {/* Top glowing line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-cyan-500 opacity-100"></div>
      
      <p className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-gray-500 mb-3 self-start">Current Secure Address</p>
      
      {isCustomMode ? (
        <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full animate-scale-in">
            <div className="flex-grow flex items-center bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-cyan-500 focus-within:border-transparent transition-all shadow-inner overflow-hidden">
            <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="alias"
                className="flex-1 min-w-[80px] w-full bg-transparent text-slate-800 dark:text-gray-100 text-sm sm:text-base p-3 font-mono focus:outline-none placeholder-gray-400"
                aria-label="Email alias"
            />
            <span className="text-gray-400 dark:text-gray-500 font-mono text-lg select-none">@</span>
            <div className="relative flex-1 min-w-[140px]">
                {isManualDomain ? (
                    <input
                        type="text"
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        placeholder="domain.com"
                        className="w-full bg-transparent text-slate-800 dark:text-gray-100 text-sm sm:text-base p-3 font-mono focus:outline-none placeholder-gray-400"
                        aria-label="Custom domain input"
                    />
                ) : (
                    <>
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="w-full bg-transparent text-slate-800 dark:text-gray-100 text-sm sm:text-base p-3 pr-8 font-mono focus:outline-none appearance-none cursor-pointer"
                        aria-label="Select domain"
                    >
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        {selectedDomain && !domains.includes(selectedDomain) && <option key={selectedDomain} value={selectedDomain}>{selectedDomain}</option>}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                    </>
                )}
            </div>
            <button
                onClick={() => setIsManualDomain(!isManualDomain)}
                className="px-3 py-2 text-slate-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors border-l border-gray-100 dark:border-gray-800 focus:outline-none"
                title={isManualDomain ? "Select from list" : "Type custom domain"}
            >
                {isManualDomain ? <ListBulletIcon className="h-5 w-5" /> : <PencilSquareIcon className="h-4 w-4" />}
            </button>
            </div>
            <button
            onClick={handleCreate}
            disabled={isLoading || isUnchanged}
            title="Create Address (Ctrl+Enter)"
            className="flex-shrink-0 flex items-center justify-center p-3 rounded-lg transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-600 dark:to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
            {isLoading ? <Spinner /> : <SparklesIcon />}
            </button>
        </div>
      ) : (
        <div className="w-full bg-white/80 dark:bg-black/40 border border-slate-200 dark:border-gray-700 rounded-lg p-1 relative group-hover:border-indigo-500/30 dark:group-hover:border-cyan-500/30 transition-colors shadow-sm">
          <div className="h-12 flex items-center justify-center w-full px-2">
            {isLoading && !email ? (
              <>
                <Spinner />
                <span className="ml-3 text-sm font-medium text-slate-500 dark:text-gray-400 animate-pulse">Generating ID...</span>
              </>
            ) : email ? (
              <p className="font-mono text-base sm:text-lg md:text-xl text-indigo-700 dark:text-cyan-400 truncate select-all font-semibold tracking-tight">{email}</p>
            ) : (
              <p className="text-slate-400 dark:text-gray-500 text-sm italic">Not active</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 h-6 w-full">
        <div className="text-xs font-medium">
          {validationError && <p className="text-red-500 dark:text-red-400 animate-fade-in-up font-bold">{validationError}</p>}
          {!validationError && error && <p className="text-red-500 animate-fade-in-up">{error}</p>}
          {copied && <p className="text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in-up"><CheckIcon /> Copied!</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQr(true)}
            disabled={!email}
            className="p-2 rounded-lg bg-slate-100 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-cyan-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-gray-600"
            title="Show QR Code"
          >
            <QrCodeIcon />
          </button>
          <button
            onClick={handleCopy}
            disabled={copied || !email}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
              copied
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                : 'bg-indigo-50 dark:bg-cyan-900/20 text-indigo-600 dark:text-cyan-400 hover:bg-indigo-100 dark:hover:bg-cyan-900/40 border-indigo-100 dark:border-cyan-900/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
             <ClipboardIcon />
             <span className="hidden sm:inline">Copy</span>
          </button>
        </div>
      </div>
      
      {/* QR Modal */}
      {showQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-8 rounded-2xl shadow-2xl relative w-full max-w-sm mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 id="qr-modal-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Scan QR Code
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">Use your phone to capture this address.</p>
              <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100 inline-block mx-auto">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${email}`}
                  width="200"
                  height="200"
                  className="block rounded-lg"
                />
              </div>
              <div className="mt-6 p-3 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700">
                <p
                    className="text-indigo-600 dark:text-cyan-400 text-center text-sm font-mono break-all font-medium"
                    aria-label="Current email address"
                >
                    {email}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Close"
            >
              <XIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
