// Vercel Routing Middleware: gives shared incident links their own link
// preview. The app is a client-rendered SPA, so Facebook, WhatsApp, X etc.
// (which don't run JavaScript) otherwise only ever see index.html's generic
// site-wide title/description/image for every /track?id=… URL.
//
// Only link-preview crawlers are intercepted — residents get the normal SPA
// with no extra API round-trip (which could hit a Render cold start).

export const config = {
  matcher: '/track',
};

const API_BASE = process.env.VITE_API_URL || 'https://charlemontwatch.onrender.com/api';
const API_TIMEOUT_MS = 8000;

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
// property/name attribute, leaving the rest of index.html untouched
const setMeta = (html, attr, key, value) =>
  html.replace(
    new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 'i'),
    `$1${escapeHtml(value)}$2`,
  );

const fetchIncident = async id => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/incidents/${encodeURIComponent(id)}`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.incident || data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const userAgent = request.headers.get('user-agent') || '';

  // Returning nothing lets the request continue to the normal SPA rewrite
  if (!id || !PREVIEW_BOTS.test(userAgent)) return;

  const [incident, indexRes] = await Promise.all([
    fetchIncident(id),
    fetch(new URL('/index.html', url)),
  ]);
  if (!incident || !indexRes.ok) return;

  const typeName = TYPE_NAMES[String(incident.incidentType).toLowerCase()] || 'Incident';
  const title = `${incident.title || typeName} – ${incident.location || 'Charlemont Street'} | CharlemontWatch`;
  const description = truncate(
    `${typeName} reported on CharlemontWatch (${incident.shortId}). ${incident.description || ''}`.trim(),
    200,
  );
  const photo = (incident.photos || []).find(p => p && p.url && p.approved !== false);
  const shareUrl = `${url.origin}/track?id=${encodeURIComponent(incident.shortId || id)}`;

  let html = await indexRes.text();
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
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
    // The fixed 1200×630 dimensions belong to the default og-image.jpg
    html = html.replace(/\s*<meta\s+property="og:image:(width|height)"[^>]*>/gi, '');
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}
