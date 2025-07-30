import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const componentRef = useRef();
  const pdfRef = useRef(null);

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

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    
    // Create a temporary container
    const pdfContent = document.createElement('div');
    
    // Add title and header
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; padding: 20px;">
        <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 8px;">User Management</h1>
        <p style="font-size: 16px; color: #3730a3;">ASL Learning Application User List</p>
        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f8fafc">
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb">Email</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb">Role</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb">Joined</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => `
            <tr>
              <td style="padding: 12px 16px; color: #6b7280">${user.email}</td>
              <td style="padding: 12px 16px; color: #6b7280">${user.role}</td>
              <td style="padding: 12px 16px; color: #6b7280">${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top: 24px; text-align: right; font-size: 14px; color: #6b7280">
        Total Users: ${users.length}
      </div>
    `;

    const opt = {
      margin: 1,
      filename: 'ASL-Users-Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF from the temporary container
    html2pdf().set(opt).from(pdfContent).save();
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
        padding: '32px',
        marginBottom: '24px'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: '#111827',
              margin: '0 0 8px 0'
            }}>
              👥 User Management
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#6b7280',
              margin: '0'
            }}>
              Manage user roles and permissions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDownloadPDF}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              📄 Export PDF
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <div ref={pdfRef}>
          {/* Users Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px 24px'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '600',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📋 Users List
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Name</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Email</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Role</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Joined</th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'center',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user._id} 
                      style={{ 
                        borderBottom: index < users.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.closest('tr').style.backgroundColor = '#f9fafb'}
                      onMouseOut={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ 
                        padding: '16px 24px',
                        color: '#111827',
                        fontWeight: '500'
                      }}>
                        {user.name}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        color: '#6b7280'
                      }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {editingUser === user._id ? (
                          <select 
                            value={editRole} 
                            onChange={(e) => setEditRole(e.target.value)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              background: 'white'
                            }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: user.role === 'admin' ? '#fee2e2' : '#dbeafe',
                            color: user.role === 'admin' ? '#dc2626' : '#2563eb'
                          }}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        color: '#6b7280'
                      }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        textAlign: 'center'
                      }}>
                        {editingUser === user._id ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleSaveRole(user._id)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
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
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✗ Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleEditRole(user)}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              ✏️ Edit Role
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            padding: '16px 24px',
            background: '#f9fafb',
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

      {/* Hidden component for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} style={{ 
          padding: '16px', 
          background: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          marginTop: '16px'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: '#111827',
            margin: '0 0 16px 0',
            borderBottom: '2px solid #667eea',
            paddingBottom: '8px'
          }}>
            Users List
          </h2>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>Name</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>Email</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>Role</th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#374151',
                  borderBottom: '1px solid #e5e7eb'
                }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={{ 
                    padding: '12px 16px',
                    color: '#111827',
                    fontWeight: '500'
                  }}>
                    {user.name}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: '#6b7280'
                  }}>
                    {user.email}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: '#6b7280'
                  }}>
                    {user.role}
                  </td>
                  <td style={{ 
                    padding: '12px 16px',
                    color: '#6b7280'
                  }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Users;
