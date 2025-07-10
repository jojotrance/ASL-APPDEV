import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png'; // Make sure your logo image is in this path

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
          <img
            src={logo}
            alt="ASL Bridge Logo"
            style={{ width: 40 ,height: 40, objectFit: 'contain' }}
          />
        </div>
        <div>
          <h1 style={{
            color: '#1e40af',
            fontSize: '20px',
            fontWeight: '700',
            margin: 0,
            textShadow: '0 2px 4px rgba(255,255,255,0.7)'
          }}>
            SignConnect
          </h1>
          <p style={{
            color: '#1e40af',
            fontSize: '12px',
            margin: 0,
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(255,255,255,0.7)'
          }}>
            ASL Bridge
          </p>
        </div>
      </div>

      {/* Navigation + Auth Buttons */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {['Features', 'Services', 'Learn', 'Translate'].map((item) => (
          <span
            key={item}
            style={{
              display: 'inline-block',
              borderRadius: '50%',
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#fde047'; // yellow circle
              e.currentTarget.style.boxShadow = '0 2px 8px #fde04755';
              e.currentTarget.querySelector('a').style.color = '#1e40af';
              e.currentTarget.querySelector('a').style.transform = 'translateY(-1px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.querySelector('a').style.color = '#1e40af';
              e.currentTarget.querySelector('a').style.transform = 'translateY(0)';
            }}
          >
            <a
              href={`#${item.toLowerCase()}`}
              style={{
                color: '#1e40af',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '16px',
                textShadow: '0 1px 2px rgba(255,255,255,0.7)',
                cursor: 'pointer',
                padding: '8px 18px',
                borderRadius: '50%',
                display: 'inline-block',
                transition: 'color 0.3s, transform 0.3s'
              }}
            >
              {item}
            </a>
          </span>
        ))}
        {/* Auth Buttons */}
        <button
          onMouseOver={e => {
            e.currentTarget.style.border = '2px solid #1e40af';
          }}
          onMouseOut={e => {
            e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)';
          }}
          onClick={() => navigate('/login')}
          style={{
            marginLeft: 24,
            marginRight: 8,
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