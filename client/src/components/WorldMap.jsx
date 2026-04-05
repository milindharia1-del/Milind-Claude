import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

let L;

function buildPopupHtml(hs, color) {
  const sevBg = { Critical: '#ef444422', High: '#f9731622', Watch: '#eab30822' };
  const articles = hs.articles || [];

  const articleRows = articles.length
    ? articles
        .map(
          (a) => `
        <a href="${a.url}" target="_blank" rel="noopener" style="
          display:block;
          padding:6px 0;
          border-top:1px solid rgba(255,255,255,0.06);
          text-decoration:none;
          color:inherit;
        ">
          <div style="font-size:11px;line-height:1.45;color:#d1d5db;margin-bottom:3px;">${a.title}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:10px;color:#6b7280;">${a.source}</span>
            <span style="font-size:10px;padding:1px 5px;border-radius:3px;background:${sevBg[a.severity] || '#ffffff11'};color:${hotspotColor(a.severity)};">${a.severity}</span>
          </div>
        </a>`
        )
        .join('')
    : `<p style="font-size:11px;color:#6b7280;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06)">No recent articles matched.</p>`;

  return `
    <div style="
      font-family:'Inter',system-ui,sans-serif;
      width:280px;
      background:#0f1117;
      color:#e5e7eb;
      border-radius:8px;
    ">
      <!-- Header -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="
          width:10px;height:10px;border-radius:50%;
          background:${color};
          box-shadow:0 0 8px ${color};
          flex-shrink:0;
        "></span>
        <strong style="font-size:14px;flex:1;">${hs.name}</strong>
        <span style="
          font-size:10px;font-weight:600;letter-spacing:0.05em;
          padding:2px 7px;border-radius:4px;
          background:${sevBg[hs.severity] || '#ffffff11'};
          color:${color};
          border:1px solid ${color}44;
        ">${hs.severity.toUpperCase()}</span>
      </div>

      <!-- Meta -->
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <div style="
          flex:1;padding:6px 8px;border-radius:6px;
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
        ">
          <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Region</div>
          <div style="font-size:11px;font-weight:600;">${hs.region}</div>
        </div>
        <div style="
          flex:1;padding:6px 8px;border-radius:6px;
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
        ">
          <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Articles (24h)</div>
          <div style="font-size:11px;font-weight:600;">${hs.articleCount}</div>
        </div>
        <div style="
          flex:1;padding:6px 8px;border-radius:6px;
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);
        ">
          <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Coords</div>
          <div style="font-size:10px;font-weight:600;">${hs.lat.toFixed(1)}°, ${hs.lng.toFixed(1)}°</div>
        </div>
      </div>

      <!-- Articles -->
      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">
        Latest Intelligence
      </div>
      ${articleRows}
    </div>`;
}

export default function WorldMap({ activeHotspot, onHotspotSelect, style }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);

  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: newsApi.getHotspots,
    refetchInterval: 5 * 60 * 1000,
  });

  const hotspots = data?.hotspots || [];

  // Initialise map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    import('leaflet').then((leaflet) => {
      L = leaflet.default;
      const map = L.map(mapRef.current, {
        center: [20, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: false,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);

      // Military green-blue tint on tiles only (not markers)
      tileLayer.on('load', () => {
        const pane = map.getPanes().tilePane;
        if (pane) pane.style.filter = 'hue-rotate(140deg) saturate(0.55) brightness(0.85)';
      });
      // Apply immediately too
      setTimeout(() => {
        const pane = map.getPanes().tilePane;
        if (pane) pane.style.filter = 'hue-rotate(140deg) saturate(0.55) brightness(0.85)';
      }, 100);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: '© CartoDB' }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add/update hotspot markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !hotspots.length) return;
    import('leaflet').then((leaflet) => {
      L = leaflet.default;
      const map = mapInstanceRef.current;

      // Remove old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      hotspots.forEach((hs) => {
        const color = hotspotColor(hs.severity);
        const isActive = activeHotspot === hs.id;
        const size = isActive ? 26 : 18;

        const iconHtml = `
          <div style="position:relative;width:${size}px;height:${size}px;">
            <div class="hotspot-ring" style="
              position:absolute;inset:0;border-radius:50%;
              background:${color}22;border:1.5px solid ${color}66;
            "></div>
            <div style="
              position:absolute;inset:${isActive ? 6 : 4}px;border-radius:50%;
              background:${color};box-shadow:0 0 10px ${color},0 0 20px ${color}55;
            "></div>
          </div>`;

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([hs.lat, hs.lng], { icon })
          .addTo(map)
          .bindPopup(buildPopupHtml(hs, color), {
            maxWidth: 300,
            className: 'military-popup',
          })
          .on('click', () => onHotspotSelect(hs.id === activeHotspot ? null : hs.id));

        markersRef.current[hs.id] = marker;
      });
    });
  }, [hotspots, activeHotspot, onHotspotSelect, mapReady]);

  return (
    <div
      className="card"
      style={{ gridArea: 'map', position: 'relative', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg px-3 py-2"
        style={{
          background: 'rgba(8,12,18,0.9)',
          border: '1px solid rgba(0,255,180,0.12)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
      >
        <p className="text-xs font-semibold mb-0.5" style={{ color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '9px' }}>
          Threat Level
        </p>
        {[
          { label: 'Critical', color: '#ef4444' },
          { label: 'High', color: '#f97316' },
          { label: 'Watch', color: '#eab308' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full block shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ color: '#9ca3af', fontSize: '10px' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hotspot count */}
      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium"
        style={{
          background: 'rgba(8,12,18,0.9)',
          border: '1px solid rgba(0,255,180,0.12)',
          color: '#4ade80',
          zIndex: 1000,
          fontSize: '10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        ◉ {hotspots.length} Active Zones
      </div>

      {/* Active filter badge */}
      {activeHotspot && (
        <div
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer"
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.4)',
            color: '#60a5fa',
            zIndex: 1000,
          }}
          onClick={() => onHotspotSelect(null)}
        >
          <span>Filter: {hotspots.find((h) => h.id === activeHotspot)?.name}</span>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>×</span>
        </div>
      )}
    </div>
  );
}
