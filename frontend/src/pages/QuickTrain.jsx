import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickTrain = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('setup'); // setup, recording, training, testing, complete
  const [signToRecord, setSignToRecord] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [trainingStatus, setTrainingStatus] = useState('');
  const [modelAccuracy, setModelAccuracy] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  
  const recordingDuration = 3000; // 3 seconds
  
  // Common ASL signs for quick training
  const commonSigns = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'Hello', 'Thank You', 'Please', 'Help', 'Yes', 'No'
  ];

  useEffect(() => {
    if (currentStep === 'setup') {
      initializeCamera();
    }
    return () => {
      cleanup();
    };
  }, [currentStep]);

  const initializeCamera = async () => {
    try {
      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            console.log('✅ Camera video playing successfully');
          });
        };
        
        // Wait for actual video data, not just metadata
        videoRef.current.onloadeddata = () => {
          console.log('📹 Video data loaded');
          startVideoDisplay();
        };
        
        // Backup - start after a delay regardless
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            console.log('⏰ Timeout fallback: starting video display');
            startVideoDisplay();
          }
        }, 2000);
      }
      
      setMessage('Camera ready! Enter the ASL sign you want to train.');
      setError('');
    } catch (err) {
      console.error('❌ Camera access error:', err);
      setError('Failed to access camera: ' + err.message);
    }
  };

  const startVideoDisplay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) {
      console.error('❌ Missing video or canvas in startVideoDisplay');
      return;
    }
    
    console.log('🎨 Starting video display on canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;
    
    const drawFrame = () => {
      if (video.readyState >= 2) {
        // Debug: check video dimensions
        if (!drawFrame.logged) {
          console.log('� Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          drawFrame.logged = true;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(-1, 1); // Mirror like selfie
        ctx.translate(-canvas.width, 0);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        console.log('⏳ Video not ready, state:', video.readyState);
      }
      // KEEP DRAWING FRAMES CONTINUOUSLY
      requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = () => {
    if (!signToRecord.trim()) {
      setError('Please enter the sign you want to record!');
      return;
    }

    if (!streamRef.current) {
      setError('Camera not ready!');
      return;
    }

    setError('');
    setCurrentStep('recording');
    
    // Countdown before recording
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown('RECORD!');
        clearInterval(countdownInterval);
        
        setTimeout(() => {
          setCountdown(null);
          actuallyStartRecording();
        }, 500);
      }
    }, 1000);
  };

  const actuallyStartRecording = () => {
    try {
      chunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideo(blob);
        setCurrentStep('training');
        trainModel(blob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMessage(`Recording "${signToRecord}" for ${recordingDuration/1000} seconds...`);
      
      // Stop recording after duration
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, recordingDuration);
      
    } catch (err) {
      setError('Recording failed: ' + err.message);
      setCurrentStep('setup');
    }
  };

  const trainModel = async (videoBlob) => {
    try {
      setTrainingStatus('Processing video and training model...');
      setMessage('Please wait while we train the model with your recording.');
      
      const formData = new FormData();
      formData.append('video', videoBlob, `${signToRecord}.webm`);
      formData.append('sign', signToRecord);  // Changed from 'label' to 'sign'
      
      console.log('📤 Sending training request for sign:', signToRecord);
      
      const response = await fetch('/api/quick-train', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setModelAccuracy(result.accuracy);
        setTrainingStatus('Training completed successfully!');
        setCurrentStep('complete');
        setMessage(`Model trained with ${result.accuracy}% accuracy on your recording of "${signToRecord}"`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Training failed');
      }
    } catch (err) {
      setError('Training failed: ' + err.message);
      setTrainingStatus('Training failed');
      setCurrentStep('setup');
    }
  };

  const resetTraining = () => {
    setCurrentStep('setup');
    setSignToRecord('');
    setRecordedVideo(null);
    setMessage('');
    setError('');
    setTrainingStatus('');
    setModelAccuracy(null);
    setCountdown(null);
    setIsRecording(false);
    initializeCamera();
  };

  const goToRecognition = () => {
    cleanup();
    navigate('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2>🚀 Quick Train a Sign</h2>
            <p>Record yourself performing an ASL sign to instantly train the model!</p>
            
            <div style={{ margin: '20px 0' }}>
              <input
                type="text"
                value={signToRecord}
                onChange={(e) => setSignToRecord(e.target.value)}
                placeholder="Enter the sign to record (e.g., 'A', 'Hello')"
                style={{
                  padding: '12px',
                  fontSize: '16px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  width: '300px',
                  marginRight: '10px'
                }}
              />
            </div>
            
            <div style={{ margin: '20px 0' }}>
              <h3>Common Signs:</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                justifyContent: 'center',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                {commonSigns.map(sign => (
                  <button
                    key={sign}
                    onClick={() => setSignToRecord(sign)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: signToRecord === sign ? '#4CAF50' : '#f0f0f0',
                      color: signToRecord === sign ? 'white' : '#333',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {sign}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startRecording}
              disabled={!signToRecord.trim()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: signToRecord.trim() ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: signToRecord.trim() ? 'pointer' : 'not-allowed',
                marginTop: '20px'
              }}
            >
              Start Recording
            </button>
          </div>
        );
      
      case 'recording':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2>📹 Recording "{signToRecord}"</h2>
            {countdown && (
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: countdown === 'RECORD!' ? '#f44336' : '#4CAF50',
                margin: '20px 0'
              }}>
                {countdown}
              </div>
            )}
            {isRecording && (
              <div style={{
                fontSize: '24px',
                color: '#f44336',
                fontWeight: 'bold',
                margin: '20px 0'
              }}>
                🔴 RECORDING...
              </div>
            )}
          </div>
        );
      
      case 'training':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2>🧠 Training Model</h2>
            <div style={{ fontSize: '18px', margin: '20px 0' }}>
              {trainingStatus}
            </div>
            <div style={{ 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '20px auto'
            }}></div>
          </div>
        );
      
      case 'complete':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2>✅ Training Complete!</h2>
            <div style={{ fontSize: '18px', margin: '20px 0', color: '#4CAF50' }}>
              Successfully trained model for "{signToRecord}"
            </div>
            {modelAccuracy && (
              <div style={{ fontSize: '16px', margin: '10px 0' }}>
                Model Accuracy: {modelAccuracy}%
              </div>
            )}
            
            <div style={{ margin: '30px 0' }}>
              <button
                onClick={goToRecognition}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Test Recognition
              </button>
              
              <button
                onClick={resetTraining}
                style={{
                  padding: '15px 30px',
                  fontSize: '16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Train Another Sign
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#333' }}>Quick Train</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Camera Feed */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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
          {/* Debug info */}
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '10px' 
          }}>
            {streamRef.current ? '📹 Stream Connected' : '❌ No Stream'}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e8',
            color: '#2d5a2d',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#fdeaea',
            color: '#a94442',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Step Content */}
        {renderStep()}
      </div>

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuickTrain;
