import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized and network offline errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network/Server offline error
      error.message = 'Unable to connect to the server. Please verify your internet connection or check if the backend service is running.';
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      localStorage.removeItem('token');
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const path = window.location.pathname;
      // Do not redirect if we are logging in, at root landing page, at admin login panel, or on a page starting with /login
      if (!isLoginRequest && path !== '/' && !path.startsWith('/login') && path !== '/admin') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
