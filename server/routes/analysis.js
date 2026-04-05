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

function safeBriefing(articles) {
  try {
    const text = buildBriefing(articles);
    return text || 'Global situation monitoring active. Insufficient data to generate detailed briefing at this time.';
  } catch {
    return 'Monitoring active across all regions. Aggregating latest intelligence from live sources.';
  }
}

function safeDigest(articles) {
  try {
    return buildDigest(articles);
  } catch {
    return {
      europe: 'Monitoring active.',
      'asia-pacific': 'Monitoring active.',
      americas: 'Monitoring active.',
      'africa-me': 'Monitoring active.',
    };
  }
}

// POST /api/analysis/briefing
router.post('/briefing', async (req, res) => {
  const cached = cache.get('briefing');
  if (cached) return res.json(cached);
  let articles = [];
  try { articles = await fetchGDELT(); } catch {}
  const result = { text: safeBriefing(articles), generatedAt: new Date().toISOString() };
  cache.set('briefing', result);
  res.json(result);
});

// POST /api/analysis/briefing/refresh
router.post('/briefing/refresh', async (req, res) => {
  cache.del('briefing');
  let articles = [];
  try { articles = await fetchGDELT(); } catch {}
  const result = { text: safeBriefing(articles), generatedAt: new Date().toISOString() };
  cache.set('briefing', result);
  res.json(result);
});

// GET /api/analysis/digest
router.get('/digest', async (req, res) => {
  const cached = cache.get('digest');
  if (cached) return res.json(cached);
  let articles = [];
  try { articles = await fetchGDELT(); } catch {}
  const result = { regions: safeDigest(articles), generatedAt: new Date().toISOString() };
  cache.set('digest', result);
  res.json(result);
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

// POST /api/analysis/hotspot/:id — focused briefing for a specific conflict zone
const HOTSPOT_META = {
  ua: { name: 'Ukraine', keywords: ['ukraine', 'kyiv', 'russian', 'zaporizhzhia', 'zelensky', 'kharkiv', 'kremlin', 'donbas', 'kherson'] },
  ir: { name: 'Iran', keywords: ['iran', 'tehran', 'irgc', 'khamenei', 'iranian', 'persian', 'nuclear iran', 'sanctions iran'] },
  me: { name: 'Israel-Gaza', keywords: ['israel', 'gaza', 'hamas', 'netanyahu', 'idf', 'west bank', 'rafah', 'hezbollah', 'palestin', 'jerusalem'] },
  sy: { name: 'Syria', keywords: ['syria', 'damascus', 'syrian', 'hts', 'idlib', 'aleppo'] },
  sd: { name: 'Sudan', keywords: ['sudan', 'khartoum', 'darfur', 'rsf', 'sudanese', 'rapid support', 'south sudan'] },
  tw: { name: 'Taiwan Strait', keywords: ['taiwan', 'strait', 'pla', 'taipei', 'china military', 'taiwanese', 'south china sea'] },
  kp: { name: 'Korean Peninsula', keywords: ['north korea', 'kim jong', 'pyongyang', 'dprk', 'icbm', 'korean missile', 'seoul'] },
  in: { name: 'J&K / India-Pakistan', keywords: ['kashmir', 'jammu', 'line of control', 'india pakistan', 'pakistan military', 'islamabad', 'pulwama', 'loc india'] },
  sa: { name: 'Sahel Region', keywords: ['mali', 'niger', 'burkina', 'sahel', 'coup', 'junta', 'wagner', 'bamako', 'niamey'] },
};

router.post('/hotspot/:id', async (req, res) => {
  const { id } = req.params;
  const meta = HOTSPOT_META[id];
  if (!meta) return res.status(404).json({ error: 'Unknown hotspot' });

  const cacheKey = `hotspot_${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  let allArticles = [];
  try { allArticles = await fetchGDELT(); } catch {}

  const articles = allArticles.filter((a) =>
    meta.keywords.some((k) => (a.title || '').toLowerCase().includes(k))
  );

  let text;
  if (articles.length === 0) {
    text = `No recent GDELT articles matched ${meta.name} in the last 24 hours. The situation may be developing outside current monitored sources, or reporting frequency is low. Monitor ${meta.keywords.slice(0, 3).join(', ')} keyword feeds for updates.`;
  } else {
    const critical = articles.filter((a) => a.severity === 'Critical');
    const high = articles.filter((a) => a.severity === 'High');
    const topTitle = (critical[0] || high[0] || articles[0]).title;
    const conflictCount = articles.filter((a) => ['war','attack','military','airstrike','missile','battle','killed'].some(k => a.title.toLowerCase().includes(k))).length;
    const diplomacyCount = articles.filter((a) => ['talks','agreement','ceasefire','summit','negotiate'].some(k => a.title.toLowerCase().includes(k))).length;

    const parts = [];
    parts.push(`${meta.name} zone: ${articles.length} article${articles.length > 1 ? 's' : ''} tracked in the past 24 hours${critical.length > 0 ? `, including ${critical.length} critical-severity event${critical.length > 1 ? 's' : ''}` : ''}.`);
    parts.push(`Latest development: ${topTitle}.`);
    if (conflictCount > diplomacyCount) {
      parts.push(`Operational indicators dominate reporting (${conflictCount} conflict vs ${diplomacyCount} diplomatic articles), suggesting active escalation with limited de-escalation signals.`);
    } else if (diplomacyCount > 0) {
      parts.push(`Diplomatic activity is present (${diplomacyCount} article${diplomacyCount > 1 ? 's' : ''}), indicating possible back-channel engagement alongside ${conflictCount} operational reports.`);
    } else {
      parts.push(`Situation remains under active monitoring. Recommend cross-referencing with regional intelligence feeds for ground-truth assessment.`);
    }
    text = parts.join(' ');
  }

  const result = {
    name: meta.name,
    text,
    articles: articles.slice(0, 5).map((a) => ({ title: a.title, url: a.url, source: a.source, severity: a.severity })),
    generatedAt: new Date().toISOString(),
  };
  cache.set(cacheKey, result, 1800); // 30 min cache
  res.json(result);
});

module.exports = router;
