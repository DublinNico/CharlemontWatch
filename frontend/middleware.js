// Vercel Routing Middleware: gives shared incident links (and the Túath vote
// page) their own link preview. The app is a client-rendered SPA, so Facebook, WhatsApp, X etc.
// (which don't run JavaScript) otherwise only ever see index.html's generic
// site-wide title/description/image for every /track?id=… URL.
//
// Only link-preview crawlers are intercepted — residents get the normal SPA
// with no extra API round-trip (which could hit a Render cold start).

export const config = {
  matcher: ['/track', '/vote'],
};

const API_BASE = process.env.VITE_API_URL || 'https://charlemontwatch.onrender.com/api';
const API_TIMEOUT_MS = 8000;
const TEMPLATE_TIMEOUT_MS = 3000;

const PREVIEW_BOTS = /facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|linkedinbot|discordbot|telegrambot|pinterest|redditbot|skypeuripreview|embedly|iframely|vkshare|applebot|googlebot|bingbot|mastodon|bluesky|snapchat|viber|outbrain|quora link preview/i;

const TYPE_NAMES = {
  graffiti: 'Graffiti',
  antisocial: 'Anti-Social Behaviour',
  safetyhazard: 'Safety Hazard',
  maintenance: 'Maintenance Issue',
};

const escapeHtml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

// Replaces the content="" of an existing <meta> tag matched by its
// property/name attribute, leaving the rest of index.html untouched. Uses a
// replacement callback so "$&"-style sequences in incident text stay literal.
const setMeta = (html, attr, key, value) =>
  html.replace(
    new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i'),
    (_, open, close) => `${open}${escapeHtml(value)}${close}`,
  );

// Fetches and parses a response within a time limit; resolves to null on
// timeout, network error or non-2xx so the caller can fall back cleanly
const fetchWithTimeout = async (resource, timeoutMs, parse) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(resource, { signal: controller.signal });
    if (!res.ok) return null;
    return await parse(res);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const fetchIncident = async id => {
  const data = await fetchWithTimeout(
    `${API_BASE}/incidents/${encodeURIComponent(id)}`,
    API_TIMEOUT_MS,
    res => res.json(),
  );
  return data && (data.incident || data);
};

// Fixed preview for /vote — needs no API call, so it works even while the
// Render backend is asleep
const VOTE_PREVIEW = {
  title: 'Are you happy with Túath Housing? | CharlemontWatch',
  description: 'Charlemont Street residents are voting. Rate Túath Housing and leave a comment. It takes less than a minute.',
  image: '/og-vote.jpg',
  width: 1200,
  height: 630,
};

const votePreview = async (url) => {
  const template = await fetchWithTimeout(new URL('/index.html', url), TEMPLATE_TIMEOUT_MS, res => res.text());
  if (!template) return;

  const { title, description } = VOTE_PREVIEW;
  const image = `${url.origin}${VOTE_PREVIEW.image}`;
  let html = template.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:url', `${url.origin}/vote`);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:width', String(VOTE_PREVIEW.width));
  html = setMeta(html, 'property', 'og:image:height', String(VOTE_PREVIEW.height));
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  html = setMeta(html, 'name', 'twitter:image', image);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const userAgent = request.headers.get('user-agent') || '';

  if (url.pathname === '/vote') {
    return PREVIEW_BOTS.test(userAgent) ? votePreview(url) : undefined;
  }

  // Returning nothing lets the request continue to the normal SPA rewrite
  if (!id || !PREVIEW_BOTS.test(userAgent)) return;

  const [incident, template] = await Promise.all([
    fetchIncident(id),
    fetchWithTimeout(new URL('/index.html', url), TEMPLATE_TIMEOUT_MS, res => res.text()),
  ]);
  if (!incident || !template) return;

  const typeName = TYPE_NAMES[String(incident.incidentType).toLowerCase()] || 'Incident';
  const title = `${incident.title || typeName} – ${incident.location || 'Charlemont Street'} | CharlemontWatch`;
  const description = truncate(
    `${typeName} reported on CharlemontWatch (${incident.shortId}). ${incident.description || ''}`.trim(),
    200,
  );
  const photo = (incident.photos || []).find(p => p && p.url && p.approved !== false);
  const shareUrl = `${url.origin}/track?id=${encodeURIComponent(incident.shortId || id)}`;

  let html = template.replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:type', 'article');
  html = setMeta(html, 'property', 'og:url', shareUrl);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (photo) {
    html = setMeta(html, 'property', 'og:image', photo.url);
    html = setMeta(html, 'name', 'twitter:image', photo.url);
    // Facebook only shows a never-seen image on the first share if its size
    // is declared, so pass the photo's real size when the upload recorded it.
    // Otherwise drop the tags: 1200×630 belongs to the default og-image.jpg.
    if (Number(photo.width) > 0 && Number(photo.height) > 0) {
      html = setMeta(html, 'property', 'og:image:width', String(photo.width));
      html = setMeta(html, 'property', 'og:image:height', String(photo.height));
    } else {
      html = html.replace(/\s*<meta\s+property="og:image:(width|height)"[^>]*>/gi, '');
    }
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
