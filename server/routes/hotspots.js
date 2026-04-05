const router = require('express').Router();
const { fetchGDELT } = require('./news');

// 9 regional hotspots with geo coordinates
const HOTSPOT_REGIONS = [
  { id: 'ua', name: 'Ukraine', lat: 49.4, lng: 31.1, region: 'Europe', keywords: ['ukraine', 'kyiv', 'russian', 'zaporizhzhia', 'zelensky', 'kharkiv', 'russo', 'kremlin', 'moscow war', 'donbas', 'kherson', 'mariupol', 'zelenskyy'] },
  { id: 'ir', name: 'Iran', lat: 32.4, lng: 53.7, region: 'Middle East', keywords: ['iran', 'tehran', 'irgc', 'khamenei', 'iranian', 'persian', 'rouhani', 'nuclear iran', 'sanctions iran', 'strait of hormuz'] },
  { id: 'me', name: 'Israel-Gaza', lat: 31.5, lng: 35.2, region: 'Middle East', keywords: ['israel', 'gaza', 'hamas', 'netanyahu', 'idf', 'west bank', 'rafah', 'hezbollah', 'tel aviv', 'jerusalem', 'palestin', 'settler', 'lebanese'] },
  { id: 'sy', name: 'Syria', lat: 34.8, lng: 38.9, region: 'Middle East', keywords: ['syria', 'damascus', 'syrian', 'hts', 'idlib', 'aleppo', 'isis syria', 'rebel syria'] },
  { id: 'sd', name: 'Sudan', lat: 15.5, lng: 32.5, region: 'Africa', keywords: ['sudan', 'khartoum', 'darfur', 'rsf', 'sudanese', 'rapid support', 'south sudan', 'sudani', 'omdurman', 'war sudan'] },
  { id: 'tw', name: 'Taiwan Strait', lat: 23.8, lng: 121.0, region: 'Asia-Pacific', keywords: ['taiwan', 'strait', 'pla', 'taipei', 'china military', 'tsai', 'taiwanese', 'china navy', 'south china sea', 'china threat', 'beijing taiwan'] },
  { id: 'kp', name: 'Korean Peninsula', lat: 37.5, lng: 127.0, region: 'Asia-Pacific', keywords: ['north korea', 'kim jong', 'pyongyang', 'dprk', 'icbm', 'seoul', 'south korea military', 'korean missile', 'ballistic korea'] },
  { id: 'in', name: 'J&K / India-Pak', lat: 34.0, lng: 76.5, region: 'South Asia', keywords: ['kashmir', 'jammu', 'line of control', 'loc india', 'india pakistan', 'pakistan military', 'islamabad', 'modi pakistan', 'pulwama', 'uri attack', 'surgical strike'] },
  { id: 'sa', name: 'Sahel Region', lat: 14.0, lng: -1.5, region: 'Africa', keywords: ['mali', 'niger', 'burkina', 'sahel', 'coup', 'junta', 'wagner', 'faso', 'bamako', 'niamey', 'al qaeda sahel', 'jihadist africa'] },
];

function matchHotspot(article) {
  const lower = (article.title || '').toLowerCase();
  for (const hs of HOTSPOT_REGIONS) {
    if (hs.keywords.some((k) => lower.includes(k))) return hs.id;
  }
  return null;
}

router.get('/', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const articleMap = {};
    articles.forEach((a) => {
      const hsId = matchHotspot(a);
      if (hsId) {
        if (!articleMap[hsId]) articleMap[hsId] = [];
        articleMap[hsId].push(a);
      }
    });

    const hotspots = HOTSPOT_REGIONS.map((hs) => {
      const related = articleMap[hs.id] || [];
      const severities = related.map((a) => a.severity);
      let severity = 'Watch';
      if (severities.includes('Critical')) severity = 'Critical';
      else if (severities.includes('High')) severity = 'High';

      return {
        ...hs,
        severity,
        articleCount: related.length,
        articles: related.slice(0, 4).map((a) => ({
          title: a.title,
          url: a.url,
          source: a.source,
          publishedAt: a.publishedAt,
          category: a.category,
          severity: a.severity,
        })),
      };
    });

    res.json({ hotspots, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotspots' });
  }
});

module.exports = router;
