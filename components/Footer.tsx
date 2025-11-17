import React from 'react';

export default function Footer() {
  return (
    <footer className="relative z-10 text-center py-6 mt-8 border-t border-gray-200 dark:border-cyan-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 dark:text-gray-500">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} GhostDrop. All Rights Reserved.</p>
          <p className="hidden sm:block">Secure, private, and disposable email inboxes.</p>
          <a 
            href="https://tinyurl.com/428mxrum" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}
