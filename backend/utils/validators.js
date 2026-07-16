// Shared email format check, reused by the Incident model, SatisfactionVote
// model, and both controllers so the rule stays in exactly one place
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = { EMAIL_REGEX };
