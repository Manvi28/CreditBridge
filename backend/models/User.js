import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    occupation: String,
    monthlyIncome: [Number],
    rentPayment: {
      type: String,
      enum: ['on-time', 'late', 'na'],
      default: 'on-time'
    },
    utility1Payment: {
      type: String,
      enum: ['on-time', 'late', 'na'],
      default: 'on-time'
    },
    utility2Payment: {
      type: String,
      enum: ['on-time', 'late', 'na'],
      default: 'on-time'
    },
    educationLevel: {
      type: String,
      enum: ['high-school', 'bachelors', 'masters', 'phd', 'other']
    },
    fieldOfStudy: String
  },
  creditScore: {
    score: Number,
    riskBand: {
      type: String,
      enum: ['Low', 'Medium', 'High']
    },
    topFactors: [{
      name: String,
      description: String,
      impact: String,
      weight: Number
    }],
    explanation: String,
    calculatedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User;