import axios from 'axios';
import { useAuthStore } from '../store/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Attach access token to every request
api.interceptors.request.use(cfg => {
  const token = useAuthStore.getState().tokens?.access;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-refresh on 401, then retry; logout on failure
api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      const refresh = useAuthStore.getState().tokens?.refresh;
      if (refresh) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh });
          useAuthStore.getState().setTokens(res.data.tokens);
          original.headers.Authorization = `Bearer ${res.data.tokens.access}`;
          return api(original);
        } catch {
          // Revoke token on server then clear client
          await axios.post(`${api.defaults.baseURL}/auth/logout`, { refreshToken: refresh }).catch(() => {});
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
