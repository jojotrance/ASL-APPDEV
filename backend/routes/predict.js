import express from 'express';
import Sign from '../models/Sign.js';

const router = express.Router();

// Calculate similarity between two landmark sets
function calculateSimilarity(inputLandmarks, storedSign) {
  try {
    if (!inputLandmarks || !storedSign || inputLandmarks.length === 0 || !storedSign.frames || storedSign.frames.length === 0) {
      return 0;
    }

    // Extract landmarks from stored sign frames
    const storedLandmarks = storedSign.frames.map(frame => frame.landmarks || []);

    let totalSimilarity = 0;
    let comparisonCount = 0;

    // Compare landmarks frame by frame
    const minFrames = Math.min(inputLandmarks.length, storedLandmarks.length);
    
    for (let frameIdx = 0; frameIdx < minFrames; frameIdx++) {
      const inputFrame = inputLandmarks[frameIdx];
      const storedFrame = storedLandmarks[frameIdx];
      
      if (!inputFrame || !storedFrame) continue;
      
      // Compare each hand in the frame
      const minHands = Math.min(inputFrame.length, storedFrame.length);
      
      for (let handIdx = 0; handIdx < minHands; handIdx++) {
        const inputHand = inputFrame[handIdx];
        const storedHand = storedFrame[handIdx];
        
        if (!inputHand || !storedHand) continue;
        
        // Compare each landmark point
        const minPoints = Math.min(inputHand.length, storedHand.length);
        let handSimilarity = 0;
        let validPoints = 0;
        
        for (let pointIdx = 0; pointIdx < minPoints; pointIdx++) {
          const inputPoint = inputHand[pointIdx];
          const storedPoint = storedHand[pointIdx];
          
          if (!inputPoint || !storedPoint) continue;
          
          // Calculate Euclidean distance with better error handling
          const x1 = parseFloat(inputPoint.x) || 0;
          const y1 = parseFloat(inputPoint.y) || 0;
          const z1 = parseFloat(inputPoint.z) || 0;
          
          const x2 = parseFloat(storedPoint.x) || 0;
          const y2 = parseFloat(storedPoint.y) || 0;
          const z2 = parseFloat(storedPoint.z) || 0;
          
          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Convert distance to similarity (closer = more similar)
          const maxDistance = 0.3; // Adjusted for MediaPipe coordinate system (0-1 range)
          const pointSimilarity = Math.max(0, 1 - (distance / maxDistance));
          handSimilarity += pointSimilarity;
          validPoints++;
        }
        
        if (validPoints > 0) {
          handSimilarity /= validPoints;
          totalSimilarity += handSimilarity;
          comparisonCount++;
        }
      }
    }
    
    if (comparisonCount === 0) {
      return 0;
    }
    
    // Calculate average similarity and convert to percentage
    const avgSimilarity = totalSimilarity / comparisonCount;
    const percentage = Math.max(0, Math.min(100, avgSimilarity * 100));
    
    return percentage;

  } catch (error) {
    console.error('Error calculating similarity:', error);
    return 0;
  }
}router.post('/', async (req, res) => {
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
      
      const similarity = calculateSimilarity(landmarks, sign);
      
      if (similarity > bestConfidence) {
        bestConfidence = similarity;
        bestMatch = sign.word;
      }
    }

    // Set minimum confidence threshold (lowered for testing)
    const minConfidence = 5;
    
    if (bestConfidence < minConfidence) {
      return res.json({ word: null, confidence: 0 });
    }

    // Only log successful predictions to reduce spam
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