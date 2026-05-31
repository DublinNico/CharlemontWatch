# BUG-016 — Mongoose ValidationError Returned as 500 Instead of 400

| Field | Detail |
|---|---|
| **Date** | 31/05/26 |
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Backend / API |

## Description

Submitting an incident report with missing required fields (e.g. no `location`) or an invalid enum value (e.g. `incidentType: "vandalism"`) returned HTTP 500 Internal Server Error. The correct status for a bad client request is 400 Bad Request. The integration tests IT-002 and IT-003 were also asserting 500, so the wrong behaviour was not caught.

## Steps to Reproduce

1. `POST /api/incidents/report` with `{ incidentType: "graffiti", description: "Test" }` (no location)
2. Observe: HTTP 500, `{ "error": "Incident validation failed: location: Path \`location\` is required." }`
3. Expected: HTTP 400

## Root Cause

The `createIncident` catch block returned `res.status(500)` for all errors, including Mongoose `ValidationError` which is a predictable client error, not a server fault.

```js
// before
} catch (error) {
  console.error('Create incident error:', error);
  res.status(500).json({ error: error.message });
}
```

## Fix Applied

Added a `ValidationError` check before the generic 500:

```js
} catch (error) {
  console.error('Create incident error:', error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  res.status(500).json({ error: 'Internal Server Error' });
}
```

Integration tests IT-002 and IT-003 updated to assert 400.

## Files Changed

- `backend/controllers/incidentController.js`
- `backend/tests/integration/incidents.test.js`

## Discovered By

Code review (31/05/26)
