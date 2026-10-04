const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { submitVote, getSummary } = require('../controllers/satisfactionController');
const {
  submitComment, getApprovedComments, getAllComments, approveComment, deleteComment,
  getCommentByToken, deleteCommentByToken,
} = require('../controllers/voteCommentController');
const { authenticate, adminOnly } = require('../middleware/auth');

// Throttles votes per IP so the public endpoint can't be flooded with junk submissions
const voteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many vote submissions, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Throttles comments per IP — each one emails the admin, so keep floods out
const commentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many comments, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Public: submit or change a satisfaction vote (upserted by email)
router.post('/', voteLimiter, submitVote);

// Public: aggregate counts per rating
router.get('/summary', getSummary);

// Public: approved comments under the vote, and submitting a new (pending) one
router.get('/comments', getApprovedComments);
router.post('/comments', commentLimiter, submitComment);

// Throttles delete-link lookups per IP so tokens can't be guessed at speed
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

// Public: commenter views / deletes their own comment via the emailed link
router.post('/comments/mine', tokenLimiter, getCommentByToken);
router.post('/comments/mine/delete', tokenLimiter, deleteCommentByToken);

// Admin: moderation queue — list all, approve, delete
router.get('/comments/admin', authenticate, adminOnly, getAllComments);
router.patch('/comments/admin/:id/approve', authenticate, adminOnly, approveComment);
router.delete('/comments/admin/:id', authenticate, adminOnly, deleteComment);

module.exports = router;
