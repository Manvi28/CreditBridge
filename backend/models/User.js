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
    userType: {
      type: String,
      enum: ['working', 'student'],
      default: 'working'
    },
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    occupation: String,

    // Working fields
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

    // Common fields
    educationLevel: {
      type: String,
      enum: ['high-school', 'bachelors', 'masters', 'phd', 'other']
    },
    fieldOfStudy: String,

    // Student fields
    gpa: Number,
    collegeScore: Number,
    cosignerIncome: Number,
    scholarship: {
      type: Boolean,
      default: false
    }
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

// hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);
export default User;
