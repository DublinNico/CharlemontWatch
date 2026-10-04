const mongoose = require('mongoose');
const { EMAIL_REGEX } = require('../utils/validators');

const MAX_NAME_LENGTH = 50;
const MAX_TEXT_LENGTH = 1000;
const DEFAULT_NAME = 'A resident';

// A resident's comment under the Túath satisfaction vote. Comments start as
// 'pending' and only appear publicly once an admin approves them; the email
// is kept for moderation and never returned by the public endpoint.
const voteCommentSchema = new mongoose.Schema({
  // Optional display name — residents who leave it blank show as DEFAULT_NAME
  name: {
    type: String,
    trim: true,
    maxlength: MAX_NAME_LENGTH,
    default: DEFAULT_NAME,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: v => EMAIL_REGEX.test(v),
      message: 'Invalid email format'
    }
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: MAX_TEXT_LENGTH,
  },
  // SHA-256 of the private delete-link token emailed to the commenter. Only
  // the hash is stored, so a database leak can't be used to delete comments.
  deleteTokenHash: {
    type: String,
    index: true,
    select: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
    index: true,
  },
}, { timestamps: true });

const VoteComment = mongoose.model('VoteComment', voteCommentSchema);

module.exports = VoteComment;
module.exports.MAX_NAME_LENGTH = MAX_NAME_LENGTH;
module.exports.MAX_TEXT_LENGTH = MAX_TEXT_LENGTH;
module.exports.DEFAULT_NAME = DEFAULT_NAME;
