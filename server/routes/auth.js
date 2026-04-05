const router = require('express').Router();

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'geowatch2024';

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === DASHBOARD_PASSWORD) {
    req.session.authenticated = true;
    req.session.user = { name: 'Admin' };
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid password' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.json({ authenticated: true, user: req.session.user });
  }
  res.json({ authenticated: false, user: null });
});

module.exports = router;
