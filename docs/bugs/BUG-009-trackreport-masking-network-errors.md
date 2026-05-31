# BUG-009 — Track Report Masking Network Errors as "Not Found"

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Low |
| **Area** | Frontend / Error Handling |

## Description
Any error that occurred during an incident lookup on the Track Report page — including server errors, network timeouts, and connection failures — was displayed to the user as "Incident not found." This made it impossible for users to distinguish between a genuinely missing incident and a server/network problem.

## Steps to Reproduce
1. Stop the backend server
2. Navigate to `/track` and search for any incident ID
3. Observe "Incident not found" — misleading, as the server is simply unreachable

## Root Cause
The `catch` block in `doSearch` unconditionally called `setNotFound(true)` regardless of the error type. There was no check on `err.response?.status`.

## Fix Applied
Split the catch block to distinguish 404 from other errors:

```js
catch (err) {
  if (err.response?.status === 404) {
    setNotFound(true);
  } else {
    setSearchError('Something went wrong. Please check your connection and try again.');
  }
}
```

Added a `searchError` state and a corresponding error message in the UI.

## Files Changed
- `frontend/src/app/pages/TrackReport.tsx`
