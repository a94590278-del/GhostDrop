import React from 'react';
import { RefreshIcon, SparklesIcon } from './Icons';
import Spinner from './Spinner';

interface ActionsProps {
  onNewEmail: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  disabled: boolean;
}

const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  className?: string;
  title: string;
  variant?: 'primary' | 'secondary';
}> = ({ onClick, disabled, children, className = '', title, variant = 'secondary' }) => {
  const baseClasses = `w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950`;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white border-transparent
      hover:bg-blue-700
      dark:bg-purple-600 dark:hover:bg-purple-700
      focus:ring-blue-500 dark:focus:ring-purple-500
    `,
    secondary: `
      bg-white/70 text-gray-700 border-gray-300
      hover:bg-gray-50 hover:border-gray-400
      dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700
      dark:hover:border-cyan-500 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20
      focus:ring-cyan-500
    `,
  };

  const disabledClasses = `
    disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed
    dark:disabled:bg-gray-800/30 dark:disabled:text-gray-500 dark:disabled:border-gray-700
  `;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default function Actions({ onNewEmail, onRefresh, isRefreshing, disabled }: ActionsProps) {
  return (
    <div className="flex gap-4">
      <ActionButton onClick={onRefresh} disabled={disabled} title="Refresh Inbox">
        {isRefreshing ? <Spinner /> : <RefreshIcon />}
        <span>Refresh</span>
      </ActionButton>
      <ActionButton onClick={onNewEmail} disabled={false} title="Generate New Email" variant="primary">
        <SparklesIcon />
        <span>New</span>
      </ActionButton>
    </div>
  );
}