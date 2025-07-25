import express from 'express';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import User from '../models/User.js';

const router = express.Router();

// Get user profile (placeholder)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (admin only)
router.put('/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (!['guest', 'user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be guest, user, or admin.' });
    }
    
    // Prevent admin from changing their own role (safety measure)
    if (req.params.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own admin role.' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
