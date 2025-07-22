import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Extract category from the fieldname (e.g., 'video_alphabet_A' -> 'alphabet')
    const fieldParts = file.fieldname.split('_');
    const category = fieldParts[1] || 'alphabet';
    
    const uploadDir = path.join(__dirname, '..', '..', 'dataset', `${category}_videos`);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Extract category and item from fieldname (e.g., 'video_alphabet_A' -> 'A.webm')
    const fieldParts = file.fieldname.split('_');
    const item = fieldParts.slice(2).join('_'); // Handle items with spaces/underscores
    cb(null, `${item}.webm`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Handle ASL signs training (alphabet, numbers, greetings, etc.)
router.post('/train-signs', upload.any(), async (req, res) => {
  try {
    console.log('📹 Received ASL signs training request');
    console.log(`📊 Number of files: ${req.files?.length || 0}`);
    console.log('📂 Selected category:', req.body.selectedCategory);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No video files received' });
    }

    const selectedCategory = req.body.selectedCategory || 'alphabet';
    
    // Extract signs from the uploaded files
    const uploadedSigns = [];
    const signData = {};
    
    req.files.forEach(file => {
      const signKey = file.fieldname.replace('video_', '');
      const [category, item] = signKey.split('_');
      
      uploadedSigns.push(item);
      signData[item] = {
        filename: file.filename,
        sign: item,
        category: category,
        frames: null, // Will be calculated during processing
        duration: null, // Will be calculated during processing
        recorded_at: new Date().toISOString()
      };
    });

    console.log(`🔤 Signs uploaded: ${uploadedSigns.join(', ')}`);
    console.log(`📂 Category: ${selectedCategory}`);

    // Create dataset metadata
    const metadata = {
      created: new Date().toISOString(),
      type: 'ASL_Signs',
      category: selectedCategory,
      fps: 30, // Estimated
      duration_seconds: 3, // Estimated
      resolution: '640x480', // Estimated
      videos: signData
    };

    // Create category-specific directory
    const categoryDir = path.join(__dirname, '..', '..', 'dataset', `${selectedCategory}_videos`);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    // Save metadata
    const metadataPath = path.join(categoryDir, 'dataset_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('💾 Metadata saved, starting video processing...');

    // Process videos and train model
    const processingResult = await processSignVideos(selectedCategory);
    
    if (processingResult.success) {
      console.log('✅ ASL signs model training completed successfully');
      res.json({
        success: true,
        message: `${selectedCategory} model trained successfully`,
        accuracy: processingResult.accuracy,
        signs: processingResult.signs,
        samples: processingResult.samples,
        category: selectedCategory
      });
    } else {
      console.error('❌ Processing failed:', processingResult.error);
      res.status(500).json({
        error: 'Processing failed',
        details: processingResult.error
      });
    }

  } catch (error) {
    console.error('❌ Training error:', error);
    res.status(500).json({
      error: 'Training failed',
      details: error.message
    });
  }
});

// Keep the old alphabet endpoint for backward compatibility
router.post('/train-alphabet', upload.any(), async (req, res) => {
  try {
    console.log('📹 Received alphabet training request');
    console.log(`📊 Number of files: ${req.files?.length || 0}`);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No video files received' });
    }

    // Extract letters from the uploaded files
    const uploadedLetters = [];
    const letterData = {};
    
    req.files.forEach(file => {
      const letter = file.fieldname.replace('video_', '');
      uploadedLetters.push(letter);
      letterData[letter] = {
        filename: file.filename,
        letter: letter,
        frames: null, // Will be calculated during processing
        duration: null, // Will be calculated during processing
        recorded_at: new Date().toISOString()
      };
    });

    console.log(`🔤 Letters uploaded: ${uploadedLetters.join(', ')}`);

    // Create dataset metadata
    const metadata = {
      created: new Date().toISOString(),
      type: 'ASL_Alphabet',
      fps: 30, // Estimated
      duration_seconds: 3, // Estimated
      resolution: '640x480', // Estimated
      videos: letterData
    };

    // Save metadata
    const metadataPath = path.join(__dirname, '..', '..', 'dataset', 'alphabet_videos', 'dataset_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('💾 Metadata saved, starting video processing...');

    // Process videos and train model
    const processingResult = await processAlphabetVideos();
    
    if (processingResult.success) {
      console.log('✅ Alphabet model training completed successfully');
      res.json({
        success: true,
        message: 'Alphabet model trained successfully',
        accuracy: processingResult.accuracy,
        letters: processingResult.letters,
        samples: processingResult.samples
      });
    } else {
      console.error('❌ Processing failed:', processingResult.error);
      res.status(500).json({
        error: 'Processing failed',
        details: processingResult.error
      });
    }

  } catch (error) {
    console.error('❌ Training error:', error);
    res.status(500).json({
      error: 'Training failed',
      details: error.message
    });
  }
});

// Function to process videos using Python script
function processSignVideos(category = 'alphabet') {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'process_sign_videos.py');
    
    console.log('🐍 Starting Python processing script...');
    console.log(`📁 Script path: ${scriptPath}`);
    console.log(`📂 Category: ${category}`);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return resolve({
        success: false,
        error: `Processing script not found: ${scriptPath}`
      });
    }

    const python = spawn('python', [scriptPath, category], {
      cwd: path.join(__dirname, '..', '..')
    });

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('🐍 Python:', chunk.trim());
    });

    python.stderr.on('data', (data) => {
      const chunk = data.toString();
      error += chunk;
      console.error('🐍 Python Error:', chunk.trim());
    });

    python.on('close', (code) => {
      console.log(`🐍 Python script finished with code: ${code}`);
      
      if (code === 0) {
        // Try to extract information from output
        const lines = output.split('\n');
        let accuracy = 0;
        let signs = [];
        let samples = 0;

        lines.forEach(line => {
          if (line.includes('Accuracy:')) {
            const match = line.match(/Accuracy:\s*([\d.]+)/);
            if (match) accuracy = parseFloat(match[1]);
          }
          if (line.includes('Available signs:') || line.includes('Available letters:')) {
            const match = line.match(/Available (?:signs|letters):\s*\[(.*)\]/);
            if (match) {
              signs = match[1].split(',').map(l => l.trim().replace(/['"]/g, ''));
            }
          }
          if (line.includes('Total samples:')) {
            const match = line.match(/Total samples:\s*(\d+)/);
            if (match) samples = parseInt(match[1]);
          }
        });

        resolve({
          success: true,
          accuracy: accuracy,
          signs: signs,
          samples: samples,
          output: output
        });
      } else {
        resolve({
          success: false,
          error: error || 'Processing script failed',
          output: output
        });
      }
    });

    python.on('error', (err) => {
      console.error('🐍 Python spawn error:', err);
      resolve({
        success: false,
        error: `Failed to start Python script: ${err.message}`
      });
    });
  });
}

// Function to process videos using Python script (backward compatibility)
function processAlphabetVideos() {
  return processSignVideos('alphabet');
}

// Get training status
router.get('/training-status', (req, res) => {
  try {
    const modelPath = path.join(__dirname, '..', '..', 'dataset', 'processed', 'training_data', 'asl_model.pkl');
    const metadataPath = path.join(__dirname, '..', '..', 'dataset', 'processed', 'training_data', 'alphabet_metadata.json');
    
    const hasModel = fs.existsSync(modelPath);
    let metadata = null;
    
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      } catch (err) {
        console.error('Error reading metadata:', err);
      }
    }
    
    res.json({
      hasAlphabetModel: hasModel,
      metadata: metadata,
      modelPath: hasModel ? modelPath : null
    });
    
  } catch (error) {
    console.error('Error checking training status:', error);
    res.status(500).json({ error: 'Failed to check training status' });
  }
});

export default router;
