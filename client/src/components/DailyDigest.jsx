import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../lib/api';
import { timeAgo } from '../lib/utils';

const REGION_CONFIG = [
  { key: 'europe',      label: 'Europe',      colour: '#3b82f6', keywords: ['europe', 'eu', 'nato', 'ukraine', 'russia', 'france', 'germany', 'uk', 'poland'] },
  { key: 'asia-pacific', label: 'Asia-Pacific', colour: '#8b5cf6', keywords: ['china', 'japan', 'korea', 'taiwan', 'india', 'pacific', 'beijing'] },
  { key: 'americas',    label: 'Americas',     colour: '#22c55e', keywords: ['us', 'usa', 'united states', 'canada', 'brazil', 'latin', 'washington'] },
  { key: 'africa-me',   label: 'Africa & ME',  colour: '#f97316', keywords: ['africa', 'israel', 'iran', 'saudi', 'egypt', 'sudan', 'gaza', 'middle east'] },
];

export default function DailyDigest({ activeRegion, onRegionSelect, style }) {
  const { data, isLoading } = useQuery({
    queryKey: ['digest'],
    queryFn: analysisApi.getDigest,
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const regions = data?.regions || {};

  return (
    <div className="card flex flex-col" style={{ gridArea: 'digest', ...style, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <DigestIcon />
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Daily Digest</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {activeRegion ? 'Filtering feed ↑' : data?.generatedAt ? timeAgo(data.generatedAt) : ''}
        </span>
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
            {REGION_CONFIG.map((region) => {
              const isActive = activeRegion === region.label;
              return (
                <div
                  key={region.key}
                  onClick={() => onRegionSelect(region.label, region.keywords)}
                  className="px-4 py-3 transition-colors"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: isActive ? `${region.colour}10` : 'transparent',
                    borderLeft: isActive ? `2px solid ${region.colour}` : '2px solid transparent',
                  }}
                  onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full block shrink-0" style={{ background: region.colour }} />
                      <span className="text-xs font-semibold" style={{ color: region.colour }}>{region.label}</span>
                    </div>
                    {isActive && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${region.colour}20`, color: region.colour, fontSize: 9 }}>
                        Filtering ×
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)', lineHeight: '1.55' }}>
                    {regions[region.key] || 'No significant developments to report.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DigestIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
