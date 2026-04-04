const router = require('express').Router();
const { fetchGDELT } = require('./news');

const SEVERITY_ORDER = { Critical: 0, High: 1, Watch: 2, Normal: 3 };

router.get('/', async (req, res) => {
  try {
    const articles = await fetchGDELT();
    const alerts = articles
      .filter((a) => a.severity !== 'Normal')
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
      .slice(0, 8)
      .map((a, idx) => ({
        id: idx,
        title: a.title,
        severity: a.severity,
        category: a.category,
        source: a.source,
        publishedAt: a.publishedAt,
        url: a.url,
      }));

    res.json({ alerts, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
