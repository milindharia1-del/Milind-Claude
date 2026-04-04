import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const newsApi = {
  getNews: (category) =>
    api.get('/api/news', { params: { category, limit: 30 } }).then((r) => r.data),
  getAlerts: () => api.get('/api/alerts').then((r) => r.data),
  getHotspots: () => api.get('/api/hotspots').then((r) => r.data),
};

export const analysisApi = {
  getBriefing: () => api.post('/api/analysis/briefing').then((r) => r.data),
  refreshBriefing: () => api.post('/api/analysis/briefing/refresh').then((r) => r.data),
  getDigest: () => api.get('/api/analysis/digest').then((r) => r.data),
  getTrends: () => api.get('/api/analysis/trends').then((r) => r.data),
};

export default api;
