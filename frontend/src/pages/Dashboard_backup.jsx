import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import '../dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/stats/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  // Prepare pie chart data
  const pieData = [
    { name: 'Total Users', value: stats.totalUsers, color: '#0088FE' },
    { name: 'Total Signs', value: stats.totalSigns, color: '#00C49F' }
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Admin Dashboard</h1>
        <p>ASL Learning Application Analytics & Management</p>
        
        {/* Admin Navigation Buttons */}
        <div className="admin-nav-buttons">
          <button 
            onClick={() => navigate('/sign-recorder')}
            className="nav-button recorder-btn"
          >
            📹 Sign Recorder
          </button>
          <button 
            onClick={() => navigate('/model-trainer')}
            className="nav-button trainer-btn"
          >
            🤖 Model Trainer
          </button>
          <button 
            onClick={() => navigate('/users')}
            className="nav-button users-btn"
          >
            👥 Manage Users
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-cards">
        <div 
          className="stat-card clickable" 
          onClick={() => navigate('/users')}
          title="Click to manage users"
        >
          <div className="stat-icon user-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-change positive">
              +{stats.newUsersThisMonth} this month
            </div>
          </div>
          <div className="click-indicator">→</div>
        </div>

          <div className="stat-card">
            <div className="stat-icon sign-icon">🤟</div>
            <div className="stat-content">
              <h3>Total Signs</h3>
              <div className="stat-number">{stats.totalSigns}</div>
              <div className="stat-change positive">
                +{stats.newSignsThisMonth} this month
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon new-icon">📈</div>
            <div className="stat-content">
              <h3>New Users</h3>
              <div className="stat-number">{stats.newUsersThisMonth}</div>
              <div className="stat-change">Last 30 days</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon growth-icon">🆕</div>
            <div className="stat-content">
              <h3>New Signs</h3>
              <div className="stat-number">{stats.newSignsThisMonth}</div>
              <div className="stat-change">Last 30 days</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Monthly User Registrations */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>📅 Monthly User Registrations</h3>
              <p>Track new user growth over time</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyUserData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" name="New Users" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Sign Creation */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>🤟 Monthly Sign Creation</h3>
              <p>Monitor sign content growth</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlySignData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="signs" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="New Signs"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Total Distribution Pie Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>📊 Platform Overview</h3>
              <p>Users vs Signs distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Combined Growth Chart */}
          <div className="chart-container">
            <div className="chart-header">
              <h3>📈 Growth Comparison</h3>
              <p>Users vs Signs growth trend</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  data={stats.monthlyUserData}
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  name="Users"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  data={stats.monthlySignData}
                  type="monotone" 
                  dataKey="signs" 
                  stroke="#10b981" 
                  name="Signs"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>📋 Recent Activity Summary</h3>
          <div className="activity-grid">
            <div className="activity-item">
              <div className="activity-icon">👥</div>
              <div className="activity-content">
                <span className="activity-label">Users joined this month</span>
                <span className="activity-value">{stats.newUsersThisMonth}</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🤟</div>
              <div className="activity-content">
                <span className="activity-label">Signs added this month</span>
                <span className="activity-value">{stats.newSignsThisMonth}</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🌐</div>
              <div className="activity-content">
                <span className="activity-label">Total platform users</span>
                <span className="activity-value">{stats.totalUsers}</span>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📚</div>
              <div className="activity-content">
                <span className="activity-label">Total ASL signs</span>
                <span className="activity-value">{stats.totalSigns}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;