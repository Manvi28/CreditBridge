import express from 'express';
import axios from 'axios';
import User from '../models/User.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get credit score
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
    const profileData = req.body;
    
    // Call AI service to calculate score
    const aiResponse = await axios.post('http://localhost:6000/predict', {
      age: profileData.age,
      gender: profileData.gender,
      occupation: profileData.occupation,
      monthlyIncome: profileData.monthlyIncome,
      rentPayment: profileData.rentPayment,
      utility1Payment: profileData.utility1Payment,
      utility2Payment: profileData.utility2Payment,
      educationLevel: profileData.educationLevel,
      fieldOfStudy: profileData.fieldOfStudy
    });
    
    const scoreData = aiResponse.data;
    
    // Update user's credit score
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.creditScore = {
      score: scoreData.score,
      riskBand: scoreData.riskBand,
      topFactors: scoreData.topFactors,
      explanation: scoreData.explanation,
      calculatedAt: new Date()
    };
    
    await user.save();
    
    res.json(user.creditScore);
  } catch (error) {
    console.error('Calculate score error:', error);
    
    // If AI service is not available, use a simple calculation
    if (error.code === 'ECONNREFUSED') {
      try {
        const user = await User.findById(req.userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Simple score calculation
        const score = calculateSimpleScore(req.body);
        
        user.creditScore = {
          score: score,
          riskBand: score >= 70 ? 'Low' : score >= 40 ? 'Medium' : 'High',
          topFactors: [
            {
              name: 'Payment History',
              description: 'Your payment consistency for rent and utilities',
              impact: 'positive',
              weight: 35
            },
            {
              name: 'Income Stability',
              description: 'Your income trend over the last 6 months',
              impact: 'positive',
              weight: 30
            },
            {
              name: 'Education Level',
              description: 'Your educational background',
              impact: 'positive',
              weight: 15
            }
          ],
          explanation: 'Score calculated based on payment history, income stability, and education level.',
          calculatedAt: new Date()
        };
        
        await user.save();
        res.json(user.creditScore);
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to calculate score', error: fallbackError.message });
      }
    } else {
      res.status(500).json({ message: 'Failed to calculate score', error: error.message });
    }
  }
});

// Simple score calculation function (fallback)
function calculateSimpleScore(profileData) {
  let score = 50; // Base score
  
  // Payment history (35%)
  if (profileData.rentPayment === 'on-time') score += 12;
  if (profileData.utility1Payment === 'on-time') score += 11;
  if (profileData.utility2Payment === 'on-time') score += 12;
  
  // Income stability (30%)
  const avgIncome = profileData.monthlyIncome.reduce((a, b) => a + parseFloat(b || 0), 0) / 6;
  if (avgIncome > 5000) score += 30;
  else if (avgIncome > 3000) score += 20;
  else if (avgIncome > 1000) score += 10;
  
  // Education (15%)
  const educationScores = {
    'phd': 15,
    'masters': 12,
    'bachelors': 10,
    'high-school': 5,
    'other': 3
  };
  score += educationScores[profileData.educationLevel] || 0;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

export default router;