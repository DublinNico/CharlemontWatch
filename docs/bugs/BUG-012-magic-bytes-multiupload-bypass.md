# BUG-012 — Magic-Byte Validation Only Checked First File in Multi-Upload

| Field | Detail |
|---|---|
| **Status** | Fixed |
| **Severity** | High |
| **Area** | Backend / Security |

## Description

`validateMagicBytes` only inspected `req.files[0]` when processing multi-file uploads. Files at indices 1–9 were never magic-byte validated. An attacker could upload a valid JPEG as the first photo and up to 9 non-image files (e.g. PDFs renamed to `.jpg`) as the remaining photos — all would pass through to S3 and be stored in the incident record.

## Steps to Reproduce

1. `POST /api/incidents/report` with multipart body
2. Attach a valid JPEG as `photos[0]`
3. Attach a PDF renamed to `.jpg` as `photos[1]`
4. Observe both files are accepted with HTTP 201

## Root Cause

The middleware used `req.file || (req.files && req.files[0])` — a pattern suited to single-file uploads. When used after `upload.array('photos', 10)`, `req.file` is `undefined` and the fallback only grabbed the first element of the array, leaving the rest uninspected.

## Fix Applied

Replaced the single-file pattern with a loop over all files:

```js
const files = req.files?.length ? req.files : (req.file ? [req.file] : []);
for (const file of files) {
  if (!isValidImageBuffer(file.buffer)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
}
```

Also extracted the magic-byte logic into `isValidImageBuffer()` and fixed the `b.length < 12` guard — previously it applied globally before JPEG/PNG checks, rejecting any valid image buffer shorter than 12 bytes. The `< 12` guard now only applies to the WebP check, which actually requires bytes 8–11.

## Files Changed

- `backend/middleware/upload.js`

## Discovered By

Code review (automated review pass, 31 May 2026)
