import React, { useState } from 'react';

function Alphabet() {
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);

  const alphabetSigns = [
    { letter: 'A', description: 'Make a fist with thumb pointing up along the side', difficulty: 'Easy' },
    { letter: 'B', description: 'Flat hand with fingers together pointing up, thumb across palm', difficulty: 'Easy' },
    { letter: 'C', description: 'Curved hand like holding a cup, thumb and fingers form a C shape', difficulty: 'Easy' },
    { letter: 'D', description: 'Index finger pointing up, other fingers touch thumb forming a circle', difficulty: 'Medium' },
    { letter: 'E', description: 'Bent fingers touching thumb, all fingertips touch thumb tip', difficulty: 'Medium' },
    { letter: 'F', description: 'Index finger and thumb touch in a circle, other fingers point up', difficulty: 'Medium' },
    { letter: 'G', description: 'Index finger and thumb pointing sideways, like pointing a gun', difficulty: 'Hard' },
    { letter: 'H', description: 'Index and middle finger extended sideways, other fingers folded', difficulty: 'Medium' },
    { letter: 'I', description: 'Pinky finger extended up, other fingers in fist with thumb', difficulty: 'Easy' },
    { letter: 'J', description: 'Pinky finger extended, make a J motion in the air', difficulty: 'Hard' },
    { letter: 'K', description: 'Index and middle finger up in V, thumb touches middle finger', difficulty: 'Hard' },
    { letter: 'L', description: 'Index finger up, thumb out to side, forming L shape', difficulty: 'Easy' },
    { letter: 'M', description: 'Thumb under first three fingers, pinky folded down', difficulty: 'Medium' },
    { letter: 'N', description: 'Thumb under first two fingers, other fingers folded', difficulty: 'Medium' },
    { letter: 'O', description: 'All fingers curved to form circle shape, like holding a ball', difficulty: 'Easy' },
    { letter: 'P', description: 'Like K but pointing downward, middle finger touches thumb', difficulty: 'Hard' },
    { letter: 'Q', description: 'Like G but pointing downward, index and thumb point down', difficulty: 'Hard' },
    { letter: 'R', description: 'Index and middle finger crossed, other fingers in fist', difficulty: 'Medium' },
    { letter: 'S', description: 'Fist with thumb across fingers, thumb covers fingernails', difficulty: 'Easy' },
    { letter: 'T', description: 'Thumb between index and middle finger, fist closed', difficulty: 'Medium' },
    { letter: 'U', description: 'Index and middle finger up together, other fingers folded', difficulty: 'Easy' },
    { letter: 'V', description: 'Index and middle finger up in V shape, separated', difficulty: 'Easy' },
    { letter: 'W', description: 'Index, middle, and ring finger up, like three fingers', difficulty: 'Medium' },
    { letter: 'X', description: 'Index finger crooked/bent, other fingers in fist', difficulty: 'Medium' },
    { letter: 'Y', description: 'Thumb and pinky extended, other fingers folded (hang loose)', difficulty: 'Easy' },
    { letter: 'Z', description: 'Index finger extended, trace Z shape in the air', difficulty: 'Hard' }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Hard': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  return (
    <div className="alphabet-container">
      {/* Header */}
      <header className="alphabet-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🔤</span>
            Learn ASL Alphabet
          </h1>
          <p className="page-subtitle">Master all 26 letters of the American Sign Language alphabet</p>
          
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-number">26</span>
              <span className="stat-label">Letters</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">8</span>
              <span className="stat-label">Easy</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">12</span>
              <span className="stat-label">Medium</span>
            </div>
            <div className="stat-badge">
              <span className="stat-number">6</span>
              <span className="stat-label">Hard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="alphabet-content">
        {/* Controls */}
        <div className="alphabet-controls">
          <div className="mode-toggle">
            <button 
              className={`toggle-btn ${!practiceMode ? 'active' : ''}`}
              onClick={() => setPracticeMode(false)}
            >
              📖 Learn Mode
            </button>
            <button 
              className={`toggle-btn ${practiceMode ? 'active' : ''}`}
              onClick={() => setPracticeMode(true)}
            >
              🎯 Practice Mode
            </button>
          </div>
          
          <div className="view-options">
            <button className="option-btn">
              <span className="btn-icon">🔀</span>
              Shuffle
            </button>
            <button className="option-btn">
              <span className="btn-icon">📊</span>
              Progress
            </button>
            <button className="option-btn">
              <span className="btn-icon">🎮</span>
              Quiz
            </button>
          </div>
        </div>

        {/* Alphabet Grid */}
        <div className="alphabet-section">
          <div className="section-title">
            <h2>ASL Alphabet</h2>
            <p>Click on any letter to learn how to sign it</p>
          </div>
          
          <div className="alphabet-grid">
            {alphabetSigns.map((sign, index) => (
              <div
                key={sign.letter}
                className={`letter-card ${selectedLetter === index ? 'selected' : ''}`}
                onClick={() => setSelectedLetter(index)}
              >
                <div className="letter-visual">
                  <div className="hand-illustration">
                    <div className="hand-placeholder">
                      <span className="hand-icon">✋</span>
                    </div>
                  </div>
                  <div 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(sign.difficulty) }}
                  >
                    {getDifficultyIcon(sign.difficulty)}
                  </div>
                </div>
                
                <div className="letter-info">
                  <div className="letter-label">
                    <span className="letter-text">{sign.letter}</span>
                  </div>
                  <div className="letter-name">Letter {sign.letter}</div>
                </div>
                
                <div className="card-overlay">
                  <div className="overlay-content">
                    <span className="play-icon">▶️</span>
                    <span>Learn {sign.letter}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedLetter !== null && (
          <div className="detail-panel">
            <div className="detail-content">
              <div className="detail-header">
                <div className="letter-detail-info">
                  <h3>Letter {alphabetSigns[selectedLetter].letter}</h3>
                  <div 
                    className="difficulty-indicator"
                    style={{ color: getDifficultyColor(alphabetSigns[selectedLetter].difficulty) }}
                  >
                    {getDifficultyIcon(alphabetSigns[selectedLetter].difficulty)} {alphabetSigns[selectedLetter].difficulty}
                  </div>
                </div>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedLetter(null)}
                >
                  ✕
                </button>
              </div>

              <div className="detail-body">
                <div className="video-section">
                  <div className="video-placeholder">
                    <div className="large-hand-demo">
                      <span className="demo-hand">✋</span>
                      <div className="letter-overlay">{alphabetSigns[selectedLetter].letter}</div>
                    </div>
                    <button className="play-video-btn">
                      <span className="play-icon">▶️</span>
                      Watch Demonstration
                    </button>
                  </div>
                </div>

                <div className="instruction-section">
                  <h4>How to sign "{alphabetSigns[selectedLetter].letter}":</h4>
                  <p className="instruction-text">
                    {alphabetSigns[selectedLetter].description}
                  </p>
                  
                  <div className="tips-section">
                    <h5>💡 Tips for success:</h5>
                    <ul>
                      <li>Keep your hand steady and in clear view</li>
                      <li>Practice the shape slowly before speeding up</li>
                      <li>Use a mirror to check your hand position</li>
                      <li>Hold the position for 2-3 seconds when practicing</li>
                    </ul>
                  </div>

                  <div className="action-buttons">
                    <button className="action-btn primary">
                      <span className="btn-icon">📹</span>
                      Practice with Camera
                    </button>
                    <button className="action-btn secondary">
                      <span className="btn-icon">🔄</span>
                      Repeat Demo
                    </button>
                    <button className="action-btn secondary">
                      <span className="btn-icon">✅</span>
                      Mark as Learned
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        <div className="progress-summary">
          <div className="summary-card">
            <h3>Your Progress</h3>
            <div className="progress-stats">
              <div className="progress-item">
                <div className="progress-circle">
                  <svg className="progress-ring" width="60" height="60">
                    <circle
                      className="progress-ring-circle"
                      stroke="#E3F2FD"
                      strokeWidth="4"
                      fill="transparent"
                      r="26"
                      cx="30"
                      cy="30"
                    />
                    <circle
                      className="progress-ring-circle"
                      stroke="#2196F3"
                      strokeWidth="4"
                      fill="transparent"
                      r="26"
                      cx="30"
                      cy="30"
                      strokeDasharray={`${(18/26) * 163.36} 163.36`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="progress-text">18/26</div>
                </div>
                <span className="progress-label">Letters Learned</span>
              </div>
              
              <div className="achievement-badges">
                <div className="badge earned">🏆 First Letter</div>
                <div className="badge earned">🔥 5 Day Streak</div>
                <div className="badge">⭐ Half Alphabet</div>
                <div className="badge">🎯 Perfect Score</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Alphabet;
