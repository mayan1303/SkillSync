import api from './api';
export const market = () => api.get('/data/market').then(r => r.data);
export const predict = (model, values) => api.post(`/data/predict/${model}`, values).then(r => r.data);
