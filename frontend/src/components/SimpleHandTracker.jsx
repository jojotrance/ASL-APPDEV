import React, { useRef, useEffect, useState, useCallback } from 'react';

const SimpleHandTracker = ({ 
  onPrediction, 
  onHandsDetected, 
  onConfidenceChange, 
  mode = 'recognition',
  trainedSigns = [],
  isTranslating = true
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const lastPredictionTime = useRef(0);
  const lastDetectedSign = useRef(null);
  const lastSignTime = useRef(0);
  const isTranslatingRef = useRef(isTranslating);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [isPredicting, setIsPredicting] = useState(false);

  // Update ref when prop changes
  useEffect(() => {
    isTranslatingRef.current = isTranslating;
    // Reset detection state when translation is stopped
    if (!isTranslating) {
      lastDetectedSign.current = null;
      lastSignTime.current = 0;
      setIsPredicting(false);
    }
  }, [isTranslating]);

  const BUFFER_SIZE = 10;
  const PREDICTION_COOLDOWN = 500; // Reduced to 0.5 seconds for faster response
  const MIN_CONFIDENCE_THRESHOLD = 15; // Higher threshold for more reliable predictions
  const SAME_SIGN_COOLDOWN = 2000; // 2 seconds before detecting the same sign again

  // Camera setup
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsReady(true);
            initializeMediaPipe();
          });
        };
      }
    } catch (err) {
      setError('Camera access failed');
      console.error('Camera error:', err);
    }
  }, []);

  // MediaPipe initialization
  const initializeMediaPipe = useCallback(() => {
    if (window.Hands) {
      setupHands();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = setupHands;
      script.onerror = () => setError('Failed to load MediaPipe');
      document.head.appendChild(script);
    }
  }, []);

  // MediaPipe setup
  const setupHands = useCallback(() => {
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // Reduced for better compatibility
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    // Start processing with error handling
    const processFrame = async () => {
      if (handsRef.current && videoRef.current && videoRef.current.readyState === 4) {
        try {
          await handsRef.current.send({ image: videoRef.current });
        } catch (error) {
          // Silently handle MediaPipe abort errors
          if (!error.message?.includes('Aborted') && !error.message?.includes('arguments_')) {
            console.error('MediaPipe error:', error);
          }
        }
      }
      requestAnimationFrame(processFrame);
    };
    
    // Delay start to ensure everything is loaded
    setTimeout(() => {
      processFrame();
    }, 500);
  }, []);

  // Process MediaPipe results
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!canvas || !video || !ctx) return;

    // Clear and draw video
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Check for hands and notify parent
    const handsDetected = {
      left: false,
      right: false
    };

    // Process hand landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Update hands detected status
      if (results.multiHandedness) {
        results.multiHandedness.forEach((handedness, index) => {
          const label = handedness.label.toLowerCase();
          if (label === 'left') handsDetected.left = true;
          if (label === 'right') handsDetected.right = true;
        });
      } else {
        // Fallback if handedness not available
        handsDetected.left = results.multiHandLandmarks.length > 0;
        handsDetected.right = results.multiHandLandmarks.length > 1;
      }

      const landmarks = results.multiHandLandmarks.map(handLandmarks => 
        handLandmarks.map(point => ({ x: point.x, y: point.y, z: point.z }))
      );
      
      // Update frame buffer
      setFrameBuffer(prev => {
        const newBuffer = [...prev, landmarks];
        if (newBuffer.length > BUFFER_SIZE) newBuffer.shift();
        
        // Only perform prediction if translation is active and not already predicting
        if (newBuffer.length === BUFFER_SIZE && isTranslatingRef.current && !isPredicting) {
          const now = Date.now();
          if (now - lastPredictionTime.current >= PREDICTION_COOLDOWN) {
            setIsPredicting(true);
            
            fetch('/api/v1/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ landmarks: newBuffer }),
            })
            .then(response => response.json())
            .then(result => {
              // Double-check translation state before calling callbacks
              if (result.confidence > MIN_CONFIDENCE_THRESHOLD && isTranslatingRef.current) {
                const detectedSign = result.word;
                const isSameSign = lastDetectedSign.current === detectedSign;
                const timeSinceLastSign = now - lastSignTime.current;
                
                // Allow detection if:
                // 1. It's a different sign, OR
                // 2. It's the same sign but enough time has passed
                if (!isSameSign || timeSinceLastSign >= SAME_SIGN_COOLDOWN) {
                  onConfidenceChange?.(result.confidence);
                  onPrediction?.(result.word, result.confidence);
                  lastDetectedSign.current = detectedSign;
                  lastSignTime.current = now;
                  console.log(`✅ ${isSameSign ? 'Repeated' : 'New'} sign detected: "${result.word}" (${result.confidence}%)`);
                } else {
                  console.log(`🔄 Same sign "${detectedSign}" ignored (${Math.ceil((SAME_SIGN_COOLDOWN - timeSinceLastSign) / 1000)}s cooldown remaining)`);
                }
                lastPredictionTime.current = now;
              } else if (result.confidence <= MIN_CONFIDENCE_THRESHOLD) {
                console.log(`⚠️ Low confidence prediction rejected: "${result.word}" (${result.confidence}%)`);
                lastPredictionTime.current = now;
              }
            })
            .catch(error => {
              console.error('❌ Prediction error:', error);
              lastPredictionTime.current = now;
            })
            .finally(() => {
              setIsPredicting(false);
            });
          }
        }
        return newBuffer;
      });

      // Draw landmarks
      results.multiHandLandmarks.forEach((handLandmarks, handIndex) => {
        handLandmarks.forEach(point => {
          const x = (1 - point.x) * canvas.width;
          const y = point.y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = handIndex === 0 ? '#2196F3' : '#4CAF50';
          ctx.fill();
        });
      });
    }

    // Notify parent about hands detection status
    onHandsDetected?.(handsDetected);
  }, [onHandsDetected, onPrediction, onConfidenceChange]);

  // Initialize on mount
  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, [startCamera]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        width="640"
        height="480"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
      />
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px'
        }}>
          ❌ {error}
        </div>
      )}
      {!isReady && !error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px'
        }}>
          🔄 Loading...
        </div>
      )}
      {isReady && !isTranslating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '16px'
        }}>
          📹 Camera Ready<br />
          <span style={{ fontSize: '14px', opacity: 0.8 }}>Click "Start Translating" to begin</span>
        </div>
      )}
      {isReady && isTranslating && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: isPredicting ? 'rgba(255, 165, 0, 0.8)' : 'rgba(34, 139, 34, 0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {isPredicting ? '🔄 ANALYZING...' : '🟢 ACTIVE'}
        </div>
      )}
    </div>
  );
};

export default SimpleHandTracker;