import React from 'react';
import AuthenticatedHeader from './AuthenticatedHeader';

const AuthenticatedLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <AuthenticatedHeader />
      <main style={{
        paddingTop: '80px', // Account for fixed header
        minHeight: 'calc(100vh - 80px)'
      }}>
        {children}
      </main>
    </div>
  );
};

export default AuthenticatedLayout;
