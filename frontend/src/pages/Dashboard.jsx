import React, { useState, useEffect } from 'react';
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
        <h1>Admin Dashboard</h1>
        <p>ASL Learning Application Analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon user-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-change">
              +{stats.newUsersThisMonth} this month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sign-icon">🤟</div>
          <div className="stat-content">
            <h3>Total Signs</h3>
            <div className="stat-number">{stats.totalSigns}</div>
            <div className="stat-change">
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
          <h3>Monthly User Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyUserData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#0088FE" name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Sign Creation */}
        <div className="chart-container">
          <h3>Monthly Sign Creation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlySignData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="signs" 
                stroke="#00C49F" 
                strokeWidth={3}
                name="New Signs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Users vs Signs Comparison */}
        <div className="chart-container">
          <h3>Users vs Signs Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                data={stats.monthlyUserData}
                type="monotone" 
                dataKey="users" 
                stroke="#0088FE" 
                name="Users"
              />
              <Line 
                data={stats.monthlySignData}
                type="monotone" 
                dataKey="signs" 
                stroke="#00C49F" 
                name="Signs"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Total Distribution Pie Chart */}
        <div className="chart-container">
          <h3>Total Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity Summary</h3>
        <div className="activity-grid">
          <div className="activity-item">
            <span className="activity-label">Users joined this month:</span>
            <span className="activity-value">{stats.newUsersThisMonth}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Signs added this month:</span>
            <span className="activity-value">{stats.newSignsThisMonth}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Total platform users:</span>
            <span className="activity-value">{stats.totalUsers}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Total ASL signs:</span>
            <span className="activity-value">{stats.totalSigns}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;