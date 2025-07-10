import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Learn() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('numbers');
  const [selectedSign, setSelectedSign] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);

  const categories = [
    { id: 'alphabet', name: 'Alphabet', icon: '🔤', description: 'Learn the ASL alphabet' },
    { id: 'numbers', name: 'Numbers', icon: '🔢', description: 'Learn numbers 0-100' },
    { id: 'greetings', name: 'Greetings', icon: '👋', description: 'Common greetings and polite expressions' }
  ];

  const alphabetSigns = [
    { letter: 'A', description: 'Make a fist with thumb pointing up', difficulty: 'Easy' },
    { letter: 'B', description: 'Flat hand with fingers together, thumb across palm', difficulty: 'Easy' },
    { letter: 'C', description: 'Curved hand like holding a cup', difficulty: 'Easy' },
    { letter: 'D', description: 'Index finger up, other fingers touch thumb', difficulty: 'Medium' },
    { letter: 'E', description: 'Bent fingers touching thumb', difficulty: 'Medium' },
    { letter: 'F', description: 'Index and thumb touch, other fingers up', difficulty: 'Medium' },
    { letter: 'G', description: 'Index finger and thumb pointing sideways', difficulty: 'Hard' },
    { letter: 'H', description: 'Index and middle finger sideways', difficulty: 'Medium' }
  ];

  const greetingSigns = [
    { word: 'Hello', description: 'Open hand moving away from forehead', difficulty: 'Easy' },
    { word: 'Thank you', description: 'Flat hand moves from chin outward', difficulty: 'Easy' },
    { word: 'Please', description: 'Flat hand circles on chest', difficulty: 'Medium' },
    { word: 'Sorry', description: 'Fist circles on chest', difficulty: 'Medium' },
    { word: 'Good morning', description: 'Combine "good" and "morning" signs', difficulty: 'Hard' },
    { word: 'How are you?', description: 'Series of hand movements', difficulty: 'Hard' }
  ];

  const numberSigns = [
    { number: '0', description: 'Make an O shape with thumb and fingers', difficulty: 'Easy' },
    { number: '1', description: 'Index finger pointing up', difficulty: 'Easy' },
    { number: '2', description: 'Index and middle finger up (peace sign)', difficulty: 'Easy' },
    { number: '3', description: 'Thumb, index, and middle finger up', difficulty: 'Easy' },
    { number: '4', description: 'Four fingers up, thumb tucked', difficulty: 'Easy' },
    { number: '5', description: 'Open hand, all fingers extended', difficulty: 'Easy' },
    { number: '6', description: 'Thumb touches pinky, other fingers up', difficulty: 'Medium' },
    { number: '7', description: 'Thumb touches ring finger, others up', difficulty: 'Medium' },
    { number: '8', description: 'Thumb touches middle finger, others up', difficulty: 'Medium' },
    { number: '9', description: 'Thumb touches index finger, others up', difficulty: 'Medium' }
  ];

  const getCurrentSigns = () => {
    switch (selectedCategory) {
      case 'numbers':
        return numberSigns.map(sign => ({ ...sign, name: sign.number }));
      case 'greetings':
        return greetingSigns.map(sign => ({ ...sign, name: sign.word }));
      default:
        return numberSigns.map(sign => ({ ...sign, name: sign.number }));
    }
  };

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'alphabet') {
      navigate('/alphabet');
    } else {
      setSelectedCategory(categoryId);
      setSelectedSign(null); // Reset selection when changing category
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <div className="learn-container">
      {/* Header */}
      <header className="learn-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📚</span>
            Learn ASL
          </h1>
          <p className="page-subtitle">Master American Sign Language step by step</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="learn-content">
        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2>Learning Categories</h2>
            <div className="progress-indicator">
              <span>Progress: 45%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="categories-grid">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <div className="category-stats">
                  <span className="completed">8/12 Complete</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Learning Content */}
        <div className="learning-layout">
          {/* Signs List */}
          <section className="signs-section">
            <div className="section-header">
              <h2>
                {categories.find(cat => cat.id === selectedCategory)?.name} Signs
              </h2>
              <div className="view-controls">
                <button 
                  className={`view-btn ${!practiceMode ? 'active' : ''}`}
                  onClick={() => setPracticeMode(false)}
                >
                  📖 Learn
                </button>
                <button 
                  className={`view-btn ${practiceMode ? 'active' : ''}`}
                  onClick={() => setPracticeMode(true)}
                >
                  🎯 Practice
                </button>
              </div>
            </div>

            <div className="signs-grid">
              {getCurrentSigns().map((sign, index) => (
                <div
                  key={index}
                  className={`sign-card ${selectedSign === index ? 'selected' : ''}`}
                  onClick={() => setSelectedSign(index)}
                >
                  <div className="sign-visual">
                    <div className="sign-placeholder">
                      <span className="sign-letter">{sign.name}</span>
                    </div>
                    <div 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(sign.difficulty) }}
                    >
                      {sign.difficulty}
                    </div>
                  </div>
                  <div className="sign-info">
                    <h4>{sign.name}</h4>
                    <p>{sign.description}</p>
                  </div>
                  <div className="sign-actions">
                    <button className="action-btn practice-btn">
                      <span className="btn-icon">▶️</span>
                      Practice
                    </button>
                    <button className="action-btn favorite-btn">
                      <span className="btn-icon">⭐</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Detail Panel */}
          <section className="detail-section">
            {selectedSign !== null ? (
              <div className="sign-detail">
                <div className="detail-header">
                  <h3>Learning: {getCurrentSigns()[selectedSign]?.name}</h3>
                  <div 
                    className="difficulty-indicator"
                    style={{ color: getDifficultyColor(getCurrentSigns()[selectedSign]?.difficulty) }}
                  >
                    {getCurrentSigns()[selectedSign]?.difficulty} Level
                  </div>
                </div>

                <div className="detail-content">
                  <div className="video-placeholder">
                    <div className="video-container">
                      <span className="video-icon">🎥</span>
                      <p>Video demonstration</p>
                      <button className="play-btn">
                        <span>▶️</span> Play Video
                      </button>
                    </div>
                  </div>

                  <div className="instructions">
                    <h4>How to sign:</h4>
                    <p>{getCurrentSigns()[selectedSign]?.description}</p>
                    
                    <div className="tips">
                      <h5>💡 Tips:</h5>
                      <ul>
                        <li>Keep your hand steady and clear</li>
                        <li>Practice slowly at first</li>
                        <li>Watch your hand position in the mirror</li>
                        <li>Repeat 5-10 times for muscle memory</li>
                      </ul>
                    </div>
                  </div>

                  <div className="practice-controls">
                    <button className="control-btn primary">
                      <span className="btn-icon">📷</span>
                      Practice with Camera
                    </button>
                    <button className="control-btn secondary">
                      <span className="btn-icon">🔄</span>
                      Repeat Video
                    </button>
                    <button className="control-btn secondary">
                      <span className="btn-icon">✅</span>
                      Mark as Learned
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <div className="placeholder-content">
                  <span className="placeholder-icon">👈</span>
                  <h3>Select a sign to learn</h3>
                  <p>Choose a sign from the list to see detailed instructions and video demonstrations.</p>
                </div>
              </div>
            )}

            {/* Learning Stats */}
            <div className="learning-stats">
              <h4>Your Progress</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">47</span>
                  <span className="stat-label">Signs Learned</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">12</span>
                  <span className="stat-label">Days Streak</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">89%</span>
                  <span className="stat-label">Accuracy</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Learn;
