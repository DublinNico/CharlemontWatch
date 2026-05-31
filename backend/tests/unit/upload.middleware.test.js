const express = require('express');
const request = require('supertest');
const { upload, validateMagicBytes } = require('../../middleware/upload');

// Minimal valid image buffers
const JPEG_BUFFER = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, ...Array(20).fill(0x00)]);
const PNG_BUFFER  = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...Array(16).fill(0x00)]);
const WEBP_BUFFER = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x00, 0x00, 0x00, 0x00, // file size (unused in test)
  0x57, 0x45, 0x42, 0x50, // "WEBP"
  ...Array(12).fill(0x00)
]);
// PDF magic bytes disguised as a .jpg
const PDF_AS_JPG  = Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(20).fill(0x00)]); // "%PDF"

const buildApp = (field = 'photo', multi = false) => {
  const app = express();
  const multerMiddleware = multi
    ? upload.array(field, 10)
    : upload.single(field);
  app.post('/upload', multerMiddleware, validateMagicBytes, (req, res) => res.json({ ok: true }));
  app.use((err, req, res, next) => res.status(400).json({ error: err.message }));
  return app;
};

// ─── MIME type filter ─────────────────────────────────────────────────────────

describe('upload middleware — MIME type filter', () => {
  test('UT-038-A: rejects a file with an unsupported MIME type (text/plain)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      .attach('photo', JPEG_BUFFER, { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/JPEG|PNG|WebP/i);
  });

  test('UT-038-B: rejects a file with application/pdf MIME type', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      .attach('photo', PDF_AS_JPG, { filename: 'doc.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(400);
  });
});

// ─── File size limit ──────────────────────────────────────────────────────────

describe('upload middleware — file size limit', () => {
  test('UT-039: rejects a file exceeding 5MB', async () => {
    const app = buildApp();
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 0xFF); // 6MB
    const res = await request(app)
      .post('/upload')
      .attach('photo', bigBuffer, { filename: 'big.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
  });
});

// ─── Magic-byte validation ────────────────────────────────────────────────────

describe('upload middleware — magic-byte validation', () => {
  test('UT-040-A: accepts a valid JPEG', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      .attach('photo', JPEG_BUFFER, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('UT-040-B: accepts a valid PNG', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      .attach('photo', PNG_BUFFER, { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
  });

  test('UT-040-C: accepts a valid WebP', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      .attach('photo', WEBP_BUFFER, { filename: 'photo.webp', contentType: 'image/webp' });
    expect(res.status).toBe(200);
  });

  test('UT-041: rejects a PDF renamed to .jpg (magic-byte mismatch)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/upload')
      // Content-Type says image/jpeg but the buffer starts with %PDF
      .attach('photo', PDF_AS_JPG, { filename: 'exploit.jpg', contentType: 'image/jpeg' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type/i);
  });
});

// ─── No-file passthrough ──────────────────────────────────────────────────────

describe('upload middleware — no file submitted', () => {
  test('UT-042: passes through when no file is attached', async () => {
    const app = buildApp();
    const res = await request(app).post('/upload');
    expect(res.status).toBe(200);
  });
});
