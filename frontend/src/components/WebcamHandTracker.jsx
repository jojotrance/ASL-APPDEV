import React, { useRef, useEffect, useState } from 'react';

function WebcamHandTracker({ onSignDetected, onConfidenceChange, onCameraInfo, onHandsDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainedSigns, setTrainedSigns] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [mediapipeHands, setMediapipeHands] = useState(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Detection buffers for more accurate recognition
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [lastDetectedSign, setLastDetectedSign] = useState(null);

  const BUFFER_SIZE = 5;
  const DETECTION_COOLDOWN = 800;
  const CONFIDENCE_THRESHOLD = 0.30;

    useEffect(() => {
    if (frameBuffer.length >= 3) {
      analyzeFrameBuffer(frameBuffer);
    }
  }, [frameBuffer]);

  // Load trained signs from your database
  useEffect(() => {
    loadTrainedSigns();
  }, []);

// Replace the loadTrainedSigns function with this enhanced version:

const loadTrainedSigns = async () => {
  try {
    const response = await fetch('/api/v1/signs/training-data');
    
    if (response.ok) {
      const data = await response.json();
      setTrainedSigns(data);
      setIsModelLoaded(data.length > 0);
      console.log(`✅ Loaded ${data.length} trained signs for ASL detection`);
    } else {
      console.error('Failed to load trained signs');
    }
  } catch (error) {
    console.error('Error loading trained signs:', error);
  }
};

  // Advanced sign recognition using trained data
  const recognizeSignFromTrainedData = (currentLandmarks) => {
    if (!currentLandmarks || currentLandmarks.length === 0 || !trainedSigns || trainedSigns.length === 0) {
      return null;
    }

    let bestMatch = null;
    let bestScore = 0;

    trainedSigns.forEach(trainedSign => {
      if (trainedSign.frames && trainedSign.frames.length > 0) {
        let totalSimilarity = 0;
        let validComparisons = 0;

        trainedSign.frames.forEach(trainedFrame => {
          const similarity = calculateFrameSimilarity(currentLandmarks, trainedFrame);
          if (similarity > 0) {
            totalSimilarity += similarity;
            validComparisons++;
          }
        });

        if (validComparisons > 0) {
          const avgSimilarity = totalSimilarity / validComparisons;
          
          if (avgSimilarity > bestScore) {
            bestScore = avgSimilarity;
            bestMatch = {
              word: trainedSign.label,
              confidence: avgSimilarity
            };
          }
        }
      }
    });

    return bestMatch;
  };

  const calculateFrameSimilarity = (currentLandmarks, trainedFrame) => {
    if (!currentLandmarks || !trainedFrame) {
      return 0;
    }
    
    // Try different possible structures for the trained frame
    let trainedLandmarks = null;
    
    if (trainedFrame.landmarks) {
      trainedLandmarks = trainedFrame.landmarks;
    } else if (trainedFrame.hands) {
      trainedLandmarks = trainedFrame.hands;
    } else if (Array.isArray(trainedFrame)) {
      trainedLandmarks = trainedFrame;
    } else {
      return 0;
    }

    try {
      let totalSimilarity = 0;
      let comparisons = 0;

      // Compare each hand in current frame with trained frame
      currentLandmarks.forEach((currentHand, handIndex) => {
        if (trainedLandmarks[handIndex]) {
          const handSimilarity = calculateHandSimilarity(currentHand, trainedLandmarks[handIndex]);
          if (handSimilarity > 0) {
            totalSimilarity += handSimilarity;
            comparisons++;
          }
        }
      });

      return comparisons > 0 ? totalSimilarity / comparisons : 0;
    } catch (error) {
      return 0;
    }
  };

  const calculateHandSimilarity = (hand1, hand2) => {
    if (!hand1 || !hand2 || hand1.length !== hand2.length) {
      return 0;
    }

    try {
      let totalDistance = 0;
      let validPoints = 0;

      for (let i = 0; i < Math.min(hand1.length, hand2.length); i++) {
        const p1 = hand1[i];
        const p2 = hand2[i];
        
        if (p1 && p2 && typeof p1.x === 'number' && typeof p2.x === 'number') {
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2) + 
            Math.pow((p1.z || 0) - (p2.z || 0), 2)
          );
          totalDistance += distance;
          validPoints++;
        }
      }

      if (validPoints === 0) {
        return 0;
      }

      // Normalize the distance to a similarity score
      const avgDistance = totalDistance / validPoints;
      const similarity = Math.max(0, 1 - (avgDistance * 2));
      
      return Math.min(1, Math.max(0, similarity));
    } catch (error) {
      return 0;
    }
  };

  const analyzeFrameBuffer = (buffer) => {
    if (buffer.length < 3) return;

    const now = Date.now();
    if (now - lastDetectionTime < DETECTION_COOLDOWN) return;

    const recentFrames = buffer.slice(-3);
    let bestDetection = null;
    let bestConfidence = 0;

    recentFrames.forEach(frame => {
      const detection = recognizeSignFromTrainedData(frame.landmarks);
      if (detection && detection.confidence > bestConfidence) {
        bestDetection = detection;
        bestConfidence = detection.confidence;
      }
    });

    if (bestDetection && bestConfidence > CONFIDENCE_THRESHOLD) {
      // Only report if it's a new sign or confidence changed significantly
      if (bestDetection.word !== lastDetectedSign || Math.abs(bestConfidence * 100 - (typeof bestDetection.confidence === 'number' ? bestDetection.confidence * 100 : 0)) > 5) {
        if (onSignDetected) {
          onSignDetected(bestDetection.word);
        }
        if (onConfidenceChange) {
          onConfidenceChange(Math.round(bestConfidence * 100));
        }
        setLastDetectedSign(bestDetection.word);
        setLastDetectionTime(now);
      }
    } else {
      // If no sign detected, reset confidence
      if (onConfidenceChange) {
        onConfidenceChange(0);
      }
      setLastDetectedSign(null);
    }
  };

  // Start camera first, then initialize MediaPipe
useEffect(() => {
  const startCamera = async () => {
    try {
      setIsLoading(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        console.error('Video or canvas ref not available');
        return;
      }

      // Clear any existing video source first
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      // Set up video element
      video.srcObject = stream;
      
      // Wait for metadata to load before playing
      video.onloadedmetadata = async () => {
        try {
          await video.play();
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setCameraStarted(true);
          setIsLoading(false);
          
          // Send initial camera info
          if (onCameraInfo) {
            onCameraInfo({
              resolution: `${video.videoWidth}x${video.videoHeight}`,
              status: 'Ready'
            });
          }
          
          // Start MediaPipe after camera is ready
          await initializeMediaPipe();
          
        } catch (playError) {
          console.error('Video play error:', playError);
          setError(`Failed to play video: ${playError.message}`);
          setIsLoading(false);
        }
      };

      video.onerror = (err) => {
        console.error('Video error:', err);
        setError('Failed to start video stream');
        setIsLoading(false);
      };

    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera access failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  startCamera();

  return () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  };
}, []);

// Replace the initializeMediaPipe function with this improved version:

const initializeMediaPipe = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  
  if (!video || !canvas) {
    console.error('Video or canvas not available');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  let frameId = 0;

  // Start showing video feed immediately, even before MediaPipe loads
  const showVideoFeed = () => {
    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    
    if (!mediapipeHands) {
      requestAnimationFrame(showVideoFeed);
    }
  };
  
  // Start showing video immediately
  showVideoFeed();

  try {
    console.log('🔄 Loading MediaPipe dynamically...');
    
    // Dynamic import to load MediaPipe
    const { Hands } = await import('@mediapipe/hands');
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay
    
    const hands = new Hands({
      locateFile: (file) => {
        // Use CDN sources for MediaPipe files to avoid local file issues
        console.log('📁 Loading MediaPipe file:', file);
        
        // Priority order: CDN first, then local fallback
        const cdnSources = [
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469404/${file}`,
          `https://unpkg.com/@mediapipe/hands@0.4.1675469404/${file}`,
          `/mediapipe-hands/${file}` // Local fallback
        ];
        
        // Return the CDN source
        return cdnSources[0];
      },
    });
    
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0, // Use lighter model for better performance
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });
    
    // Add error handling for MediaPipe initialization
    hands.onResults((results) => {
      try {
        // Always clear and draw the video feed first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mirror the canvas and draw video feed
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        const handsDetected = { left: false, right: false };
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarksData = results.multiHandLandmarks.map(landmarks => 
            landmarks.map(point => ({
              x: Math.round(point.x * 1000) / 1000,
              y: Math.round(point.y * 1000) / 1000,
              z: Math.round(point.z * 1000) / 1000
            }))
          );

          if (results.multiHandedness) {
            results.multiHandedness.forEach(hand => {
              if (hand.label === 'Left') handsDetected.left = true;
              if (hand.label === 'Right') handsDetected.right = true;
            });
          }

          setFrameBuffer(prev => {
            frameId++;
            const newBuffer = [...prev, {
              id: frameId,
              timestamp: Date.now(),
              landmarks: landmarksData,
              handedness: results.multiHandedness?.map(h => h.label) || []
            }];
            if (newBuffer.length > BUFFER_SIZE) {
              newBuffer.shift();
            }
            return newBuffer;
          });

          // Draw hand landmarks (mirrored)
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness[i];
            
            for (let j = 0; j < landmarks.length; j++) {
              const point = landmarks[j];
              // Mirror the x coordinate for landmarks
              const x = (1 - point.x) * canvas.width;
              const y = point.y * canvas.height;
              
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = handedness.label === 'Left' ? '#2196F3' : '#4caf50';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            
            // Draw connections (mirrored)
            const connections = [
              [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
              [0, 5], [5, 6], [6, 7], [7, 8], // Index
              [0, 9], [9, 10], [10, 11], [11, 12], // Middle
              [0, 13], [13, 14], [14, 15], [15, 16], // Ring
              [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
              [5, 9], [9, 13], [13, 17] // Palm
            ];
            
            ctx.strokeStyle = handedness.label === 'Left' ? '#2196F3' : '#4caf50';
            ctx.lineWidth = 2;
            
            connections.forEach(([start, end]) => {
              const startPoint = landmarks[start];
              const endPoint = landmarks[end];
              
              // Mirror the x coordinates for connections
              const startX = (1 - startPoint.x) * canvas.width;
              const startY = startPoint.y * canvas.height;
              const endX = (1 - endPoint.x) * canvas.width;
              const endY = endPoint.y * canvas.height;
              
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
            });
          }
        } else {
          if (onConfidenceChange) {
            onConfidenceChange(0);
          }
        }
        
        if (onHandsDetected) {
          onHandsDetected(handsDetected);
        }
        
      } catch (drawError) {
        console.error('Error in drawing:', drawError);
      }
    });
    
    setMediapipeHands(hands);
    console.log('✅ MediaPipe initialized successfully');
    
    // Start processing with improved error handling and recovery
    let errorCount = 0;
    const MAX_ERRORS = 10;
    let lastErrorTime = 0;
    
    const processFrame = async () => {
      try {
        if (video.readyState === 4 && hands) {
          await hands.send({ image: video });
          errorCount = 0; // Reset error count on successful frame
        }
        requestAnimationFrame(processFrame);
      } catch (error) {
        const now = Date.now();
        errorCount++;
        
        console.warn(`Frame processing error (${errorCount}/${MAX_ERRORS}):`, error.message);
        
        // If we get too many errors in a short time, stop trying to avoid infinite loops
        if (errorCount >= MAX_ERRORS && (now - lastErrorTime) < 5000) {
          console.error('Too many MediaPipe errors, falling back to camera-only mode');
          setIsFallbackMode(true);
          return;
        }
        
        lastErrorTime = now;
        
        // Continue processing with a small delay to prevent tight error loops
        setTimeout(() => requestAnimationFrame(processFrame), 100);
      }
    };
    
    setTimeout(processFrame, 500);
    
  } catch (error) {
    console.error('MediaPipe initialization error:', error);
    setIsFallbackMode(true);
    
    // Fallback: provide basic camera without hand tracking
    const fallbackDraw = () => {
      try {
        if (video && canvas && video.readyState >= 2) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Mirror the canvas for drawing
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          
          // Show fallback message
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, 10, canvas.width - 20, 60);
          ctx.fillStyle = '#fff';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Hand tracking unavailable', canvas.width / 2, 35);
          ctx.fillText('Camera only mode', canvas.width / 2, 55);
          ctx.textAlign = 'left';
        }
        requestAnimationFrame(fallbackDraw);
      } catch (fallbackError) {
        // If even fallback fails, just show the video element
        console.error('Fallback drawing failed:', fallbackError);
      }
    };
    
    // Start fallback mode
    setTimeout(fallbackDraw, 100);
  }
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
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3>Camera Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            marginTop: '10px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
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
          <p>Starting camera...</p>
        </div>
      )}
      
      {/* Status Indicators */}
      {cameraStarted && !isFallbackMode && isModelLoaded && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 5,
          fontSize: '12px'
        }}>
          ✅ {trainedSigns.length} Signs Ready
        </div>
      )}
      
      {isFallbackMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 152, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 5,
          fontSize: '12px'
        }}>
          📷 Camera Only Mode
        </div>
      )}
      
      <video 
        ref={videoRef} 
        style={{ 
          width: '100%',
          height: 'auto',
          minHeight: '400px',
          backgroundColor: '#000',
          display: 'block',
          transform: 'scaleX(-1)'
        }} 
        playsInline 
        muted 
        autoPlay
      />
      
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }} 
      />

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

export default WebcamHandTracker;