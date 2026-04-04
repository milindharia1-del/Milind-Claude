export function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function categoryClass(cat) {
  const map = {
    Conflict: 'cat-conflict',
    Diplomacy: 'cat-diplomacy',
    Economy: 'cat-economy',
    Elections: 'cat-elections',
    General: 'cat-general',
  };
  return map[cat] || 'cat-general';
}

export function severityDotClass(sev) {
  const map = {
    Critical: 'sev-dot-critical',
    High: 'sev-dot-high',
    Watch: 'sev-dot-watch',
    Normal: 'sev-dot-normal',
  };
  return map[sev] || 'sev-dot-normal';
}

export function severityTextClass(sev) {
  const map = {
    Critical: 'sev-critical',
    High: 'sev-high',
    Watch: 'sev-watch',
    Normal: 'sev-normal',
  };
  return map[sev] || 'sev-normal';
}

export function hotspotColor(severity) {
  if (severity === 'Critical') return '#ef4444';
  if (severity === 'High') return '#f97316';
  return '#eab308';
}
