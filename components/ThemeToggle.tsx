'use client';

import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-muted dark:text-sage-400">☀️</span>
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          theme === 'light'
            ? 'bg-sage-200'
            : 'bg-sage-700'
        }`}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        role="switch"
        aria-checked={theme === 'dark'}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm text-muted dark:text-sage-400">🌙</span>
    </div>
  );
}
