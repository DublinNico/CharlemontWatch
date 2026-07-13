const SatisfactionVote = require('../models/SatisfactionVote');

const VALID_RATINGS = ['low', 'medium', 'high'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Submit or change a satisfaction vote (one vote per email, upserted)
const submitVote = async (req, res) => {
  try {
    const { email, rating } = req.body;

    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'a valid email is required' });
    }
    if (!rating || !VALID_RATINGS.includes(rating)) {
      return res.status(400).json({ error: 'rating must be one of: low, medium, high' });
    }

    const vote = await SatisfactionVote.findOneAndUpdate(
      { email: email.toLowerCase() },
      { rating, updatedAt: new Date() },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, rating: vote.rating });
  } catch (error) {
    console.error('Submit satisfaction vote error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Public aggregate counts — no emails exposed
const getSummary = async (req, res) => {
  try {
    const counts = { low: 0, medium: 0, high: 0 };
    const results = await SatisfactionVote.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);
    results.forEach(r => { counts[r._id] = r.count; });

    const total = counts.low + counts.medium + counts.high;
    res.json({ ...counts, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { submitVote, getSummary };
