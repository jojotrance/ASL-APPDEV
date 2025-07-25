import React, { useRef, useEffect, useState, useCallback } from 'react';

const MockHandTracker = ({
  onHandsDetected,
  onConfidenceChange,
  onPrediction,
  isRecording = false,
  recordingTime = 0,
  targetSign = null,
  mode = 'recognition'
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  
  const BUFFER_SIZE = 10;

  const performPrediction = useCallback(async (frameBuffer) => {
    try {
      console.log('🔄 Sending frame buffer for prediction...', frameBuffer.length, 'frames');
      
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landmarks: frameBuffer
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Prediction result:', result);
        
        setConfidence(result.confidence);
        
        if (onConfidenceChange) {
          onConfidenceChange(result.confidence);
        }
        
        if (onPrediction) {
          onPrediction(result.word, result.confidence);
        }
      }
    } catch (error) {
      console.error('❌ Prediction error:', error);
    }
  }, [onConfidenceChange, onPrediction]);

  // Generate mock hand landmarks that simulate real hand detection
  const generateMockLandmarks = useCallback(() => {
    const landmarks = [];
    
    // Generate 21 landmarks for a hand (MediaPipe standard)
    for (let i = 0; i < 21; i++) {
      landmarks.push({
        x: 0.3 + Math.random() * 0.4, // Random position in center area
        y: 0.3 + Math.random() * 0.4,
        z: 0.05 + Math.random() * 0.1
      });
    }
    
    return [landmarks]; // Return as array with one hand
  }, []);

  const addMockFrame = useCallback(() => {
    if (!isDetecting) return;
    
    console.log('🔄 Generating mock frame for prediction...');
    const mockLandmarks = generateMockLandmarks();
    console.log('📍 Mock landmarks generated:', mockLandmarks.length, 'hands');
    
    setFrameBuffer(prev => {
      const newBuffer = [...prev, mockLandmarks];
      if (newBuffer.length > BUFFER_SIZE) {
        newBuffer.shift();
      }
      
      console.log(`📦 Frame buffer: ${newBuffer.length}/${BUFFER_SIZE} frames`);
      
      if (newBuffer.length >= BUFFER_SIZE) {
        console.log('✅ Buffer full, triggering prediction...');
        performPrediction(newBuffer);
      }
      
      return newBuffer;
    });
  }, [isDetecting, generateMockLandmarks, performPrediction]);

  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log('📹 Camera started successfully');
            setIsReady(true);
            startMockDetection();
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera access failed: ${err.message}`);
    }
  }, []);

  const startMockDetection = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    
    const processFrame = () => {
      if (video.readyState === 4) {
        // Draw the video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mirror the canvas
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Draw mock hand indicators
        if (isDetecting) {
          // Draw some mock hand landmarks
          const mockPositions = [
            { x: canvas.width * 0.3, y: canvas.height * 0.4 },
            { x: canvas.width * 0.4, y: canvas.height * 0.3 },
            { x: canvas.width * 0.5, y: canvas.height * 0.4 },
            { x: canvas.width * 0.6, y: canvas.height * 0.5 },
            { x: canvas.width * 0.7, y: canvas.height * 0.6 }
          ];
          
          mockPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = '#00ff00';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
          
          // Update hands detected status
          if (onHandsDetected) {
            onHandsDetected({ left: true, right: false });
          }
        }
      }
      
      requestAnimationFrame(processFrame);
    };
    
    processFrame();
    
    // Start generating mock frames for prediction
    const frameInterval = setInterval(() => {
      if (isDetecting) {
        addMockFrame();
      }
    }, 100); // 10 FPS
    
    return () => clearInterval(frameInterval);
  }, [isDetecting, addMockFrame, onHandsDetected]);

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      startCamera();
    }
    
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#f44336',
        backgroundColor: '#ffebee',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <h3>Camera Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            startCamera();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#000'
        }}
      />
      
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {isReady ? '✅ Ready' : '🔄 Loading...'}
      </div>
      
      {confidence !== null && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Confidence: {(confidence * 100).toFixed(1)}%
        </div>
      )}
      
      {/* Manual Detection Control */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => {
            console.log('🎯 Detection button clicked, current state:', isDetecting);
            setIsDetecting(!isDetecting);
            console.log('🎯 Detection state changed to:', !isDetecting);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: isDetecting ? '#f44336' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isDetecting ? '⏹️ Stop Detection' : '▶️ Start Detection'}
        </button>
      </div>
      
      {isDetecting && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(76,175,80,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          🤲 Mock Hand Detection Active
        </div>
      )}
    </div>
  );
};

export default MockHandTracker;
