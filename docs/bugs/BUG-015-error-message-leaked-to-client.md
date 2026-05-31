# BUG-015 — Internal Error Message Leaked to Client in 500 Responses

| Field | Detail |
|---|---|
| **Date** | 31/05/26 |
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Backend / Security |

## Description

The global Express error handler in `app.js` returned `err.message` directly in the 500 response body. Internal error messages can expose stack details, database field names, or logic hints that aid an attacker in probing the system.

## Steps to Reproduce

1. Send a request that causes an unhandled server error (e.g. a malformed body that bypasses validation)
2. Observe the response: `{ "error": "Incident validation failed: location: Path \`location\` is required." }`
3. Internal Mongoose schema details are visible in the response

## Root Cause

```js
// before
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
```

`err.message` was returned verbatim. The same pattern existed in `createIncident` for non-ValidationError paths.

## Fix Applied

Generic message returned to the client; full error still logged server-side:

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});
```

## Files Changed

- `backend/app.js`
- `backend/controllers/incidentController.js` (non-ValidationError 500 path)

## Discovered By

Code review (31/05/26)
