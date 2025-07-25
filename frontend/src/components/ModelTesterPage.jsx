import React, { useState, useRef, useEffect } from 'react';
import SimpleHandTracker from './SimpleHandTracker';

const ModelTesterPage = () => {
  const [isTestingML, setIsTestingML] = useState(false);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [dbPrediction, setDbPrediction] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [selectedModel, setSelectedModel] = useState('neural_network');
  const [isLoading, setIsLoading] = useState(false);

  const handleLandmarks = async (landmarks) => {
    if (!isTestingML || !landmarks || landmarks.length === 0) return;

    setIsLoading(true);
    
    try {
      // Test ML Model Prediction
      const mlResponse = await fetch('/api/predict-ml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          landmarks,
          model: selectedModel 
        })
      });

      let mlResult = null;
      if (mlResponse.ok) {
        mlResult = await mlResponse.json();
      } else {
        mlResult = { error: 'ML prediction service not available' };
      }

      // Test Database Prediction (current system)
      const dbResponse = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks })
      });

      let dbResult = null;
      if (dbResponse.ok) {
        dbResult = await dbResponse.json();
      }

      // Update predictions
      setMlPrediction(mlResult);
      setDbPrediction(dbResult);

      // Add to test results for comparison
      const testResult = {
        timestamp: new Date().toLocaleTimeString(),
        ml: mlResult,
        database: dbResult,
        model: selectedModel
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results

    } catch (error) {
      console.error('Testing error:', error);
      setMlPrediction({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const startTesting = () => {
    setIsTestingML(true);
    setTestResults([]);
  };

  const stopTesting = () => {
    setIsTestingML(false);
    setMlPrediction(null);
    setDbPrediction(null);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🧪 ML Model Tester
      </h1>
      
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Test your trained machine learning models and compare them with the current database detection system.
        </p>
      </div>

      {/* Model Selection */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0 }}>🤖 Select ML Model to Test:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['neural_network', 'random_forest', 'svm'].map(model => (
            <label key={model} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: '8px 12px',
              backgroundColor: selectedModel === model ? '#007bff' : '#e9ecef',
              color: selectedModel === model ? 'white' : '#333',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="model"
                value={model}
                checked={selectedModel === model}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ marginRight: '8px' }}
              />
              {model.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
          ))}
        </div>
      </div>

      {/* Testing Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={startTesting}
          disabled={isTestingML}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isTestingML ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isTestingML ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isTestingML ? '🔴 Testing Active' : '▶️ Start Testing'}
        </button>
        
        <button
          onClick={stopTesting}
          disabled={!isTestingML}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isTestingML ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isTestingML ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⏹️ Stop Testing
        </button>

        <button
          onClick={clearResults}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Current Predictions Display */}
      {isTestingML && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          {/* ML Model Prediction */}
          <div style={{
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '8px',
            border: '2px solid #2196f3'
          }}>
            <h3 style={{ marginTop: 0, color: '#1976d2' }}>
              🤖 ML Model ({selectedModel.replace('_', ' ')})
            </h3>
            {isLoading ? (
              <div>🔄 Processing...</div>
            ) : mlPrediction ? (
              <div>
                {mlPrediction.error ? (
                  <div style={{ color: '#d32f2f' }}>
                    ❌ {mlPrediction.error}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {mlPrediction.word || 'No prediction'}
                    </div>
                    <div style={{ fontSize: '18px', color: '#666' }}>
                      Confidence: {mlPrediction.confidence ? `${mlPrediction.confidence.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#666' }}>Waiting for hand detection...</div>
            )}
          </div>

          {/* Database Prediction */}
          <div style={{
            padding: '20px',
            backgroundColor: '#e8f5e8',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            <h3 style={{ marginTop: 0, color: '#388e3c' }}>
              💾 Database Detection (Current)
            </h3>
            {isLoading ? (
              <div>🔄 Processing...</div>
            ) : dbPrediction ? (
              <div>
                {dbPrediction.error ? (
                  <div style={{ color: '#d32f2f' }}>
                    ❌ {dbPrediction.error}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {dbPrediction.word || 'No prediction'}
                    </div>
                    <div style={{ fontSize: '18px', color: '#666' }}>
                      Confidence: {dbPrediction.confidence ? `${dbPrediction.confidence.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#666' }}>Waiting for hand detection...</div>
            )}
          </div>
        </div>
      )}

      {/* Camera Component */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <SimpleHandTracker
          onPrediction={handleLandmarks}
          mode="testing"
        />
      </div>

      {/* Test Results History */}
      {testResults.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>📊 Test Results Comparison</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            padding: '15px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Time</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Model</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>ML Prediction</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>DB Prediction</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Match?</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => {
                  const mlWord = result.ml?.word || 'None';
                  const dbWord = result.database?.word || 'None';
                  const match = mlWord === dbWord && mlWord !== 'None';
                  
                  return (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6', fontSize: '12px' }}>
                        {result.timestamp}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                        {result.model.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                        {result.ml?.error ? (
                          <span style={{ color: '#dc3545' }}>Error</span>
                        ) : (
                          <span>
                            {mlWord}
                            {result.ml?.confidence && ` (${result.ml.confidence.toFixed(0)}%)`}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                        {result.database?.error ? (
                          <span style={{ color: '#dc3545' }}>Error</span>
                        ) : (
                          <span>
                            {dbWord}
                            {result.database?.confidence && ` (${result.database.confidence.toFixed(0)}%)`}
                          </span>
                        )}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        border: '1px solid #dee2e6',
                        backgroundColor: match ? '#d4edda' : (mlWord === 'None' && dbWord === 'None' ? '#fff3cd' : '#f8d7da'),
                        fontWeight: 'bold'
                      }}>
                        {match ? '✅ Yes' : (mlWord === 'None' && dbWord === 'None' ? '⚪ Both None' : '❌ No')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h3 style={{ marginTop: 0 }}>📋 How to Use This Tester:</h3>
        <ol>
          <li><strong>Select a model</strong> - Choose which ML model you want to test</li>
          <li><strong>Start testing</strong> - Click "Start Testing" to activate both ML and database predictions</li>
          <li><strong>Perform signs</strong> - Make ASL signs in front of the camera</li>
          <li><strong>Compare results</strong> - See predictions from both systems side-by-side</li>
          <li><strong>Analyze performance</strong> - Use the results table to see which system performs better</li>
        </ol>
        
        <h4>🎯 What to Look For:</h4>
        <ul>
          <li><strong>Green matches</strong> - Both systems agree on the prediction</li>
          <li><strong>Red mismatches</strong> - Systems disagree (helps identify which works better)</li>
          <li><strong>Confidence scores</strong> - Higher confidence usually means more reliable prediction</li>
          <li><strong>Response speed</strong> - Notice if ML models are faster/slower than database detection</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelTesterPage;
