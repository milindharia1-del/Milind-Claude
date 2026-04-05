import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

// Fix Leaflet's broken default icon paths in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Applies military tint to the tile layer pane
function TileTint() {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPanes().tilePane;
    if (pane) pane.style.filter = 'hue-rotate(140deg) saturate(0.5) brightness(0.8)';
  }, [map]);
  return null;
}

function buildPopupHtml(hs, color) {
  const sevBg = { Critical: '#ef444422', High: '#f9731622', Watch: '#eab30822' };
  const articles = hs.articles || [];

  const rows = articles.length
    ? articles.map((a) => `
        <a href="${a.url}" target="_blank" rel="noopener" style="display:block;padding:6px 0;
          border-top:1px solid rgba(255,255,255,0.06);text-decoration:none;color:inherit;">
          <div style="font-size:11px;line-height:1.45;color:#d1d5db;margin-bottom:3px;">${a.title}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:#6b7280;">${a.source}</span>
            <span style="font-size:10px;padding:1px 5px;border-radius:3px;
              background:${sevBg[a.severity]||'#ffffff11'};color:${hotspotColor(a.severity)};">${a.severity}</span>
          </div>
        </a>`).join('')
    : `<p style="font-size:11px;color:#6b7280;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06)">No recent articles matched.</p>`;

  return `
    <div style="font-family:Inter,system-ui,sans-serif;width:270px;color:#e5e7eb;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${color};
          box-shadow:0 0 8px ${color};flex-shrink:0;"></span>
        <strong style="font-size:14px;flex:1;">${hs.name}</strong>
        <span style="font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;
          background:${sevBg[hs.severity]||'#ffffff11'};color:${color};border:1px solid ${color}44;">
          ${hs.severity.toUpperCase()}
        </span>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px;">
        ${[['Region', hs.region], ['Articles 24h', hs.articleCount], ['Coords', `${hs.lat.toFixed(1)}°, ${hs.lng.toFixed(1)}°`]].map(([label, val]) => `
          <div style="flex:1;padding:5px 7px;border-radius:6px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);">
            <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">${label}</div>
            <div style="font-size:11px;font-weight:600;">${val}</div>
          </div>`).join('')}
      </div>
      <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Latest Intel</div>
      ${rows}
    </div>`;
}

function HotspotMarkers({ hotspots, activeHotspot, onHotspotSelect }) {
  return hotspots.map((hs) => {
    const color = hotspotColor(hs.severity);
    const isActive = activeHotspot === hs.id;
    const size = isActive ? 26 : 18;

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

    return (
      <Marker
        key={hs.id}
        position={[hs.lat, hs.lng]}
        icon={icon}
        eventHandlers={{ click: () => onHotspotSelect(hs.id === activeHotspot ? null : hs.id) }}
      >
        <Popup maxWidth={300} className="military-popup">
          <div dangerouslySetInnerHTML={{ __html: buildPopupHtml(hs, color) }} />
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
    <div className="card" style={{ ...style, position: 'relative', borderRadius: '10px', overflow: 'hidden', minHeight: 0 }}>
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
          url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          attribution="© CartoDB"
        />
        <TileTint />
        <HotspotMarkers
          hotspots={hotspots}
          activeHotspot={activeHotspot}
          onHotspotSelect={onHotspotSelect}
        />
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
        background: 'rgba(8,12,18,0.9)', border: '1px solid rgba(0,255,180,0.12)',
        backdropFilter: 'blur(8px)', borderRadius: '8px', padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: '5px',
      }}>
        <p style={{ color: '#4ade80', fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
          Threat Level
        </p>
        {[['Critical','#ef4444'],['High','#f97316'],['Watch','#eab308']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
            <span style={{ color: '#9ca3af', fontSize: '10px' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Zone counter */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 1000,
        background: 'rgba(8,12,18,0.9)', border: '1px solid rgba(0,255,180,0.12)',
        borderRadius: '6px', padding: '4px 10px',
        color: '#4ade80', fontSize: '10px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        ◉ {hotspots.length} Active Zones
      </div>

      {activeHotspot && (
        <div onClick={() => onHotspotSelect(null)} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)',
          borderRadius: '6px', padding: '4px 10px',
          color: '#60a5fa', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
        }}>
          <span>Filter: {hotspots.find(h => h.id === activeHotspot)?.name}</span>
          <span style={{ fontSize: '15px', lineHeight: 1 }}>×</span>
        </div>
      )}
    </div>
  );
}
