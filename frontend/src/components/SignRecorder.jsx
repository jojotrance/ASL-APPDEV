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
    <div style={{ 
        minHeight: '100vh',
        width: '100%',
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #EBF4FF 0%, #E6FFFA 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        padding: '30px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
        color: '#2563EB',
        fontSize: '2rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
        fontWeight: '600'
      }}>Sign Language Recorder</h2>
      
      <div style={{ 
        marginBottom: '25px',
        background: 'white',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
      }}>
        <input
          type="text"
          placeholder="Enter sign label (e.g., 'hello', 'thank you')"
          value={signLabel}
          onChange={(e) => setSignLabel(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            border: '2px solid #E2E8F0',
            borderRadius: '12px',
            marginBottom: '12px',
            transition: 'all 0.3s ease',
            outline: 'none',
            ':focus': {
              borderColor: '#2563EB',
              boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
            }
          }}
        />
        <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
          Recording will capture {RECORDING_DURATION/1000} seconds with both hands tracking and optimized data
        </div>
      </div>

      <div style={{ 
        position: 'relative', 
        width: '100%', 
        borderRadius: '20px', 
        overflow: 'hidden', 
        marginBottom: '25px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        background: '#FFFFFF'
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

        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: '#f44336',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: 'white',
              borderRadius: '50%',
              animation: 'blink 1s infinite'
            }}></div>
            RECORDING - Frame {frameCount}
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

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={startRecording}
          disabled={isRecording || !signLabel.trim() || isLoading}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: isRecording ? '#E2E8F0' : '#3B82F6',
            color: isRecording ? '#94A3B8' : 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: isRecording ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            fontWeight: '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'scale(1)',
            boxShadow: isRecording ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              backgroundColor: isRecording ? '#E2E8F0' : '#60A5FA',
              transform: isRecording ? 'none' : 'scale(1.05)',
              boxShadow: isRecording ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.4)'
            }
          }}
        >
          {isRecording ? '📹 Recording...' : '📹 Start Recording'}
        </button>

        <button
          onClick={saveRecording}
          disabled={recordedFrames.length === 0}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: recordedFrames.length === 0 ? '#E2E8F0' : '#3B82F6',
            color: recordedFrames.length === 0 ? '#94A3B8' : 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: recordedFrames.length === 0 ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            fontWeight: '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'scale(1)',
            boxShadow: recordedFrames.length === 0 ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              backgroundColor: recordedFrames.length === 0 ? '#E2E8F0' : '#60A5FA',
              transform: recordedFrames.length === 0 ? 'none' : 'scale(1.05)',
              boxShadow: recordedFrames.length === 0 ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.4)'
            }
          }}
        >
          💾 Save Sign
        </button>

        <button
          onClick={clearRecording}
          disabled={recordedFrames.length === 0}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            backgroundColor: recordedFrames.length === 0 ? '#E2E8F0' : '#3B82F6',
            color: recordedFrames.length === 0 ? '#94A3B8' : 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: recordedFrames.length === 0 ? 'not-allowed' : 'pointer',
            minWidth: '140px',
            fontWeight: '600',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'scale(1)',
            boxShadow: recordedFrames.length === 0 ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              backgroundColor: recordedFrames.length === 0 ? '#E2E8F0' : '#60A5FA',
              transform: recordedFrames.length === 0 ? 'none' : 'scale(1.05)',
              boxShadow: recordedFrames.length === 0 ? 'none' : '0 8px 20px rgba(59, 130, 246, 0.4)'
            }
          }}
        >
          Clear
        </button>
      </div>

      {recordedFrames.length > 0 && (
        <div style={{ 
          marginTop: '25px', 
          padding: '20px', 
          background: 'linear-gradient(to right, #E0F2FE, #E0F7FF)',
          borderRadius: '15px',
          textAlign: 'center',
          border: '1px solid #BAE6FD',
          boxShadow: '0 4px 12px rgba(186, 230, 253, 0.2)'
        }}>
          <p>✅ Recorded {recordedFrames.length} optimized frames for sign: <strong>{signLabel}</strong></p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Data size optimized for safe transmission ({Math.round(JSON.stringify(recordedFrames).length / 1024)} KB)
          </p>
        </div>
      )}

      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        `}
      </style>
      </div>
    </div>
  );
}

export default SignRecorder;