import React, { useState } from 'react';
import WebcamHandTracker from '../components/WebcamHandTracker.jsx';

function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [confidence, setConfidence] = useState(0);

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">👋</span>
            ASL Translator
          </h1>
          <p className="app-subtitle">American Sign Language Recognition</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="camera-section">
          <div className="camera-container">
            <div className="camera-header">
              <h2>Live Camera Feed</h2>
              <div className="status-indicator">
                <div className={`status-dot ${isRecording ? 'recording' : 'standby'}`}></div>
                <span className="status-text">
                  {isRecording ? 'Recording' : 'Ready'}
                </span>
              </div>
            </div>
            
            <div className="camera-wrapper">
              <WebcamHandTracker />
              <div className="camera-overlay">
                <div className="detection-frame"></div>
                <div className="hand-indicators">
                  <div className="hand-indicator left-hand">
                    <div className="hand-icon">✋</div>
                    <span>Left Hand</span>
                    <div className="detection-status detected">Detected</div>
                  </div>
                  <div className="hand-indicator right-hand">
                    <div className="hand-icon">🤚</div>
                    <span>Right Hand</span>
                    <div className="detection-status not-detected">Not Detected</div>
                  </div>
                </div>
                <div className="fps-counter">
                  <span>FPS: 30</span>
                </div>
                <div className="recording-timer" style={{ display: isRecording ? 'block' : 'none' }}>
                  <div className="timer-dot"></div>
                  <span>00:45</span>
                </div>
              </div>
            </div>

            <div className="camera-info">
              <div className="info-item">
                <div className="info-icon">📹</div>
                <div className="info-content">
                  <span className="info-label">Resolution</span>
                  <span className="info-value">1280x720</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">🎯</div>
                <div className="info-content">
                  <span className="info-label">Detection</span>
                  <span className="info-value">Active</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">⚡</div>
                <div className="info-content">
                  <span className="info-label">Performance</span>
                  <span className="info-value">Optimal</span>
                </div>
              </div>
            </div>

            <div className="camera-controls">
              <button 
                className={`control-btn ${isRecording ? 'stop-btn' : 'start-btn'}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <>
                    <span className="btn-icon">⏹️</span>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <span className="btn-icon">▶️</span>
                    Start Recording
                  </>
                )}
              </button>
              <button className="control-btn secondary-btn">
                <span className="btn-icon">📷</span>
                Capture
              </button>
              <button className="control-btn secondary-btn">
                <span className="btn-icon">⚙️</span>
                Settings
              </button>
            </div>
          </div>

          {/* Quick Actions - moved below camera */}
          <div className="quick-actions-container">
            <div className="quick-actions-header">
              <h3>Quick Actions</h3>
              <div className="quick-actions-icon">⚡</div>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn">
                <div className="qa-icon">📚</div>
                <span>Learn ASL</span>
              </button>
              <button className="quick-action-btn">
                <div className="qa-icon">🎯</div>
                <span>Practice Mode</span>
              </button>
              <button className="quick-action-btn">
                <div className="qa-icon">📝</div>
                <span>Save Session</span>
              </button>
              <button className="quick-action-btn">
                <div className="qa-icon">📤</div>
                <span>Export Data</span>
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
                    style={{ width: `${confidence}%` }}
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
                {translatedText || 'Position your hands in the camera view and start signing...'}
              </div>
              <div className="translation-actions">
                <button className="action-btn copy-btn">
                  <span className="btn-icon">📋</span>
                  Copy
                </button>
                <button className="action-btn speak-btn">
                  <span className="btn-icon">🔊</span>
                  Speak
                </button>
                <button className="action-btn clear-btn">
                  <span className="btn-icon">🗑️</span>
                  Clear
                </button>
              </div>
            </div>

            <div className="translation-history">
              <div className="history-header">
                <h3>Recent Translations</h3>
                <button className="clear-history-btn">Clear All</button>
              </div>
              <div className="history-list">
                <div className="history-item">
                  <div className="history-content">
                    <span className="history-text">Hello</span>
                    <div className="history-meta">
                      <span className="accuracy-badge high">95%</span>
                      <span className="history-time">2 min ago</span>
                    </div>
                  </div>
                  <button className="replay-btn">↻</button>
                </div>
                <div className="history-item">
                  <div className="history-content">
                    <span className="history-text">Thank you</span>
                    <div className="history-meta">
                      <span className="accuracy-badge medium">87%</span>
                      <span className="history-time">5 min ago</span>
                    </div>
                  </div>
                  <button className="replay-btn">↻</button>
                </div>
                <div className="history-item">
                  <div className="history-content">
                    <span className="history-text">Good morning</span>
                    <div className="history-meta">
                      <span className="accuracy-badge high">92%</span>
                      <span className="history-time">8 min ago</span>
                    </div>
                  </div>
                  <button className="replay-btn">↻</button>
                </div>
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
                <div className="stat-number">47</div>
                <div className="stat-label">Signs Detected</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">89%</div>
                <div className="stat-label">Avg Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">12m</div>
                <div className="stat-label">Session Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">2.1s</div>
                <div className="stat-label">Avg Response</div>
              </div>
            </div>
            <div className="progress-section">
              <div className="progress-header">
                <span>Learning Progress</span>
                <span>Level 3</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '68%' }}></div>
              </div>
              <div className="progress-text">68% to next level</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
