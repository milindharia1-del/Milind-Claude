import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from './lib/api';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    return <LoginPage />;
  }

  return (
    <Dashboard
      user={data.user}
      theme={theme}
      onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    />
  );
}
