import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';

function SignTranslator() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedSentence, setTranslatedSentence] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hands, setHands] = useState(null);
  const [detectedHands, setDetectedHands] = useState([]);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let isMounted = true;

    const handsInstance = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    handsInstance.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    handsInstance.onResults((results) => {
      if (!isMounted) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Update detected hands for UI display
      const currentHands = results.multiHandedness?.map(h => h.label) || [];
      setDetectedHands(currentHands);

      // Draw hand landmarks and connections
      if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
          const handedness = results.multiHandedness?.[index];
          landmarks.forEach((point) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = handedness?.label === 'Left' ? '#2196F3' : '#4caf50';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
          ];
          ctx.strokeStyle = handedness?.label === 'Left' ? '#2196F3' : '#4caf50';
          ctx.lineWidth = 2;
          connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
          });
        });
      }

      // Recognition logic (simulate or connect to backend/model)
      if (isTranslating && results.multiHandLandmarks) {
        // Simulate recognition: If two hands detected, add "Hello" to sentence
        // Replace this with your ML model or backend API call
        if (currentHands.length === 2) {
          setTranslatedSentence(prev => prev.endsWith('Hello') ? prev : prev + (prev ? ' ' : '') + 'Hello');
          setConfidence(95);
        } else if (currentHands.length === 1) {
          setTranslatedSentence(prev => prev.endsWith('Thank you') ? prev : prev + (prev ? ' ' : '') + 'Thank you');
          setConfidence(90);
        }
      }
    });

    setHands(handsInstance);

    async function startCamera() {
      try {
        setIsLoading(true);
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        video.srcObject = stream;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            resolve();
          };
          video.onerror = reject;
        });
        await video.play();
        setIsLoading(false);
        animationId = requestAnimationFrame(processFrame);
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        setIsLoading(false);
        console.error('Camera error:', err);
      }
    }

    async function processFrame() {
      if (!isMounted || !handsInstance) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          await handsInstance.send({ image: video });
        } catch (error) {
          if (error.name !== 'BindingError') {
            console.error('MediaPipe error:', error);
          }
          return;
        }
      }
      if (isMounted && handsInstance) {
        animationId = requestAnimationFrame(processFrame);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      try {
        if (handsInstance) {
          handsInstance.close();
        }
      } catch (error) {}
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isTranslating]);

  const startTranslation = () => {
    setTranslatedSentence('');
    setConfidence(0);
    setIsTranslating(true);
  };

  const stopTranslation = () => {
    setIsTranslating(false);
  };

  if (error) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#f44336',
        background: '#ffebee',
        borderRadius: '10px',
        border: '1px solid #ffcdd2'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
        <h3>Camera Access Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Sign Language Translator</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {!isTranslating ? (
          <button
            onClick={startTranslation}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Start Translation
          </button>
        ) : (
          <button
            onClick={stopTranslation}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Stop Translation
          </button>
        )}
      </div>

      <div style={{ position: 'relative', width: '100%', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 10,
            minHeight: '400px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #ffffff30',
              borderTop: '4px solid #2196F3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p>Initializing camera...</p>
          </div>
        )}

        {/* Hand detection indicator */}
        {!isLoading && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            zIndex: 5,
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>Hands Detected:</div>
            {detectedHands.length === 0 ? (
              <div style={{ color: '#ffcccc' }}>No hands detected</div>
            ) : (
              detectedHands.map((hand, index) => (
                <div key={index} style={{
                  color: hand === 'Left' ? '#64b5f6' : '#81c784',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: hand === 'Left' ? '#2196F3' : '#4caf50'
                  }}></div>
                  {hand} Hand
                </div>
              ))
            )}
          </div>
        )}

        <video
          ref={videoRef}
          style={{
            width: '100%',
            display: isLoading ? 'none' : 'block',
            transform: 'scaleX(-1)'
          }}
          playsInline
          muted
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)'
          }}
        />
      </div>

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#e8f5e8',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #4caf50'
      }}>
        <h3>Translated Sentence</h3>
        <div style={{
          fontSize: '1.3rem',
          fontWeight: 'bold',
          color: '#2563eb',
          minHeight: '40px'
        }}>
          {translatedSentence || 'Start signing to see translation...'}
        </div>
        <div style={{ marginTop: '10px', fontSize: '1rem', color: '#666' }}>
          Confidence: {confidence}%
        </div>
      </div>

      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        `}
      </style>
    </div>
  );
}

export default SignTranslator;