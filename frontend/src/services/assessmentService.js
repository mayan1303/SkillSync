import api from './api';
export const assessSkills = () => api.get('/student/assessments/skills').then(r => r.data);
export const assessStart = skill => api.post('/student/assessments/start', { skill }).then(r => r.data);
export const assessAnswer = (id, answer, away = false) => api.post(`/student/assessments/${id}/answer`, { answer, away }).then(r => r.data);
