import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { timeAgo, categoryClass, severityTextClass } from '../lib/utils';

const TABS = ['All', 'Conflict', 'Diplomacy', 'Economy', 'Elections'];

const TOPIC_KEYWORDS = {
  'Conflict & War': ['war', 'attack', 'military', 'forces', 'battle', 'troops', 'airstrike', 'killed'],
  'Diplomacy': ['talks', 'summit', 'agreement', 'treaty', 'negotiate', 'ceasefire', 'bilateral'],
  'Sanctions': ['sanction', 'embargo', 'tariff', 'restriction', 'ban'],
  'Elections': ['election', 'vote', 'ballot', 'president', 'poll', 'campaign'],
  'Nuclear & WMD': ['nuclear', 'missile', 'weapon', 'warhead', 'atomic'],
  'Energy & Resources': ['oil', 'gas', 'energy', 'pipeline', 'supply', 'opec'],
  'Humanitarian': ['refugee', 'aid', 'crisis', 'civilian', 'displaced', 'famine'],
  'Cyber & Intel': ['cyber', 'hack', 'intelligence', 'spy', 'surveillance'],
};

const REGION_KEYWORDS = {
  'Europe': ['europe', 'eu', 'nato', 'ukraine', 'russia', 'france', 'germany', 'uk', 'poland', 'kyiv'],
  'Asia-Pacific': ['china', 'japan', 'korea', 'taiwan', 'india', 'pacific', 'beijing', 'tokyo'],
  'Americas': ['us', 'usa', 'united states', 'canada', 'brazil', 'latin', 'washington', 'mexico'],
  'Africa & ME': ['africa', 'israel', 'iran', 'saudi', 'egypt', 'sudan', 'gaza', 'middle east', 'tehran'],
};

function matchesFilter(article, feedFilter) {
  if (!feedFilter) return true;
  const lower = article.title.toLowerCase();
  if (feedFilter.type === 'topic') {
    const kws = TOPIC_KEYWORDS[feedFilter.label] || [];
    return kws.some((k) => lower.includes(k));
  }
  if (feedFilter.type === 'region') {
    const kws = REGION_KEYWORDS[feedFilter.label] || feedFilter.keywords || [];
    return kws.some((k) => lower.includes(k));
  }
  return true;
}

export default function NewsFeed({ activeHotspot, feedFilter, onClearFilter, style }) {
  const [activeTab, setActiveTab] = useState('All');

  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['news', activeTab],
    queryFn: () => newsApi.getNews(activeTab),
    refetchInterval: 60 * 1000,
  });

  const allArticles = data?.articles || [];
  const articles = feedFilter
    ? allArticles.filter((a) => matchesFilter(a, feedFilter))
    : allArticles;

  return (
    <div className="card flex flex-col" style={{ gridArea: 'feed', ...style, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Live Feed</span>
          <span className="pulse-dot w-1.5 h-1.5 rounded-full block" style={{ background: '#4ade80' }} />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {isLoading ? 'Loading…' : `${articles.length} articles`}
        </span>
      </div>

      {/* Active filter banner */}
      {feedFilter && (
        <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="text-xs" style={{ color: '#60a5fa' }}>
            Filtering: <strong>{feedFilter.label}</strong> — {articles.length} match{articles.length !== 1 ? 'es' : ''}
          </span>
          <button onClick={onClearFilter} className="text-xs px-2 py-0.5 rounded" style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            Clear ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
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
            No articles {feedFilter ? 'match this filter' : 'found'}
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
      <div className="flex items-center justify-between px-4 py-1.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Auto-refresh every 60s</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {dataUpdatedAt ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}` : ''}
        </span>
      </div>
    </div>
  );
}

function NewsItem({ article }) {
  const hasLink = article.url && article.url !== '#';
  return (
    <a
      href={hasLink ? article.url : undefined}
      target={hasLink ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 px-4 py-3 transition-colors block"
      style={{ borderBottom: '1px solid var(--border)', textDecoration: 'none', cursor: hasLink ? 'pointer' : 'default' }}
      onMouseOver={(e) => { if (hasLink) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      <div className="flex items-start gap-2">
        <span className={`badge ${categoryClass(article.category)} shrink-0 mt-0.5`}>{article.category}</span>
        <p className="text-xs leading-snug font-medium" style={{ color: 'var(--text-primary)', lineHeight: '1.35' }}>
          {article.title}
          {hasLink && <span style={{ color: '#60a5fa', marginLeft: 4, fontSize: 10 }}>↗</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{article.source}</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(article.publishedAt)}</span>
        {article.severity !== 'Normal' && (
          <>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>·</span>
            <span className={`text-xs font-semibold ${severityTextClass(article.severity)}`}>{article.severity}</span>
          </>
        )}
      </div>
    </a>
  );
}
