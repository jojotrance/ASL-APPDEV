import React, { useState, useRef, useEffect } from 'react';

function VideoPlayer() {
  const [phrase, setPhrase] = useState('');
  const [animations, setAnimations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/asl/play/${encodeURIComponent(phrase)}`);
    const data = await res.json();
    const onlyVideos = data.animations.filter(anim => anim.type === 'video');
    const hasFingerspelling = data.animations.some(anim => anim.type === 'fingerspell');
    setAnimations(data.animations);
    setCurrentIndex(0);
    setLoading(false);

    if (onlyVideos.length === 0 && hasFingerspelling) {
      // Only fingerspelling — no autoplay needed
      return;
    }
  };

  const handleEnded = () => {
    const nextIndex = animations.findIndex((a, i) => i > currentIndex && a.type === 'video');
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex);
    }
  };

  useEffect(() => {
    // Automatically play video when index updates
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {}); // catch play() promise if autoplay blocked
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
    }, 800); // Show each letter for 800ms
    return () => clearTimeout(timeout);
  }
}, [currentIndex]);

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

      <div style={{ marginTop: 24 }}>
        {animations.length > 0 && animations[currentIndex]?.type === 'video' && (
          <video
            key={animations[currentIndex].url}
            ref={videoRef}
            src={animations[currentIndex].url}
            controls
            autoPlay
            onEnded={handleEnded}
            style={{ maxWidth: 480 }}
          />
        )}

        {animations.length > 0 && animations[currentIndex]?.type === 'fingerspell' && (
          <div style={{ fontSize: 32 }}>
            👐 Fingerspelling: {animations[currentIndex].letter}
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;
