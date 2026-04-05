import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

function Popup({ hs, color, onClose }) {
  const sevBg = { Critical: 'rgba(239,68,68,0.15)', High: 'rgba(249,115,22,0.15)', Watch: 'rgba(234,179,8,0.15)' };
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12, zIndex: 50,
      width: 290, background: '#0b0f1a',
      border: `1px solid ${color}44`,
      borderRadius: 10, padding: '14px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${color}22`,
      color: '#e5e7eb', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
        <strong style={{ fontSize: 14, flex: 1 }}>{hs.name}</strong>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
          background: sevBg[hs.severity] || 'rgba(255,255,255,0.07)',
          color, border: `1px solid ${color}44`, letterSpacing: '0.05em',
        }}>{hs.severity.toUpperCase()}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      {/* Meta cards */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[['Region', hs.region], ['Articles 24h', hs.articleCount], ['Coords', `${hs.lat.toFixed(1)}°, ${hs.lng.toFixed(1)}°`]].map(([label, val]) => (
          <div key={label} style={{
            flex: 1, padding: '5px 7px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Articles */}
      <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Latest Intel</div>
      {(hs.articles || []).length === 0 && (
        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>No recent articles matched.</p>
      )}
      {(hs.articles || []).map((a, i) => (
        <a key={i} href={a.url} target="_blank" rel="noopener" style={{
          display: 'block', padding: '6px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textDecoration: 'none', color: 'inherit',
        }}>
          <div style={{ fontSize: 11, lineHeight: 1.45, color: '#d1d5db', marginBottom: 3 }}>{a.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>{a.source}</span>
            <span style={{
              fontSize: 10, padding: '1px 5px', borderRadius: 3,
              background: sevBg[a.severity] || 'rgba(255,255,255,0.07)',
              color: hotspotColor(a.severity),
            }}>{a.severity}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function WorldMap({ activeHotspot, onHotspotSelect, style }) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: newsApi.getHotspots,
    refetchInterval: 5 * 60 * 1000,
  });
  const hotspots = data?.hotspots || [];

  function handleMarkerClick(hs) {
    const next = hs.id === selectedHotspot?.id ? null : hs;
    setSelectedHotspot(next);
    onHotspotSelect(next ? hs.id : null);
  }

  const activeHs = selectedHotspot;
  const activeColor = activeHs ? hotspotColor(activeHs.severity) : null;

  return (
    <div className="card" style={{ ...style, position: 'relative', borderRadius: 10, overflow: 'hidden', minHeight: 0, background: '#080c12' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140, center: [10, 15] }}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      >
        <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#1a2535', stroke: '#0d1520', strokeWidth: 0.5, outline: 'none' },
                    hover:   { fill: '#1e2e42', stroke: '#0d1520', strokeWidth: 0.5, outline: 'none' },
                    pressed: { fill: '#1a2535', outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {hotspots.map((hs) => {
            const color = hotspotColor(hs.severity);
            const isActive = activeHotspot === hs.id;
            const r = isActive ? 9 : 6;
            return (
              <Marker key={hs.id} coordinates={[hs.lng, hs.lat]}>
                <circle r={r * 2.2} fill={`${color}18`} style={{ animation: 'none' }} />
                <circle
                  r={r}
                  fill={color}
                  stroke={isActive ? '#fff' : `${color}cc`}
                  strokeWidth={isActive ? 1.5 : 1}
                  style={{
                    cursor: 'pointer',
                    filter: `drop-shadow(0 0 6px ${color})`,
                    transition: 'r 0.2s',
                  }}
                  onClick={() => handleMarkerClick(hs)}
                />
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Popup */}
      {activeHs && (
        <Popup
          hs={activeHs}
          color={activeColor}
          onClose={() => { setSelectedHotspot(null); onHotspotSelect(null); }}
        />
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 10,
        background: 'rgba(8,12,18,0.92)', border: '1px solid rgba(0,255,180,0.12)',
        backdropFilter: 'blur(8px)', borderRadius: 8, padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        <p style={{ color: '#4ade80', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Threat Level
        </p>
        {[['Critical','#ef4444'],['High','#f97316'],['Watch','#eab308']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
            <span style={{ color: '#9ca3af', fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Zone counter */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 10,
        background: 'rgba(8,12,18,0.92)', border: '1px solid rgba(0,255,180,0.12)',
        borderRadius: 6, padding: '4px 10px',
        color: '#4ade80', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        ◉ {hotspots.length} Active Zones
      </div>
    </div>
  );
}
