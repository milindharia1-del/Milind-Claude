const router = require('express').Router();
const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // 5 min

const CATEGORIES = {
  Conflict: ['war', 'attack', 'military', 'missile', 'troops', 'battle', 'bomb', 'drone', 'explosion', 'killed', 'forces', 'airstrike', 'combat'],
  Diplomacy: ['talks', 'treaty', 'sanctions', 'diplomat', 'summit', 'agreement', 'ceasefire', 'negotiate', 'bilateral', 'embassy', 'foreign minister'],
  Economy: ['trade', 'tariff', 'gdp', 'inflation', 'debt', 'oil', 'supply chain', 'bank', 'currency', 'recession', 'investment', 'market'],
  Elections: ['election', 'vote', 'ballot', 'candidate', 'president', 'parliament', 'poll', 'campaign', 'democracy', 'referendum', 'minister'],
};

function categorise(title = '') {
  const lower = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return 'General';
}

function severityScore(title = '') {
  const lower = title.toLowerCase();
  const critical = ['war', 'nuclear', 'attack', 'massacre', 'invasion', 'missile', 'airstrike'];
  const high = ['military', 'killed', 'battle', 'explosion', 'crisis', 'emergency'];
  const watch = ['sanction', 'tension', 'protest', 'unrest', 'dispute'];

  if (critical.some((k) => lower.includes(k))) return 'Critical';
  if (high.some((k) => lower.includes(k))) return 'High';
  if (watch.some((k) => lower.includes(k))) return 'Watch';
  return 'Normal';
}

async function fetchGDELT() {
  const cached = cache.get('gdelt_news');
  if (cached) return cached;

  try {
    // GDELT GKG 2.0 API — returns JSON article metadata
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=geopolitics%20conflict%20diplomacy&mode=ArtList&maxrecords=60&format=json&timespan=1440';
    const { data } = await axios.get(url, { timeout: 10000 });

    const articles = (data.articles || []).map((a, idx) => ({
      id: idx,
      title: a.title || 'Untitled',
      url: a.url,
      source: a.domain || 'Unknown',
      publishedAt: a.seendate
        ? new Date(
            a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
          ).toISOString()
        : new Date().toISOString(),
      category: categorise(a.title),
      severity: severityScore(a.title),
      country: a.sourcecountry || null,
      image: null,
    }));

    cache.set('gdelt_news', articles);
    return articles;
  } catch (err) {
    console.error('GDELT fetch error:', err.message);
    return getFallbackNews();
  }
}

function getFallbackNews() {
  const now = new Date().toISOString();
  return [
    { id: 1, title: 'Diplomatic Talks Resume Between Major Powers', url: '#', source: 'Reuters', publishedAt: now, category: 'Diplomacy', severity: 'Watch', country: 'UN' },
    { id: 2, title: 'Economic Sanctions Tightened on Key Exporters', url: '#', source: 'AP', publishedAt: now, category: 'Economy', severity: 'High' },
    { id: 3, title: 'Military Operations Continue in Contested Region', url: '#', source: 'BBC', publishedAt: now, category: 'Conflict', severity: 'Critical' },
    { id: 4, title: 'Summit Scheduled to Address Regional Tensions', url: '#', source: 'Al Jazeera', publishedAt: now, category: 'Diplomacy', severity: 'Watch' },
    { id: 5, title: 'Parliamentary Elections Proceed Amid Security Concerns', url: '#', source: 'Reuters', publishedAt: now, category: 'Elections', severity: 'High' },
    { id: 6, title: 'Trade Negotiations Enter Critical Phase', url: '#', source: 'FT', publishedAt: now, category: 'Economy', severity: 'Watch' },
    { id: 7, title: 'Ceasefire Violations Reported Along Border', url: '#', source: 'AP', publishedAt: now, category: 'Conflict', severity: 'Critical' },
    { id: 8, title: 'International Aid Convoy Reaches Conflict Zone', url: '#', source: 'UN News', publishedAt: now, category: 'Conflict', severity: 'High' },
    { id: 9, title: 'Central Bank Raises Interest Rates Amid Inflation', url: '#', source: 'Bloomberg', publishedAt: now, category: 'Economy', severity: 'Normal' },
    { id: 10, title: 'Opposition Leader Arrested Before Vote', url: '#', source: 'Reuters', publishedAt: now, category: 'Elections', severity: 'High' },
  ];
}

router.get('/', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const { category, limit = 30 } = req.query;
    let filtered = articles;
    if (category && category !== 'All') {
      filtered = articles.filter((a) => a.category === category);
    }
    res.json({
      articles: filtered.slice(0, Number(limit)),
      total: filtered.length,
      cached: !!cache.get('gdelt_news'),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

module.exports = router;
module.exports.fetchGDELT = fetchGDELT;
module.exports.CATEGORIES = CATEGORIES;
