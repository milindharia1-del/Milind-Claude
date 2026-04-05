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
      <StatusBar
        user={user}
        theme={theme}
        onThemeToggle={onThemeToggle}
        style={{ gridArea: 'statusbar' }}
      />
      <WorldMap
        activeHotspot={activeHotspot}
        onHotspotSelect={setActiveHotspot}
        style={{ gridArea: 'map' }}
      />
      <NewsFeed
        activeHotspot={activeHotspot}
        style={{ gridArea: 'feed' }}
      />
      <AlertsPanel style={{ gridArea: 'alerts' }} />
      <AIAnalysis style={{ gridArea: 'analysis' }} />
      <TrendsChart style={{ gridArea: 'trends' }} />
      <DailyDigest style={{ gridArea: 'digest' }} />
    </div>
  );
}
