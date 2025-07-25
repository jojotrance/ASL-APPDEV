import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamHandTracker from '../components/WebcamHandTracker.jsx';

function Learn() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('alphabet');
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceResult, setPracticeResult] = useState(null);
  const [currentLetterPractice, setCurrentLetterPractice] = useState(null);
  const videoRef = useRef(null);
  const [countdown, setCountdown] = useState(null);

  // Learning data for all categories
  const alphabetData = [
    { letter: 'A', videoUrl: '/alphabet-videos/A.mp4', description: 'Make a fist with your thumb to the side', difficulty: 'Easy' },
    { letter: 'B', videoUrl: '/alphabet-videos/B.mp4', description: 'Four fingers straight up, thumb tucked', difficulty: 'Easy' },
    { letter: 'C', videoUrl: '/alphabet-videos/C.mp4', description: 'Shape your hand like the letter C', difficulty: 'Easy' },
    { letter: 'D', videoUrl: '/alphabet-videos/D.mp4', description: 'Point finger up, touch thumb to other fingers', difficulty: 'Easy' },
    { letter: 'E', videoUrl: '/alphabet-videos/E.mp4', description: 'Curl all fingertips to touch thumb', difficulty: 'Medium' },
    { letter: 'F', videoUrl: '/alphabet-videos/F.mp4', description: 'OK sign with index and thumb circle', difficulty: 'Medium' },
    { letter: 'G', videoUrl: '/alphabet-videos/G.mp4', description: 'Point index finger sideways, thumb up', difficulty: 'Easy' },
    { letter: 'H', videoUrl: '/alphabet-videos/H.mp4', description: 'Two fingers pointing sideways', difficulty: 'Easy' },
    { letter: 'I', videoUrl: '/alphabet-videos/I.mp4', description: 'Pinky finger up, other fingers down', difficulty: 'Easy' },
    { letter: 'J', videoUrl: '/alphabet-videos/J.mp4', description: 'Pinky up, draw a J in the air', difficulty: 'Hard' },
    { letter: 'K', videoUrl: '/alphabet-videos/K.mp4', description: 'Index and middle up, thumb between them', difficulty: 'Medium' },
    { letter: 'L', videoUrl: '/alphabet-videos/L.mp4', description: 'Thumb and index finger form L shape', difficulty: 'Easy' },
    { letter: 'M', videoUrl: '/alphabet-videos/M.mp4', description: 'Thumb under three fingers', difficulty: 'Medium' },
    { letter: 'N', videoUrl: '/alphabet-videos/N.mp4', description: 'Thumb under two fingers', difficulty: 'Medium' },
    { letter: 'O', videoUrl: '/alphabet-videos/O.mp4', description: 'All fingers and thumb form O shape', difficulty: 'Easy' },
    { letter: 'P', videoUrl: '/alphabet-videos/P.mp4', description: 'Like K but pointing down', difficulty: 'Medium' },
    { letter: 'Q', videoUrl: '/alphabet-videos/Q.mp4', description: 'Like G but thumb and finger pointing down', difficulty: 'Medium' },
    { letter: 'R', videoUrl: '/alphabet-videos/R.mp4', description: 'Cross index and middle fingers', difficulty: 'Easy' },
    { letter: 'S', videoUrl: '/alphabet-videos/S.mp4', description: 'Make a fist with thumb across fingers', difficulty: 'Easy' },
    { letter: 'T', videoUrl: '/alphabet-videos/T.mp4', description: 'Thumb between index and middle finger', difficulty: 'Medium' },
    { letter: 'U', videoUrl: '/alphabet-videos/U.mp4', description: 'Index and middle fingers up together', difficulty: 'Easy' },
    { letter: 'V', videoUrl: '/alphabet-videos/V.mp4', description: 'Index and middle fingers up in V shape', difficulty: 'Easy' },
    { letter: 'W', videoUrl: '/alphabet-videos/W.mp4', description: 'Index, middle, and ring fingers up', difficulty: 'Easy' },
    { letter: 'X', videoUrl: '/alphabet-videos/X.mp4', description: 'Index finger crooked like a hook', difficulty: 'Medium' },
    { letter: 'Y', videoUrl: '/alphabet-videos/Y.mp4', description: 'Pinky and thumb out, like "hang loose"', difficulty: 'Easy' },
    { letter: 'Z', videoUrl: '/alphabet-videos/Z.mp4', description: 'Draw a Z in the air with index finger', difficulty: 'Hard' }
  ];

  const numbersData = [
    { number: '0', videoUrl: '/number-videos/0.mp4', description: 'Make an O shape with thumb and fingers', difficulty: 'Easy' },
    { number: '1', videoUrl: '/number-videos/1.mp4', description: 'Hold up index finger', difficulty: 'Easy' },
    { number: '2', videoUrl: '/number-videos/2.mp4', description: 'Hold up index and middle fingers', difficulty: 'Easy' },
    { number: '3', videoUrl: '/number-videos/3.mp4', description: 'Hold up thumb, index, and middle fingers', difficulty: 'Easy' },
    { number: '4', videoUrl: '/number-videos/4.mp4', description: 'Hold up four fingers, thumb tucked', difficulty: 'Easy' },
    { number: '5', videoUrl: '/number-videos/5.mp4', description: 'Open hand with all fingers spread', difficulty: 'Easy' },
    { number: '6', videoUrl: '/number-videos/6.mp4', description: 'Three fingers down, thumb touches pinky', difficulty: 'Medium' },
    { number: '7', videoUrl: '/number-videos/7.mp4', description: 'Ring finger down, thumb touches ring finger', difficulty: 'Medium' },
    { number: '8', videoUrl: '/number-videos/8.mp4', description: 'Middle finger down, thumb touches middle', difficulty: 'Medium' },
    { number: '9', videoUrl: '/number-videos/9.mp4', description: 'Index finger down, thumb touches index', difficulty: 'Medium' }
  ];

  const greetingsData = [
    { sign: 'Hello', videoUrl: '/greeting-videos/hello.mp4', description: 'Wave your hand or salute motion from forehead', difficulty: 'Easy' },
    { sign: 'Goodbye', videoUrl: '/greeting-videos/goodbye.mp4', description: 'Wave your hand back and forth', difficulty: 'Easy' },
    { sign: 'Please', videoUrl: '/greeting-videos/please.mp4', description: 'Circular motion on chest with flat hand', difficulty: 'Easy' },
    { sign: 'Thank You', videoUrl: '/greeting-videos/thankyou.mp4', description: 'Touch fingers to chin, then move hand forward', difficulty: 'Easy' },
    { sign: 'Sorry', videoUrl: '/greeting-videos/sorry.mp4', description: 'Circular motion on chest with fist', difficulty: 'Easy' },
    { sign: 'Nice to Meet You', videoUrl: '/greeting-videos/nicetomeetyou.mp4', description: 'Combination of "nice" and "meet" signs', difficulty: 'Hard' },
    { sign: 'How are you?', videoUrl: '/greeting-videos/howareyou.mp4', description: 'Point to person, then sign "how"', difficulty: 'Medium' },
    { sign: 'Good Morning', videoUrl: '/greeting-videos/goodmorning.mp4', description: 'Combine "good" and "morning" signs', difficulty: 'Medium' },
    { sign: 'Good Night', videoUrl: '/greeting-videos/goodnight.mp4', description: 'Combine "good" and "night" signs', difficulty: 'Medium' },
    { sign: 'I Love You', videoUrl: '/greeting-videos/iloveyou.mp4', description: 'Pinky, index, and thumb extended', difficulty: 'Easy' }
  ];

  // Get current data based on category
  const getCurrentData = () => {
    switch(selectedCategory) {
      case 'alphabet': return alphabetData;
      case 'numbers': return numbersData;
      case 'greetings': return greetingsData;
      default: return alphabetData;
    }
  };

  const handleStartPractice = (item) => {
    setCurrentLetterPractice(item);
    setPracticeMode(true);
    setPracticeResult(null);
    startCountdown();
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(timer);
      }
    }, 1000);
  };

  const handlePredictionResult = (prediction) => {
    if (currentLetterPractice) {
      const expected = selectedCategory === 'alphabet' ? currentLetterPractice.letter :
                     selectedCategory === 'numbers' ? currentLetterPractice.number :
                     currentLetterPractice.sign;
      
      const isCorrect = prediction.toLowerCase() === expected.toLowerCase();
      setPracticeResult({ 
        isCorrect, 
        expected, 
        predicted: prediction 
      });
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      default: return '#2196F3';
    }
  };

  return (
    <div className="learn-container">
      <style jsx>{`
        .learn-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: 'Arial', sans-serif;
        }

        .learn-header {
          text-align: center;
          margin-bottom: 3rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 2rem;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .page-title {
          color: white;
          font-size: 3rem;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .title-icon {
          margin-right: 1rem;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.2rem;
          margin: 1rem 0 0 0;
        }

        .category-selector {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .category-btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .category-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .category-btn.active {
          background: rgba(255, 255, 255, 0.9);
          color: #667eea;
          font-weight: bold;
        }

        .signs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .sign-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .sign-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
        }

        .sign-letter {
          font-size: 4rem;
          font-weight: bold;
          color: white;
          text-align: center;
          margin-bottom: 1rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .sign-description {
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          line-height: 1.4;
        }

        .difficulty-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          color: white;
          font-size: 0.9rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }

        .sign-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .action-btn {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-weight: bold;
        }

        .watch-btn {
          background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
          color: white;
        }

        .practice-btn {
          background: linear-gradient(45deg, #4ECDC4, #44A08D);
          color: white;
        }

        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .practice-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .practice-content {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .practice-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .practice-title {
          font-size: 2rem;
          color: #333;
          margin: 0 0 1rem 0;
        }

        .countdown {
          font-size: 4rem;
          color: #FF6B6B;
          font-weight: bold;
          text-align: center;
          margin: 2rem 0;
        }

        .webcam-container {
          margin: 2rem 0;
          text-align: center;
        }

        .result {
          margin-top: 2rem;
          padding: 1rem;
          border-radius: 10px;
          text-align: center;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .result.correct {
          background: #E8F5E8;
          color: #2E7D32;
          border: 2px solid #4CAF50;
        }

        .result.incorrect {
          background: #FFEBEE;
          color: #C62828;
          border: 2px solid #F44336;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #FF6B6B;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .navigation-buttons {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 3rem;
        }

        .nav-btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .nav-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <header className="learn-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📚</span>
            Learn ASL
          </h1>
          <p className="subtitle">
            Master American Sign Language with interactive video tutorials and real-time practice
          </p>
        </div>
      </header>

      {/* Category Selector */}
      <div className="category-selector">
        <button 
          className={`category-btn ${selectedCategory === 'alphabet' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('alphabet')}
        >
          🔤 Alphabet
        </button>
        <button 
          className={`category-btn ${selectedCategory === 'numbers' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('numbers')}
        >
          🔢 Numbers
        </button>
        <button 
          className={`category-btn ${selectedCategory === 'greetings' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('greetings')}
        >
          👋 Greetings
        </button>
      </div>

      {/* Signs Grid */}
      <div className="signs-grid">
        {getCurrentData().map((item, index) => (
          <div key={index} className="sign-card">
            <div className="sign-letter">
              {selectedCategory === 'alphabet' ? item.letter :
               selectedCategory === 'numbers' ? item.number :
               item.sign}
            </div>
            <div className="sign-description">
              {item.description}
            </div>
            <div 
              className="difficulty-badge" 
              style={{ backgroundColor: getDifficultyColor(item.difficulty) }}
            >
              {item.difficulty}
            </div>
            <div className="sign-actions">
              <button className="action-btn watch-btn">
                📺 Watch Tutorial
              </button>
              <button 
                className="action-btn practice-btn"
                onClick={() => handleStartPractice(item)}
              >
                🎯 Practice
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Practice Modal */}
      {practiceMode && (
        <div className="practice-modal">
          <div className="practice-content">
            <button 
              className="close-btn"
              onClick={() => setPracticeMode(false)}
            >
              ×
            </button>
            
            <div className="practice-header">
              <h2 className="practice-title">
                Practice: {selectedCategory === 'alphabet' ? currentLetterPractice?.letter :
                          selectedCategory === 'numbers' ? currentLetterPractice?.number :
                          currentLetterPractice?.sign}
              </h2>
              <p>{currentLetterPractice?.description}</p>
            </div>

            {countdown && (
              <div className="countdown">
                {countdown}
              </div>
            )}

            {!countdown && (
              <div className="webcam-container">
                <WebcamHandTracker 
                  onPrediction={handlePredictionResult}
                  targetSign={selectedCategory === 'alphabet' ? currentLetterPractice?.letter :
                             selectedCategory === 'numbers' ? currentLetterPractice?.number :
                             currentLetterPractice?.sign}
                />
              </div>
            )}

            {practiceResult && (
              <div className={`result ${practiceResult.isCorrect ? 'correct' : 'incorrect'}`}>
                {practiceResult.isCorrect ? (
                  <>
                    🎉 Correct! Well done!
                  </>
                ) : (
                  <>
                    ❌ Try again! Expected: {practiceResult.expected}, Got: {practiceResult.predicted}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="navigation-buttons">
        <button className="nav-btn" onClick={() => navigate('/')}>
          🏠 Home
        </button>
        <button className="nav-btn" onClick={() => navigate('/practice')}>
          🎯 Free Practice
        </button>
      </div>
    </div>
  );
}

export default Learn;
