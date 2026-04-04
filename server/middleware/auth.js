function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorised', authenticated: false });
}

module.exports = { requireAuth };
