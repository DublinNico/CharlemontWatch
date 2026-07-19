# BUG-018 — Internal Error Message Leaked to Client in incidentController 500 Responses

| Field | Detail |
|---|---|
| **Date** | 19/07/26 |
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Backend / Security |

## Description

Seven functions in `incidentController.js` — `getIncident`, `getAllIncidents`, `getPendingIncidents`, `reviewIncident`, `reviewPhoto`, `updateIncidentStatus`, `deleteIncident` — returned `error.message` directly in the 500 response body on any unexpected failure. BUG-015 fixed this same pattern in the global error handler and in `createIncident`'s non-ValidationError path, but these seven functions were missed at the time and had the leak the whole way through.

## Steps to Reproduce

1. Trigger an unexpected error in any of the seven affected functions (e.g. a database connectivity issue, or a malformed ObjectId reaching a path not already guarded)
2. Observe the response body contains the raw driver/Mongoose error message instead of a generic one

## Root Cause

```js
// before, repeated across all 7 functions
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

No logging of the real error server-side either — errors were only ever visible to whoever called the API, not in Render's logs.

## Fix Applied

Generic message returned to the client; full error still logged server-side, matching the pattern already used in `createIncident`/`addPhoto`:

```js
} catch (error) {
  console.error('Get incident error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
```

(Each function got its own descriptive log label — "Get incident error", "Get all incidents error", "Get pending incidents error", "Review incident error", "Review photo error", "Update incident status error", "Delete incident error".)

## Files Changed

- `backend/controllers/incidentController.js`
- `backend/tests/unit/incidentController.test.js` (new — UT-065 – UT-071, one regression test per function; verified each test actually fails if the fix is reverted)

## Discovered By

Code review, following up on a question about what user data reaches third parties (19/07/26)
