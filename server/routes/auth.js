const router = require('express').Router();
const passport = require('passport');

const CLIENT_URL = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CLIENT_URL}/?error=auth_failed`,
  }),
  (req, res) => {
    res.redirect(CLIENT_URL);
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.user });
  }
  res.json({ authenticated: false, user: null });
});

module.exports = router;
