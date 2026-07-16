const { EMAIL_REGEX } = require('../utils/validators');
const { sendContactMessage } = require('../services/emailService');

const MAX_MESSAGE_LENGTH = 5000;

// Public: handles "Contact Us" form submissions. Validates the input, then
// emails the admin with Reply-To set to the sender so replying goes
// straight back to them, not through CharlemontWatch.
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, message, website } = req.body;

    // Honeypot: a hidden field real users never see or fill in, but bots
    // that blindly autofill every input on the form will. Pretend success
    // rather than telling the bot its submission was rejected.
    if (website) {
      return res.status(200).json({ success: true });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'a valid email is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
    }

    await sendContactMessage(name.trim(), email.trim(), message.trim());
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Contact form submission failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { submitContactMessage };
