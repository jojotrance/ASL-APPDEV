import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthenticatedLayout from './AuthenticatedLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        background: 'linear-gradient(135deg, #27548a 0%, #4a7bc8 100%)',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

  // Only allow 'user' or 'admin' roles to access protected routes
  // 'guest' role should only access the landing page
  return user && (user.role === 'user' || user.role === 'admin') ? (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  ) : (
    <Navigate to="/" replace />
  );
};

export default ProtectedRoute;