import React, { useState, useRef, useEffect } from 'react';

function SignInput() {
  const [inputText, setInputText] = useState('');
  const [matchFound, setMatchFound] = useState(null); // null | true | false
  const [showResult, setShowResult] = useState(false);
  const [animations, setAnimations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aslGloss, setAslGloss] = useState('');
  const videoRef = useRef(null);

  // Play ASL animation functionality
  const handlePlay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/asl/play/${encodeURIComponent(inputText)}`);
      const data = await res.json();
      setAnimations(data.animations);
      setAslGloss(data.aslGloss);
      setCurrentIndex(0);
      setMatchFound(data.animations.length > 0);
      setShowResult(true);
    } catch (error) {
      console.error('Error fetching animations:', error);
      setMatchFound(false);
      setShowResult(true);
    }
    setLoading(false);
  };

  const handleVideoEnded = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < animations.length) {
      setCurrentIndex(nextIndex);
    }
  };

  // Auto-advance fingerspelling videos
  useEffect(() => {
    const current = animations[currentIndex];
    if (current?.type === 'fingerspell') {
      const timeout = setTimeout(() => {
        const next = currentIndex + 1;
        if (next < animations.length) {
          setCurrentIndex(next);
        }
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, animations]);

  // Load and play video when index changes
  useEffect(() => {
    if (videoRef.current && animations[currentIndex]) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Simulate sign matching logic
  const handleCheckSigns = () => {
    if (!inputText.trim()) return;
    handlePlay();
  };

  const handleReset = () => {
    setInputText('');
    setMatchFound(null);
    setShowResult(false);
    setAnimations([]);
    setCurrentIndex(0);
    setAslGloss('');
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">⌨️</span>
            Type to Sign
          </h1>
          <p className="app-subtitle">Convert text phrases to ASL signs or fingerspelling</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40 }}>
        <div className="signinput-container" style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 18,
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.07)',
          padding: 36,
          minWidth: 380,
          maxWidth: 480,
          width: '100%',
        }}>
          <div className="signinput-flow">
            <div className="flow-step">
              <span className="flow-label">1. Type a phrase</span>
              <input
                className="signinput-textbox"
                type="text"
                placeholder="Enter text to translate to ASL..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 18,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  marginTop: 10,
                  marginBottom: 24,
                  outline: 'none',
                  background: '#f7f7fa'
                }}
                disabled={showResult}
              />
            </div>
            <div className="flow-step">
              <span className="flow-label">2. Check for ASL sign</span>
              <button
                className="check-btn"
                onClick={handleCheckSigns}
                disabled={!inputText.trim() || showResult}
                style={{
                  background: 'linear-gradient(90deg, #4f8cff 0%, #38e7b0 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 28px',
                  fontSize: 18,
                  fontWeight: 600,
                  cursor: (!inputText.trim() || showResult) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px 0 rgba(79,140,255,0.08)',
                  marginTop: 8,
                  marginBottom: 24,
                  transition: 'background 0.2s'
                }}
              >
                {loading ? 'Loading...' : 'Check Signs'}
              </button>
            </div>
            {showResult && (
              <div className="flow-step">
                <span className="flow-label">3. Result</span>
                
                {/* ASL Gloss Display */}
                {aslGloss && (
                  <div style={{ 
                    marginTop: 16, 
                    marginBottom: 16,
                    padding: 12, 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: 8,
                    fontSize: 14
                  }}>
                    <strong>Original:</strong> {inputText}<br/>
                    <strong>ASL Gloss:</strong> {aslGloss.toUpperCase()}
                  </div>
                )}

                <div style={{
                  marginTop: 16,
                  marginBottom: 16,
                  padding: 24,
                  borderRadius: 12,
                  background: matchFound ? 'linear-gradient(90deg, #38e7b0 0%, #4f8cff 100%)' : 'linear-gradient(90deg, #ffb347 0%, #ff5e62 100%)',
                  color: '#fff',
                  fontSize: 20,
                  fontWeight: 500,
                  textAlign: 'center',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {matchFound === true ? (
                    <>
                      <span style={{ fontSize: 32, marginBottom: 8 }}>✅ ASL Animation Found</span>
                      <span style={{ fontSize: 16, opacity: 0.9 }}>Showing ASL sign animation for your phrase.</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 32, marginBottom: 8 }}>🔤 Fingerspelling</span>
                      <span style={{ fontSize: 16, opacity: 0.9 }}>No direct ASL sign found. Showing fingerspelling.</span>
                    </>
                  )}
                </div>

                {/* Video Player */}
                {animations.length > 0 && animations[currentIndex] && (
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <p style={{ marginBottom: 16, fontSize: 16, fontWeight: 500 }}>
                      Playing: {animations[currentIndex].word || `Letter ${animations[currentIndex].letter}`} 
                      ({currentIndex + 1}/{animations.length})
                    </p>
                    <video
                      key={animations[currentIndex].url}
                      ref={videoRef}
                      src={animations[currentIndex].url}
                      controls
                      autoPlay
                      onEnded={handleVideoEnded}
                      style={{ 
                        maxWidth: '100%', 
                        width: 320, 
                        height: 240,
                        borderRadius: 8,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>
                )}

                <button
                  className="reset-btn"
                  onClick={handleReset}
                  style={{
                    background: '#f7f7fa',
                    color: '#4f8cff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginTop: 16
                  }}
                >
                  Try Another Phrase
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SignInput;