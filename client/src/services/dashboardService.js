import api from './api';

export const getStats = (department = '') => {
  return api.get('/dashboard/stats', {
    params: department ? { department } : {}
  });
};

export const getDepartmentProgress = () => {
  return api.get('/dashboard/department-progress');
};

export default { getStats, getDepartmentProgress };
