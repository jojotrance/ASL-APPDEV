import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import rightImage from '../assets/pic.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Safely handle auth context - it might not be available
  let login = () => {};
  const navigate = useNavigate();
  
  try {
    const auth = useAuth();
    login = auth.login;
  } catch (error) {
    // useAuth is not available (component rendered outside AuthProvider)
    console.log('Login rendered outside AuthProvider');
  }

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    
    try {
      const res = await axios.post('/api/v1/auth/login', { email, password });
      
      if (res.data.token && res.data.user) {
        // Check if user role is 'guest' (pending approval)
        if (res.data.user.role === 'guest') {
          login(res.data.user, res.data.token);
          navigate('/pending-approval');
          return;
        }
        
        // Check if user is admin and redirect to dashboard
        if (res.data.user.role === 'admin') {
          login(res.data.user, res.data.token);
          navigate('/dashboard');
          return;
        }
        
        login(res.data.user, res.data.token);
        navigate('/home2'); // Redirect to home2 after successful login for regular users
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #27548a 0%, #4a7bc8 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Left side - Login Form */}
      <div style={{
        flex: 1,
        maxWidth: '900px',
        padding: '40px',
        backgroundColor: '#27548a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Logo */}
        <div className="seq-animate seq-delay-1" style={{
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

        {/* Form Title */}
        <h2 className="seq-animate seq-delay-2" style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: '8px 0 10px 0',
          textAlign: 'center',
          width: '100%'
        }}>Welcome to SignConnect!</h2>
        <p className="seq-animate seq-delay-3" style={{
          color: '#ffffff',
          fontSize: '18px',
          marginBottom: '30px',
          margin: '8px 0 30px 0',
          textAlign: 'center',
          width: '100%'
        }}>Uniting the World, One Sign at a Time.</p>

        {/* Form */}
        <form
          className="seq-animate seq-delay-4"
          onSubmit={handleSubmit}
          style={{
            width: '100%',
            maxWidth: '350px',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.07)',
            borderRadius: '18px',
            boxShadow: '0 4px 24px rgba(30,64,175,0.10)',
            padding: '32px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Email Field */}
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>Email</label>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '38px',
              fontSize: '18px'
            }}>
              {/* Inline SVG Mail Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="4" stroke="#8b5cf6" strokeWidth="2"/>
                <path d="M3 7l9 6 9-6" stroke="#8b5cf6" strokeWidth="2"/>
              </svg>
            </span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.85)'
              }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              marginBottom: '8px'
            }}>Password</label>
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '38px',
              fontSize: '18px'
            }}>
              {/* Inline SVG Lock Icon */}
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="#8b5cf6" strokeWidth="2"/>
                <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#8b5cf6" strokeWidth="2"/>
              </svg>
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.85)'
              }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Login Button */}
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
            Login
          </button>

          {/* Register Link */}
          <p className="seq-animate seq-delay-5" style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#ffffff',
            margin: '8px 0 0 0',
            width: '100%'
          }}>
            Don't have an account?{' '}
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                navigate('/register');
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
              Register
            </a>
          </p>

          {/* Error Message */}
          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '14px',
              marginTop: '15px',
              textAlign: 'center'
            }}>
              {error}
            </p>
          )}
        </form>
      </div>

      {/* Right side - Illustration */}
      <div className="seq-animate seq-delay-6" style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)'
      }}>
        <img
          src={rightImage}
          alt="Login Illustration"
          style={{
            maxWidth: '80%',
            maxHeight: '80%',
            objectFit: 'contain',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(30,64,175,0.10)'
          }}
        />
      </div>
    </div>
  );
}

export default Login;