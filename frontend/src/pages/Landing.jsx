import React, { useState, useEffect } from 'react';
import LandingHeader from '../components/LandingHeader';
import { useScrollReveal } from '../hooks/useScrollReveal';


function Landing() {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: "🧠",
      title: "AI-Powered Recognition",
      description: "Advanced machine learning trained on medical ASL vocabulary with 99.5% accuracy"
    },
    {
      icon: "⚡",
      title: "Real-Time Translation",
      description: "Instant sign language to text conversion with minimal latency for seamless communication"
    },
    {
      icon: "🛡️",
      title: "HIPAA Compliant",
      description: "Full healthcare privacy compliance ensuring patient data security and protection"
    },
    {
      icon: "🏥",
      title: "Medical Specialized",
      description: "Trained with certified medical interpreters for accurate healthcare terminology"
    }
  ];

  const services = [
    { icon: "🏥", title: "Hospital Integration", desc: "Seamless EHR integration" },
    { icon: "🚑", title: "Emergency Services", desc: "Critical communication support" },
    { icon: "👩‍⚕️", title: "Clinical Consultations", desc: "Enhanced patient care" },
    { icon: "💊", title: "Pharmacy Support", desc: "Medication counseling" }
  ];

  const stats = [
    { number: "99.5%", label: "Translation Accuracy" },
    { number: "500+", label: "Healthcare Facilities" },
    { number: "50K+", label: "Successful Translations" },
    { number: "24/7", label: "Medical Support" }
  ];

  // Add scroll reveal hooks for each section
  const [featuresRef, featuresVisible] = useScrollReveal();
  const [servicesRef, servicesVisible] = useScrollReveal();
  const [statsRef, statsVisible] = useScrollReveal();
  const [ctaRef, ctaVisible] = useScrollReveal();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700">
      <LandingHeader />
      
      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '120px 24px 80px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #0891b2 100%)'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '25px',
              color: '#bfdbfe',
              fontWeight: '500',
              fontSize: '14px',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              🏥 Trusted by 500+ Healthcare Facilities
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: '4rem', 
            fontWeight: '800', 
            color: 'white', 
            marginBottom: '24px', 
            lineHeight: '1.1',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}>
            Medical-Grade
            <br />
            <span style={{
              background: 'linear-gradient(45deg, #67e8f9, #bfdbfe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              ASL Translation
            </span>
          </h1>
          
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#bfdbfe', 
            marginBottom: '48px', 
            maxWidth: '800px', 
            margin: '0 auto 48px',
            lineHeight: '1.6',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            Breaking communication barriers in healthcare with AI-powered American Sign Language translation. 
            Ensuring every patient receives the care they deserve.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '64px'
          }}>
            <button style={{
              background: 'white',
              color: '#1e40af',
              padding: '16px 32px',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '18px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}>
              <span style={{ fontSize: '20px' }}>▶</span>
              Start Translation Now
            </button>
            
            <button style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '25px',
              fontWeight: '600',
              fontSize: '18px',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}>
              <span style={{ fontSize: '18px' }}>ℹ</span>
              Learn More
            </button>
          </div>

          {/* Live Demo Preview */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '900px',
            margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '32px', 
              alignItems: 'center' 
            }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
                  Live Translation Demo
                </h3>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '16px'
                }}>
                  <div style={{
                    width: '100%',
                    height: '128px',
                    background: 'linear-gradient(135deg, #3b82f6, #0891b2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px'
                  }}>
                    📹
                  </div>
                  <p style={{ color: '#bfdbfe', fontSize: '14px', marginTop: '8px', margin: '8px 0 0' }}>
                    Camera feed will appear here
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
                  Translation Output
                </h3>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <p style={{ color: '#374151', fontSize: '18px', lineHeight: '1.5', margin: 0 }}>
                    "Hello, I need to schedule an appointment with Dr. Smith for next week."
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginTop: '16px' 
                  }}>
                    <span style={{ color: '#059669', fontWeight: '500' }}>✓ 99.2% Confidence</span>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Real-time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        style={{
          padding: '80px 24px',
          background: 'white',
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(.4,2,.3,1)'
        }}
      >
        <div style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: '#111827', 
              marginBottom: '24px' 
            }}>
              Advanced Translation Technology
            </h2>
            <p style={{ 
              fontSize: '20px', 
              color: '#6b7280', 
              maxWidth: '700px', 
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Cutting-edge AI technology designed specifically for medical environments, 
              ensuring accurate and reliable communication between healthcare providers and deaf patients.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '32px' 
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  padding: '32px',
                  borderRadius: '16px',
                  transition: 'all 0.5s ease',
                  cursor: 'pointer',
                  background: currentFeature === index 
                    ? 'linear-gradient(135deg, #1e40af, #0891b2)' 
                    : '#f9fafb',
                  color: currentFeature === index ? 'white' : '#111827',
                  boxShadow: currentFeature === index 
                    ? '0 20px 40px rgba(30, 64, 175, 0.3)' 
                    : '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transform: currentFeature === index ? 'scale(1.05)' : 'scale(1)',
                  border: currentFeature === index ? 'none' : '1px solid #e5e7eb'
                }}
                onClick={() => setCurrentFeature(index)}
                onMouseOver={(e) => {
                  if (currentFeature !== index) {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentFeature !== index) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: currentFeature === index ? '#bfdbfe' : '#6b7280',
                  lineHeight: '1.6'
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
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          opacity: servicesVisible ? 1 : 0,
          transform: servicesVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(.4,2,.3,1)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '24px'
            }}>
              Healthcare Communication Solutions
            </h2>
            <p style={{
              fontSize: '20px',
              color: '#6b7280',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Comprehensive ASL translation services tailored for medical facilities, 
              emergency services, and healthcare professionals nationwide.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px'
          }}>
            {services.map((service, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  padding: '40px 32px',
                  borderRadius: '20px',
                  boxShadow: '0 6px 24px rgba(30, 64, 175, 0.07)',
                  border: '1px solid #e0e7ef',
                  transition: 'all 0.3s',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'scale(1.04)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 64, 175, 0.13)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(30, 64, 175, 0.07)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{service.icon}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>{service.title}</h3>
                <p style={{ color: '#64748b', marginBottom: '24px', minHeight: '48px' }}>{service.desc}</p>
                <button style={{
                  color: '#2563eb',
                  background: 'none',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}>
                  Learn More →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        ref={statsRef}
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(90deg, #1e3a8a 0%, #0891b2 100%)',
          opacity: statsVisible ? 1 : 0,
          transform: statsVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(.4,2,.3,1)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: 'white',
              marginBottom: '20px'
            }}>
              Trusted by Healthcare Leaders
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#e0f2fe',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Our platform has facilitated thousands of successful medical communications, 
              improving patient outcomes across the healthcare industry.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px'
          }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: '18px',
                  padding: '48px 0',
                  textAlign: 'center',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(8, 145, 178, 0.10)',
                  fontWeight: '600',
                  fontSize: '2rem'
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #67e8f9, #bfdbfe)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '12px'
                }}>
                  {stat.number}
                </div>
                <div style={{ color: '#bae6fd', fontSize: '1.1rem', fontWeight: '500' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        style={{
          padding: '80px 24px',
          background: 'white',
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(.4,2,.3,1)'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '24px'
          }}>
            Ready to Transform Healthcare Communication?
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#64748b',
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Join hundreds of healthcare facilities already using ASL Bridge to provide 
            better care for deaf and hard-of-hearing patients. Start your free trial today.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button style={{
              background: 'linear-gradient(90deg, #2563eb 0%, #06b6d4 100%)',
              color: 'white',
              padding: '18px 44px',
              borderRadius: '999px',
              fontWeight: '700',
              fontSize: '1.2rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(37,99,235,0.15)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>▶</span>
              Start Free Trial
            </button>
            <button style={{
              background: '#f1f5f9',
              color: '#1e293b',
              padding: '18px 44px',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30,64,175,0.07)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.3rem' }}>📅</span>
              Schedule Demo
            </button>
          </div>
          <div style={{
            marginTop: '40px',
            padding: '32px',
            background: 'linear-gradient(90deg, #e0f2fe 0%, #f0f9ff 100%)',
            borderRadius: '18px',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            display: 'flex',
            justifyContent: 'center',
            gap: '32px',
            fontWeight: '500',
            fontSize: '1rem'
          }}>
            <span>✅ HIPAA Compliant</span>
            <span>✅ 24/7 Support</span>
            <span>✅ Easy Integration</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827',
        color: 'white',
        padding: '64px 24px 32px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '22px' }}>🤟</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>ASL Bridge</h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.95rem', margin: 0 }}>Medical Translation</p>
              </div>
            </div>
            <p style={{ color: '#d1d5db', lineHeight: '1.7' }}>
              Leading the future of healthcare communication through innovative 
              ASL translation technology, making medical care accessible to all.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '18px' }}>Services</h4>
            <div>
              {['Hospital Integration', 'Emergency Services', 'Clinical Support', 'Pharmacy Services'].map((service) => (
                <a key={service} href="#" style={{
                  display: 'block',
                  color: '#d1d5db',
                  textDecoration: 'none',
                  marginBottom: '10px',
                  fontSize: '1rem'
                }}>{service}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '18px' }}>Support</h4>
            <div>
              {['Help Center', 'Training Resources', 'Documentation', 'Contact Support'].map((item) => (
                <a key={item} href="#" style={{
                  display: 'block',
                  color: '#d1d5db',
                  textDecoration: 'none',
                  marginBottom: '10px',
                  fontSize: '1rem'
                }}>{item}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '18px' }}>Contact</h4>
            <div style={{ color: '#d1d5db', fontSize: '1rem', marginBottom: '12px' }}>
              <p>📧 support@aslbridge.com</p>
              <p>📞 1-800-ASL-HELP</p>
              <p>🚨 24/7 Emergency Support</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              {['📘', '🐦', '💼', '📸'].map((emoji, index) => (
                <a key={index} href="#" style={{
                  width: '36px',
                  height: '36px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  color: 'white',
                  textDecoration: 'none'
                }}>{emoji}</a>
              ))}
            </div>
          </div>
        </div>
        <div style={{
          borderTop: '1px solid #1e293b',
          marginTop: '40px',
          paddingTop: '24px',
          textAlign: 'center',
          color: '#a1a1aa',
          fontSize: '1rem'
        }}>
          &copy; 2025 ASL Bridge. All rights reserved. HIPAA Compliant Healthcare Technology.
        </div>
      </footer>
    </div>
  );
}

export default Landing;