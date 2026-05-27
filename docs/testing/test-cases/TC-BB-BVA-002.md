# TC-BB-BVA-002 — Photo File Size Boundary Value Analysis

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-BVA-002 |
| **Technique** | Black-Box — Boundary Value Analysis |
| **Component** | Multer upload middleware — `fileSize` limit |
| **Objective** | Verify that the 5MB per-file limit is enforced exactly at and around the boundary |

---

## Boundary Analysis

The upload middleware sets `limits: { fileSize: 5 * 1024 * 1024 }` = **5,242,880 bytes**.

| Boundary | Size | Expected |
|----------|------|----------|
| Well below limit | 1 KB | Accepted |
| Just below limit | 5,242,879 bytes (5MB − 1 byte) | Accepted |
| At limit | 5,242,880 bytes (exactly 5MB) | Accepted |
| Just above limit | 5,242,881 bytes (5MB + 1 byte) | Rejected |
| Well above limit | 10MB | Rejected |

---

## Test Cases

### TC-BB-BVA-002-1: Very small file (1 KB) — well below limit
| | |
|---|---|
| **Input** | JPEG file of 1,024 bytes |
| **Expected** | File passes multer; included in upload to S3 |
| **Result** | PASS |

### TC-BB-BVA-002-2: File at 5MB − 1 byte (just below limit)
| | |
|---|---|
| **Input** | JPEG file of 5,242,879 bytes |
| **Expected** | File accepted by multer and uploaded to S3 |
| **Result** | PASS |

### TC-BB-BVA-002-3: File at exactly 5MB (at limit)
| | |
|---|---|
| **Input** | JPEG file of 5,242,880 bytes |
| **Expected** | File accepted by multer (limit is inclusive) |
| **Result** | PASS |

### TC-BB-BVA-002-4: File at 5MB + 1 byte (just above limit)
| | |
|---|---|
| **Input** | File of 5,242,881 bytes |
| **Expected** | Multer rejects with `LIMIT_FILE_SIZE` error; HTTP 500 returned |
| **Result** | PASS |

### TC-BB-BVA-002-5: File type not in allowed list (MIME filter)
| | |
|---|---|
| **Input** | A `.gif` file (MIME: `image/gif`) |
| **Expected** | `fileFilter` callback returns error: `"Only JPEG, PNG, and WebP allowed"` |
| **Result** | PASS |

### TC-BB-BVA-002-6: PDF masquerading as JPEG (MIME spoofing)
| | |
|---|---|
| **Input** | A `.pdf` file renamed to `.jpg`; browser sends `Content-Type: image/jpeg` |
| **Expected** | Multer accepts based on declared MIME type (no magic-byte check in current implementation). *This is a noted security gap — see Notes.* |
| **Result** | File accepted (gap identified) |

---

## Notes
The `fileFilter` in `middleware/upload.js` checks `file.mimetype` as declared by the client — it does not inspect the actual file bytes (magic numbers). This means a malicious file could bypass the filter. A recommended improvement is to use a library such as **file-type** to verify the real file signature server-side.

Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`.
