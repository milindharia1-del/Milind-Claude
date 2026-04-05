require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const newsRouter = require('./routes/news');
const alertsRouter = require('./routes/alerts');
const hotspotsRouter = require('./routes/hotspots');
const analysisRouter = require('./routes/analysis');
const authRouter = require('./routes/auth');

const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24h
  },
}));


const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Auth routes (no auth required)
app.use('/auth', authRouter);

// Protected API routes
app.use('/api/news', requireAuth, newsRouter);
app.use('/api/alerts', requireAuth, alertsRouter);
app.use('/api/hotspots', requireAuth, hotspotsRouter);
app.use('/api/analysis', requireAuth, analysisRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
