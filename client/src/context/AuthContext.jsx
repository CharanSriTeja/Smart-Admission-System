import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user || response.data;
        if (userData && userData.role) {
          userData.role = userData.role.toLowerCase();
        }
        setUser(userData);
        setToken(storedToken);
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, []);

  // Sync role-based theme classes to the document element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-admin', 'theme-volunteer', 'theme-hod');
    
    if (user && user.role) {
      root.classList.add(`theme-${user.role.toLowerCase()}`);
    } else {
      // Default theme (e.g. Volunteer Teal theme) for landing/unauthenticated state
      root.classList.add('theme-volunteer');
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data;
    if (userData && userData.role) {
      userData.role = userData.role.toLowerCase();
    }
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    if (userData.role === 'admin') {
      navigate('/admin');
    } else if (userData.role === 'hod') {
      navigate('/hod/dashboard');
    } else {
      navigate('/volunteer/dashboard');
    }
    return response.data;
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
