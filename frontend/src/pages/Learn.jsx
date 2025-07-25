import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Learn.css';

function Learn() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('alphabet');
  const [showVideoModal, setShowVideoModal] = useState(null);
  const [learnedSigns, setLearnedSigns] = useState(new Set()); // Track learned signs
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMusicLoaded, setIsMusicLoaded] = useState(false);
  const [musicError, setMusicError] = useState('');
  const audioRef = useRef(null);

  // Initialize background music
  useEffect(() => {
    // Simple MP3 background music player
    const createBackgroundMusic = async () => {
      setMusicError('');
      
      try {
        console.log('🎵 Setting up MP3 background music player...');
        
        // Create HTML5 Audio element for MP3 playback
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.3; // 30% volume for background music
        audio.preload = 'auto';
        
        // Set the path to your MP3 file in the public folder
        // You can put your MP3 file in: public/audio/cafe-background.mp3
        audio.src = '/audio/bgm.mp3';
        
        const audioController = {
          async play() {
            try {
              await audio.play();
              console.log('✅ Background music started successfully');
              return true;
            } catch (error) {
              console.error('❌ Error playing background music:', error);
              throw error;
            }
          },
          
          pause() {
            audio.pause();
            console.log('🎵 Background music paused');
          },
          
          isPlaying() {
            return !audio.paused;
          },
          
          cleanup() {
            audio.pause();
            audio.currentTime = 0;
          },

          setVolume(volume) {
            audio.volume = Math.max(0, Math.min(1, volume));
          }
        };

        // Check if the audio file can be loaded
        const handleCanPlay = () => {
          setIsMusicLoaded(true);
          setMusicError('');
          console.log('🎼 MP3 background music loaded successfully');
        };

        const handleError = (e) => {
          console.error('❌ Error loading MP3 file:', e);
          setMusicError('Could not load background music file. Please check if /audio/cafe-background.mp3 exists.');
          setIsMusicLoaded(false);
        };

        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        audioRef.current = audioController;
        
        // Try to load the audio to check if file exists
        audio.load();
        
      } catch (error) {
        console.error('❌ Failed to initialize MP3 player:', error);
        setMusicError(`Failed to initialize audio player: ${error.message}`);
        setIsMusicLoaded(false);
      }
    };

    createBackgroundMusic();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.cleanup();
      }
    };
  }, []);

  const toggleMusic = async () => {
    if (!audioRef.current || !isMusicLoaded) {
      console.log('❌ Audio not ready:', { audioRef: !!audioRef.current, loaded: isMusicLoaded });
      return;
    }

    try {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        const success = await audioRef.current.play();
        if (success !== false) {
          setIsMusicPlaying(true);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling music:', error);
      setMusicError(`Music toggle failed: ${error.message}`);
    }
  };

 
  const categories = [
    { id: 'alphabet', name: 'Alphabet', icon: '🔤', description: 'Learn the ASL alphabet A-Z' },
    { id: 'numbers', name: 'Numbers', icon: '🔢', description: 'Learn numbers 0-10' },
    { id: 'greetings', name: 'Greetings', icon: '👋', description: 'Common greetings and polite expressions' }
  ];

  const backendBaseUrl = "http://localhost:5000";

  const alphabetDescriptions = [
    { letter: 'A', description: 'Make a fist with thumb pointing up', difficulty: 'Easy' },
    { letter: 'B', description: 'Flat hand with fingers together, thumb across palm', difficulty: 'Easy' },
    { letter: 'C', description: 'Curved hand like holding a cup', difficulty: 'Easy' },
    { letter: 'D', description: 'Index finger up, other fingers touch thumb', difficulty: 'Medium' },
    { letter: 'E', description: 'Bent fingers touching thumb', difficulty: 'Medium' },
    { letter: 'F', description: 'Index and thumb touch, other fingers up', difficulty: 'Medium' },
    { letter: 'G', description: 'Index finger and thumb pointing sideways', difficulty: 'Hard' },
    { letter: 'H', description: 'Index and middle finger sideways', difficulty: 'Medium' },
    { letter: 'I', description: 'Pinky finger extended, other fingers folded', difficulty: 'Easy' },
    { letter: 'J', description: 'Pinky extended, draw a J shape in the air', difficulty: 'Medium' },
    { letter: 'K', description: 'Index and middle finger up, thumb touches middle finger', difficulty: 'Medium' },
    { letter: 'L', description: 'Index finger up, thumb extended sideways', difficulty: 'Easy' },
    { letter: 'M', description: 'Thumb under first three fingers', difficulty: 'Medium' },
    { letter: 'N', description: 'Thumb under first two fingers', difficulty: 'Medium' },
    { letter: 'O', description: 'All fingertips touch thumb, forming O shape', difficulty: 'Easy' },
    { letter: 'P', description: 'Index and middle finger down, thumb touches middle finger', difficulty: 'Hard' },
    { letter: 'Q', description: 'Index finger and thumb pointing down', difficulty: 'Hard' },
    { letter: 'R', description: 'Index and middle finger crossed', difficulty: 'Medium' },
    { letter: 'S', description: 'Make a fist with thumb across fingers', difficulty: 'Easy' },
    { letter: 'T', description: 'Thumb between index and middle finger', difficulty: 'Medium' },
    { letter: 'U', description: 'Index and middle finger up together', difficulty: 'Easy' },
    { letter: 'V', description: 'Index and middle finger up in V shape', difficulty: 'Easy' },
    { letter: 'W', description: 'Index, middle, and ring finger up', difficulty: 'Medium' },
    { letter: 'X', description: 'Index finger bent like a hook', difficulty: 'Medium' },
    { letter: 'Y', description: 'Thumb and pinky extended, other fingers folded', difficulty: 'Easy' },
    { letter: 'Z', description: 'Index finger draws Z shape in the air', difficulty: 'Hard' }
  ];

  const alphabetSigns = alphabetDescriptions.map(sign => ({
  ...sign,
  videoUrl: `${backendBaseUrl}/videos/fingerspell/${sign.letter}.mp4`
}));

  const greetingSigns = [
    { word: 'Hello', description: 'Open hand moving away from forehead', difficulty: 'Easy' },
    { word: 'Thank you', description: 'Flat hand moves from chin outward', difficulty: 'Easy' },
    { word: 'Please', description: 'Flat hand circles on chest', difficulty: 'Medium' },
    { word: 'Sorry', description: 'Fist circles on chest', difficulty: 'Medium' },
    { word: 'Good morning', description: 'Combine "good" and "morning" signs', difficulty: 'Hard' },
    { word: 'How are you?', description: 'Series of hand movements', difficulty: 'Hard' }
  ];
const greetingSignsWithVideo = greetingSigns.map(sign => ({
  ...sign,
  videoUrl: `${backendBaseUrl}/videos/greetings/${sign.word.replace(/\s/g, '_').replace(/[^\w_]/g, '')}.mp4`
}));
  const numberSigns = [
    { number: '1', description: 'Index finger pointing up', difficulty: 'Easy' },
    { number: '2', description: 'Index and middle finger up (peace sign)', difficulty: 'Easy' },
    { number: '3', description: 'Thumb, index, and middle finger up', difficulty: 'Easy' },
    { number: '4', description: 'Four fingers up, thumb tucked', difficulty: 'Easy' },
    { number: '5', description: 'Open hand, all fingers extended', difficulty: 'Easy' },
    { number: '6', description: 'Thumb touches pinky, other fingers up', difficulty: 'Medium' },
    { number: '7', description: 'Thumb touches ring finger, others up', difficulty: 'Medium' },
    { number: '8', description: 'Thumb touches middle finger, others up', difficulty: 'Medium' },
    { number: '9', description: 'Thumb touches index finger, others up', difficulty: 'Medium' },
    { number: '10', description: 'Thumb up with other hand showing 0', difficulty: 'Medium' }
  ];
const numberSignsWithVideo = numberSigns.map(sign => ({
  ...sign,
  videoUrl: `${backendBaseUrl}/videos/numbers/${sign.number}.mp4`
}));

const getCurrentSigns = () => {
  switch (selectedCategory) {
    case 'alphabet':
      return alphabetSigns.map(sign => ({ ...sign, name: sign.letter }));
    case 'numbers':
      return numberSignsWithVideo.map(sign => ({ ...sign, name: sign.number }));
    case 'greetings':
      return greetingSignsWithVideo.map(sign => ({ ...sign, name: sign.word }));
    default:
      return alphabetSigns.map(sign => ({ ...sign, name: sign.letter }));
  }
};

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const getTotalSigns = () => {
    switch (selectedCategory) {
      case 'alphabet': return alphabetSigns.length;
      case 'numbers': return numberSigns.length;
      case 'greetings': return greetingSigns.length;
      default: return alphabetSigns.length;
    }
  };

  const getLearnedCount = () => {
    const currentSigns = getCurrentSigns();
    return currentSigns.filter(sign => learnedSigns.has(`${selectedCategory}-${sign.name}`)).length;
  };

  const getProgressPercentage = () => {
    const total = getTotalSigns();
    const learned = getLearnedCount();
    return total > 0 ? Math.round((learned / total) * 100) : 0;
  };

  const markAsLearned = (signName) => {
    const signKey = `${selectedCategory}-${signName}`;
    const newLearnedSigns = new Set(learnedSigns);
    
    if (learnedSigns.has(signKey)) {
      newLearnedSigns.delete(signKey); // Unmark if already learned
    } else {
      newLearnedSigns.add(signKey); // Mark as learned
    }
    
    setLearnedSigns(newLearnedSigns);
  };

  const isSignLearned = (signName) => {
    return learnedSigns.has(`${selectedCategory}-${signName}`);
  };

  return (
    <div className="learn-container">
      {/* Header */}
      <header className="learn-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <span className="title-icon">📚</span>
              Learn ASL
            </h1>
            <p className="page-subtitle">Master American Sign Language step by step</p>
          </div>
          <div className="header-right">
            <button 
              className={`music-toggle-btn ${isMusicPlaying ? 'playing' : ''} ${musicError ? 'error' : ''}`}
              onClick={toggleMusic}
              disabled={!isMusicLoaded && !musicError}
              title={
                musicError 
                  ? `Music error: ${musicError}` 
                  : isMusicPlaying 
                    ? 'Pause soothing background music' 
                    : isMusicLoaded 
                      ? 'Play soothing background music'
                      : 'Loading audio...'
              }
            >
              {musicError ? '❌' : isMusicPlaying ? '🔊' : '🔇'}
              <span className="music-label">
                {musicError 
                  ? 'Audio Error' 
                  : isMusicPlaying 
                    ? 'Music On' 
                    : isMusicLoaded 
                      ? 'Music Off'
                      : 'Loading...'
                }
              </span>
            </button>
            {musicError && (
              <div className="music-error-tooltip">
                Click to retry audio initialization
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="learn-content">
        {/* Categories Section */}
        <section className="categories-section">
          <div className="section-header">
            <h2>Learning Categories</h2>
            <div className="progress-indicator">
              <span>Progress: {getProgressPercentage()}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${getProgressPercentage()}%` }}></div>
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
                  <span className="completed">{getLearnedCount()}/{getTotalSigns()} Complete</span>
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
            </div>

            <div className="signs-grid">
              {getCurrentSigns().map((sign, index) => (
                <div
                  key={index}
                  className={`sign-card ${isSignLearned(sign.name) ? 'learned' : ''}`}
                >
                  <div className="sign-visual">
                    <div className="sign-placeholder">
                      <span className="sign-letter">{sign.name}</span>
                    </div>
                  </div>
                  <div className="sign-info">
                    <h4>{sign.name}</h4>
                    <p>{sign.description}</p>
                  </div>
                  <div className="sign-actions">
                    <button 
                      className="action-btn play-btn"
                      onClick={() => setShowVideoModal(sign)}
                    >
                      <span className="btn-icon">▶️</span>
                      Play Video
                    </button>
                    <button 
                      className={`action-btn mark-btn ${isSignLearned(sign.name) ? 'learned' : ''}`}
                      onClick={() => markAsLearned(sign.name)}
                    >
                      <span className="btn-icon">{isSignLearned(sign.name) ? '✅' : '📝'}</span>
                      {isSignLearned(sign.name) ? 'Learned' : 'Mark as Learned'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Video Modal */}
        {showVideoModal && (
          <div className="video-modal" onClick={() => setShowVideoModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{showVideoModal.name}</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowVideoModal(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <video 
                  className="modal-video" 
                  autoPlay 
                  loop 
                  controls
                >
                  <source src={showVideoModal.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <p className="video-description">{showVideoModal.description}</p>
                <div className="modal-actions">
                  <button 
                    className={`mark-learned-btn ${isSignLearned(showVideoModal.name) ? 'learned' : ''}`}
                    onClick={() => markAsLearned(showVideoModal.name)}
                  >
                    {isSignLearned(showVideoModal.name) ? '✅ Learned' : '📝 Mark as Learned'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Learn;
