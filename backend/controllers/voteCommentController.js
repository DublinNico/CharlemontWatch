const crypto = require('crypto');
const mongoose = require('mongoose');
const VoteComment = require('../models/VoteComment');
const { MAX_NAME_LENGTH, MAX_TEXT_LENGTH, DEFAULT_NAME } = require('../models/VoteComment');
const { EMAIL_REGEX } = require('../utils/validators');
const { sendVoteCommentNotification, sendCommentDeleteLink } = require('../services/emailService');

const PUBLIC_LIMIT = 50;

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

// Looks up a comment from a delete-link token, or null for a missing,
// malformed or unknown one
const findByToken = (token) => {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
  return VoteComment.findOne({ deleteTokenHash: hashToken(token) });
};

// Public: submit a comment under the satisfaction vote. It's saved as
// pending and the admin is emailed; nothing is shown until it's approved.
const submitComment = async (req, res) => {
  try {
    const { name, email, text, website } = req.body;

    // Honeypot: hidden field only bots fill in. Pretend success so the bot
    // isn't told its submission was dropped.
    if (website) {
      return res.status(201).json({ success: true });
    }

    // Name is optional; a blank one falls back to DEFAULT_NAME
    const displayName = typeof name === 'string' && name.trim() ? name.trim() : DEFAULT_NAME;
    if (displayName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `name must be ${MAX_NAME_LENGTH} characters or fewer` });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'a valid email is required' });
    }
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'comment is required' });
    }
    if (text.trim().length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `comment must be ${MAX_TEXT_LENGTH} characters or fewer` });
    }

    // The raw token only ever exists in the commenter's email; we keep its hash
    const deleteToken = crypto.randomBytes(32).toString('hex');
    const comment = await VoteComment.create({
      name: displayName,
      email: email.trim(),
      text: text.trim(),
      deleteTokenHash: hashToken(deleteToken),
    });
    sendVoteCommentNotification(comment);
    sendCommentDeleteLink(comment, deleteToken);

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Submit vote comment error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Public: approved comments, newest first — names and text only, no emails
const getApprovedComments = async (req, res) => {
  try {
    const comments = await VoteComment.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(PUBLIC_LIMIT)
      .select('name text createdAt');
    res.json(comments);
  } catch (error) {
    console.error('Get vote comments error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Admin: every comment, pending first then newest, including emails
const getAllComments = async (req, res) => {
  try {
    const comments = await VoteComment.find().sort({ status: -1, createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get all vote comments error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Admin: approve a pending comment so it appears publicly
const approveComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const comment = await VoteComment.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json(comment);
  } catch (error) {
    console.error('Approve vote comment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Admin: delete a comment (rejecting a pending one, or removing a published one)
const deleteComment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const comment = await VoteComment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vote comment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Public: show the commenter their own comment from the emailed delete link,
// so they can confirm before deleting. Token is POSTed to keep it out of logs.
const getCommentByToken = async (req, res) => {
  try {
    const comment = await findByToken(req.body.token);
    if (!comment) return res.status(404).json({ error: 'This link is invalid or the comment has already been deleted' });
    res.json({ name: comment.name, text: comment.text, status: comment.status, createdAt: comment.createdAt });
  } catch (error) {
    console.error('Get vote comment by token error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Public: the commenter deletes their own comment via the emailed link
const deleteCommentByToken = async (req, res) => {
  try {
    const comment = await findByToken(req.body.token);
    if (!comment) return res.status(404).json({ error: 'This link is invalid or the comment has already been deleted' });
    await comment.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vote comment by token error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  submitComment, getApprovedComments, getAllComments, approveComment, deleteComment,
  getCommentByToken, deleteCommentByToken,
};
