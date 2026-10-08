import api from './api';
export const simulate = b => api.post('/intel/simulate', b).then(r => r.data);
export const whatIf = skills => api.post('/student/whatif', { skills }).then(r => r.data);
export const alerts = () => api.get('/intel/alerts').then(r => r.data);
export const outcomes = () => api.get('/intel/outcomes').then(r => r.data);
