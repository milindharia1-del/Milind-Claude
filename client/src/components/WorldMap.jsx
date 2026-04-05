import React, { useState, useEffect, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

const SEV_BG = {
  Critical: 'rgba(239,68,68,0.15)',
  High: 'rgba(249,115,22,0.15)',
  Watch: 'rgba(234,179,8,0.15)',
};

function HotspotPopup({ hs, onClose }) {
  const color = hotspotColor(hs.severity);
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 50,
      width: 280, background: '#0b0f1a',
      border: `1px solid ${color}55`, borderRadius: 10, padding: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
      color: '#e5e7eb', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
        <strong style={{ fontSize: 14, flex: 1 }}>{hs.name}</strong>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: SEV_BG[hs.severity] || 'rgba(255,255,255,0.07)', color, border: `1px solid ${color}44` }}>
          {hs.severity.toUpperCase()}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, marginLeft: 4 }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['Region', hs.region], ['Articles', hs.articleCount], ['Coords', `${hs.lat.toFixed(1)}°, ${hs.lng.toFixed(1)}°`]].map(([label, val]) => (
          <div key={label} style={{ flex: 1, padding: '5px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Latest Intel</div>
      {(hs.articles || []).length === 0
        ? <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>No recent articles matched.</p>
        : (hs.articles || []).map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener" style={{ display: 'block', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 11, lineHeight: 1.45, color: '#d1d5db', marginBottom: 3 }}>{a.title}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#6b7280' }}>{a.source}</span>
              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: SEV_BG[a.severity] || 'rgba(255,255,255,0.07)', color: hotspotColor(a.severity) }}>{a.severity}</span>
            </div>
          </a>
        ))
      }
    </div>
  );
}

export default function WorldMap({ activeHotspot, onHotspotSelect, style }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ width: 800, height: 400 });
  const [selected, setSelected] = useState(null);

  // Measure real pixel dimensions so ComposableMap renders at correct size
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    ro.observe(containerRef.current);
    // Initial measurement
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) setDims({ width, height });
    return () => ro.disconnect();
  }, []);

  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: newsApi.getHotspots,
    refetchInterval: 5 * 60 * 1000,
  });
  const hotspots = data?.hotspots || [];

  function handleClick(hs) {
    const next = selected?.id === hs.id ? null : hs;
    setSelected(next);
    onHotspotSelect(next ? hs.id : null);
  }

  return (
    <div
      className="card"
      ref={containerRef}
      style={{ ...style, position: 'relative', borderRadius: 10, overflow: 'hidden', minHeight: 0, background: '#080d14' }}
    >
      <ComposableMap
        width={dims.width}
        height={dims.height}
        projection="geoMercator"
        projectionConfig={{ scale: dims.width * 0.14, center: [10, 15] }}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={8}>
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#16202e', stroke: '#0a1018', strokeWidth: 0.4, outline: 'none' },
                    hover:   { fill: '#1c2d40', stroke: '#0a1018', strokeWidth: 0.4, outline: 'none' },
                    pressed: { fill: '#16202e', outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {hotspots.map((hs) => {
            const color = hotspotColor(hs.severity);
            const isActive = activeHotspot === hs.id;
            return (
              <Marker key={hs.id} coordinates={[hs.lng, hs.lat]}>
                <circle r={isActive ? 16 : 11} fill={`${color}18`} stroke={`${color}44`} strokeWidth={1} style={{ pointerEvents: 'none' }} />
                <circle
                  r={isActive ? 7 : 5}
                  fill={color}
                  stroke={isActive ? '#fff' : `${color}bb`}
                  strokeWidth={isActive ? 1.5 : 0.8}
                  style={{ cursor: 'pointer', filter: `drop-shadow(0 0 5px ${color})` }}
                  onClick={() => handleClick(hs)}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {selected && (
        <HotspotPopup hs={selected} onClose={() => { setSelected(null); onHotspotSelect(null); }} />
      )}

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, background: 'rgba(8,13,20,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ color: '#94a3b8', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Severity</p>
        {[['Critical','#ef4444'],['High','#f97316'],['Watch','#eab308']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Counter */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(8,13,20,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>
        {hotspots.length} Active Hotspots
      </div>

      {activeHotspot && !selected && (
        <div onClick={() => { onHotspotSelect(null); }} style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 6, padding: '4px 10px', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
          <span>Filter: {hotspots.find(h => h.id === activeHotspot)?.name}</span>
          <span style={{ fontSize: 15 }}>×</span>
        </div>
      )}
    </div>
  );
}
