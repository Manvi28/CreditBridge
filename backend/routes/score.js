import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get saved credit score
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('creditScore');
    if (!user || !user.creditScore || !user.creditScore.score) {
      return res.status(404).json({ message: 'Credit score not found' });
    }
    res.json(user.creditScore);
  } catch (error) {
    console.error('Get score error:', error);
    res.status(500).json({ message: 'Failed to get credit score', error: error.message });
  }
});

// Calculate credit score
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    // Always pull fresh profile from DB
    const user = await User.findById(req.userId).select('profile');
    if (!user || !user.profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const p = user.profile;

    // Base payload (working fields)
    const aiPayload = {
      userType: p.userType || 'working',
      age: p.age,
      gender: p.gender,
      educationLevel: p.educationLevel,
      occupation: p.occupation,
      monthlyIncome: p.monthlyIncome || [],
      rentPayment: p.rentPayment,
      utility1Payment: p.utility1Payment,
      utility2Payment: p.utility2Payment,
    };

    // If student, add extra fields with safe defaults
    if (p.userType === 'student') {
      aiPayload.gpa = p.gpa ?? 6.5;
      aiPayload.collegeScore = p.collegeScore ?? 60;
      aiPayload.cosignerIncome = p.cosignerIncome ?? 0;
      aiPayload.scholarship = p.scholarship ?? false;
    }

    // Call Flask AI service
    const aiResponse = await axios.post('http://localhost:6000/predict', aiPayload);
    const scoreData = aiResponse.data;

    const userToUpdate = await User.findById(req.userId);
    userToUpdate.creditScore = {
      score: scoreData.score,
      riskBand: scoreData.riskBand,
      topFactors: scoreData.topFactors,
      explanation: scoreData.explanation,
      calculatedAt: new Date()
    };

    await userToUpdate.save();
    res.json(userToUpdate.creditScore);

  } catch (error) {
    console.error('Calculate score error:', error);
    if (error.code === 'ECONNREFUSED') {
      // fallback logic
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const score = calculateSimpleScore(user.profile);
      user.creditScore = {
        score,
        riskBand: score >= 70 ? 'Low' : score >= 40 ? 'Medium' : 'High',
        topFactors: [],
        explanation: 'Fallback score based on basic rules',
        calculatedAt: new Date()
      };
      await user.save();
      return res.json(user.creditScore);
    } else {
      return res.status(500).json({ message: 'Failed to calculate score', error: error.message });
    }
  }
});

// Fallback quick scoring
function calculateSimpleScore(profileData) {
  let score = 50;
  if (profileData?.rentPayment === 'on-time') score += 12;
  if (profileData?.utility1Payment === 'on-time') score += 11;
  if (profileData?.utility2Payment === 'on-time') score += 12;

  const avgIncome = profileData?.monthlyIncome?.reduce((a,b)=>a+parseFloat(b||0),0)/6 || 0;
  if (avgIncome > 5000) score += 30;
  else if (avgIncome > 3000) score += 20;
  else if (avgIncome > 1000) score += 10;

  const educationScores = {'phd':15,'masters':12,'bachelors':10,'high-school':5,'other':3};
  score += educationScores[profileData?.educationLevel] || 0;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export default router;
