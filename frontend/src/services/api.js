import axios from 'axios';
let token = null; export const setToken = t => { token = t; };
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api', withCredentials: true });
api.interceptors.request.use(c => { if (token) c.headers.Authorization = `Bearer ${token}`; return c; });
let refreshing = null;
api.interceptors.response.use(r => r, async e => {
  const o = e.config;
  if (e.response?.status === 401 && o && !o._retry && !o.url.includes('/auth/')) {
    o._retry = true;
    try {
      refreshing = refreshing || api.post('/auth/refresh').finally(() => { refreshing = null; });
      const { data } = await refreshing; setToken(data.accessToken);
      return api(o);
    } catch { setToken(null); window.dispatchEvent(new Event('wie:expired')); }
  }
  return Promise.reject(e);
});
export default api;
