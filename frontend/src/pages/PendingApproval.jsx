import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is approved, redirect to home2
    if (user && user.role === 'user') {
      navigate('/home2');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #27548a 0%, #4a7bc8 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        margin: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        padding: '40px 30px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #27548a 0%, #4a7bc8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px auto'
        }}>
          <img
            src={logo}
            alt="ASL Bridge Logo"
            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
          />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#2d3748',
          margin: '0 0 20px 0'
        }}>
          Account Pending Approval
        </h1>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '10px',
          padding: '20px',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
          <p style={{
            color: '#856404',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: '0 0 10px 0'
          }}>
            Your registration was successful! However, your account is currently pending administrator approval.
          </p>
          <p style={{
            color: '#856404',
            fontSize: '14px',
            margin: '0'
          }}>
            Once approved, you'll be able to access all features of ASL Bridge.
          </p>
        </div>

        <div style={{
          background: '#e1f5fe',
          border: '1px solid #b3e5fc',
          borderRadius: '10px',
          padding: '15px',
          margin: '20px 0'
        }}>
          <p style={{
            color: '#0277bd',
            fontSize: '14px',
            margin: '0',
            fontWeight: '500'
          }}>
            💡 This page will automatically redirect you once your account is approved.
            You can also refresh this page or log in again to check your status.
          </p>
        </div>

        {user && (
          <div style={{ margin: '20px 0' }}>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>
              Logged in as: <strong>{user.username}</strong>
            </p>
            <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
              Email: <strong>{user.email}</strong>
            </p>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4a7bc8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Check Status
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>

        <p style={{
          color: '#888',
          fontSize: '12px',
          marginTop: '30px',
          margin: '30px 0 0 0'
        }}>
          Need help? Contact support at support@aslbridge.com
        </p>
      </div>
    </div>
  );
}

export default PendingApproval;
