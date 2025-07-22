import React, { useState, useRef, useEffect } from 'react';

function VideoPlayer() {
  const [phrase, setPhrase] = useState('');
  const [animations, setAnimations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [aslGloss, setAslGloss] = useState('');
  const videoRef = useRef(null);

  const handlePlay = async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/asl/play/${encodeURIComponent(phrase)}`);
    const data = await res.json();
    setAnimations(data.animations);
    setAslGloss(data.aslGloss);
    setCurrentIndex(0);
    setLoading(false);
  };

  const handleEnded = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < animations.length) {
      setCurrentIndex(nextIndex);
    }
  };

  useEffect(() => {
    if (videoRef.current && animations[currentIndex]) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

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

  return (
    <div>
      <h2>Play ASL Animation</h2>
      <input
        type="text"
        value={phrase}
        onChange={e => setPhrase(e.target.value)}
        placeholder="Type a phrase..."
        style={{ marginRight: 8 }}
      />
      <button onClick={handlePlay} disabled={loading || !phrase}>
        {loading ? 'Loading...' : 'Play'}
      </button>

      {aslGloss && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          <strong>Original:</strong> {phrase}<br/>
          <strong>ASL Gloss:</strong> {aslGloss.toUpperCase()}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {animations.length > 0 && animations[currentIndex] && (
          <div>
            <p>Playing: {animations[currentIndex].word || `Letter ${animations[currentIndex].letter}`} 
               ({currentIndex + 1}/{animations.length})</p>
            <video
              key={animations[currentIndex].url}
              ref={videoRef}
              src={animations[currentIndex].url}
              controls
              autoPlay
              onEnded={handleEnded}
              style={{ maxWidth: 480 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;