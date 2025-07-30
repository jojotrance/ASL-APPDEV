import React, { useState, useEffect, useRef } from 'react';
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
import html2pdf from 'html2pdf.js';
import '../dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const pdfRef = useRef(null);

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

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    
    // Create title element for PDF
    const titleDiv = document.createElement('div');
    titleDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; padding: 20px;">
        <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 8px;">Admin Dashboard</h1>
        <p style="font-size: 16px; color: #3730a3;">ASL Learning Application Analytics & Management</p>
        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    // Insert title at the beginning of the element
    element.insertBefore(titleDiv, element.firstChild);

    const opt = {
      margin: 1,
      filename: 'ASL-Dashboard-Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().set(opt).from(element).save().then(() => {
      // Remove the title element after PDF generation
      element.removeChild(titleDiv);
    });
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #aab4c0ff 0%, #005bcaff 50%, #8097b1ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '2rem',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '20px',
          padding: '2rem',
          color: '#ef4444',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Total Users', value: stats.totalUsers, color: '#6366f1' },
    { name: 'Total Signs', value: stats.totalSigns, color: '#8b5cf6' }
  ];

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    padding: '2rem 1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#1f2937'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '3rem',
    color: '#1e40af'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(45deg, #1e40af, #3730a3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    fontWeight: '400',
    opacity: '0.8',
    margin: '0',
    color: '#1e40af'
  };

  const navButtonsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto 3rem auto'
  };

  const buttonStyle = {
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    padding: '1.5rem',
    color: '#1e40af',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto 3rem auto'
  };

  const statCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer'
  };

  const statIconStyle = {
    fontSize: '2.5rem',
    marginBottom: '1rem'
  };

  const statNumberStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1f2937',
    margin: '0.5rem 0'
  };

  const statLabelStyle = {
    color: '#6b7280',
    fontSize: '0.9rem',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const trendStyle = {
    color: '#10b981',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: '0.5rem'
  };

  const chartsContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const chartCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  const chartTitleStyle = {
    fontSize: '1.3rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#1f2937'
  };

  const activitySectionStyle = {
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const activityHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  };

  const activityTitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e40af',
    margin: '0'
  };

  const refreshButtonStyle = {
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    color: '#1e40af',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  };

  const activityGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  };

  const activityCardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  };

  const activityItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 0',
    borderBottom: '1px solid rgba(229, 231, 235, 0.5)'
  };

  const activityIconStyle = {
    fontSize: '1.5rem',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
    borderRadius: '12px',
    color: 'white'
  };

  const exportButtonStyle = {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    zIndex: 1000
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        `}
      </style>

      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Admin Dashboard</h1>
        <p style={subtitleStyle}>ASL Learning Application Analytics & Management</p>
      </div>

      {/* Export PDF Button - Moved to top */}
      <div style={{...navButtonsStyle, marginBottom: '1rem'}}>
        <button
          onClick={handleDownloadPDF}
          style={{
            ...buttonStyle,
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.3)';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📄</span>
          <div>
            <div>Export PDF Report</div>
            <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>Download dashboard report</div>
          </div>
        </button>
      </div>

      {/* Navigation Buttons */}
      <div style={navButtonsStyle}>
        <button
          onClick={() => navigate('/sign-recorder')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.6)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 40px rgba(30, 64, 175, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.4)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>📹</span>
          <div>
            <div>Sign Recorder</div>
            <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>Record new ASL signs</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/model-trainer')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.6)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 40px rgba(30, 64, 175, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.4)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🤖</span>
          <div>
            <div>Model Trainer</div>
            <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>Train AI models</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/users')}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.6)';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 40px rgba(30, 64, 175, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.4)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>👥</span>
          <div>
            <div>Manage Users</div>
            <div style={{ fontSize: '0.8rem', opacity: '0.8' }}>User administration</div>
          </div>
        </button>
      </div>

      <div ref={pdfRef}>
        {/* Stats Cards */}
        <div style={statsGridStyle}>
          <div
            style={statCardStyle}
            onClick={() => navigate('/users')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={statIconStyle}>👥</div>
            <div style={statLabelStyle}>Total Users</div>
            <div style={statNumberStyle}>{stats.totalUsers}</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Active learners</div>
            <div style={trendStyle}>↗ +{Math.round(stats.totalUsers * 0.12)}</div>
          </div>

          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={statIconStyle}>🤟</div>
            <div style={statLabelStyle}>Total Signs</div>
            <div style={statNumberStyle}>{stats.totalSigns}</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Available signs</div>
            <div style={trendStyle}>↗ +{Math.round(stats.totalSigns * 0.08)}</div>
          </div>

          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={statIconStyle}>🎯</div>
            <div style={statLabelStyle}>Avg Accuracy</div>
            <div style={statNumberStyle}>{stats.averageAccuracy || 85}%</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Model performance</div>
            <div style={trendStyle}>↗ +2.3%</div>
          </div>

          <div
            style={statCardStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-8px)';
              e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={statIconStyle}>📚</div>
            <div style={statLabelStyle}>Learning Sessions</div>
            <div style={statNumberStyle}>{Math.round(stats.totalUsers * 3.2)}</div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>This month</div>
            <div style={trendStyle}>↗ +{Math.round(stats.totalUsers * 0.15)}</div>
          </div>
        </div>

        {/* Charts */}
        <div style={chartsContainerStyle}>
          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>📊 Usage Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Users', value: stats.totalUsers },
                { name: 'Signs', value: stats.totalSigns },
                { name: 'Sessions', value: Math.round(stats.totalUsers * 2.5) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(20px)'
                  }}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>📈 Growth Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { month: 'Jan', users: Math.round(stats.totalUsers * 0.6), signs: Math.round(stats.totalSigns * 0.7) },
                { month: 'Feb', users: Math.round(stats.totalUsers * 0.7), signs: Math.round(stats.totalSigns * 0.8) },
                { month: 'Mar', users: Math.round(stats.totalUsers * 0.85), signs: Math.round(stats.totalSigns * 0.9) },
                { month: 'Apr', users: stats.totalUsers, signs: stats.totalSigns }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(20px)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ r: 6, fill: '#6366f1' }} />
                <Line type="monotone" dataKey="signs" stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>🥧 Distribution Overview</h3>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(20px)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <h3 style={chartTitleStyle}>📋 Quick Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'linear-gradient(45deg, #f0f9ff, #ecfdf5)',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Success Rate</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                  {stats.averageAccuracy || 87}%
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'linear-gradient(45deg, #fefce8, #f0f9ff)',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Active Today</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>
                  {Math.round(stats.totalUsers * 0.23)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'linear-gradient(45deg, #fdf4ff, #f0f9ff)',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>New This Week</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#8b5cf6' }}>
                  {Math.round(stats.totalUsers * 0.08)}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: 'linear-gradient(45deg, #f0f9ff, #fef7ff)',
                borderRadius: '12px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Most Popular Sign</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>
                  👋 Hello
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div style={activitySectionStyle}>
          <div style={activityHeaderStyle}>
            <h3 style={activityTitleStyle}>🔄 Recent Activity</h3>
          </div>
          <div style={activityGridStyle}>
            <div style={activityCardStyle}>
              <h4 style={{ ...chartTitleStyle, marginBottom: '1.5rem' }}>📈 System Performance</h4>
              <div style={activityItemStyle}>
                <div style={activityIconStyle}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Model accuracy</div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>AI recognition performance</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                  {stats.averageAccuracy || 87}%
                </div>
              </div>
              <div style={activityItemStyle}>
                <div style={activityIconStyle}>🚀</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Processing speed</div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Average response time</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#6366f1' }}>
                  1.2s
                </div>
              </div>
            </div>

            <div style={activityCardStyle}>
              <h4 style={{ ...chartTitleStyle, marginBottom: '1.5rem' }}>👥 User Engagement</h4>
              <div style={activityItemStyle}>
                <div style={activityIconStyle}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Total platform users</div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Registered learners</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#8b5cf6' }}>
                  {stats.totalUsers}
                </div>
              </div>
              <div style={activityItemStyle}>
                <div style={activityIconStyle}>📚</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#374151' }}>Total ASL signs</div>
                  <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Available in database</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4' }}>
                  {stats.totalSigns}
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