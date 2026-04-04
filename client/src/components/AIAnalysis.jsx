import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '../lib/api';
import { timeAgo } from '../lib/utils';

export default function AIAnalysis({ style }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['briefing'],
    queryFn: analysisApi.getBriefing,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000,
  });

  const { mutate: refresh, isPending: refreshing } = useMutation({
    mutationFn: analysisApi.refreshBriefing,
    onSuccess: (newData) => {
      qc.setQueryData(['briefing'], newData);
    },
  });

  return (
    <div
      className="card flex flex-col"
      style={{ gridArea: 'analysis', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <ClaudeIcon />
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            AI Briefing
          </span>
          <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            Claude
          </span>
        </div>
        <button
          onClick={() => refresh()}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all"
          style={{
            background: refreshing ? 'rgba(59,130,246,0.1)' : 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshIcon spinning={refreshing} />
          {refreshing ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 panel-scroll">
        {isLoading || refreshing ? (
          <div className="flex flex-col gap-2">
            <div className="h-3 rounded animate-pulse" style={{ background: 'var(--border)', width: '92%' }} />
            <div className="h-3 rounded animate-pulse" style={{ background: 'var(--border)', width: '85%' }} />
            <div className="h-3 rounded animate-pulse" style={{ background: 'var(--border)', width: '78%' }} />
          </div>
        ) : data?.text ? (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.7' }}>
            {data.text}
          </p>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            No briefing available. Click Regenerate to generate one.
          </p>
        )}
      </div>

      {/* Footer */}
      {data?.generatedAt && (
        <div
          className="px-4 py-1.5 shrink-0 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Generated {timeAgo(data.generatedAt)}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Refreshes hourly</span>
        </div>
      )}
    </div>
  );
}

function ClaudeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
