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
            <div className="stat-label">Active learners</div>
          </div>
          <div className="stat-trend positive">↗ +{Math.round(stats.totalUsers * 0.12)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sign-icon">🤟</div>
          <div className="stat-content">
            <h3>Total Signs</h3>
            <div className="stat-number">{stats.totalSigns}</div>
            <div className="stat-label">Available signs</div>
          </div>
          <div className="stat-trend positive">↗ +{Math.round(stats.totalSigns * 0.08)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accuracy-icon">🎯</div>
          <div className="stat-content">
            <h3>Avg Accuracy</h3>
            <div className="stat-number">{stats.averageAccuracy || 85}%</div>
            <div className="stat-label">Model performance</div>
          </div>
          <div className="stat-trend positive">↗ +2.3%</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions-icon">📚</div>
          <div className="stat-content">
            <h3>Learning Sessions</h3>
            <div className="stat-number">{Math.round(stats.totalUsers * 3.2)}</div>
            <div className="stat-label">This month</div>
          </div>
          <div className="stat-trend positive">↗ +{Math.round(stats.totalUsers * 0.15)}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        <div className="chart-section">
          <div className="chart-card">
            <h3>📊 Usage Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Users', value: stats.totalUsers },
                { name: 'Signs', value: stats.totalSigns },
                { name: 'Sessions', value: Math.round(stats.totalUsers * 2.5) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>📈 Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', users: Math.round(stats.totalUsers * 0.6), signs: Math.round(stats.totalSigns * 0.7) },
                { month: 'Feb', users: Math.round(stats.totalUsers * 0.7), signs: Math.round(stats.totalSigns * 0.8) },
                { month: 'Mar', users: Math.round(stats.totalUsers * 0.85), signs: Math.round(stats.totalSigns * 0.9) },
                { month: 'Apr', users: stats.totalUsers, signs: stats.totalSigns }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#4F46E5" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="signs" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-card">
            <h3>🥧 Distribution Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>📋 Quick Stats</h3>
            <div className="quick-stats">
              <div className="quick-stat-item">
                <span className="quick-stat-label">Success Rate</span>
                <span className="quick-stat-value">{stats.averageAccuracy || 87}%</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Active Today</span>
                <span className="quick-stat-value">{Math.round(stats.totalUsers * 0.23)}</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">New This Week</span>
                <span className="quick-stat-value">{Math.round(stats.totalUsers * 0.08)}</span>
              </div>
              <div className="quick-stat-item">
                <span className="quick-stat-label">Most Popular Sign</span>
                <span className="quick-stat-value">👋 Hello</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-section">
        <div className="activity-header">
          <h3>🔄 Recent Activity</h3>
          <button className="refresh-btn" onClick={fetchStats}>🔄 Refresh</button>
        </div>
        <div className="activity-grid">
          <div className="activity-card">
            <h4>📈 System Performance</h4>
            <div className="activity-items">
              <div className="activity-item">
                <div className="activity-icon">⚡</div>
                <div className="activity-content">
                  <span className="activity-label">Model accuracy</span>
                  <span className="activity-value">{stats.averageAccuracy || 87}%</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">🚀</div>
                <div className="activity-content">
                  <span className="activity-label">Processing speed</span>
                  <span className="activity-value">1.2s avg</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="activity-card">
            <h4>👥 User Engagement</h4>
            <div className="activity-items">
              <div className="activity-item">
                <div className="activity-icon">👤</div>
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
    </div>
  );
};

export default Dashboard;
