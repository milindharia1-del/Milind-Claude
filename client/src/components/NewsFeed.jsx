import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { timeAgo, categoryClass, severityTextClass } from '../lib/utils';

const TABS = ['All', 'Conflict', 'Diplomacy', 'Economy', 'Elections'];

export default function NewsFeed({ activeHotspot, style }) {
  const [activeTab, setActiveTab] = useState('All');

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['news', activeTab],
    queryFn: () => newsApi.getNews(activeTab),
    refetchInterval: 60 * 1000,
  });

  const articles = data?.articles || [];

  return (
    <div
      className="card flex flex-col"
      style={{ gridArea: 'feed', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
            Live Feed
          </span>
          <span
            className="pulse-dot w-1.5 h-1.5 rounded-full block"
            style={{ background: '#4ade80' }}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isLoading ? 'Loading…' : `${articles.length} articles`}
        </span>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="text-xs px-2.5 py-1 rounded-md font-medium transition-all"
            style={{
              background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : 'var(--text-secondary)',
              border: activeTab === tab ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="panel-scroll flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-secondary)' }}>
            No articles found
          </div>
        ) : (
          <div>
            {articles.map((article, idx) => (
              <NewsItem key={article.id ?? idx} article={article} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-1.5 shrink-0"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Auto-refresh every 60s
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {dataUpdatedAt ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : ''}
        </span>
      </div>
    </div>
  );
}

function NewsItem({ article }) {
  return (
    <a
      href={article.url !== '#' ? article.url : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 px-4 py-3 transition-colors block"
      style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="flex items-start gap-2">
        <span className={`badge ${categoryClass(article.category)} shrink-0 mt-0.5`}>
          {article.category}
        </span>
        <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text-primary)', lineHeight: '1.35' }}>
          {article.title}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{article.source}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(article.publishedAt)}</span>
        {article.severity !== 'Normal' && (
          <>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
            <span className={`text-xs font-semibold ${severityTextClass(article.severity)}`}>
              {article.severity}
            </span>
          </>
        )}
      </div>
    </a>
  );
}
