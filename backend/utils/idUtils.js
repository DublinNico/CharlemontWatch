const crypto = require('crypto');

const generateShortId = () => 'CW-' + crypto.randomBytes(3).toString('hex').toUpperCase();

module.exports = { generateShortId };
