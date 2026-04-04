# GeoWatch — Real-Time Geopolitics Dashboard

A single-page, no-scroll geopolitics intelligence dashboard powered by GDELT live news, Anthropic Claude AI analysis, and Google OAuth authentication.

## Features

| Section | Description |
|---|---|
| **Status Bar** | Live pulse dot, event stats, dark/light toggle, sign-out |
| **World Map** | Leaflet + CartoDB dark tiles, pulsing severity markers, click to filter |
| **Live Feed** | GDELT articles, category tabs, auto-refresh every 60 s |
| **Alerts Panel** | Top 4 critical/high severity events, colour-coded |
| **AI Briefing** | Claude 3-sentence geopolitical analysis, regenerate on demand |
| **Trends Chart** | Recharts bar chart of top 6 keyword frequency topics |
| **Daily Digest** | Claude one-sentence regional summary × 4 regions |

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- A **Google Cloud** project with OAuth 2.0 credentials
- An **Anthropic API key**

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-org/geowatch.git
cd geowatch

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env — fill in all variables (see below)
```

### 3. Set up Google OAuth

1. Go to [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorised redirect URI: `http://localhost:3001/auth/google/callback`
4. Copy **Client ID** and **Client Secret** into `server/.env`

### 4. Run in development

In two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173, proxies /api and /auth to :3001)
cd client && npm run dev
```

Open `http://localhost:5173`. Sign in with Google to access the dashboard.

---

## Environment Variables

All variables go in `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | Express port (default `3001`) |
| `SESSION_SECRET` | Random 32-byte hex string |
| `CLIENT_ORIGIN` | Frontend origin, e.g. `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | Full callback URL, e.g. `http://localhost:3001/auth/google/callback` |
| `ANTHROPIC_API_KEY` | Anthropic API key (`sk-ant-…`) |
| `ALLOWED_EMAILS` | Comma-separated whitelist. Leave blank to allow any Google account. |

---

## Production Build

```bash
# Build React → outputs to server/public/
cd client && npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to enable autostart
```

---

## Deploying to a DigitalOcean Droplet

### First-time server setup

```bash
# On the Droplet (Ubuntu 22.04 recommended)
apt update && apt install -y nginx certbot python3-certbot-nginx nodejs npm git

# Install PM2
npm install -g pm2

# Clone repo
mkdir -p /var/www && cd /var/www
git clone https://github.com/your-org/geowatch.git geowatch
cd geowatch/server && cp ../../.env.example .env && nano .env   # fill in production values

# Build
cd ../client && npm install && npm run build
cd ../server && npm install --omit=dev

# Start
cd /var/www/geowatch
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

### Nginx + HTTPS

```bash
# Copy nginx config
cp /var/www/geowatch/nginx.conf /etc/nginx/sites-available/geowatch
# Edit the file: replace your-domain.com with your real domain
nano /etc/nginx/sites-available/geowatch

ln -s /etc/nginx/sites-available/geowatch /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get TLS certificate
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### GitHub Actions auto-deploy

Add these secrets to your GitHub repository (`Settings → Secrets → Actions`):

| Secret | Value |
|---|---|
| `DROPLET_HOST` | Your Droplet IP or hostname |
| `DROPLET_USER` | SSH username (e.g. `root` or `deploy`) |
| `DROPLET_SSH_KEY` | Private SSH key with access to the Droplet |
| `DROPLET_PORT` | SSH port (default `22`, optional) |

Every push to `main` will SSH into the Droplet, pull the latest code, install dependencies, and reload PM2.

---

## API Routes

All `/api/*` routes require an authenticated session (Google OAuth).

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/news` | GDELT articles, cached 5 min. Query: `?category=Conflict&limit=30` |
| `GET` | `/api/alerts` | Top 8 high-severity events sorted Critical→Watch |
| `GET` | `/api/hotspots` | 8 regional hotspots with severity and latest headline |
| `POST` | `/api/analysis/briefing` | Claude 3-sentence briefing, cached 1 h |
| `POST` | `/api/analysis/briefing/refresh` | Force-regenerate briefing |
| `GET` | `/api/analysis/digest` | Claude regional digest, cached 1 h |
| `GET` | `/api/analysis/trends` | Top 6 keyword frequency topics |
| `GET` | `/auth/google` | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | OAuth callback |
| `POST` | `/auth/logout` | Destroy session |
| `GET` | `/auth/me` | Current user info |

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v4, Leaflet/react-leaflet, Recharts, TanStack Query
- **Backend:** Node.js, Express, Passport.js (Google OAuth), Anthropic SDK, node-cache
- **Data:** [GDELT Project API v2](https://blog.gdeltproject.org/gdelt-2-0-our-global-database-of-society/)
- **AI:** Anthropic Claude (claude-opus-4-6)
- **Deploy:** PM2, Nginx, DigitalOcean Droplet, GitHub Actions

---

## License

MIT
