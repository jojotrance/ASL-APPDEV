import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';

function ASLDetector({ onSignDetected, onConfidenceChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainedSigns, setTrainedSigns] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [currentSign, setCurrentSign] = useState('');
  const [confidence, setConfidence] = useState(0);
  
  // Detection buffers for more accurate recognition
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  
  const BUFFER_SIZE = 5;
  const DETECTION_COOLDOWN = 1000;
  const CONFIDENCE_THRESHOLD = 0.10; // Lowered for more sensitivity

  // Load trained signs from database
  useEffect(() => {
    loadTrainedSigns();
  }, []);

  const loadTrainedSigns = async () => {
    try {
      const response = await fetch('/api/v1/signs/training-data');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Raw training data received:', data); // Debug log
        setTrainedSigns(data);
        setIsModelLoaded(data.length > 0);
        console.log(`✅ Loaded ${data.length} trained signs for ASL detection`);
      } else {
        console.error('Failed to load trained signs - Response not OK:', response.status);
      }
    } catch (error) {
      console.error('Error loading trained signs:', error);
    }
  };

  // Sign recognition using trained data
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

    console.log('Analyzing frame buffer with', recentFrames.length, 'frames'); // Debug

    recentFrames.forEach(frame => {
      const detection = recognizeSignFromTrainedData(frame.landmarks);
      console.log('Frame detection result:', detection); // Debug
      if (detection && detection.confidence > bestConfidence) {
        bestDetection = detection;
        bestConfidence = detection.confidence;
      }
    });

    console.log('Best detection:', bestDetection, 'confidence:', bestConfidence, 'threshold:', CONFIDENCE_THRESHOLD); // Debug

    if (bestDetection && bestConfidence > CONFIDENCE_THRESHOLD) {
      console.log('Detection found:', bestDetection.word, 'confidence:', bestConfidence); // Debug log
      setCurrentSign(bestDetection.word);
      setConfidence(Math.round(bestConfidence * 100));
      
      if (onSignDetected) {
        console.log('Calling onSignDetected with:', bestDetection.word); // Debug log
        onSignDetected(bestDetection.word);
      }
      if (onConfidenceChange) {
        console.log('Calling onConfidenceChange with:', Math.round(bestConfidence * 100)); // Debug log
        onConfidenceChange(Math.round(bestConfidence * 100));
      }
      
      setLastDetectionTime(now);
    } else {
      console.log('No detection above threshold or no detection found'); // Debug
    }
  };

  // Initialize camera and MediaPipe
  useEffect(() => {
    const startDetection = async () => {
      try {
        setIsLoading(true);
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) {
          console.error('Video or canvas ref not available');
          return;
        }

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        
        video.srcObject = stream;
        
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            await initializeMediaPipe();
            setIsLoading(false);
            
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

    startDetection();

    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
        video.srcObject = null;
      }
    };
  }, []);

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hands = new Hands({
        locateFile: (file) => {
          return `/mediapipe-hands/${file}`;
        }
      });
      
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
        selfieMode: true,
      });
      
      hands.onResults((results) => {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Mirror the canvas for drawing
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarksData = results.multiHandLandmarks.map(landmarks => 
              landmarks.map(point => ({
                x: Math.round(point.x * 1000) / 1000,
                y: Math.round(point.y * 1000) / 1000,
                z: Math.round(point.z * 1000) / 1000
              }))
            );

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
              if (newBuffer.length >= 3) {
                analyzeFrameBuffer(newBuffer);
              }
              return newBuffer;
            });

            // Draw minimal hand landmarks (mirrored)
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              const handedness = results.multiHandedness[i];
              // Draw key landmarks only
              const keyPoints = [0, 4, 8, 12, 16, 20]; // Wrist and fingertips
              keyPoints.forEach(pointIndex => {
                if (landmarks[pointIndex]) {
                  const point = landmarks[pointIndex];
                  const x = (1 - point.x) * canvas.width;
                  const y = point.y * canvas.height;
                  ctx.beginPath();
                  ctx.arc(x, y, 6, 0, 2 * Math.PI);
                  ctx.fillStyle = handedness.label === 'Left' ? '#2196F3' : '#4caf50';
                  ctx.fill();
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }
              });
            }
          } else {
            // No hands detected: clear buffer and detection
            setFrameBuffer([]);
            setCurrentSign('');
            setConfidence(0);
            if (onConfidenceChange) {
              onConfidenceChange(0);
            }
          }
        } catch (drawError) {
          console.error('Error in drawing:', drawError);
        }
      });

      hands.onError = (error) => {
        console.error('MediaPipe error:', error);
        setError(`MediaPipe error: ${error.message}`);
      };

      let isProcessing = false;

      const processFrame = async () => {
        try {
          // Only process if video and canvas are ready and have valid dimensions
          if (
            video.readyState === video.HAVE_ENOUGH_DATA &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            canvas.width > 0 &&
            canvas.height > 0 &&
            !isProcessing
          ) {
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
        padding: '20px', 
        textAlign: 'center', 
        color: '#f44336',
        background: '#ffebee',
        borderRadius: '10px',
        border: '1px solid #ffcdd2'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
        <h4>Detection Error</h4>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '5px',
            marginTop: '8px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      borderRadius: '10px', 
      overflow: 'hidden',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
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
          minHeight: '300px'
        }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            border: '3px solid #ffffff30',
            borderTop: '3px solid #2196F3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '12px'
          }}></div>
          <p>Initializing ASL Detection...</p>
        </div>
      )}
      
      {/* Detection Status */}
      {!isLoading && isModelLoaded && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          zIndex: 5,
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>🤟 ASL Detector Active</span>
          <span>{trainedSigns.length} signs loaded</span>
        </div>
      )}

      {/* Current Detection Display */}
      {currentSign && confidence > 0 && frameBuffer.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          background: 'rgba(76, 175, 80, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          zIndex: 5,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
            {currentSign.toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            Confidence: {confidence}%
          </div>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        style={{ 
          width: '100%',
          height: 'auto',
          minHeight: '300px',
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

export default ASLDetector;
