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
  return { Conflict:'cat-conflict', Diplomacy:'cat-diplomacy', Economy:'cat-economy', Elections:'cat-elections' }[cat] || 'cat-general';
}

export function severityDotClass(sev) {
  return { Critical:'sev-dot-critical', High:'sev-dot-high', Watch:'sev-dot-watch', Normal:'sev-dot-normal' }[sev] || 'sev-dot-normal';
}

export function severityTextClass(sev) {
  return { Critical:'sev-critical', High:'sev-high', Watch:'sev-watch', Normal:'sev-normal' }[sev] || 'sev-normal';
}

export function hotspotColor(severity) {
  if (severity === 'Critical') return '#ef4444';
  if (severity === 'High') return '#f97316';
  return '#eab308';
}
