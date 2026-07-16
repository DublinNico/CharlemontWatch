const SatisfactionVote = require('../models/SatisfactionVote');
const { EMAIL_REGEX } = require('../utils/validators');

const VALID_RATINGS = ['low', 'medium', 'high'];

// Submit or change a satisfaction vote (one vote per email, upserted).
// Public endpoint — resubmitting with the same email overwrites the
// resident's previous rating instead of creating a duplicate.
const submitVote = async (req, res) => {
  try {
    const { email, rating } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'a valid email is required' });
    }
    if (!rating || !VALID_RATINGS.includes(rating)) {
      return res.status(400).json({ error: 'rating must be one of: low, medium, high' });
    }

    const vote = await SatisfactionVote.findOneAndUpdate(
      { email: email.toLowerCase() },
      { rating },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, rating: vote.rating });
  } catch (error) {
    console.error('Submit satisfaction vote error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    // Concurrent upserts for a brand-new email can race and hit the unique index
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Vote submission conflict — please try again' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Public aggregate counts — no emails exposed. Powers the results bar shown
// on the Home page.
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
    console.error('Get satisfaction summary error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { submitVote, getSummary };
