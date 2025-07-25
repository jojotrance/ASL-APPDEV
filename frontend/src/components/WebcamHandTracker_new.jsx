import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const WebcamHandTracker = ({
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
  
  const BUFFER_SIZE = 30; // frames for detection

  const predictSign = useCallback(async (landmarksData) => {
    if (!landmarksData || landmarksData.length === 0) return;
    
    try {
      // Process landmarks for prediction
      const processedFeatures = landmarksData[0].flat().map(coord => 
        typeof coord === 'object' ? [coord.x, coord.y, coord.z] : coord
      ).flat();

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          landmarks: processedFeatures
        })
      });

      if (response.ok) {
        const result = await response.json();
        setConfidence(result.confidence);
        
        if (onConfidenceChange) {
          onConfidenceChange(result.confidence);
        }
        
        if (onPrediction) {
          onPrediction(result.prediction, result.confidence);
        }
      }
    } catch (error) {
      console.error('Prediction error:', error);
    }
  }, [onConfidenceChange, onPrediction]);

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
            initializeMediaPipe();
          });
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera access failed: ${err.message}`);
    }
  }, []);

  const initializeMediaPipe = useCallback(async () => {
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
              // If handedness not available, assume hands detected
              handsDetected.left = landmarksData.length > 0;
              handsDetected.right = landmarksData.length > 1;
            }
            
            // Send landmarks for prediction
            if (landmarksData.length > 0) {
              predictSign(landmarksData);
            }
            
            // Draw hand landmarks (mirrored)
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              const handedness = results.multiHandedness?.[i];
              
              for (let j = 0; j < landmarks.length; j++) {
                const point = landmarks[j];
                // Mirror the x coordinate for landmarks
                const x = (1 - point.x) * canvas.width;
                const y = point.y * canvas.height;
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fillStyle = handedness?.label === 'Left' ? '#2196F3' : '#4caf50';
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
              
              ctx.strokeStyle = handedness?.label === 'Left' ? '#2196F3' : '#4caf50';
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
  }, [predictSign, onHandsDetected, onConfidenceChange]);

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas size
      canvas.width = 640;
      canvas.height = 480;
      
      startCamera();
    }
    
    return () => {
      // Cleanup
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
      
      {/* Status indicators */}
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
      
      {isRecording && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f44336',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          🔴 Recording {recordingTime}s
        </div>
      )}
      
      {targetSign && mode === 'practice' && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(76,175,80,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Target: {targetSign}
        </div>
      )}
    </div>
  );
};

export default WebcamHandTracker;
