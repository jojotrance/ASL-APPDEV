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

export default router;
