import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

router.post('/predict', async (req, res) => {
  try {
    console.log('🔥 Prediction request received!');
    const { landmarks } = req.body;
    
    console.log('📊 Landmarks data:', {
      type: typeof landmarks,
      length: landmarks ? landmarks.length : 'null',
      isArray: Array.isArray(landmarks)
    });
    
    if (!landmarks || landmarks.length === 0) {
      console.log('❌ No landmarks provided');
      return res.json({ word: null, confidence: 0 });
    }
    
    // Call Python script for prediction using your trained model
    const pythonScript = path.join(__dirname, '../../scripts/predict_realtime.py');
    const python = spawn('python', [pythonScript, JSON.stringify(landmarks)]);
    
    let result = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        try {
          const prediction = JSON.parse(result);
          res.json(prediction);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          res.status(500).json({ error: 'Invalid prediction response' });
        }
      } else {
        console.error('Python script error:', error);
        res.status(500).json({ error: error || 'Prediction failed' });
      }
    });
    
  } catch (error) {
    console.error('Prediction endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
