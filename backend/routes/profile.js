import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('profile');
    if (!user || !user.profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    
    res.json(user.profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

// Update profile
router.post('/', authMiddleware, async (req, res) => {
  try {
    const profileData = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update profile fields
    user.profile = {
      ...user.profile,
      age: profileData.age,
      gender: profileData.gender,
      occupation: profileData.occupation,
      monthlyIncome: profileData.monthlyIncome,
      rentPayment: profileData.rentPayment,
      utility1Payment: profileData.utility1Payment,
      utility2Payment: profileData.utility2Payment,
      educationLevel: profileData.educationLevel,
      fieldOfStudy: profileData.fieldOfStudy
    };
    
    await user.save();
    
    res.json({ message: 'Profile updated successfully', profile: user.profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

export default router;