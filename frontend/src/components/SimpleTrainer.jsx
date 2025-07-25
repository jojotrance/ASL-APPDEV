import React, { useState } from 'react';
import SimpleHandTracker from './SimpleHandTracker';

const SimpleTrainer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSign, setCurrentSign] = useState('');
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [message, setMessage] = useState('');
  const [handsDetected, setHandsDetected] = useState({ left: false, right: false });

  const handleSignChange = (e) => {
    setCurrentSign(e.target.value);
    setMessage('');
  };

  const startRecording = () => {
    if (!currentSign.trim()) {
      setMessage('Please enter a sign name first');
      return;
    }
    
    setIsRecording(true);
    setRecordedFrames([]);
    setMessage('Recording... Make your sign!');
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setMessage('Processing...');

    if (recordedFrames.length === 0) {
      setMessage('No frames recorded. Try again.');
      return;
    }

    try {
      const signData = {
        label: currentSign.trim(),
        frames: recordedFrames,
        frameCount: recordedFrames.length,
        duration: recordedFrames.length * 100 // Approximate duration in ms
      };

      console.log('Saving sign data:', {
        label: signData.label,
        frameCount: signData.frameCount,
        framesPreview: recordedFrames.slice(0, 2)
      });

      const response = await fetch('/api/v1/signs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signData),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Sign "${currentSign}" saved successfully! (${recordedFrames.length} frames)`);
        setCurrentSign('');
        setRecordedFrames([]);
        console.log('Sign saved:', result);
      } else {
        const error = await response.text();
        setMessage(`❌ Failed to save sign: ${error}`);
        console.error('Save failed:', error);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      console.error('Save error:', error);
    }
  };

  const handleLandmarkData = (landmarks) => {
    if (isRecording && landmarks && landmarks.length > 0) {
      setRecordedFrames(prev => [...prev, landmarks]);
    }
  };

  const handleHandsDetected = (detected) => {
    setHandsDetected(detected);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🤟 Simple ASL Trainer
      </h1>
      
      {/* Sign Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '10px', 
          fontSize: '16px', 
          fontWeight: 'bold' 
        }}>
          Sign to Record:
        </label>
        <input
          type="text"
          value={currentSign}
          onChange={handleSignChange}
          placeholder="Enter sign name (e.g., hello, thank you)"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            marginBottom: '10px'
          }}
        />
      </div>

      {/* Recording Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        justifyContent: 'center'
      }}>
        <button
          onClick={startRecording}
          disabled={isRecording || !currentSign.trim()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isRecording ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRecording ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRecording ? '🔴 Recording...' : '🎬 Start Recording'}
        </button>
        
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isRecording ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isRecording ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⏹️ Stop Recording
        </button>
      </div>

      {/* Status Display */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          <strong>Hands Detected:</strong> 
          <span style={{ marginLeft: '10px' }}>
            Left: {handsDetected.left ? '✅' : '❌'} | 
            Right: {handsDetected.right ? '✅' : '❌'}
          </span>
        </div>
        
        {isRecording && (
          <div style={{
            padding: '10px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <strong>Frames Recorded:</strong> {recordedFrames.length}
          </div>
        )}
        
        {message && (
          <div style={{
            padding: '10px',
            backgroundColor: message.includes('✅') ? '#e8f5e8' : 
                           message.includes('❌') ? '#ffeaea' : '#fff3cd',
            color: message.includes('✅') ? '#155724' : 
                   message.includes('❌') ? '#721c24' : '#856404',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Camera Component */}
      <div style={{ textAlign: 'center' }}>
        <SimpleHandTracker
          onPrediction={handleLandmarkData}
          onHandsDetected={handleHandsDetected}
          mode="training"
        />
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h3 style={{ marginTop: 0 }}>Instructions:</h3>
        <ol>
          <li>Enter the name of the sign you want to record</li>
          <li>Make sure both hands are visible in the camera</li>
          <li>Click "Start Recording" and perform the sign slowly and clearly</li>
          <li>Click "Stop Recording" when done</li>
          <li>The sign will be saved to the database for recognition</li>
        </ol>
      </div>
    </div>
  );
};

export default SimpleTrainer;
