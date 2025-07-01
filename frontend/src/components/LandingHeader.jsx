import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      borderBottom: '1px solid rgba(255,255,255,0.2)'
    }}>
      {/* Logo Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, #1e40af, #0891b2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>🤟</span>
        </div>
        <div>
          <h1 style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: '700',
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            ASL Bridge
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            fontSize: '12px',
            margin: 0,
            fontWeight: '500'
          }}>
            Medical Translation Platform
          </p>
        </div>
      </div>

      {/* Navigation + Auth Buttons */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {['Features', 'Services', 'Technology', 'Support'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.color = '#bfdbfe';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            {item}
          </a>
        ))}
        {/* Auth Buttons */}
        <button
          onClick={() => navigate('/login')}
          style={{
            marginLeft: 24,
            marginRight: 8,
            padding: '10px 24px',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
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
            background: 'white',
            color: '#1e40af',
            border: 'none',
            borderRadius: '25px',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(30,64,175,0.10)'
          }}
        >
          Register
        </button>
      </nav>
    </header>
  );
};

export default LandingHeader;