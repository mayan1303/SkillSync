import api from './api'; const d = r => r.data;
export const myCourses = () => api.get('/agency/courses').then(d);
export const createCourse = b => api.post('/agency/courses', b).then(d);
export const deleteCourse = id => api.delete(`/agency/courses/${id}`);
export const draftCourse = skill => api.post('/agency/courses/draft', { skill }).then(d);
export const catalog = () => api.get('/student/courses').then(d);
export const enroll = id => api.post(`/student/courses/${id}/enroll`).then(d);
export const feed = () => api.get('/student/feed').then(d);
