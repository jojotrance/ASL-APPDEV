import express from 'express';
import Sign from '../models/Sign.js';

const router = express.Router();

// Calculate similarity between two landmark sets
function calculateSimilarity(landmarks1, landmarks2) {
  try {
    if (!landmarks1 || !landmarks2 || landmarks1.length === 0 || landmarks2.length === 0) {
      return 0;
    }

    let totalSimilarity = 0;
    let comparisonCount = 0;

    // Compare landmarks frame by frame
    const minFrames = Math.min(landmarks1.length, landmarks2.length);
    
    for (let frameIdx = 0; frameIdx < minFrames; frameIdx++) {
      const frame1 = landmarks1[frameIdx];
      const frame2 = landmarks2[frameIdx];
      
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
          const pointSimilarity = Math.max(0, 1 - distance);
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

    // Get all signs from database
    const signs = await Sign.find();
    
    if (!signs || signs.length === 0) {
      console.log('❌ No trained signs found in database');
      return res.json({ 
        error: 'No trained signs found in database',
        word: null, 
        confidence: 0 
      });
    }

    console.log(`🔍 Comparing against ${signs.length} trained signs...`);

    let bestMatch = null;
    let bestConfidence = 0;

    // Compare input landmarks with each trained sign
    for (const sign of signs) {
      if (!sign.frames || sign.frames.length === 0) continue;
      
      const similarity = calculateSimilarity(landmarks, sign.frames);
      console.log(`📊 Sign "${sign.word}": ${similarity.toFixed(2)}% similarity`);
      
      if (similarity > bestConfidence) {
        bestConfidence = similarity;
        bestMatch = sign.word;
      }
    }

    // Set minimum confidence threshold
    const minConfidence = 15;
    
    if (bestConfidence < minConfidence) {
      console.log(`⚠️ Best match confidence ${bestConfidence.toFixed(2)}% below threshold ${minConfidence}%`);
      return res.json({ word: null, confidence: 0 });
    }

    console.log(`✅ Best match: "${bestMatch}" with ${bestConfidence.toFixed(2)}% confidence`);
    
    res.json({
      word: bestMatch,
      confidence: bestConfidence
    });

  } catch (error) {
    console.error('❌ Prediction endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;