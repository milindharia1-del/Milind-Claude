import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../lib/api';
import { timeAgo } from '../lib/utils';

const REGION_CONFIG = [
  { key: 'europe', label: 'Europe', icon: '🌍', colour: '#3b82f6' },
  { key: 'asia-pacific', label: 'Asia-Pacific', icon: '🌏', colour: '#8b5cf6' },
  { key: 'americas', label: 'Americas', icon: '🌎', colour: '#22c55e' },
  { key: 'africa-me', label: 'Africa & ME', icon: '🌍', colour: '#f97316' },
];

export default function DailyDigest({ style }) {
  const { data, isLoading } = useQuery({
    queryKey: ['digest'],
    queryFn: analysisApi.getDigest,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const regions = data?.regions || {};

  return (
    <div
      className="card flex flex-col"
      style={{ gridArea: 'digest', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <DigestIcon />
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            Daily Digest
          </span>
          <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
            Claude
          </span>
        </div>
        {data?.generatedAt && (
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {timeAgo(data.generatedAt)}
          </span>
        )}
      </div>

      {/* Regions */}
      <div className="flex-1 panel-scroll">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-2.5 rounded animate-pulse" style={{ background: 'var(--border)', width: '40%' }} />
                <div className="h-2.5 rounded animate-pulse" style={{ background: 'var(--border)', width: '90%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {REGION_CONFIG.map((region) => (
              <RegionItem
                key={region.key}
                region={region}
                summary={regions[region.key]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RegionItem({ region, summary }) {
  return (
    <div
      className="px-4 py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="w-1.5 h-1.5 rounded-full block shrink-0"
          style={{ background: region.colour }}
        />
        <span className="text-xs font-semibold" style={{ color: region.colour }}>
          {region.label}
        </span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.55' }}>
        {summary || 'No significant developments to report.'}
      </p>
    </div>
  );
}

function DigestIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
