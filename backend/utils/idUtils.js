const crypto = require('crypto');

// Generates a short, human-readable public reference like "CW-A1B2C3" that
// residents use to track their report, instead of exposing the raw MongoDB ObjectId
const generateShortId = () => 'CW-' + crypto.randomBytes(3).toString('hex').toUpperCase();

module.exports = { generateShortId };
