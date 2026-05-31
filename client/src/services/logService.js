import api from './api';

export const getLogs = (params = {}) => {
  return api.get('/logs', { params });
};

export default { getLogs };
