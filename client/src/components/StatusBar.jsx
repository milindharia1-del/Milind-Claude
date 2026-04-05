import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { newsApi, authApi } from '../lib/api';
import { timeAgo } from '../lib/utils';

export default function StatusBar({ user, theme, onThemeToggle, style }) {
  const qc = useQueryClient();
  const [clock, setClock] = useState(new Date());
  const [flash, setFlash] = useState(false);
  const prevCriticalRef = useRef(0);

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data: newsData } = useQuery({
    queryKey: ['news', 'All'],
    queryFn: () => newsApi.getNews('All'),
    refetchInterval: 60 * 1000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: newsApi.getAlerts,
    refetchInterval: 60 * 1000,
  });

  const articles = newsData?.articles || [];
  const alerts = alertsData?.alerts || [];
  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const countries = [...new Set(articles.map((a) => a.country).filter(Boolean))].length;

  // Flash red when new critical alerts arrive
  useEffect(() => {
    if (criticalCount > prevCriticalRef.current && prevCriticalRef.current !== 0) {
      setFlash(true);
      setTimeout(() => setFlash(false), 3000);
    }
    prevCriticalRef.current = criticalCount;
  }, [criticalCount]);

  const handleLogout = async () => {
    await authApi.logout();
    qc.clear();
    window.location.reload();
  };

  const timeStr = clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = clock.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="card flex items-center px-4 gap-6"
      style={{
        gridArea: 'statusbar', ...style, borderRadius: '10px',
        transition: 'box-shadow 0.3s',
        boxShadow: flash ? '0 0 0 2px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.2)' : undefined,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative w-5 h-5">
          <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)' }} />
          <div className="absolute inset-1.5 rounded-full" style={{ background: flash ? '#ff2020' : '#ef4444', transition: 'background 0.3s' }} />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>GeoWatch</span>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="pulse-dot w-2 h-2 rounded-full bg-green-400 block" />
        <span className="text-xs font-medium text-green-400">LIVE</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-5 flex-1">
        <Stat label="Events Today" value={articles.length} />
        <Stat label="Active Hotspots" value={9} />
        <Stat
          label="Critical Alerts"
          value={criticalCount}
          flash={flash}
          valueStyle={criticalCount > 0 ? { color: flash ? '#ff4444' : '#f87171' } : undefined}
        />
        <Stat label="Countries" value={countries || '—'} />
      </div>

      {/* Live clock */}
      <div className="shrink-0 text-right">
        <div className="text-sm font-mono font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
          {timeStr} <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>UTC</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{dateStr}</div>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onThemeToggle}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
        title="Toggle dark/light mode"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* User */}
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
            {(user.name || 'A')[0]}
          </div>
          <button onClick={handleLogout} className="text-xs transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, valueStyle, flash }) {
  return (
    <div className="flex flex-col">
      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{label}</span>
      <span
        className="text-sm font-semibold leading-tight"
        style={{ color: 'var(--text-primary)', transition: 'color 0.3s', ...valueStyle }}
      >
        {flash && valueStyle ? '⚠ ' : ''}{value}
      </span>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b93a8" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
