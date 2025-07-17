import React, { useState } from 'react';

function VideoPlayer() {
  const [phrase, setPhrase] = useState('');
  const [animations, setAnimations] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/asl/play/${encodeURIComponent(phrase)}`);
    const data = await res.json();
    setAnimations(data.animations || []);
    setLoading(false);
  };

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
        {animations.map((anim, idx) =>
        anim.type === 'video' && anim.url ? (
            anim.url.includes('youtube.com') ? (
            <iframe
                key={idx}
                width="320"
                height="180"
                src={anim.url.replace('watch?v=', 'embed/')}
                title={anim.word}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ marginBottom: 16 }}
            />
            ) : (
            <video key={idx} src={anim.url} controls style={{ maxWidth: 320, marginBottom: 16 }} />
            )
        ) : (
            <div key={idx} style={{ fontSize: 32, marginBottom: 16 }}>
            👐 Fingerspelling: {anim.letter}
            </div>
        )
        )}
      </div>
    </div>
  );
}

export default VideoPlayer;