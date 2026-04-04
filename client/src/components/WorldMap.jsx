import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { newsApi } from '../lib/api';
import { hotspotColor } from '../lib/utils';

// Leaflet is loaded via CDN in index.html; access it via window.L
let L;

export default function WorldMap({ activeHotspot, onHotspotSelect, style }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

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

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 }
      ).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: '© CartoDB' }).addTo(map);

      mapInstanceRef.current = map;
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
    if (!mapInstanceRef.current || !hotspots.length) return;
    import('leaflet').then((leaflet) => {
      L = leaflet.default;
      const map = mapInstanceRef.current;

      // Remove old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      hotspots.forEach((hs) => {
        const color = hotspotColor(hs.severity);
        const isActive = activeHotspot === hs.id;

        const iconHtml = `
          <div style="
            position: relative;
            width: ${isActive ? 24 : 16}px;
            height: ${isActive ? 24 : 16}px;
          ">
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: ${color}33;
              border: 1.5px solid ${color}88;
              animation: pulse-ring 2s ease-out infinite;
            "></div>
            <div style="
              position: absolute;
              inset: ${isActive ? 5 : 3}px;
              border-radius: 50%;
              background: ${color};
              box-shadow: 0 0 8px ${color}88;
            "></div>
          </div>`;

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [isActive ? 24 : 16, isActive ? 24 : 16],
          iconAnchor: [isActive ? 12 : 8, isActive ? 12 : 8],
        });

        const marker = L.marker([hs.lat, hs.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;min-width:200px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>
                <strong style="font-size:13px;">${hs.name}</strong>
                <span style="font-size:11px;padding:1px 6px;background:${color}22;color:${color};border-radius:3px;margin-left:auto">${hs.severity}</span>
              </div>
              <p style="font-size:11px;color:#8b93a8;margin-bottom:4px;">${hs.region} • ${hs.articleCount} article${hs.articleCount !== 1 ? 's' : ''}</p>
              ${hs.latestHeadline
                ? `<p style="font-size:12px;line-height:1.4;">${hs.latestHeadline}</p>`
                : ''}
            </div>`,
            { maxWidth: 280 }
          )
          .on('click', () => onHotspotSelect(hs.id === activeHotspot ? null : hs.id));

        markersRef.current[hs.id] = marker;
      });
    });
  }, [hotspots, activeHotspot, onHotspotSelect]);

  return (
    <div
      className="card"
      style={{ gridArea: 'map', position: 'relative', ...style, borderRadius: '10px', overflow: 'hidden' }}
    >
      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg px-3 py-2"
        style={{
          background: 'rgba(15,17,23,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
        }}
      >
        <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-secondary)' }}>Severity</p>
        {[
          { label: 'Critical', color: '#ef4444' },
          { label: 'High', color: '#f97316' },
          { label: 'Watch', color: '#eab308' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full block shrink-0" style={{ background: color }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hotspot count */}
      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-medium"
        style={{
          background: 'rgba(15,17,23,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--text-secondary)',
          zIndex: 1000,
        }}
      >
        {hotspots.length} Active Hotspots
      </div>

      {/* Active filter badge */}
      {activeHotspot && (
        <div
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer"
          style={{
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.35)',
            color: '#60a5fa',
            zIndex: 1000,
          }}
          onClick={() => onHotspotSelect(null)}
        >
          <span>Filtering: {hotspots.find((h) => h.id === activeHotspot)?.name}</span>
          <span>×</span>
        </div>
      )}
    </div>
  );
}
