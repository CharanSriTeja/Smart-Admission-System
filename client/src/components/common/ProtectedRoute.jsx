import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.map((r) => r.toLowerCase()).includes(user.role.toLowerCase()))) {
    // Redirect to appropriate dashboard based on role
    const roleLC = user?.role?.toLowerCase();
    if (roleLC === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (roleLC === 'hod') {
      return <Navigate to="/hod/dashboard" replace />;
    }
    return <Navigate to="/volunteer/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
