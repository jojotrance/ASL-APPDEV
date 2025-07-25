import React, { useState, useEffect } from 'react';
import SimpleHandTracker from '../components/SimpleHandTracker.jsx';

function Home() {
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [currentSign, setCurrentSign] = useState('');
  const [sessionStats, setSessionStats] = useState({
    startTime: Date.now(),
    totalDetections: 0,
    handsDetected: { left: false, right: false }
  });
  const [cameraInfo, setCameraInfo] = useState({
    resolution: 'Unknown',
    fps: 0,
    status: 'Initializing'
  });
  const [trainedSignsCount, setTrainedSignsCount] = useState(0);
  const [trainedSigns, setTrainedSigns] = useState([]); // Store the actual trained signs

  // Handle sign prediction from SimpleHandTracker
  const handlePrediction = (detectedWord, confidence) => {
    console.log(`🎯 Home.jsx received prediction: "${detectedWord}" with confidence: ${confidence}%`);
    
    setCurrentSign(detectedWord);
    setTranslatedText(detectedWord);
    setConfidence(confidence);
    
    // Add to history if it's a new detection
    const timestamp = new Date().toLocaleTimeString();
    setDetectionHistory(prev => {
      const newHistory = [...prev];
      
      // Only add if it's different from the last detection or confidence changed significantly
      if (newHistory.length === 0 || 
          newHistory[0].text !== detectedWord || 
          Math.abs(newHistory[0].confidence - confidence) > 10) {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        newHistory.unshift({
          text: detectedWord,
          confidence: confidence,
          timestamp: timestamp,
          id: uniqueId
        });
        
        // Update session stats
        setSessionStats(prevStats => ({
          ...prevStats,
          totalDetections: prevStats.totalDetections + 1
        }));
        
        // Keep only last 10 detections
        return newHistory.slice(0, 10);
      }
      
      return newHistory;
    });
  };

  // Handle confidence updates (called by SimpleHandTracker)
  const handleConfidenceChange = (newConfidence) => {
    setConfidence(newConfidence);
  };

  // Handle hands detection status
  const handleHandsDetected = (handsInfo) => {
    setSessionStats(prev => ({
      ...prev,
      handsDetected: handsInfo
    }));
  };

  // Load trained signs count for display
  useEffect(() => {
    const loadTrainedSigns = async () => {
      try {
        console.log('🔄 Loading trained signs from database...');
        
        const response = await fetch('/api/v1/signs');
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Loaded trained signs:', data);
          
          if (Array.isArray(data)) {
            setTrainedSigns(data);
            setTrainedSignsCount(data.length);
            console.log(`✅ Found ${data.length} trained signs for recognition`);
            
            // Log the sign names for debugging
            const signNames = data.map(sign => sign.word || sign.label).join(', ');
            console.log(`📝 Available signs: [${signNames}]`);
          } else {
            console.log('⚠️ Unexpected data format:', data);
          }
        } else {
          console.error('❌ Failed to load trained signs:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Error loading trained signs:', error);
      }
    };
    
    loadTrainedSigns();
  }, []);

  // Calculate dynamic statistics
  useEffect(() => {
    if (detectionHistory.length > 0) {
      const avgConf = Math.round(
        detectionHistory.reduce((sum, item) => sum + item.confidence, 0) / detectionHistory.length
      );
      setSessionStats(prev => ({
        ...prev,
        avgConfidence: avgConf
      }));
    }
  }, [detectionHistory]);

  // Clear current translation
  const clearTranslation = () => {
    setTranslatedText('');
    setCurrentSign('');
    setConfidence(0);
  };

  // Clear all history
  const clearHistory = () => {
    setDetectionHistory([]);
    setSessionStats(prev => ({
      ...prev,
      totalDetections: 0
    }));
  };

  // Dynamic status text
  const getStatusText = () => {
    if (currentSign) return `Detected: ${currentSign}`;
    if (sessionStats.handsDetected.left || sessionStats.handsDetected.right) return 'Hands Visible';
    return 'Ready';
  };

  // Dynamic detection status
  const getDetectionStatus = () => {
    if (currentSign) return 'Active';
    if (sessionStats.handsDetected.left || sessionStats.handsDetected.right) return 'Tracking';
    return 'Standby';
  };

  return (
    <div className="home-container">
      {/* Main Content */}
      <main className="main-content">
        <div className="camera-section">
          <div className="camera-container">
            <div className="camera-header">
              <h2>Live Camera Feed</h2>
              <div className="status-indicator">
                <div className={`status-dot ${currentSign ? 'recording' : sessionStats.handsDetected.left || sessionStats.handsDetected.right ? 'tracking' : 'standby'}`}></div>
                <span className="status-text">
                  {getStatusText()}
                </span>
              </div>
            </div>
            
            <div className="camera-wrapper">
              <SimpleHandTracker 
                onHandsDetected={handleHandsDetected}
                onConfidenceChange={handleConfidenceChange}
                onPrediction={handlePrediction}
                mode="recognition"
                trainedSigns={trainedSigns}
              />
              {currentSign && (
                <div className="current-detection" style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px'
                }}>
                  <span className="detected-sign" style={{ fontWeight: 'bold' }}>
                    {currentSign}
                  </span>
                  <span className="detection-confidence" style={{ marginLeft: '10px', opacity: 0.8 }}>
                    {confidence}%
                  </span>
                </div>
              )}
            </div>

            <div className="camera-controls">
              <button 
                className="control-btn secondary-btn"
                onClick={clearTranslation}
                disabled={!translatedText}
              >
                <span className="btn-icon">🗑️</span>
                Clear Translation
              </button>
            </div>
          </div>
        </div>

        <div className="translation-section">
          <div className="translation-container">
            <div className="translation-header">
              <h2>Translation Results</h2>
              <div className="confidence-meter">
                <span className="confidence-label">Accuracy:</span>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ 
                      width: `${confidence}%`,
                      backgroundColor: confidence > 85 ? '#4caf50' : confidence > 70 ? '#ff9800' : '#f44336'
                    }}
                  ></div>
                </div>
                <span className="confidence-value">{confidence}%</span>
              </div>
            </div>
            
            <div className="translation-output">
              <div className="output-header">
                <div className="translation-indicator">
                  <div className={`pulse-dot ${translatedText ? 'active' : ''}`}></div>
                </div>
              </div>
              <div className="output-text">
                {translatedText || (trainedSignsCount > 0 ? 
                  'Position your hands in the camera view and start signing...' : 
                  'No trained signs found. Please record and train some signs first.'
                )}
              </div>
            </div>
            
            <div className="translation-history">
              <div className="history-header">
                <h3>Recent Translations ({detectionHistory.length})</h3>
                <button 
                  className="clear-history-btn"
                  onClick={clearHistory}
                  disabled={detectionHistory.length === 0}
                >
                  Clear All
                </button>
              </div>
              <div className="history-list">
                {detectionHistory.length > 0 ? (
                  detectionHistory.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-content">
                        <span className="history-text">{item.text}</span>
                        <div className="history-meta">
                          <span className={`accuracy-badge ${item.confidence > 85 ? 'high' : item.confidence > 70 ? 'medium' : 'low'}`}>
                            {item.confidence}%
                          </span>
                          <span className="history-time">{item.timestamp}</span>
                        </div>
                      </div>
                      <button 
                        className="replay-btn"
                        onClick={() => setTranslatedText(item.text)}
                      >
                        ↻
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-history" style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#666',
                    fontStyle: 'italic'
                  }}>
                    <p>
                      {trainedSignsCount > 0 ? 
                        'No translations yet. Start signing to see results!' :
                        'Train some signs first to begin translation.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;