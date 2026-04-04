const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');
const NodeCache = require('node-cache');
const { fetchGDELT } = require('./news');

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REGIONS = [
  { id: 'europe', name: 'Europe', keywords: ['europe', 'eu', 'nato', 'ukraine', 'russia', 'france', 'germany', 'uk', 'poland'] },
  { id: 'asia-pacific', name: 'Asia-Pacific', keywords: ['china', 'japan', 'korea', 'taiwan', 'australia', 'india', 'asean', 'pacific'] },
  { id: 'americas', name: 'Americas', keywords: ['us', 'usa', 'united states', 'canada', 'mexico', 'brazil', 'venezuela', 'colombia', 'latin'] },
  { id: 'africa-me', name: 'Africa & Middle East', keywords: ['africa', 'israel', 'iran', 'saudi', 'egypt', 'nigeria', 'sudan', 'gaza', 'middle east'] },
];

function headlinesForRegion(articles, region) {
  return articles
    .filter((a) => region.keywords.some((k) => a.title.toLowerCase().includes(k)))
    .slice(0, 5)
    .map((a) => a.title);
}

async function generateBriefing(headlines) {
  const cacheKey = 'briefing';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const headlineText = headlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n');
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a senior geopolitical analyst. Based on these top headlines, write a concise 3-sentence geopolitical briefing for analysts. Be specific, analytical, and focus on implications.\n\nHeadlines:\n${headlineText}\n\nBriefing:`,
        },
      ],
    });

    const result = {
      text: message.content[0].text,
      generatedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Claude briefing error:', err.message);
    return {
      text: 'AI analysis temporarily unavailable. Please check your Anthropic API key configuration.',
      generatedAt: new Date().toISOString(),
    };
  }
}

async function generateDigest(articles) {
  const cacheKey = 'digest';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const regionSummaries = REGIONS.map((r) => {
      const headlines = headlinesForRegion(articles, r);
      return `${r.name}:\n${headlines.length > 0 ? headlines.join('\n') : 'No significant developments.'}`;
    }).join('\n\n');

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: `You are a geopolitical analyst. For each of the 4 world regions below, write exactly one analytical sentence summarising the key development. Be specific and concise. Return ONLY a JSON object with keys: europe, "asia-pacific", americas, "africa-me".\n\n${regionSummaries}`,
        },
      ],
    });

    let parsed;
    try {
      const text = message.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {
        europe: 'European security situation remains fluid amid ongoing diplomatic efforts.',
        'asia-pacific': 'Indo-Pacific tensions persist with increased military posturing from regional powers.',
        americas: 'Political transitions and economic pressures continue to shape regional dynamics.',
        'africa-me': 'Conflict zones and governance crises drive humanitarian concerns across the region.',
      };
    }

    const result = { regions: parsed, generatedAt: new Date().toISOString() };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Claude digest error:', err.message);
    return {
      regions: {
        europe: 'European security situation remains fluid amid ongoing diplomatic efforts.',
        'asia-pacific': 'Indo-Pacific tensions persist with increased military posturing from regional powers.',
        americas: 'Political transitions and economic pressures continue to shape regional dynamics.',
        'africa-me': 'Conflict zones and governance crises drive humanitarian concerns across the region.',
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

router.post('/briefing', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const headlines = articles.map((a) => a.title);
    const briefing = await generateBriefing(headlines);
    res.json(briefing);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

router.post('/briefing/refresh', async (req, res) => {
  cache.del('briefing');
  try {
    const articles = await fetchGDELT();
    const headlines = articles.map((a) => a.title);
    const briefing = await generateBriefing(headlines);
    res.json(briefing);
  } catch (err) {
    res.status(500).json({ error: 'Failed to refresh analysis' });
  }
});

router.get('/digest', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const digest = await generateDigest(articles);
    res.json(digest);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

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
