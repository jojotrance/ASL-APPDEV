import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user) => {
    setEditingUser(user._id);
    setEditRole(user.role);
    setError('');
    setSuccess('');
  };

  const handleSaveRole = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: editRole })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => 
          user._id === userId ? updatedUser : user
        ));
        setEditingUser(null);
        setSuccess('Role updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update role');
      }
    } catch (err) {
      setError('Error updating role');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditRole('');
    setError('');
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        setSuccess('User deleted successfully');
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Error deleting user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading users...</div>;
  }

  return (
    <div style={{ 
      padding: '24px', 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: '#f8fafc',
        minHeight: '100vh'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          padding: '24px',
          marginBottom: '24px'
        }}>
          {/* Header with back button */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#4b5563'}
                onMouseLeave={(e) => e.target.style.background = '#6b7280'}
              >
                ← Back to Dashboard
              </button>
              <h2 style={{ margin: 0, color: '#1f2937', fontSize: '24px', fontWeight: '700' }}>
                👥 User Management
              </h2>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div style={{ 
              padding: '16px', 
                backgroundColor: '#fef2f2', 
                color: '#dc2626', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f0fdf4', 
                color: '#16a34a', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                {success}
              </div>
            )}

            {/* Users Table */}
            <div style={{ 
              overflowX: 'auto',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px',
                background: 'white'
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f8fafc',
                    borderBottom: '2px solid #e5e7eb'
                  }}>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      User
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Email
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Gender
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Role
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'left', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Joined
                    </th>
                    <th style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} style={{ 
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'white'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {user.photo?.url ? (
                            <img 
                              src={user.photo.url} 
                              alt="Profile" 
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #e5e7eb'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}>
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827' }}>
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280', textTransform: 'capitalize' }}>
                        {user.sex}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {editingUser === user._id ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              style={{ 
                                padding: '6px 12px', 
                                border: '1px solid #d1d5db', 
                                borderRadius: '6px',
                                fontSize: '14px',
                                width: '120px',
                                outline: 'none',
                                background: 'white'
                              }}
                            >
                              <option value="guest">Guest</option>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => handleSaveRole(user._id)}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: '#6b7280', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : (
                          <span style={{ 
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            backgroundColor: user.role === 'admin' ? '#ef4444' : user.role === 'user' ? '#10b981' : '#f59e0b',
                            color: '#fff'
                          }}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '13px' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {editingUser !== user._id && (
                            <button
                              onClick={() => handleEditRole(user)}
                              style={{ 
                                padding: '6px 12px', 
                                backgroundColor: '#3b82f6', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              ✏️ Edit Role
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            style={{ 
                              padding: '6px 12px', 
                              backgroundColor: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            disabled={editingUser === user._id}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                color: '#6b7280',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No users found</h3>
                <p style={{ margin: 0 }}>Users will appear here once they register</p>
              </div>
            )}

            {/* Footer Stats */}
            <div style={{ 
              marginTop: '24px', 
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                Total Users: <span style={{ color: '#111827', fontWeight: '600' }}>{users.length}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Users;