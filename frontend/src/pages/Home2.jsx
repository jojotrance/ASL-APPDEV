import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import heroIllustration from '../assets/hero-illustration.png';
import logo from '../assets/logo.png';

function Home2() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Recognition",
      description: "Advanced machine learning trained on medical ASL vocabulary."
    },
    {
       icon: '🤟',
      title: 'Sign Language Output',
      description: 'Conversion to sign language with proper grammar structure, and visual representation for deaf patients.'
   },
    {
      icon: '🔄',
      title: 'Two-way Communication',
      description: 'Bidirectional translation supporting both speech-to-sign and sign-to-speech communication for complete healthcare conversations.'
   }
  ];

  const services = [
   { icon: "📝", title: "Text-to-ASL Converter", desc: "Instant text conversion to ASL animations" },
  { icon: "🤳", title: "ASL-to-Text Recognition", desc: "Real-time hand gesture detection and text output" },
  { icon: "📚", title: "Interactive Tutorials", desc: "Learn basic ASL signs like greetings and numbers" },
  { icon: "🎓", title: "Beginner-Friendly Lessons", desc: "Step-by-step sign instructions and practice" },
  ];

  const stats = [
     { number: "10K+", label: "Signs Available" },
  { number: "70K+", label: "Successful Conversions" },
  { number: "1M+", label: "Animated Signs Viewed" },
  { number: "24/7", label: "Live Support Availability" },
  ];

  // Add scroll reveal hooks for each section
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [servicesRef, servicesVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();

  // Cycle through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  // Check user role and redirect if not authorized
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'guest') {
        // Redirect guest users to pending approval page
        navigate('/pending-approval');
      }
    } else if (!loading && !user) {
      // Redirect unauthenticated users to login
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user || user.role === 'guest') {
    return null;
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section style={{
        padding: '120px 40px 80px',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center'
      }}>
        {/* Left Content */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
            }}>
              <img src={logo} alt="Logo" style={{ width: '28px', height: '28px' }} />
            </div>
            <span style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              SignConnect
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            color: '#1e40af', 
            marginBottom: '16px', 
            lineHeight: '1.1'
          }}>
            Welcome Back!
            <br />
            <span style={{ color: '#1e40af' }}>ASL Translation Hub</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#4b5563', 
            marginBottom: '40px', 
            lineHeight: '1.6'
          }}>
            Your personalized ASL translation workspace. Access all your favorite features and continue your sign language journey.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            alignItems: 'flex-start'
          }}>
            <button 
              onClick={() => window.location.href = '/video'}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '25px',
                fontWeight: '700',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
              }}
            >
              📺 Text to Sign
            </button>
            
            <button 
              onClick={() => window.location.href = '/home'}
              style={{
                background: 'transparent',
                color: '#374151',
                padding: '16px 32px',
                borderRadius: '25px',
                fontWeight: '600',
                fontSize: '16px',
                border: '2px solid #d1d5db',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              ✋ Sign to Text
            </button>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img 
            src={heroIllustration} 
            alt="ASL Translation" 
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              transform: 'perspective(1000px) rotateY(-5deg)',
              transition: 'transform 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'perspective(1000px) rotateY(0deg) scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'perspective(1000px) rotateY(-5deg)';
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        style={{
          padding: '80px 40px',
          background: 'white',
          opacity: featuresVisible ? 1 : 0,
          transform: `translateY(${featuresVisible ? 0 : 50}px)`,
          transition: 'all 0.8s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            Powerful Features
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            marginBottom: '60px'
          }}>
            Everything you need for seamless ASL communication
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: index === currentFeature ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : '#f8fafc',
                  color: index === currentFeature ? 'white' : '#374151',
                  padding: '30px',
                  borderRadius: '16px',
                  textAlign: 'center',
                  transition: 'all 0.5s ease',
                  transform: index === currentFeature ? 'translateY(-10px)' : 'translateY(0)',
                  boxShadow: index === currentFeature ? '0 10px 30px rgba(30, 64, 175, 0.3)' : '0 4px 10px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  if (index !== currentFeature) {
                    e.target.style.transform = 'translateY(-5px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (index !== currentFeature) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                  }
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  marginBottom: '12px' 
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  opacity: 0.8, 
                  lineHeight: '1.5' 
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section 
        ref={servicesRef}
        style={{
          padding: '80px 40px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          opacity: servicesVisible ? 1 : 0,
          transform: `translateY(${servicesVisible ? 0 : 50}px)`,
          transition: 'all 0.8s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            Your ASL Tools
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            marginBottom: '60px'
          }}>
            Quick access to all your favorite features
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {services.map((service, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-5px)';
                  e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                  {service.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.3rem', 
                  fontWeight: '600', 
                  color: '#1e40af',
                  marginBottom: '12px' 
                }}>
                  {service.title}
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#6b7280',
                  lineHeight: '1.5' 
                }}>
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={statsRef}
        style={{
          padding: '80px 40px',
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          color: 'white',
          opacity: statsVisible ? 1 : 0,
          transform: `translateY(${statsVisible ? 0 : 50}px)`,
          transition: 'all 0.8s ease'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '60px'
          }}>
            Join Our Growing Community
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px'
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  marginBottom: '8px'
                }}>
                  {stat.number}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  opacity: 0.9
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 40px',
        background: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '16px'
          }}>
            Ready to Continue?
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: '#6b7280',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            Jump right back into your ASL translation experience with our powerful tools.
          </p>
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => window.location.href = '/video'}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '25px',
                fontWeight: '700',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
              }}
            >
              📺 Start Text to Sign
            </button>
            <button 
              onClick={() => window.location.href = '/home'}
              style={{
                background: 'transparent',
                color: '#1e40af',
                padding: '16px 32px',
                borderRadius: '25px',
                fontWeight: '700',
                fontSize: '16px',
                border: '2px solid #1e40af',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              ✋ Try Sign to Text
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home2;
