// Verifies a Cloudflare Turnstile token against Cloudflare's siteverify API.
// Falls back to allowing the request through (with a warning) when
// TURNSTILE_SECRET_KEY isn't configured, so a missing env var never blocks
// real submissions — same fallback pattern used for the optional Tuath/DCC
// complaint email config.
const verifyTurnstile = async (token, remoteIp) => {
  if (process.env.NODE_ENV === 'test') return true;

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn('TURNSTILE_SECRET_KEY not configured — CAPTCHA check skipped');
    return true;
  }

  if (!token) return false;

  try {
    const params = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (remoteIp) params.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification request failed:', error);
    return false;
  }
};

module.exports = { verifyTurnstile };
