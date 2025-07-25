import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import cloudinary from 'cloudinary';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/register', upload.single('photo'), async (req, res) => {
  try {
    const { username, email, password, sex } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (req.file) {
      // If photo is uploaded
      const result = await cloudinary.v2.uploader.upload_stream(
        { folder: 'users' },
        async (error, result) => {
          if (error) return res.status(500).json({ error: error.message });

          const user = new User({
            username,
            email,
            password: hashedPassword,
            sex,
            photo: {
              public_id: result.public_id,
              url: result.secure_url,
            }
          });

          await user.save();

          // Generate JWT token
          const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
          );

          res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: {
              id: user._id,
              username: user.username,
              email: user.email,
              sex: user.sex,
              role: user.role,
              photo: user.photo
            }
          });
        }
      );
      result.end(req.file.buffer);
    } else {
      // If no photo uploaded
      const user = new User({
        username,
        email,
        password: hashedPassword,
        sex,
        photo: null
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );

      res.status(201).json({ 
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          sex: user.sex,
          role: user.role,
          photo: user.photo
        }
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      message: 'Login successful',
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        sex: user.sex,
        role: user.role,
        photo: user.photo
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        sex: user.sex,
        role: user.role,
        photo: user.photo
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});


router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('email username role');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;