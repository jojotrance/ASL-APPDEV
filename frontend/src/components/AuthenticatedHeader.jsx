import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const AuthenticatedHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(30, 64, 175, 0.1)',
      padding: '12px 24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/home2')}
        >
          <img src={logo} alt="SignConnect" style={{ width: '40px', height: '40px' }} />
          <span style={{ fontWeight: '700', fontSize: '1.5rem', color: '#1e40af' }}>
            SignConnect
          </span>
        </div>

        {/* Main Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '30px'
        }}>
          {/* Text to Sign */}
          <button
            onClick={() => navigate('/sign-input')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#1e40af',
              border: '2px solid #1e40af',
              borderRadius: '25px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                background: '#1e40af',
                color: 'white'
              }
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1e40af';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#1e40af';
            }}
          >
            📺 Text to Sign
          </button>

          {/* Sign to Text */}
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: '#1e40af',
              border: '2px solid #1e40af',
              borderRadius: '25px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#1e40af';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#1e40af';
            }}
          >
            ✋ Sign to Text
          </button>

          {/* Additional Menu Items */}
          <button
            onClick={() => navigate('/learn')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              borderRadius: '20px',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f3f4f6';
              e.target.style.color = '#1e40af';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#6b7280';
            }}
          >
            📚 Learn
          </button>

          {/* Admin Menu - Only show for admin users */}
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '8px 16px',
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#1e40af';
                }}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => navigate('/users')}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '20px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#1e40af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#6b7280';
                }}
              >
                👥 Users
              </button>
            </>
          )}
        </div>

        {/* User Menu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* User Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {user?.photo?.url ? (
              <img
                src={user.photo.url}
                alt={user.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e5e7eb'
                }}
              />
            ) : (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ 
              color: '#1e40af', 
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {user?.username}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ef4444';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </nav>
    </header>
  );
};

export default AuthenticatedHeader;
