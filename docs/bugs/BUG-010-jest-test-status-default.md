# BUG-010 — Jest Unit Test Failing After Status Default Change

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Low |
| **Area** | Backend / Unit Tests |

## Description
After changing the Incident model's default status from `NEW` to `PENDING_REVIEW` as part of the dual-stage moderation feature, the existing unit test `UT-016-B` began failing.

## Error Message
```text
● Incident model validation › UT-016-B: defaults status to "PENDING_REVIEW" when not provided

  expect(received).toBe(expected)
  Expected: "PENDING_REVIEW"
  Received: "NEW"
```

## Steps to Reproduce
1. Run `npm test` in the `backend/` directory after the moderation feature was added
2. Observe `UT-016-B` failing

## Root Cause
The test was written when the default status was `NEW`. The moderation feature intentionally changed the default to `PENDING_REVIEW` so all new submissions enter the review queue, but the test assertion was not updated to match.

## Fix Applied
Updated the test assertion from `'NEW'` to `'PENDING_REVIEW'`:

```js
// Before
expect(doc.status).toBe('NEW');

// After
expect(doc.status).toBe('PENDING_REVIEW');
```

## Files Changed
- `backend/tests/unit/incidentModel.test.js`
