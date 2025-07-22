import React, { useState, useEffect } from 'react';

function ModelTrainer() {
  const [signs, setSigns] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [modelStatus, setModelStatus] = useState('Not Trained');
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    try {
      const response = await fetch('/api/v1/signs/all');
      const data = await response.json();
      setSigns(data);
    } catch (error) {
      console.error('Error fetching signs:', error);
    }
  };

  const prepareTrainingData = (signsData) => {
    const features = [];
    const labels = [];

    signsData.forEach(sign => {
      sign.frames.forEach(frame => {
        if (frame.landmarks && frame.landmarks.length > 0) {
          // Flatten landmarks into a feature vector
          const flatLandmarks = frame.landmarks[0].map(point => [point.x, point.y, point.z]).flat();
          features.push(flatLandmarks);
          labels.push(sign.word || sign.label); // Handle both 'word' and 'label' fields
        }
      });
    });

    return { features, labels };
  };

  const trainModel = async () => {
    if (signs.length < 2) {
      alert('Need at least 2 different signs to train a model');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Fetch full training data
      const response = await fetch('/api/v1/signs/training-data');
      const trainingData = await response.json();

      const { features, labels } = prepareTrainingData(trainingData);

      if (features.length === 0) {
        throw new Error('No valid training data found');
      }

      // Simulate training progress
      for (let i = 0; i <= 100; i += 10) {
        setTrainingProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Save model data to localStorage for now (in production, you'd save to server)
      const modelData = {
        features,
        labels,
        uniqueLabels: [...new Set(labels)],
        trainedAt: new Date().toISOString(),
        sampleCount: features.length
      };

      localStorage.setItem('aslModel', JSON.stringify(modelData));
      setModelStatus('Trained');
      
      alert(`Model trained successfully with ${features.length} samples from ${modelData.uniqueLabels.length} different signs!`);
    } catch (error) {
      console.error('Error training model:', error);
      alert('Failed to train model: ' + error.message);
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  const deleteSign = async (signId) => {
    if (window.confirm('Are you sure you want to delete this sign?')) {
      try {
        await fetch(`/api/v1/signs/${signId}`, { method: 'DELETE' });
        fetchSigns();
      } catch (error) {
        console.error('Error deleting sign:', error);
        alert('Failed to delete sign');
      }
    }
  };

  const signGroups = signs.reduce((groups, sign) => {
    const label = sign.word || sign.label; // Handle both 'word' and 'label' fields
    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(sign);
    return groups;
  }, {});

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Model Training Dashboard</h2>
      
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '10px', 
        marginBottom: '20px' 
      }}>
        <h3>Training Status</h3>
        <p><strong>Model Status:</strong> {modelStatus}</p>
        <p><strong>Total Signs:</strong> {Object.keys(signGroups).length}</p>
        <p><strong>Total Recordings:</strong> {signs.length}</p>
        
        {isTraining && (
          <div style={{ marginTop: '10px' }}>
            <p>Training Progress: {trainingProgress}%</p>
            <div style={{ 
              width: '100%', 
              height: '10px', 
              background: '#ddd', 
              borderRadius: '5px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${trainingProgress}%`, 
                height: '100%', 
                background: '#4caf50',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        )}
        
        <button
          onClick={trainModel}
          disabled={isTraining || signs.length < 2}
          style={{
            marginTop: '10px',
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isTraining ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isTraining ? 'not-allowed' : 'pointer'
          }}
        >
          {isTraining ? 'Training...' : 'Train Model'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Recorded Signs</h3>
        {Object.keys(signGroups).length === 0 ? (
          <p>No signs recorded yet. Use the Sign Recorder to start collecting training data.</p>
        ) : (
          Object.entries(signGroups).map(([label, recordings]) => (
            <div key={label} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '10px',
              background: 'white'
            }}>
              <h4 style={{ margin: '0 0 10px 0', textTransform: 'capitalize' }}>
                {label} ({recordings.length} recordings)
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {recordings.map(recording => (
                  <div key={recording._id} style={{ 
                    padding: '8px 12px', 
                    background: '#f0f0f0', 
                    borderRadius: '5px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{recording.frameCount} frames</span>
                    <button
                      onClick={() => deleteSign(recording._id)}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ModelTrainer;