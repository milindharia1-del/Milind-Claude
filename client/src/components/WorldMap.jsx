import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

// Fix broken default icon paths in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ZoomControl() {
  const map = useMap();
  React.useEffect(() => {
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: '© CartoDB' }).addTo(map);
  }, [map]);
  return null;
}

function HotspotMarkers({ hotspots, activeHotspot, onSelect }) {
  return hotspots.map((hs) => {
    const color = hotspotColor(hs.severity);
    const isActive = activeHotspot === hs.id;
    const size = isActive ? 26 : 18;
    const sevBg = { Critical: 'rgba(239,68,68,0.15)', High: 'rgba(249,115,22,0.15)', Watch: 'rgba(234,179,8,0.15)' };

    const icon = L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;">
        <div class="hotspot-ring" style="position:absolute;inset:0;border-radius:50%;
          background:${color}22;border:1.5px solid ${color}66;"></div>
        <div style="position:absolute;inset:${isActive ? 6 : 4}px;border-radius:50%;
          background:${color};box-shadow:0 0 10px ${color},0 0 20px ${color}55;"></div>
      </div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const articles = hs.articles || [];

    return (
      <Marker
        key={hs.id}
        position={[hs.lat, hs.lng]}
        icon={icon}
        eventHandlers={{ click: () => onSelect(hs.id === activeHotspot ? null : hs.id) }}
      >
        <Popup maxWidth={300} className="military-popup">
          <div style={{ fontFamily: 'Inter,system-ui,sans-serif', width: 270, color: '#e5e7eb' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
              <strong style={{ fontSize: 14, flex: 1 }}>{hs.name}</strong>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: sevBg[hs.severity] || 'rgba(255,255,255,0.07)', color, border: `1px solid ${color}44`, letterSpacing: '0.05em' }}>
                {hs.severity.toUpperCase()}
              </span>
            </div>
            {/* Meta */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[['Region', hs.region], ['Articles 24h', hs.articleCount], ['Coords', `${hs.lat.toFixed(1)}°,${hs.lng.toFixed(1)}°`]].map(([label, val]) => (
                <div key={label} style={{ flex: 1, padding: '5px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            {/* Articles */}
            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Latest Intel</div>
            {articles.length === 0 && <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>No recent articles matched.</p>}
            {articles.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener" style={{ display: 'block', padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ fontSize: 11, lineHeight: 1.45, color: '#d1d5db', marginBottom: 3 }}>{a.title}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{a.source}</span>
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: sevBg[a.severity] || 'rgba(255,255,255,0.07)', color: hotspotColor(a.severity) }}>{a.severity}</span>
                </div>
              </a>
            ))}
          </div>
        </Popup>
      </Marker>
    );
  });
}

export default function WorldMap({ activeHotspot, onHotspotSelect, style }) {
  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: newsApi.getHotspots,
    refetchInterval: 5 * 60 * 1000,
  });
  const hotspots = data?.hotspots || [];

  return (
    <div className="card" style={{ ...style, position: 'relative', borderRadius: 10, overflow: 'hidden', minHeight: 0 }}>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        minZoom={2}
        maxZoom={10}
        zoomControl={false}
        attributionControl={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        <ZoomControl />
        <HotspotMarkers hotspots={hotspots} activeHotspot={activeHotspot} onSelect={onHotspotSelect} />
      </MapContainer>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000, background: 'rgba(15,17,23,0.88)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Severity</p>
        {[['Critical','#ef4444'],['High','#f97316'],['Watch','#eab308']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Zone counter */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(15,17,23,0.88)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}>
        {hotspots.length} Active Hotspots
      </div>

      {activeHotspot && (
        <div onClick={() => onHotspotSelect(null)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 6, padding: '4px 10px', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
          <span>Filter: {hotspots.find(h => h.id === activeHotspot)?.name}</span>
          <span style={{ fontSize: 15 }}>×</span>
        </div>
      )}
    </div>
  );
}
