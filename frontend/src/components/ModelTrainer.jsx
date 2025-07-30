import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function ModelTrainer() {
  const [signs, setSigns] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [modelStatus, setModelStatus] = useState('Not Trained');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [pdfRef] = useState(useRef(null));

  useEffect(() => {
    fetchSigns();
  }, []);

  const fetchSigns = async () => {
    try {
      const response = await fetch('/api/v1/signs/all');
      const data = await response.json();
      // Sort by creation date (most recent first)
      const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSigns(sortedData);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = () => {
    // Create a temporary container for PDF content
    const pdfContent = document.createElement('div');
    
    // Add title and metadata
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px; padding: 20px;">
        <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 8px;">Model Training Dashboard</h1>
        <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px;">
        <h2 style="font-size: 18px; color: #1e40af; margin-bottom: 16px;">Training Status</h2>
        <div style="margin-bottom: 8px;">
          <strong>Model Status:</strong> <span style="color: ${modelStatus === 'Trained' ? '#4caf50' : '#ff9800'}">${modelStatus}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Unique Signs:</strong> ${Object.keys(signGroups).length}
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Total Recordings:</strong> ${signs.length}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Sign Name</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Frames</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Duration</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Recorded At</th>
          </tr>
        </thead>
        <tbody>
          ${signs.map(sign => `
            <tr style="border-bottom: 1px solid #dee2e6;">
              <td style="padding: 12px;">${(sign.word || sign.label).toUpperCase()}</td>
              <td style="padding: 12px; text-align: center;">${sign.frameCount || sign.frames?.length || 0}</td>
              <td style="padding: 12px; text-align: center;">${sign.duration ? `${(sign.duration / 1000).toFixed(1)}s` : 'N/A'}</td>
              <td style="padding: 12px;">${sign.createdAt ? formatDate(sign.createdAt) : 'Unknown'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const opt = {
      margin: 1,
      filename: 'ASL-Model-Training-Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().set(opt).from(pdfContent).save();
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2>Model Training Dashboard</h2>
      
      <div ref={pdfRef}>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '10px', 
          marginBottom: '30px' 
        }}>
          <h3>Training Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div>
              <strong>Model Status:</strong> <span style={{ color: modelStatus === 'Trained' ? '#4caf50' : '#ff9800' }}>{modelStatus}</span>
            </div>
            <div>
              <strong>Unique Signs:</strong> {Object.keys(signGroups).length}
            </div>
            <div>
              <strong>Total Recordings:</strong> {signs.length}
            </div>
          </div>
          
          {isTraining && (
            <div style={{ marginBottom: '20px' }}>
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
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={trainModel}
              disabled={isTraining || signs.length < 2}
              style={{
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

            <button
              onClick={handleDownloadPDF}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span>📄</span>
              Export PDF
            </button>
          </div>
        </div>

        <div>
          <h3>Recorded Signs Data Table</h3>
          {signs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              background: '#f9f9f9', 
              borderRadius: '10px',
              border: '2px dashed #ddd'
            }}>
              <p style={{ color: '#666', fontSize: '18px' }}>No signs recorded yet</p>
              <p style={{ color: '#999' }}>Use the Sign Recorder to start collecting training data</p>
            </div>
          ) : (
            <div style={{ 
              background: 'white', 
              borderRadius: '10px', 
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Sign Name</th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Frames</th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Duration</th>
                    <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Recorded At</th>
                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signs.map((sign, index) => (
                    <tr 
                      key={sign._id} 
                      style={{ 
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#e3f2fd'}
                      onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa'}
                    >
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            background: '#e3f2fd',
                            color: '#1976d2',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {(sign.word || sign.label).toUpperCase()}
                          </span>
                          {index === 0 && (
                            <span style={{ 
                              background: '#4caf50',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              LATEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ 
                          background: '#fff3e0',
                          color: '#f57c00',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {sign.frameCount || sign.frames?.length || 0}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          {sign.duration ? `${(sign.duration / 1000).toFixed(1)}s` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                        {sign.createdAt ? formatDate(sign.createdAt) : 'Unknown'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteSign(sign._id)}
                          style={{
                            background: '#ff5722',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#d32f2f'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#ff5722'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hidden div for PDF generation */}
      <div ref={pdfRef} style={{ display: 'none' }}>
        <h2>Model Training Dashboard</h2>
        <div>
          <strong>Model Status:</strong> <span style={{ color: modelStatus === 'Trained' ? '#4caf50' : '#ff9800' }}>{modelStatus}</span>
        </div>
        <div>
          <strong>Unique Signs:</strong> {Object.keys(signGroups).length}
        </div>
        <div>
          <strong>Total Recordings:</strong> {signs.length}
        </div>
        <div style={{ marginTop: '20px' }}>
          <h3>Recorded Signs Data</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Sign Name</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Frames</th>
                <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>Duration</th>
                <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>Recorded At</th>
              </tr>
            </thead>
            <tbody>
              {signs.map(sign => (
                <tr key={sign._id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {(sign.word || sign.label).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {sign.frameCount || sign.frames?.length || 0}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {sign.duration ? `${(sign.duration / 1000).toFixed(1)}s` : 'N/A'}
                  </td>
                  <td style={{ padding: '10px', color: '#666', fontSize: '14px' }}>
                    {sign.createdAt ? formatDate(sign.createdAt) : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
  );
}

export default ModelTrainer;