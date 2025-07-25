import User from '../models/User.js';

const adminAuth = async (req, res, next) => {
  try {
    // Get user from auth middleware (assumes auth middleware runs first)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export default adminAuth;
