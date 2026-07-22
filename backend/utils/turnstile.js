// Verifies a Cloudflare Turnstile token against Cloudflare's siteverify API.
// Returns one of three results: true (verified), false (invalid/missing
// token — caller should 400), or 'unavailable' (network/timeout/parse
// failure reaching Cloudflare — caller should 503, not blame the visitor).
const verifyTurnstile = async (token, remoteIp) => {
  if (process.env.NODE_ENV === 'test') return true;

  if (!process.env.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY not configured in production — rejecting report submissions');
      return false;
    }
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
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (!data.success) {
      console.warn('Turnstile verification rejected:', data['error-codes']);
    }
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification request failed:', error);
    return 'unavailable';
  }
};

module.exports = { verifyTurnstile };
