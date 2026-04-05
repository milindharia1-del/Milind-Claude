import React, { useState } from 'react';
import StatusBar from './StatusBar';
import WorldMap from './WorldMap';
import NewsFeed from './NewsFeed';
import AlertsPanel from './AlertsPanel';
import AIAnalysis from './AIAnalysis';
import TrendsChart from './TrendsChart';
import DailyDigest from './DailyDigest';

export default function Dashboard({ user, theme, onThemeToggle }) {
  const [activeHotspot, setActiveHotspot] = useState(null);
  // feedFilter: { label, keywords } or null
  const [feedFilter, setFeedFilter] = useState(null);

  function setTopicFilter(topic) {
    setFeedFilter((prev) => prev?.label === topic ? null : { label: topic, type: 'topic' });
  }

  function setRegionFilter(regionLabel, keywords) {
    setFeedFilter((prev) => prev?.label === regionLabel ? null : { label: regionLabel, keywords, type: 'region' });
  }

  return (
    <div
      className="dashboard-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 440px',
        gridTemplateRows: '44px 1fr 1fr 200px',
        gridTemplateAreas: `
          "statusbar statusbar statusbar"
          "map       map       feed"
          "map       map       alerts"
          "analysis  trends    digest"
        `,
        width: '100vw',
        height: '100vh',
        background: 'var(--page-bg)',
        gap: '6px',
        padding: '6px',
        overflow: 'hidden',
      }}
    >
      <StatusBar user={user} theme={theme} onThemeToggle={onThemeToggle} style={{ gridArea: 'statusbar' }} />
      <WorldMap activeHotspot={activeHotspot} onHotspotSelect={setActiveHotspot} style={{ gridArea: 'map' }} />
      <NewsFeed activeHotspot={activeHotspot} feedFilter={feedFilter} onClearFilter={() => setFeedFilter(null)} style={{ gridArea: 'feed' }} />
      <AlertsPanel style={{ gridArea: 'alerts' }} />
      <AIAnalysis activeHotspot={activeHotspot} style={{ gridArea: 'analysis' }} />
      <TrendsChart activeTopic={feedFilter?.type === 'topic' ? feedFilter.label : null} onTopicSelect={setTopicFilter} style={{ gridArea: 'trends' }} />
      <DailyDigest activeRegion={feedFilter?.type === 'region' ? feedFilter.label : null} onRegionSelect={setRegionFilter} style={{ gridArea: 'digest' }} />
    </div>
  );
}
