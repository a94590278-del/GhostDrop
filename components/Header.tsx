import React from 'react';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header() {
  return (
    <header className="flex justify-between items-center">
      <div className="text-left">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-600 dark:text-cyan-400 tracking-wider">
          GhostDrop
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Disposable inbox that disappears on demand.
        </p>
      </div>
      <ThemeSwitcher />
    </header>
  );
}