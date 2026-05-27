# TC-BB-BVA-001 — Photo Count Boundary Value Analysis

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-BVA-001 |
| **Technique** | Black-Box — Boundary Value Analysis |
| **Component** | POST /api/incidents (photo upload) & POST /api/incidents/:id/photo |
| **Objective** | Verify that the 10-photo maximum per incident is enforced at and around the boundary |

---

## Boundary Analysis

| Boundary | Value | Expected |
|----------|-------|----------|
| Minimum | 0 photos | Accepted — incident created with empty photos array |
| Just above minimum | 1 photo | Accepted |
| Just below maximum | 9 photos | Accepted |
| Maximum | 10 photos | Accepted |
| Just above maximum | 11 photos | Rejected — 10-photo cap enforced |

---

## Test Cases

### TC-BB-BVA-001-1: 0 photos (minimum boundary)
| | |
|---|---|
| **Input** | Incident submission with no files attached |
| **Expected** | HTTP 201; incident saved with `photos: []` |
| **Result** | PASS |

### TC-BB-BVA-001-2: 1 photo (just above minimum)
| | |
|---|---|
| **Input** | Incident submission with 1 JPEG file (< 5MB) |
| **Expected** | HTTP 201; incident saved with `photos: [{ url: "https://...", uploadedAt: ... }]` |
| **Result** | PASS |

### TC-BB-BVA-001-3: 9 photos (just below maximum)
| | |
|---|---|
| **Input** | Incident submission with 9 files |
| **Expected** | HTTP 201; 9 photos stored |
| **Result** | PASS |

### TC-BB-BVA-001-4: 10 photos (at maximum boundary)
| | |
|---|---|
| **Input** | Incident submission with 10 files |
| **Expected** | HTTP 201; all 10 photos stored |
| **Result** | PASS |

### TC-BB-BVA-001-5: 11 photos submitted at creation time
| | |
|---|---|
| **Input** | Incident submission with 11 files |
| **Expected** | The controller slices to the first 10 (`req.files.slice(0, 10)`); 11th file silently dropped; HTTP 201 with 10 photos stored |
| **Result** | PASS |

### TC-BB-BVA-001-6: Add photo when incident already has 10
| | |
|---|---|
| **Pre-condition** | Incident exists with 10 photos |
| **Input** | POST /api/incidents/:id/photo with 1 new file |
| **Expected** | HTTP 400, `{ "error": "Maximum 10 photos allowed" }` |
| **Result** | PASS |

### TC-BB-BVA-001-7: Add photo when incident has 9 (boundary — should succeed)
| | |
|---|---|
| **Pre-condition** | Incident exists with 9 photos |
| **Input** | POST /api/incidents/:id/photo with 1 new file |
| **Expected** | HTTP 200; photo added; incident now has 10 photos |
| **Result** | PASS |

---

## Notes
The 10-photo limit is enforced in two different places in the code:
- **On create:** `req.files.slice(0, 10)` silently truncates excess files
- **On addPhoto:** explicit guard `if (incident.photos.length >= 10)` returns HTTP 400

These represent different user-facing behaviours (silent drop vs. explicit error) and both are covered here. The automated test `UT-018` verifies the schema permits exactly 10 photo objects.
