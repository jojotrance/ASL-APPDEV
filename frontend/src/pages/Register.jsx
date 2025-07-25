import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import rightImage from '../assets/pic.png';
import FadeTransition from '../components/FadeTransition';

function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    sex: 'rather not to say',
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  
  // Safely handle auth context - it might not be available
  let login = () => {};
  const navigate = useNavigate();
  
  try {
    const auth = useAuth();
    login = auth.login;
  } catch (error) {
    // useAuth is not available (component rendered outside AuthProvider)
    console.log('Register rendered outside AuthProvider');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    const data = new FormData();
    Object.entries(form).forEach(([key, val]) => data.append(key, val));
    if (photo) data.append('photo', photo);

    try {
      const res = await axios.post('/api/v1/auth/register', data);
      
      if (res.data.token && res.data.user) {
        login(res.data.user, res.data.token);
        navigate('/pending-approval'); // Redirect to pending approval page after registration
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #27548a 0%, #4a7bc8 100%)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/* Left side - Illustration */}
      <div className="seq-animate seq-delay-1"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.05)'
        }}
      >
        <img
          src={rightImage}
          alt="Register Illustration"
          style={{
            maxWidth: '80%',
            maxHeight: '80%',
            objectFit: 'contain',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(30,64,175,0.10)'
          }}
        />
      </div>

      {/* Right side - Register Form */}
      <div
        style={{
          flex: 1,
          maxWidth: '900px',
          padding: '40px',
          backgroundColor: '#27548a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {/* Logo */}
        <div className="seq-animate seq-delay-2" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(30,64,175,0.15)'
          }}>
            <img
              src={logo}
              alt="ASL Bridge Logo"
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
            />
          </div>
        </div>
        {/* Title */}
        <h2 className="seq-animate seq-delay-3"
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            margin: '8px 0 10px 0',
            textAlign: 'center',
            width: '100%'
          }}
        >
          Create an Account
        </h2>
        <p className="seq-animate seq-delay-4"
          style={{
            color: '#ffffff',
            fontSize: '18px',
            marginBottom: '30px',
            margin: '8px 0 30px 0',
            textAlign: 'center',
            width: '100%'
          }}
        >
          Join SignConnect today!
        </p>
        <div className="seq-animate seq-delay-5" style={{
          width: '100%',
          maxWidth: '450px',
          margin: '0 auto',
          background: 'rgba(255,255,255,0.07)',
          borderRadius: '18px',
          boxShadow: '0 4px 24px rgba(30,64,175,0.10)',
          padding: '32px 24px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Existing Register Form */}
          <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                fontSize: '18px'
              }}>
                {/* User SVG */}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" stroke="#8b5cf6" strokeWidth="2"/>
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#8b5cf6" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Username"
                required
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'rgba(255,255,255,0.85)',
                  boxSizing: 'border-box', // Prevent input overflow
                  overflow: 'hidden'
                }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                fontSize: '18px'
              }}>
                {/* Mail SVG */}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="4" stroke="#8b5cf6" strokeWidth="2"/>
                  <path d="M3 7l9 6 9-6" stroke="#8b5cf6" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email"
                required
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'rgba(255,255,255,0.85)',
                  boxSizing: 'border-box', // Prevent input overflow
                  overflow: 'hidden'
                }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                fontSize: '18px'
              }}>
                {/* Lock SVG */}
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="#8b5cf6" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#8b5cf6" strokeWidth="2"/>
                </svg>
              </span>
              <input
                type="password"
                placeholder="Password"
                required
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  background: 'rgba(255,255,255,0.85)',
                  boxSizing: 'border-box', // Prevent input overflow
                  overflow: 'hidden'
                }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>
            <select
              onChange={e => setForm({ ...form, sex: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255,255,255,0.85)',
                color: '#333',
                marginBottom: '8px',
                boxSizing: 'border-box', // Prevent select overflow
                overflow: 'hidden'
              }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="rather not to say">Rather not to say</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={e => setPhoto(e.target.files[0])}
              style={{
                marginBottom: '8px',
                color: '#fff',
                boxSizing: 'border-box', // Prevent file input overflow
                overflow: 'hidden'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(90deg, #8b5cf6 0%, #4a7bc8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '6px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.10)',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => (e.target.style.background = '#7c3aed')}
              onMouseOut={e => (e.target.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #4a7bc8 100%)')}
            >
              Register
            </button>
            {error && <p style={{
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '10px',
              textAlign: 'center'
            }}>{error}</p>}
          </form>
        </div>
        <p className="seq-animate seq-delay-6" style={{
          textAlign: 'center',
          fontSize: '16px',
          color: '#ffffff',
          margin: '18px 0 0 0',
          width: '100%'
        }}>
          Already have an account?{' '}
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              navigate('/login');
            }}
            style={{
              color: '#8b5cf6',
              textDecoration: 'none',
              fontWeight: 'bold',
              transition: 'color 0.2s'
            }}
            onMouseOver={e => (e.target.style.color = '#4a7bc8')}
            onMouseOut={e => (e.target.style.color = '#8b5cf6')}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;