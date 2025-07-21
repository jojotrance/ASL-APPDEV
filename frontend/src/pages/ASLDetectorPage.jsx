import React, { useState } from 'react';
import ASLDetector from '../components/ASLDetector';

function ASLDetectorPage() {
  const [detectedSigns, setDetectedSigns] = useState([]);
  const [currentSign, setCurrentSign] = useState('');
  const [currentConfidence, setCurrentConfidence] = useState(0);

  const handleSignDetected = (sign) => {
    console.log('Sign detected in page:', sign); // Debug log
    setCurrentSign(sign);
    
    // Add to history if it's a new sign or different from the last one
    setDetectedSigns(prev => {
      const lastSign = prev[prev.length - 1];
      if (!lastSign || lastSign.sign !== sign) {
        const newSign = {
          sign: sign,
          timestamp: new Date().toLocaleTimeString(),
          confidence: currentConfidence
        };
        return [...prev.slice(-9), newSign]; // Keep last 10 signs
      }
      return prev;
    });
  };

  const handleConfidenceChange = (confidence) => {
    console.log('Confidence changed in page:', confidence); // Debug log
    setCurrentConfidence(confidence);
  };

  const clearHistory = () => {
    setDetectedSigns([]);
    setCurrentSign('');
    setCurrentConfidence(0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
            🤟 ASL Sign Detector
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            Real-time American Sign Language Detection
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Camera Feed */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <ASLDetector 
              onSignDetected={handleSignDetected}
              onConfidenceChange={handleConfidenceChange}
            />
          </div>

          {/* Detection Display */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Current Detection */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0',
                color: '#333',
                fontSize: '18px'
              }}>
                Current Detection
              </h3>
              
              {currentSign ? (
                <div>
                  <div style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#4caf50',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                  }}>
                    {currentSign}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: '#666'
                  }}>
                    Confidence: {currentConfidence}%
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    marginTop: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${currentConfidence}%`,
                      height: '100%',
                      background: currentConfidence > 70 ? '#4caf50' : 
                                  currentConfidence > 40 ? '#ff9800' : '#f44336',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: '24px',
                  color: '#999',
                  padding: '20px'
                }}>
                  Show a sign to detect
                </div>
              )}
            </div>

            {/* Detection History */}
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              maxHeight: '400px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h3 style={{ 
                  margin: '0',
                  color: '#333',
                  fontSize: '18px'
                }}>
                  Detection History
                </h3>
                {detectedSigns.length > 0 && (
                  <button
                    onClick={clearHistory}
                    style={{
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {detectedSigns.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#999',
                    padding: '20px',
                    fontSize: '14px'
                  }}>
                    No signs detected yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detectedSigns.slice().reverse().map((detection, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#f5f5f5',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <div style={{
                          fontWeight: 'bold',
                          color: '#333',
                          textTransform: 'uppercase'
                        }}>
                          {detection.sign}
                        </div>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          <div>{detection.confidence}%</div>
                          <div>{detection.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ASLDetectorPage;
