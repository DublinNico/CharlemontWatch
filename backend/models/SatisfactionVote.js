const mongoose = require('mongoose');
const { EMAIL_REGEX } = require('../utils/validators');

const satisfactionVoteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: v => EMAIL_REGEX.test(v),
      message: 'Invalid email format'
    }
  },
  rating: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('SatisfactionVote', satisfactionVoteSchema);
