import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';

function WebcamHandTracker({ onSignDetected, onConfidenceChange, onCameraInfo, onHandsDetected, onPrediction }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainedSigns, setTrainedSigns] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);

  // Detection buffers for more accurate recognition
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [lastDetectedSign, setLastDetectedSign] = useState(null);

  const BUFFER_SIZE = 5;
  const DETECTION_COOLDOWN = 800;
  const CONFIDENCE_THRESHOLD = 0.15;

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

  // Advanced sign recognition using ML model
  const recognizeSignFromTrainedData = async (currentLandmarks) => {
    if (!currentLandmarks || currentLandmarks.length === 0) {
      return null;
    }

    try {
      console.log('📡 Sending landmarks to prediction API...');
      // Send landmarks to backend for ML model prediction
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landmarks: currentLandmarks
        })
      });

      if (response.ok) {
        const prediction = await response.json();
        console.log('🎯 Prediction response:', prediction);
        if (prediction.word && prediction.confidence > 0.15) {
          console.log(`✅ Valid prediction: ${prediction.word} (confidence: ${prediction.confidence})`);
          return {
            word: prediction.word,
            confidence: prediction.confidence
          };
        } else {
          console.log('❌ Prediction below confidence threshold or no word');
        }
      } else {
        console.error('Prediction API error:', response.statusText);
      }
    } catch (error) {
      console.error('Prediction API error:', error);
    }

    return null;
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

  const analyzeFrameBuffer = async (buffer) => {
    if (buffer.length < 3) return;

    const now = Date.now();
    if (now - lastDetectionTime < DETECTION_COOLDOWN) return;

    const recentFrames = buffer.slice(-3);
    let bestDetection = null;
    let bestConfidence = 0;

    // Process frames sequentially to avoid overwhelming the API
    for (const frame of recentFrames) {
      const detection = await recognizeSignFromTrainedData(frame.landmarks);
      if (detection && detection.confidence > bestConfidence) {
        bestDetection = detection;
        bestConfidence = detection.confidence;
      }
    }

    if (bestDetection && bestConfidence > CONFIDENCE_THRESHOLD) {
      // Only report if it's a new sign or confidence changed significantly
      if (bestDetection.word !== lastDetectedSign || Math.abs(bestConfidence * 100 - (typeof bestDetection.confidence === 'number' ? bestDetection.confidence * 100 : 0)) > 5) {
        if (onSignDetected) {
          onSignDetected(bestDetection.word);
        }
        if (onConfidenceChange) {
          onConfidenceChange(Math.round(bestConfidence * 100));
        }
        if (onPrediction) {
          console.log('🚀 Sending prediction to Learn.jsx:', bestDetection.word);
          onPrediction(bestDetection.word);
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

  try {
    console.log('🔄 Initializing MediaPipe...');
    
    // Wait for camera to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const hands = new Hands({
      locateFile: (file) => {
        const path = `/mediapipe-hands/${file}`;
        console.log(`📁 Loading MediaPipe file: ${path}`);
        return path;
      },
    });
    
    // Set simplified options
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });
    
    hands.onResults((results) => {
      try {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mirror the canvas for drawing
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
          
          // Update hands detected status
          if (results.multiHandedness) {
            results.multiHandedness.forEach((hand) => {
              if (hand.label === 'Left') handsDetected.left = true;
              if (hand.label === 'Right') handsDetected.right = true;
            });
          } else {
            // If handedness not available, assume both hands detected
            handsDetected.left = landmarksData.length > 0;
            handsDetected.right = landmarksData.length > 1;
          }
          
          // Send landmarks for prediction
          if (landmarksData.length > 0) {
            predictSign(landmarksData);
          }
        }
        
        // Update hands detected callback
        if (onHandsDetected) {
          onHandsDetected(handsDetected);
        }
        
      } catch (error) {
        console.error('Error in results processing:', error);
      }
    });
    
    console.log('✅ MediaPipe initialized successfully');
    
    // Start processing frames
    const processFrame = async () => {
      try {
        if (video.readyState === 4) {
          await hands.send({ image: video });
        }
      } catch (error) {
        console.error('Frame processing error:', error);
        // Don't rethrow, just log and continue
      }
      
      frameId = requestAnimationFrame(processFrame);
    };
    
    // Start with a delay to ensure everything is ready
    setTimeout(() => {
      console.log('🎬 Starting frame processing...');
      processFrame();
    }, 500);
    
  } catch (error) {
    console.error('MediaPipe initialization error:', error);
    setError(`MediaPipe failed to initialize: ${error.message}`);
  }
};

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

    // Add error handler
    hands.onError = (error) => {
      console.error('MediaPipe error:', error);
      setError(`MediaPipe error: ${error.message}`);
    };

    // Improved frame processing with error handling
    let isProcessing = false;
    
    const processFrame = async () => {
      try {
        if (video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing) {
          isProcessing = true;
          await hands.send({ image: video });
          isProcessing = false;
        }
      } catch (error) {
        console.error('Frame processing error:', error);
        isProcessing = false;
      }
      
      requestAnimationFrame(processFrame);
    };

    // Start processing with delay
    setTimeout(() => {
      processFrame();
    }, 500);

  } catch (err) {
    console.error('MediaPipe initialization error:', err);
    setError(`MediaPipe failed to initialize: ${err.message}`);
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
      
      {/* Model Status Indicator */}
      {cameraStarted && isModelLoaded && (
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