import api from './api';

export const getStats = () => {
  return api.get('/dashboard/stats');
};

export const getDepartmentProgress = () => {
  return api.get('/dashboard/department-progress');
};

export default { getStats, getDepartmentProgress };
