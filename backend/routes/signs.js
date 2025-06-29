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

export default router;
