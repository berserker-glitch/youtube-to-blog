'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  const v = localStorage.getItem('theme');
  return v === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  localStorage.setItem('theme', theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    try {
      const t = getStoredTheme();
      setTheme(t);
      applyTheme(t);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type='button'
      onClick={toggle}
      className='inline-flex items-center gap-2 rounded-xl border border-zinc-300/70 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-900 transition-colors'
      aria-label='Toggle theme'
      title='Toggle theme'
    >
      <span className='inline-block h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100' />
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}


