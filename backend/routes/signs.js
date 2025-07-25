import express from 'express';
import Sign from '../models/Sign.js';

const router = express.Router();

// Get all signs
router.get('/', async (req, res) => {
  try {
    const signs = await Sign.find();
    res.json(signs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new sign
router.post('/', async (req, res) => {
  try {
    const { word, videoUrl, description } = req.body;
    const sign = new Sign({ word, videoUrl, description });
    await sign.save();
    res.status(201).json(sign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/save', async (req, res) => {
  try {
    console.log('Received sign save request');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body size:', JSON.stringify(req.body).length, 'bytes');
    
    const { label, frames, frameCount, duration } = req.body;

    if (!label || !frames || frames.length === 0) {
      console.log('Validation failed:', { label: !!label, frames: !!frames, framesLength: frames?.length });
      return res.status(400).json({ error: 'Label and frames are required' });
    }

    console.log(`Creating sign: "${label}" with ${frames.length} frames`);

    const sign = new Sign({
      word: label.toLowerCase().trim(),  // Changed from 'label' to 'word'
      frames,
      frameCount,
      duration,
      createdAt: new Date()
    });

    console.log('Attempting to save sign to database...');
    await sign.save();
    console.log('Sign saved successfully with ID:', sign._id);
    
    res.status(201).json({ 
      message: 'Sign saved successfully', 
      signId: sign._id,
      word: sign.word,  // Changed from 'label' to 'word'
      frameCount: sign.frameCount
    });
  } catch (error) {
    console.error('Error saving sign:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to save sign',
      details: error.message,
      mongoError: error.name === 'ValidationError' ? error.errors : undefined
    });
  }
});

// Get all signs for training dashboard
router.get('/all', async (req, res) => {
  try {
    const signs = await Sign.find({}, { frames: 0 }); // Exclude frames for performance
    res.json(signs);
  } catch (error) {
    console.error('Error fetching signs:', error);
    res.status(500).json({ error: 'Failed to fetch signs' });
  }
});

// Get sign data for training
router.get('/training-data', async (req, res) => {
  try {
    console.log('📡 Fetching training data...');
    const signs = await Sign.find({});
    console.log(`📊 Found ${signs.length} signs in database`);
    
    const trainingData = signs.map(sign => ({
      label: sign.word,  // ✅ Changed from sign.label to sign.word
      frames: sign.frames
    }));
    
    console.log('✅ Training data prepared successfully');
    res.json(trainingData);
  } catch (error) {
    console.error('❌ Error fetching training data:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch training data',
      details: error.message 
    });
  }
});

// Delete a sign
router.delete('/:id', async (req, res) => {
  try {
    await Sign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sign deleted successfully' });
  } catch (error) {
    console.error('Error deleting sign:', error);
    res.status(500).json({ error: 'Failed to delete sign' });
  }
});

// Calculate similarity between two landmark sets
function calculateSimilarity(landmarks1, landmarks2) {
  try {
    if (!landmarks1 || !landmarks2 || landmarks1.length === 0 || landmarks2.length === 0) {
      return 0;
    }

    // Normalize incoming landmarks (from camera) - array format
    const normalizedLandmarks1 = landmarks1.map(frame => {
      if (Array.isArray(frame)) {
        return frame; // Already in correct format: array of hands
      }
      return frame;
    });

    // Normalize database landmarks - object format with metadata
    const normalizedLandmarks2 = landmarks2.map(frame => {
      if (frame && frame.landmarks && Array.isArray(frame.landmarks)) {
        return frame.landmarks; // Extract landmarks array from metadata object
      }
      if (Array.isArray(frame)) {
        return frame; // Already in correct format
      }
      return [];
    });

    let totalSimilarity = 0;
    let comparisonCount = 0;

    // Compare landmarks frame by frame
    const minFrames = Math.min(normalizedLandmarks1.length, normalizedLandmarks2.length);
    
    for (let frameIdx = 0; frameIdx < minFrames; frameIdx++) {
      const frame1 = normalizedLandmarks1[frameIdx];
      const frame2 = normalizedLandmarks2[frameIdx];
      
      if (!frame1 || !frame2) continue;
      
      // Compare each hand in the frame
      const minHands = Math.min(frame1.length, frame2.length);
      
      for (let handIdx = 0; handIdx < minHands; handIdx++) {
        const hand1 = frame1[handIdx];
        const hand2 = frame2[handIdx];
        
        if (!hand1 || !hand2) continue;
        
        // Compare each landmark point
        const minPoints = Math.min(hand1.length, hand2.length);
        let handSimilarity = 0;
        
        for (let pointIdx = 0; pointIdx < minPoints; pointIdx++) {
          const point1 = hand1[pointIdx];
          const point2 = hand2[pointIdx];
          
          if (!point1 || !point2) continue;
          
          // Calculate Euclidean distance
          const dx = (point1.x || 0) - (point2.x || 0);
          const dy = (point1.y || 0) - (point2.y || 0);
          const dz = (point1.z || 0) - (point2.z || 0);
          
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Convert distance to similarity (closer = more similar)
          // Use a more forgiving threshold since hand positions vary
          const pointSimilarity = Math.max(0, 1 - (distance * 2)); // Scale distance
          handSimilarity += pointSimilarity;
        }
        
        if (minPoints > 0) {
          handSimilarity /= minPoints;
          totalSimilarity += handSimilarity;
          comparisonCount++;
        }
      }
    }
    
    if (comparisonCount === 0) return 0;
    
    // Calculate average similarity and convert to percentage
    const avgSimilarity = totalSimilarity / comparisonCount;
    return Math.max(0, Math.min(100, avgSimilarity * 100));
    
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}

// Prediction endpoint
router.post('/predict', async (req, res) => {
  try {
    const { landmarks } = req.body;

    if (!landmarks || landmarks.length === 0) {
      return res.json({ word: null, confidence: 0 });
    }

    // Get all signs from database
    const signs = await Sign.find();
    
    if (!signs || signs.length === 0) {
      return res.json({ 
        error: 'No trained signs found in database',
        word: null, 
        confidence: 0 
      });
    }

    let bestMatch = null;
    let bestConfidence = 0;

    // Compare input landmarks with each trained sign
    for (const sign of signs) {
      if (!sign.frames || sign.frames.length === 0) continue;
      
      const similarity = calculateSimilarity(landmarks, sign.frames);
      
      if (similarity > bestConfidence) {
        bestConfidence = similarity;
        bestMatch = sign.word;
      }
    }

    // Set minimum confidence threshold to 50%
    const minConfidence = 50;
    
    if (bestConfidence < minConfidence) {
      return res.json({ word: null, confidence: 0 });
    }

    // Only log successful matches
    console.log(`✅ "${bestMatch}" (${bestConfidence.toFixed(0)}%)`);
    
    res.json({
      word: bestMatch,
      confidence: bestConfidence
    });

  } catch (error) {
    console.error('❌ Prediction error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
