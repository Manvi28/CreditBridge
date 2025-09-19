import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Admin login (hardcoded)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if(email === 'admin@creditbridge.com' && password === 'admin123'){
    return res.json({ success: true, token: 'admin-token' });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email creditScore profile');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch(err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
