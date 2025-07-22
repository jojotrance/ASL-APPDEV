import React, { useState, useRef, useEffect } from 'react';

const QuickTrainer = ({ onComplete, onClose }) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setMessage('Camera ready! Enter the ASL sign you want to train.');
    } catch (err) {
      setError('Camera access failed: ' + err.message);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = async () => {
    if (!signToRecord.trim()) {
      setError('Please enter a sign to record');
      return;
    }

    try {
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedVideo({
          blob,
          sign: signToRecord.trim()
        });
        
        setCurrentStep('training');
        await trainModel(blob, signToRecord.trim());
      };
      
      // Start countdown
      setCurrentStep('recording');
      setCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setCountdown(null);
            setMessage(`Recording ${signToRecord}...`);
            
            // Start actual recording
            mediaRecorder.start(100);
            setIsRecording(true);
            
            // Stop recording after duration
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
              }
            }, recordingDuration);
            
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const trainModel = async (videoBlob, sign) => {
    setMessage('Training model with your sign...');
    setTrainingStatus('📤 Uploading video...');
    
    try {
      const formData = new FormData();
      formData.append('video', videoBlob, `${sign}.webm`);
      formData.append('sign', sign);
      formData.append('quickTrain', 'true'); // Flag for immediate training
      
      setTrainingStatus('🤖 Processing and training...');
      
      const response = await fetch('http://localhost:5000/api/quick-train', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setModelAccuracy(result.accuracy);
        setTrainingStatus('✅ Training completed!');
        setMessage(`Success! Model trained on "${sign}" with ${(result.accuracy * 100).toFixed(1)}% accuracy`);
        setCurrentStep('testing');
      } else {
        const errorText = await response.text();
        throw new Error(`Training failed: ${response.status} ${errorText}`);
      }
      
    } catch (err) {
      setError('Training failed: ' + err.message);
      setTrainingStatus('❌ Training failed');
    }
  };

  const testRecognition = () => {
    setMessage(`Now try signing "${signToRecord}" again to test recognition!`);
    setCurrentStep('complete');
    if (onComplete) {
      onComplete({ sign: signToRecord, accuracy: modelAccuracy });
    }
  };

  const resetTrainer = () => {
    setCurrentStep('setup');
    setSignToRecord('');
    setRecordedVideo(null);
    setMessage('');
    setError('');
    setTrainingStatus('');
    setModelAccuracy(null);
  };

  return (
    <div className="quick-trainer-overlay">
      <div className="quick-trainer-modal">
        <div className="header">
          <h2>🚀 Quick ASL Trainer</h2>
          <p>Record one sign, get instant recognition!</p>
          {onClose && (
            <button className="close-btn" onClick={onClose}>×</button>
          )}
        </div>

        <div className="content">
          {/* Camera View */}
          <div className="camera-section">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                borderRadius: '10px',
                border: '2px solid #ddd'
              }}
            />
            
            {countdown && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
              </div>
            )}
            
            {isRecording && (
              <div className="recording-indicator">
                <div className="pulse-dot"></div>
                <span>RECORDING</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="controls-section">
            {currentStep === 'setup' && (
              <div className="setup-controls">
                <div className="input-group">
                  <label>What ASL sign do you want to train?</label>
                  <input
                    type="text"
                    value={signToRecord}
                    onChange={(e) => setSignToRecord(e.target.value)}
                    placeholder="e.g., A, Hello, Thank You"
                    list="common-signs"
                  />
                  <datalist id="common-signs">
                    {commonSigns.map(sign => (
                      <option key={sign} value={sign} />
                    ))}
                  </datalist>
                </div>
                
                <button 
                  className="record-btn"
                  onClick={startRecording}
                  disabled={!signToRecord.trim()}
                >
                  🎥 Start Recording
                </button>
              </div>
            )}
            
            {currentStep === 'recording' && (
              <div className="recording-status">
                <h3>Get Ready!</h3>
                <p>Position your hands and prepare to sign: <strong>{signToRecord}</strong></p>
              </div>
            )}
            
            {currentStep === 'training' && (
              <div className="training-status">
                <h3>Training in Progress</h3>
                <p>{trainingStatus}</p>
                <div className="loading-spinner"></div>
              </div>
            )}
            
            {currentStep === 'testing' && (
              <div className="testing-controls">
                <h3>✅ Training Complete!</h3>
                <p>Model accuracy: <strong>{(modelAccuracy * 100).toFixed(1)}%</strong></p>
                <div className="action-buttons">
                  <button className="test-btn" onClick={testRecognition}>
                    🎯 Test Recognition
                  </button>
                  <button className="reset-btn" onClick={resetTrainer}>
                    🔄 Train Another Sign
                  </button>
                </div>
              </div>
            )}
            
            {currentStep === 'complete' && (
              <div className="complete-status">
                <h3>🎉 Ready to Test!</h3>
                <p>Switch to Recognition Mode and try signing "<strong>{signToRecord}</strong>" again!</p>
                <button className="reset-btn" onClick={resetTrainer}>
                  🔄 Train Another Sign
                </button>
              </div>
            )}
          </div>

          {/* Messages */}
          {message && (
            <div className="message success">
              {message}
            </div>
          )}
          
          {error && (
            <div className="message error">
              {error}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .quick-trainer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .quick-trainer-modal {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .header h2 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }
        
        .header p {
          margin: 0;
          color: #666;
        }
        
        .close-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          font-size: 18px;
        }
        
        .camera-section {
          position: relative;
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .countdown-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .countdown-number {
          font-size: 2rem;
          font-weight: bold;
        }
        
        .recording-indicator {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .controls-section {
          margin-bottom: 1rem;
        }
        
        .input-group {
          margin-bottom: 1rem;
        }
        
        .input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
          color: #333;
        }
        
        .input-group input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }
        
        .record-btn, .test-btn, .reset-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin: 0.25rem;
        }
        
        .record-btn {
          background: #4CAF50;
          color: white;
          width: 100%;
        }
        
        .test-btn {
          background: #2196F3;
          color: white;
        }
        
        .reset-btn {
          background: #ff9800;
          color: white;
        }
        
        .record-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }
        
        .training-status, .testing-controls, .complete-status {
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 1rem auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-top: 1rem;
          text-align: center;
          font-weight: bold;
        }
        
        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default QuickTrainer;
