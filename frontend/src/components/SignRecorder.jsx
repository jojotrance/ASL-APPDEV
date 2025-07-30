import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';

function SignRecorder() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [signLabel, setSignLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [hands, setHands] = useState(null);
  const [detectedHands, setDetectedHands] = useState([]);

  const RECORDING_DURATION = 2000; // Reduced to 2 seconds for smaller payload
  const FRAME_SKIP = 3; // Only capture every 3rd frame to reduce data

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameCounter = 0;
    let animationId;
    let isMounted = true;

    const handsInstance = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`,
    });

    handsInstance.setOptions({
      maxNumHands: 2, // Track both hands
      modelComplexity: 1, // Increased complexity for better dual hand tracking
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

      if (results.multiHandLandmarks && isRecording) {
        frameCounter++;
        
        // Only capture every FRAME_SKIP frames to reduce payload size
        if (frameCounter % FRAME_SKIP === 0) {
          // Optimize landmarks data with reduced precision
          const optimizedLandmarks = results.multiHandLandmarks.map(landmarks => {
            return landmarks.map(point => ({
              x: Math.round(point.x * 100) / 100, // Round to 2 decimal places
              y: Math.round(point.y * 100) / 100,
              z: Math.round(point.z * 100) / 100
            }));
          });

          setRecordedFrames(prev => {
            const newFrames = [...prev, {
              timestamp: Date.now(),
              landmarks: optimizedLandmarks,
              handedness: results.multiHandedness?.map(h => h.label) || []
            }];
            setFrameCount(newFrames.length);
            return newFrames;
          });
        }
      }

      // Draw hand landmarks
      if (results.multiHandLandmarks) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
          const handedness = results.multiHandedness?.[index];
          
          // Draw hand landmarks
          landmarks.forEach((point, pointIndex) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            // Different colors for left and right hand
            if (handedness?.label === 'Left') {
              ctx.fillStyle = isRecording ? '#f44336' : '#2196F3'; // Red/Blue for left hand
            } else {
              ctx.fillStyle = isRecording ? '#ff9800' : '#4caf50'; // Orange/Green for right hand
            }
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          });

          // Draw connections
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
          ];

          // Different colors for left and right hand connections
          if (handedness?.label === 'Left') {
            ctx.strokeStyle = isRecording ? '#f44336' : '#2196F3'; // Red/Blue for left hand
          } else {
            ctx.strokeStyle = isRecording ? '#ff9800' : '#4caf50'; // Orange/Green for right hand
          }
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
    });

    setHands(handsInstance);

    async function startCamera() {
      try {
        setIsLoading(true);
        
        // Stop any existing video stream first
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
          video.srcObject = null;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, // Reduced resolution for better performance
            height: { ideal: 480 },
            facingMode: 'user'
          } 
        });
        
        video.srcObject = stream;
        
        // Use a promise to ensure proper loading
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
          // Silently handle MediaPipe errors to prevent spam
          if (error.name !== 'BindingError') {
            console.error('MediaPipe error:', error);
          }
          return; // Stop processing on error
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
      } catch (error) {
        // Ignore cleanup errors
      }
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    if (!signLabel.trim()) {
      alert('Please enter a sign label before recording');
      return;
    }
    
    setRecordedFrames([]);
    setFrameCount(0);
    setIsRecording(true);

    // Stop recording after specified duration
    setTimeout(() => {
      setIsRecording(false);
    }, RECORDING_DURATION);
  };

  const saveRecording = async () => {
    if (recordedFrames.length === 0) {
      alert('No recording data to save');
      return;
    }

    // Additional data optimization before sending
    const optimizedPayload = {
      label: signLabel.trim().toLowerCase(),
      frames: recordedFrames.slice(0, 15), // Limit to maximum 15 frames
      frameCount: Math.min(recordedFrames.length, 15),
      duration: RECORDING_DURATION
    };

    try {
      console.log(`Sending ${optimizedPayload.frames.length} frames for sign: ${optimizedPayload.label}`);
      console.log('Payload size:', JSON.stringify(optimizedPayload).length, 'bytes');
      
      const response = await fetch('/api/v1/signs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimizedPayload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        alert(`Sign "${signLabel}" saved successfully with ${optimizedPayload.frameCount} frames!`);
        setRecordedFrames([]);
        setSignLabel('');
        setFrameCount(0);
      } else {
        // Check if the response is JSON or HTML error page
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          const textResponse = await response.text();
          console.error('Server error (non-JSON):', textResponse);
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Error saving sign:', error);
      if (error.message.includes('DOCTYPE')) {
        alert('Server connection error. Please make sure the backend server is running on the correct port.');
      } else if (error.message.includes('fetch')) {
        alert('Network error. Please check your internet connection and backend server.');
      } else {
        alert('Failed to save sign: ' + error.message);
      }
    }
  };

  const clearRecording = () => {
    setRecordedFrames([]);
    setFrameCount(0);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)',
    padding: '2rem 1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  };

  const contentStyle = {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '2.5rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '2rem',
    background: 'linear-gradient(45deg, #1e40af, #3730a3)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const inputStyle = {
    maxWidth: '850px',
    width: '100%',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    border: '2px solid rgba(30, 64, 175, 0.2)',
    borderRadius: '16px',
    marginBottom: '1rem',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: '140px',
    fontFamily: 'inherit',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(45deg, #ef4444, #dc2626)',
    color: 'white'
  };

  const successButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(45deg, #10b981, #059669)',
    color: 'white'
  };

  const warningButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(45deg, #f59e0b, #d97706)',
    color: 'white'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    background: '#e5e7eb',
    color: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  };

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{
          ...contentStyle,
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📷</div>
          <h3 style={{ 
            color: '#dc2626', 
            fontSize: '1.5rem', 
            fontWeight: '700',
            marginBottom: '1rem'
          }}>
            Camera Access Error
          </h3>
          <p style={{ color: '#7f1d1d', fontSize: '1.1rem' }}>{error}</p>
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(252, 165, 165, 0.2)',
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: '#991b1b'
          }}>
            💡 Please ensure camera permissions are enabled and try refreshing the page
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>

      <div style={contentStyle}>
        <h2 style={titleStyle}>📹 Sign Language Recorder</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter sign label (e.g., 'hello', 'thank you')"
            value={signLabel}
            onChange={(e) => setSignLabel(e.target.value)}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = '#1e40af';
              e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(30, 64, 175, 0.2)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#6b7280', 
            textAlign: 'center',
            background: 'rgba(30, 64, 175, 0.05)',
     
            borderRadius: '12px',
            border: '1px solid rgba(30, 64, 175, 0.1)'
          }}>
            ⏱️ Recording will capture {RECORDING_DURATION/1000} seconds with both hands tracking and optimized data
          </div>
        </div>

        <div style={{ 
          position: 'relative', 
          width: '100%', 
          borderRadius: '20px', 
          overflow: 'hidden', 
          marginBottom: '2rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)'
        }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(30, 64, 175, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 10,
              minHeight: '400px'
            }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1.5rem'
              }}></div>
              <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>🎥 Initializing camera...</p>
              <p style={{ fontSize: '0.9rem', opacity: '0.8', marginTop: '0.5rem' }}>
                Setting up MediaPipe hand tracking
              </p>
            </div>
          )}

          {isRecording && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '25px',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                background: 'white',
                borderRadius: '50%',
                animation: 'blink 1s infinite'
              }}></div>
              <span style={{ fontWeight: '600' }}>RECORDING</span>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '0.85rem'
              }}>
                Frame {frameCount}
              </span>
            </div>
          )}

          {/* Hand detection indicator */}
          {!isLoading && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '16px',
              zIndex: 5,
              fontSize: '0.9rem',
              minWidth: '140px'
            }}>
              <div style={{ marginBottom: '8px', fontWeight: '700', fontSize: '0.8rem', opacity: '0.8' }}>
                🤚 HANDS DETECTED
              </div>
              {detectedHands.length === 0 ? (
                <div style={{ 
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }}></div>
                  No hands detected
                </div>
              ) : (
                detectedHands.map((hand, index) => (
                  <div key={index} style={{ 
                    color: hand === 'Left' ? '#93c5fd' : '#86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: index < detectedHands.length - 1 ? '4px' : '0',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: hand === 'Left' ? '#3b82f6' : '#10b981'
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
              transform: 'scaleX(-1)',
              borderRadius: '20px'
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
              transform: 'scaleX(-1)',
              borderRadius: '20px'
            }} 
          />
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <button
            onClick={startRecording}
            disabled={isRecording || !signLabel.trim() || isLoading}
            style={isRecording || !signLabel.trim() || isLoading ? disabledButtonStyle : primaryButtonStyle}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {isRecording ? '🔴 Recording...' : '🎬 Start Recording'}
          </button>

          <button
            onClick={saveRecording}
            disabled={recordedFrames.length === 0}
            style={recordedFrames.length === 0 ? disabledButtonStyle : successButtonStyle}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            💾 Save Sign
          </button>

          <button
            onClick={clearRecording}
            disabled={recordedFrames.length === 0}
            style={recordedFrames.length === 0 ? disabledButtonStyle : warningButtonStyle}
            onMouseEnter={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.target.disabled) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            🗑️ Clear
          </button>
        </div>

        {recordedFrames.length > 0 && (
          <div style={{ 
            padding: '1.5rem', 
            background: 'linear-gradient(45deg, #d1fae5, #a7f3d0)',
            borderRadius: '16px',
            textAlign: 'center',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#065f46', marginBottom: '0.5rem' }}>
              ✅ Recording Complete!
            </div>
            <p style={{ color: '#047857', margin: '0 0 0.5rem 0' }}>
              Captured <strong>{recordedFrames.length} optimized frames</strong> for sign: <strong>"{signLabel}"</strong>
            </p>
            <p style={{ 
              fontSize: '0.9rem', 
              color: '#059669',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              📊 Data size: <strong>{Math.round(JSON.stringify(recordedFrames).length / 1024)} KB</strong>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                Optimized for transmission
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignRecorder;