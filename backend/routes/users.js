import express from 'express';
import auth from '../middleware/auth.js';
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
router.get('/', auth, async (req, res) => {
  const currentUser = await User.findById(req.user.id);
  if (!currentUser || currentUser.email !== 'mina@gmail.com') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const users = await User.find().select('-password');
  res.json(users);
});

// Update user email
router.put('/:id', auth, async (req, res) => {
  const currentUser = await User.findById(req.user.id);
  if (!currentUser || currentUser.email !== 'mina@gmail.com') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { email } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { email }, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ message: 'Email updated successfully', user });
});


export default router;
