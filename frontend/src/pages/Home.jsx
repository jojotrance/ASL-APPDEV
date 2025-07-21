import React, { useState, useEffect } from 'react';
import WebcamHandTracker from '../components/WebcamHandTracker.jsx';

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

// Handle sign detection from webcam
const handleSignDetected = (detectedWord) => {
  setCurrentSign(detectedWord);
  setTranslatedText(detectedWord);
  
  // Add to history if it's a new detection
  const timestamp = new Date().toLocaleTimeString();
  setDetectionHistory(prev => {
    const newHistory = [...prev];
    
    // Only add if it's different from the last detection
    if (newHistory.length === 0 || newHistory[0].text !== detectedWord) {
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

  // Handle confidence updates
  const handleConfidenceChange = (newConfidence) => {
    setConfidence(newConfidence);
  };

  // Handle camera info updates
  const handleCameraInfo = (info) => {
    setCameraInfo(prev => ({
      ...prev,
      ...info
    }));
  };

  // Handle hands detection status
  const handleHandsDetected = (handsInfo) => {
    setSessionStats(prev => ({
      ...prev,
      handsDetected: handsInfo
    }));
  };

  // Load trained signs count
  useEffect(() => {
    const loadTrainedSignsCount = async () => {
      try {
        const response = await fetch('/api/v1/signs/training-data');
        if (response.ok) {
          const data = await response.json();
          setTrainedSignsCount(data.length);
        }
      } catch (error) {
        console.error('Error loading trained signs count:', error);
      }
    };
    
    loadTrainedSignsCount();
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
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">👋</span>
            ASL Translator
          </h1>
          <p className="app-subtitle">
            American Sign Language Recognition • {trainedSignsCount} Signs Trained
          </p>
        </div>
      </header>

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
              <WebcamHandTracker 
                onSignDetected={handleSignDetected}
                onConfidenceChange={handleConfidenceChange}
                onCameraInfo={handleCameraInfo}
                onHandsDetected={handleHandsDetected}
              />
              <div className="camera-overlay">
                <div className="detection-frame"></div>
                <div className="hand-indicators">
                  <div className="hand-indicator left-hand">
                    <div className="hand-icon">✋</div>
                    <span>Left Hand</span>
                    <div className={`detection-status ${sessionStats.handsDetected.left ? 'detected' : 'not-detected'}`}>
                      {sessionStats.handsDetected.left ? 'Detected' : 'Not Detected'}
                    </div>
                  </div>
                  <div className="hand-indicator right-hand">
                    <div className="hand-icon">🤚</div>
                    <span>Right Hand</span>
                    <div className={`detection-status ${sessionStats.handsDetected.right ? 'detected' : 'not-detected'}`}>
                      {sessionStats.handsDetected.right ? 'Detected' : 'Not Detected'}
                    </div>
                  </div>
                </div>
                <div className="fps-counter">
                  <span>FPS: {cameraInfo.fps}</span>
                </div>
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
            </div>

            <div className="camera-info">
              <div className="info-item">
                <div className="info-icon">📹</div>
                <div className="info-content">
                  <span className="info-label">Resolution</span>
                  <span className="info-value">{cameraInfo.resolution}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🎯</div>
                <div className="info-content">
                  <span className="info-label">Detection</span>
                  <span className="info-value">{getDetectionStatus()}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">⚡</div>
                <div className="info-content">
                  <span className="info-label">Confidence</span>
                  <span className="info-value">{confidence}%</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">📊</div>
                <div className="info-content">
                  <span className="info-label">Detections</span>
                  <span className="info-value">{sessionStats.totalDetections}</span>
                </div>
              </div>
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

          {/* Quick Actions */}
          <div className="quick-actions-container">
            <div className="quick-actions-header">
              <h3>Quick Actions</h3>
              <div className="quick-actions-icon">⚡</div>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => window.location.href = '/learn'}>
                <div className="qa-icon">📚</div>
                <span>Learn ASL</span>
              </button>
              <button className="quick-action-btn" onClick={() => window.location.href = '/sign-recorder'}>
                <div className="qa-icon">🎯</div>
                <span>Record Signs</span>
              </button>
              <button className="quick-action-btn" onClick={() => window.location.href = '/model-trainer'}>
                <div className="qa-icon">📝</div>
                <span>Train Model</span>
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
                  <span>Live Translation</span>
                </div>
                <div className="language-badges">
                  <span className="language-badge from">ASL</span>
                  <div className="arrow-icon">→</div>
                  <span className="language-badge to">English</span>
                </div>
              </div>
              <div className="output-text">
                {translatedText || (trainedSignsCount > 0 ? 
                  'Position your hands in the camera view and start signing...' : 
                  'No trained signs found. Please record and train some signs first.'
                )}
              </div>
              <div className="translation-actions">
                <button 
                  className="action-btn clear-btn"
                  onClick={clearTranslation}
                  disabled={!translatedText}
                >
                  <span className="btn-icon">🗑️</span>
                  Clear
                </button>
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

          {/* Stats Panel */}
          <div className="stats-container">
            <div className="stats-header">
              <h3>Session Statistics</h3>
              <div className="stats-icon">📊</div>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{sessionStats.totalDetections}</div>
                <div className="stat-label">Signs Detected</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{confidence}%</div>
                <div className="stat-label">Current Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{trainedSignsCount}</div>
                <div className="stat-label">Trained Signs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{cameraInfo.fps || 0}</div>
                <div className="stat-label">FPS</div>
              </div>
            </div>
            <div className="progress-section">
              <div className="progress-header">
                <span>Recognition Progress</span>
                <span>{cameraInfo.status}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, confidence)}%`,
                    backgroundColor: confidence > 85 ? '#4caf50' : confidence > 70 ? '#ff9800' : '#f44336'
                  }}
                ></div>
              </div>
              <div className="progress-text">{confidence}% confidence</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;