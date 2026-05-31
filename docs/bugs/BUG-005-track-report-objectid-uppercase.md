# BUG-005 — Track Report Uppercasing MongoDB ObjectIds

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | High |
| **Area** | Frontend / Incident Lookup |

## Description
When a user entered a 24-character hex MongoDB ObjectId into the Track Report search box, it was converted to uppercase before being sent to the API. MongoDB ObjectIds are case-sensitive, so the lookup always returned 404.

## Steps to Reproduce
1. Navigate to `/track`
2. Enter a valid 24-character ObjectId (e.g. `6642aef3b1c0d8e9f0123456`)
3. Observe "Incident not found" even though the incident exists

## Root Cause
The `doSearch` function called `.toUpperCase()` on the trimmed input unconditionally. This was intended for shortIds (format `CW-XXXXXX`) but incorrectly transformed ObjectIds.

## Fix Applied
Added a check before uppercasing: if the input matches a 24-character hex string it is sent as-is; otherwise `.toUpperCase()` is applied for shortId normalisation.

```js
const normalised = /^[0-9a-fA-F]{24}$/.test(trimmed)
  ? trimmed
  : trimmed.toUpperCase();
```

## Files Changed
- `frontend/src/app/pages/TrackReport.tsx`
