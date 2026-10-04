import { vi, afterEach, describe, test, expect } from 'vitest';
import middleware from '../../middleware.js';

const TEMPLATE = `<html><head>
<title>CharlemontWatch</title>
<meta name="description" content="site" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://charlemontwatch.ie" />
<meta property="og:title" content="site" />
<meta property="og:description" content="site" />
<meta property="og:image" content="https://charlemontwatch.ie/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:title" content="site" />
<meta name="twitter:description" content="site" />
<meta name="twitter:image" content="https://charlemontwatch.ie/og-image.jpg" />
</head></html>`;

const incidentWith = (photo: Record<string, unknown>) => ({
  shortId: 'CW-ABC123',
  incidentType: 'maintenance',
  title: 'Bin room',
  location: 'ffrench Mullen House',
  description: 'Overflowing bins',
  photos: [{ url: 'https://s3.example.com/photo.jpg', approved: true, ...photo }],
});

// Serves the incident JSON for API calls and the template for /index.html
const mockFetch = (incident: unknown) => {
  vi.stubGlobal('fetch', vi.fn(async (resource: string | URL) => {
    const body = String(resource).endsWith('/index.html') ? TEMPLATE : JSON.stringify(incident);
    return new Response(body, { status: 200 });
  }));
};

const crawl = () => middleware(new Request('https://charlemontwatch.ie/track?id=CW-ABC123', {
  headers: { 'user-agent': 'facebookexternalhit/1.1' },
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Link previews for shared incident links ──────────────────────────────────

describe('incident link-preview middleware', () => {
  test('declares the photo size when the upload recorded it', async () => {
    mockFetch(incidentWith({ width: 1920, height: 1440 }));
    const html = await (await crawl())!.text();

    expect(html).toContain('<meta property="og:image" content="https://s3.example.com/photo.jpg" />');
    expect(html).toContain('<meta property="og:image:width" content="1920" />');
    expect(html).toContain('<meta property="og:image:height" content="1440" />');
  });

  test('drops the default 1200×630 size for older photos with no recorded size', async () => {
    mockFetch(incidentWith({}));
    const html = await (await crawl())!.text();

    expect(html).toContain('content="https://s3.example.com/photo.jpg"');
    expect(html).not.toContain('og:image:width');
    expect(html).not.toContain('og:image:height');
  });

  test('ignores regular visitors', async () => {
    mockFetch(incidentWith({ width: 1920, height: 1440 }));
    const res = await middleware(new Request('https://charlemontwatch.ie/track?id=CW-ABC123', {
      headers: { 'user-agent': 'Mozilla/5.0' },
    }));
    expect(res).toBeUndefined();
  });
});

// ─── Link preview for the Túath vote page ─────────────────────────────────────

describe('vote page link preview', () => {
  const crawlVote = (ua = 'facebookexternalhit/1.1') => middleware(new Request('https://charlemontwatch.ie/vote', {
    headers: { 'user-agent': ua },
  }));

  test('gives crawlers the vote title, description and sized image', async () => {
    mockFetch(null);
    const html = await (await crawlVote())!.text();

    expect(html).toContain('<title>Are you happy with Túath Housing? | CharlemontWatch</title>');
    expect(html).toContain('<meta property="og:url" content="https://charlemontwatch.ie/vote" />');
    expect(html).toContain('<meta property="og:image" content="https://charlemontwatch.ie/og-vote.jpg" />');
    expect(html).toContain('<meta property="og:image:width" content="1200" />');
    expect(html).toContain('<meta property="og:image:height" content="630" />');
    expect(html).toContain('<meta name="twitter:image" content="https://charlemontwatch.ie/og-vote.jpg" />');
    expect(html).toContain('leave a comment');
  });

  test('does not call the backend API', async () => {
    mockFetch(null);
    await crawlVote();
    const calls = (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(c => String(c[0]));
    expect(calls).toEqual(['https://charlemontwatch.ie/index.html']);
  });

  test('ignores regular visitors', async () => {
    mockFetch(null);
    expect(await crawlVote('Mozilla/5.0')).toBeUndefined();
  });
});
