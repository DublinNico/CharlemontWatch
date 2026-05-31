# BUG-007 — "Failed to Approve Incident" — shortId vs ObjectId Mismatch

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Critical |
| **Area** | Backend / Admin Moderation |

## Description
Clicking Approve or Reject on a pending incident in the admin Review Queue always returned "Failed to approve incident. Please try again." The incident was never updated.

## Steps to Reproduce
1. Submit a new incident report
2. Log in as admin and open the Review Queue
3. Click Approve on the pending incident
4. Observe the error message — status remains PENDING_REVIEW

## Root Cause
The frontend stores incidents using `api.shortId || api._id` as the incident `id`. For all incidents created after the shortId feature was introduced, `incident.id` is a shortId string (e.g. `CW-A1B2C3`).

The admin controller functions (`reviewIncident`, `reviewPhoto`, `updateIncidentStatus`, `deleteIncident`, `addPhoto`) all called `Incident.findById(req.params.id)`. Mongoose's `findById` only accepts a valid MongoDB ObjectId — passing a shortId string causes the lookup to fail silently, returning `null`, which triggers a 404 that the frontend surfaces as a generic error.

## Fix Applied
Added a `findByAnyId` helper that first tries a shortId lookup, then falls back to `findById`:

```js
const findByAnyId = async (id) => {
  return await Incident.findOne({ shortId: id }) ||
         await Incident.findById(id).catch(() => null);
};
```

Replaced all `Incident.findById(req.params.id)` and `Incident.findByIdAndUpdate/Delete` calls in the five affected admin functions with `findByAnyId`.

## Files Changed
- `backend/controllers/incidentController.js`
