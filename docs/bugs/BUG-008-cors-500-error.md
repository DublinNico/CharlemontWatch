# BUG-008 — CORS Returning 500 Instead of 403 on Disallowed Origins

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Backend / Security |

## Description
Requests from disallowed origins (non-localhost) received a 500 Internal Server Error response instead of a proper 403 Forbidden. This masked the real cause in client-side error handling.

## Steps to Reproduce
1. Make an API request from an origin not matching `localhost`
2. Observe the response is HTTP 500, not 403

## Root Cause
The CORS `origin` callback was calling `cb(new Error('Not allowed by CORS'))` for disallowed origins. When `cors` receives an `Error` object as the first argument it re-throws it, which Express catches as an unhandled error and converts to a 500 response.

## Fix Applied
Changed the callback to `cb(null, false)` to silently block the request, then added an explicit middleware after the CORS setup that checks the origin and returns 403:

```js
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGIN.test(origin)) return cb(null, true);
    cb(null, false);
  }
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).send('Forbidden');
  next();
});
```

## Files Changed
- `backend/server.js`
