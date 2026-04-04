import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { analysisApi } from '../lib/api';

// Colour scale for bars
const COLOURS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-lg text-xs"
        style={{
          background: '#1a1d27',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#f0f2f8',
        }}
      >
        <p className="font-semibold mb-0.5">{payload[0].payload.topic}</p>
        <p style={{ color: '#8b93a8' }}>{payload[0].value} mentions</p>
      </div>
    );
  }
  return null;
}

function CustomYAxisTick({ x, y, payload }) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="var(--text-secondary)"
      fontSize={10}
      fontFamily="Inter, sans-serif"
    >
      {payload.value.length > 14 ? payload.value.slice(0, 13) + '…' : payload.value}
    </text>
  );
}

export default function TrendsChart({ style }) {
  const { data, isLoading } = useQuery({
    queryKey: ['trends'],
    queryFn: analysisApi.getTrends,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const trends = data?.trends || [];

  return (
    <div
      className="card flex flex-col"
      style={{ gridArea: 'trends', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <TrendIcon />
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            Trending Topics
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          By keyword frequency
        </span>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trends.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-secondary)' }}>
            No trend data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trends}
              layout="vertical"
              margin={{ top: 2, right: 16, left: 4, bottom: 2 }}
              barCategoryGap="25%"
            >
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="topic"
                width={110}
                tick={<CustomYAxisTick />}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                {trends.map((_, idx) => (
                  <Cell key={idx} fill={COLOURS[idx % COLOURS.length]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TrendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
