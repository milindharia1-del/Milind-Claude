const router = require('express').Router();
const NodeCache = require('node-cache');
const { fetchGDELT } = require('./news');

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

const REGIONS = [
  { id: 'europe', name: 'Europe', keywords: ['europe', 'eu', 'nato', 'ukraine', 'russia', 'france', 'germany', 'uk', 'poland', 'kyiv', 'moscow'] },
  { id: 'asia-pacific', name: 'Asia-Pacific', keywords: ['china', 'japan', 'korea', 'taiwan', 'australia', 'india', 'asean', 'pacific', 'beijing', 'tokyo'] },
  { id: 'americas', name: 'Americas', keywords: ['us', 'usa', 'united states', 'canada', 'mexico', 'brazil', 'venezuela', 'colombia', 'latin', 'washington'] },
  { id: 'africa-me', name: 'Africa & Middle East', keywords: ['africa', 'israel', 'iran', 'saudi', 'egypt', 'nigeria', 'sudan', 'gaza', 'tehran', 'middle east'] },
];

const TOPIC_PHRASES = {
  Conflict:   ['military offensive', 'airstrike', 'missile attack', 'ground forces advancing', 'combat operations', 'armed clashes', 'ceasefire violations'],
  Diplomacy:  ['diplomatic talks resumed', 'bilateral summit scheduled', 'sanctions agreement reached', 'peace negotiations underway', 'foreign ministers meeting', 'treaty framework discussed'],
  Sanctions:  ['new sanctions imposed', 'economic restrictions tightened', 'trade embargo extended', 'asset freezes announced', 'export controls expanded'],
  Nuclear:    ['nuclear programme advances', 'missile test conducted', 'warhead development reported', 'non-proliferation talks stalled', 'IAEA inspections resumed'],
  Humanitarian: ['civilian casualties reported', 'refugee flows increasing', 'aid corridors blocked', 'famine risk elevated', 'displacement crisis deepening'],
};

function headlinesFor(articles, keywords) {
  return articles.filter((a) =>
    keywords.some((k) => a.title.toLowerCase().includes(k))
  );
}

function dominantTheme(articles) {
  const counts = {};
  for (const [theme, phrases] of Object.entries(TOPIC_PHRASES)) {
    counts[theme] = articles.filter((a) =>
      phrases.some((p) => a.title.toLowerCase().includes(p.split(' ')[0]))
    ).length;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function severityCount(articles, level) {
  return articles.filter((a) => a.severity === level).length;
}

function buildBriefing(articles) {
  const critical = articles.filter((a) => a.severity === 'Critical');
  const high = articles.filter((a) => a.severity === 'High');
  const top = [...critical, ...high].slice(0, 12);

  const conflictArts = headlinesFor(articles, ['war', 'attack', 'military', 'airstrike', 'missile', 'troops', 'battle']);
  const diplomacyArts = headlinesFor(articles, ['talks', 'summit', 'treaty', 'agreement', 'ceasefire', 'negotiate']);
  const sanctionArts = headlinesFor(articles, ['sanction', 'embargo', 'tariff', 'restriction', 'ban']);

  const totalCritical = severityCount(articles, 'Critical');
  const totalHigh = severityCount(articles, 'High');

  // Pick dominant theme for opening
  const theme = dominantTheme(articles);
  const topHeadline = critical[0]?.title || high[0]?.title || articles[0]?.title || 'ongoing geopolitical developments';

  const sentences = [];

  // Sentence 1: overall situation
  if (totalCritical > 0) {
    sentences.push(
      `Monitoring ${totalCritical} critical-severity event${totalCritical > 1 ? 's' : ''} and ${totalHigh} high-severity incidents across active conflict zones, with ${topHeadline.toLowerCase().replace(/[.!?]$/, '')}.`
    );
  } else {
    sentences.push(
      `Current threat landscape shows ${totalHigh} high-severity incidents monitored globally, with ${theme.toLowerCase()} activity dominating the past 24-hour reporting cycle.`
    );
  }

  // Sentence 2: conflict vs diplomacy balance
  if (conflictArts.length > diplomacyArts.length * 1.5) {
    sentences.push(
      `Conflict indicators outpace diplomatic activity ${conflictArts.length}:${diplomacyArts.length} in article volume, suggesting escalatory pressure in multiple theatres with limited de-escalation momentum.`
    );
  } else if (diplomacyArts.length >= conflictArts.length) {
    sentences.push(
      `Diplomatic activity is elevated with ${diplomacyArts.length} relevant reports, potentially signalling back-channel engagement; however, ${conflictArts.length} conflict-related articles indicate sustained operational tempo.`
    );
  } else {
    sentences.push(
      `Mixed signals: ${conflictArts.length} conflict reports alongside ${diplomacyArts.length} diplomatic engagements indicate concurrent escalation and negotiation tracks in overlapping theatres.`
    );
  }

  // Sentence 3: sanctions / economic dimension or forward look
  if (sanctionArts.length > 2) {
    sentences.push(
      `Economic coercion is a significant vector with ${sanctionArts.length} sanction-related articles; analysts should monitor secondary market effects and potential retaliatory measures from targeted states.`
    );
  } else {
    const regionCount = REGIONS.filter((r) => headlinesFor(articles, r.keywords).length > 0).length;
    sentences.push(
      `Active reporting spans ${regionCount} of 4 monitored world regions; recommend prioritising ${critical[0] ? critical[0].title.split(' ').slice(0, 5).join(' ') + '…' : 'Ukraine and Middle East vectors'} for immediate analyst review.`
    );
  }

  return sentences.join(' ');
}

function buildDigest(articles) {
  const result = {};
  for (const region of REGIONS) {
    const arts = headlinesFor(articles, region.keywords);
    const crit = severityCount(arts, 'Critical');
    const high = severityCount(arts, 'High');
    const top = arts[0];

    if (arts.length === 0) {
      result[region.id] = 'No significant developments in current reporting cycle.';
    } else if (crit > 0) {
      result[region.id] = `${crit} critical-severity event${crit > 1 ? 's' : ''} detected; ${top ? top.title.split(' ').slice(0, 9).join(' ') + '…' : 'active monitoring in progress'}.`;
    } else if (high > 0) {
      result[region.id] = `${high} high-severity development${high > 1 ? 's' : ''} flagged from ${arts.length} regional articles; situation remains fluid.`;
    } else {
      result[region.id] = `${arts.length} article${arts.length > 1 ? 's' : ''} monitored; ${top ? top.title.split(' ').slice(0, 8).join(' ') + '…' : 'low-level activity noted'}.`;
    }
  }
  return result;
}

// POST /api/analysis/briefing
router.post('/briefing', async (req, res) => {
  try {
    const cached = cache.get('briefing');
    if (cached) return res.json(cached);

    const articles = await fetchGDELT();
    const result = {
      text: buildBriefing(articles),
      generatedAt: new Date().toISOString(),
    };
    cache.set('briefing', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

// POST /api/analysis/briefing/refresh — bust cache
router.post('/briefing/refresh', async (req, res) => {
  cache.del('briefing');
  try {
    const articles = await fetchGDELT();
    const result = {
      text: buildBriefing(articles),
      generatedAt: new Date().toISOString(),
    };
    cache.set('briefing', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh analysis' });
  }
});

// GET /api/analysis/digest
router.get('/digest', async (req, res) => {
  try {
    const cached = cache.get('digest');
    if (cached) return res.json(cached);

    const articles = await fetchGDELT();
    const result = {
      regions: buildDigest(articles),
      generatedAt: new Date().toISOString(),
    };
    cache.set('digest', result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// GET /api/analysis/trends
router.get('/trends', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const allText = articles.map((a) => a.title.toLowerCase()).join(' ');

    const topicGroups = [
      { topic: 'Conflict & War', keywords: ['war', 'attack', 'military', 'forces', 'battle', 'troops'] },
      { topic: 'Diplomacy', keywords: ['talks', 'summit', 'agreement', 'treaty', 'negotiate', 'bilateral'] },
      { topic: 'Sanctions', keywords: ['sanction', 'embargo', 'restriction', 'tariff', 'ban'] },
      { topic: 'Elections', keywords: ['election', 'vote', 'ballot', 'president', 'poll', 'campaign'] },
      { topic: 'Nuclear & WMD', keywords: ['nuclear', 'missile', 'weapon', 'warhead', 'atomic'] },
      { topic: 'Energy & Resources', keywords: ['oil', 'gas', 'energy', 'pipeline', 'supply', 'opec'] },
      { topic: 'Humanitarian', keywords: ['refugee', 'aid', 'crisis', 'civilian', 'displaced', 'famine'] },
      { topic: 'Cyber & Intel', keywords: ['cyber', 'hack', 'intelligence', 'spy', 'surveillance'] },
    ];

    const trends = topicGroups
      .map(({ topic, keywords }) => ({
        topic,
        count: keywords.reduce((sum, kw) => {
          const regex = new RegExp(kw, 'gi');
          return sum + (allText.match(regex) || []).length;
        }, 0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.json({ trends, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute trends' });
  }
});

module.exports = router;
