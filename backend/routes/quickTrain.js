import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Setup multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp_videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `quick_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/quick-train', upload.single('video'), async (req, res) => {
  try {
    console.log('🚀 Quick training request received!');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { sign } = req.body;
    const videoFile = req.file;
    
    if (!videoFile) {
      console.log('❌ No video file received');
      return res.status(400).json({ error: 'Missing video file' });
    }
    
    if (!sign) {
      console.log('❌ No sign label received');
      return res.status(400).json({ error: 'Missing sign label' });
    }
    
    console.log(`📹 Processing quick training for sign: "${sign}"`);
    console.log(`📁 Video file: ${videoFile.filename}`);
    
    // Create a quick training script that processes just this one video
    const scriptPath = path.join(__dirname, '../../scripts/quick_train_single.py');
    const videoPath = videoFile.path;
    
    console.log(`🐍 Python script path: ${scriptPath}`);
    console.log(`📁 Video path: ${videoPath}`);
    
    // Call Python script for immediate processing and training
    const python = spawn('python', [scriptPath, videoPath, sign]);
    
    let result = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    python.on('close', (code) => {
      // Clean up uploaded file
      try {
        fs.unlinkSync(videoPath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError.message);
      }
      
      if (code === 0) {
        try {
          const trainingResult = JSON.parse(result);
          console.log('✅ Quick training completed:', trainingResult);
          res.json(trainingResult);
        } catch (parseError) {
          console.error('Parse error:', parseError);
          console.error('Raw result:', result);
          res.status(500).json({ error: 'Invalid training response' });
        }
      } else {
        console.error('❌ Quick training failed:', error);
        res.status(500).json({ error: `Training failed: ${error}` });
      }
    });
    
  } catch (err) {
    console.error('❌ Quick training error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
