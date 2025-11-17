import React, { useState, useRef, useEffect } from 'react';
import { ClipboardIcon, QrCodeIcon } from './Icons';

interface EmailDisplayProps {
  email: string;
}

// Global QRCode is loaded from CDN in index.html
declare var QRCode: any;

export default function EmailDisplay({ email }: EmailDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (showQr && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, email, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error: Error | null) => {
        if (error) console.error(error);
      });
    }
  }, [showQr, email]);

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200 dark:border-cyan-500/20 rounded-lg p-4 flex flex-col items-center shadow-lg dark:shadow-cyan-500/5 transition-colors">
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Your temporary email address:</p>
      <div className="flex items-center w-full bg-gray-100 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-md p-2">
        <span className="flex-grow text-blue-600 dark:text-cyan-400 text-sm sm:text-base break-all select-all font-mono">
          {email}
        </span>
        <button
          onClick={handleCopy}
          className="ml-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-cyan-500/20 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors duration-200"
          title="Copy to clipboard"
        >
          <ClipboardIcon />
        </button>
        <button
          onClick={() => setShowQr(true)}
          className="ml-1 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-cyan-500/20 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors duration-200"
          title="Show QR Code"
        >
          <QrCodeIcon />
        </button>
      </div>
      {copied && (
        <p className="text-green-600 dark:text-green-400 text-xs mt-2 transition-opacity duration-300">
          Copied!
        </p>
      )}
      {showQr && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowQr(false)}
        >
          <div className="bg-white p-4 rounded-lg" onClick={e => e.stopPropagation()}>
            <canvas ref={qrCanvasRef}></canvas>
            <p className="text-black text-center mt-2 text-sm font-sans">{email}</p>
          </div>
        </div>
      )}
    </div>
  );
}