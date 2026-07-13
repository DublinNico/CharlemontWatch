const mongoose = require('mongoose');

const satisfactionVoteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Invalid email format'
    }
  },
  rating: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SatisfactionVote', satisfactionVoteSchema);
