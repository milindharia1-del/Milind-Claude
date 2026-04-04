import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { timeAgo, categoryClass, severityDotClass, severityTextClass } from '../lib/utils';

const SEV_ORDER = { Critical: 0, High: 1, Watch: 2, Normal: 3 };

export default function AlertsPanel({ style }) {
  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: newsApi.getAlerts,
    refetchInterval: 60 * 1000,
  });

  const alerts = (data?.alerts || [])
    .slice()
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
    .slice(0, 4);

  return (
    <div
      className="card flex flex-col"
      style={{ gridArea: 'alerts', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <AlertIcon />
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            Alerts
          </span>
        </div>
        {alerts.some((a) => a.severity === 'Critical') && (
          <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            {alerts.filter((a) => a.severity === 'Critical').length} Critical
          </span>
        )}
      </div>

      {/* Alert items */}
      <div className="panel-scroll flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
            No active alerts
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <AlertItem key={alert.id ?? idx} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}

function AlertItem({ alert }) {
  const dotClass = severityDotClass(alert.severity);
  const textClass = severityTextClass(alert.severity);

  return (
    <a
      href={alert.url !== '#' ? alert.url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 px-4 py-3 transition-colors block"
      style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Severity dot with pulse for Critical */}
      <div className="shrink-0 mt-1.5 relative">
        <span
          className={`w-2.5 h-2.5 rounded-full block ${dotClass} ${alert.severity === 'Critical' ? 'pulse-dot' : ''}`}
        />
        {alert.severity === 'Critical' && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: '#ef444440' }}
          />
        )}
      </div>

      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text-primary)', lineHeight: '1.35' }}>
          {alert.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${categoryClass(alert.category)}`}>{alert.category}</span>
          <span className={`text-xs font-semibold ${textClass}`}>{alert.severity}</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{alert.source}</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(alert.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}

function AlertIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
