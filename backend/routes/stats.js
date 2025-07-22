import express from 'express';
import User from '../models/User.js';
import Sign from '../models/Sign.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.email !== 'mina@gmail.com') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current date and one month ago
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Total users and signs
    const totalUsers = await User.countDocuments();
    const totalSigns = await Sign.countDocuments();

    // New users this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });

    // New signs this month
    const newSignsThisMonth = await Sign.countDocuments({
      createdAt: { $gte: oneMonthAgo }
    });

    // Monthly user registration data for the last 6 months
    const monthlyUserData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await User.countDocuments({
        createdAt: { 
          $gte: monthStart, 
          $lte: monthEnd 
        }
      });

      monthlyUserData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: count
      });
    }

    // Monthly sign creation data for the last 6 months
    const monthlySignData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await Sign.countDocuments({
        createdAt: { 
          $gte: monthStart, 
          $lte: monthEnd 
        }
      });

      monthlySignData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        signs: count
      });
    }

    res.json({
      totalUsers,
      totalSigns,
      newUsersThisMonth,
      newSignsThisMonth,
      monthlyUserData,
      monthlySignData
    });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

export default router;