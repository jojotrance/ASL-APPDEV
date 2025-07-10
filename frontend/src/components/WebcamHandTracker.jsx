import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';

function WebcamHandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    
    hands.onResults((results) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (results.multiHandLandmarks) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const landmarks = results.multiHandLandmarks[i];
          const handedness = results.multiHandedness[i];
          
          // Draw hand landmarks
          for (let j = 0; j < landmarks.length; j++) {
            const point = landmarks[j];
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            
            // Draw landmark points
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = handedness.label === 'Left' ? '#2196F3' : '#1976D2';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          
          // Draw hand connections
          const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            [5, 9], [9, 13], [13, 17] // Palm
          ];
          
          ctx.strokeStyle = handedness.label === 'Left' ? '#2196F3' : '#1976D2';
          ctx.lineWidth = 2;
          
          connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            ctx.beginPath();
            ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
            ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
            ctx.stroke();
          });
        }
      }
    });

    async function startCamera() {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        
        video.srcObject = stream;
        video.play();
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setIsLoading(false);
          requestAnimationFrame(processFrame);
        };
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        setIsLoading(false);
        console.error('Camera error:', err);
      }
    }

    async function processFrame() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        await hands.send({ image: video });
      }
      requestAnimationFrame(processFrame);
    }

    startCamera();
    
    return () => {
      hands.close();
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
          <p>Initializing camera...</p>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        style={{ 
          width: '100%', 
          display: isLoading ? 'none' : 'block',
          transform: 'scaleX(-1)' // Mirror the video
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
          transform: 'scaleX(-1)' // Mirror the canvas
        }} 
      />
    </div>
  );
}

export default WebcamHandTracker;
