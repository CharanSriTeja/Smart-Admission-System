import api from './api';

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const getMe = () => {
  return api.get('/auth/me');
};

export default { login, getMe };
