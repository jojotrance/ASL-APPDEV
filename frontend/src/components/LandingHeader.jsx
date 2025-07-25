import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const LandingHeader = () => {
  const navigate = useNavigate();
  
  // Safely handle auth context - it might not be available
  let user = null;
  let logout = () => {};
  
  try {
    const auth = useAuth();
    user = auth.user;
    logout = auth.logout;
  } catch (error) {
    // useAuth is not available (component rendered outside AuthProvider)
    console.log('LandingHeader rendered outside AuthProvider');
  }

  const handleAuthAction = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/login');
    }
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
      padding: '12px 24px'
    }}>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={logo} alt="SignConnect" style={{ width: '40px', height: '40px' }} />
          <span style={{ fontWeight: '700', fontSize: '1.5rem', color: '#1e40af' }}>
            SignConnect
          </span>
        </div>

        {/* Auth Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <>
              <span style={{ color: '#1e40af', fontWeight: '600' }}>
                Welcome, {user.username}!
              </span>
              <button
                onClick={() => navigate('/home2')}
                style={{
                  padding: '10px 24px',
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Go to App
              </button>
              <button
                onClick={logout}
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#1e40af',
                  border: '1px solid #1e40af',
                  borderRadius: '25px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#1e40af',
                  borderRadius: '25px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  padding: '10px 24px',
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default LandingHeader;