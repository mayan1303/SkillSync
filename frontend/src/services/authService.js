import api, { setToken } from './api';
const keep = async p => { const { data } = await p; setToken(data.accessToken); return data.user; };
export const login = (email, password) => keep(api.post('/auth/login', { email, password }));
export const register = body => keep(api.post('/auth/register', body));
export const restore = () => keep(api.post('/auth/refresh'));
export const logout = async () => { try { await api.post('/auth/logout'); } finally { setToken(null); } };
export const dashboard = path => api.get(`/${path}/dashboard`).then(r => r.data);
export const saveSkills = skills => api.put('/student/skills', { skills }).then(r => r.data);
