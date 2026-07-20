# BUG-019 — Incident Photos Never Actually Marked Approved, Exposed by an IDOR Fix

| Field | Detail |
|---|---|
| **Date** | 20/07/26 |
| **Status** | Fixed |
| **Severity** | High |
| **Area** | Backend / Security, Backend / Data |

## Description

`reviewIncident`'s `approve` action has a comment stating it "marks all its photos approved" when an admin approves a pending incident. The code never actually did this. It went unnoticed because nothing checked the `approved` flag when serving photos — every photo was shown publicly regardless of its approval state, whether the parent incident was pending review or already published.

An IDOR fix earlier the same day (see PR #25 and its CodeRabbit follow-up) made `GET /api/incidents` and `GET /api/incidents/:id` filter out unapproved photos for non-admin callers, closing a real privacy gap (unreviewed/rejected incident photos were previously visible to anyone). That fix was correct, but it meant every existing photo in the live database — all of it still `approved: false` from the never-implemented approve step — vanished from the public site at the same moment. This looked identical to a display regression from the outside: "the images have disappeared."

## Steps to Reproduce (pre-fix)

1. Resident submits a report with a photo → incident starts `PENDING_REVIEW`, photo starts `approved: false`
2. Admin approves the incident via the review queue → status becomes `NEW`, but the photo's `approved` flag is never touched
3. Visit `/incidents` (public) → before the IDOR fix, the photo displays anyway, since nothing checks `approved`
4. After the IDOR fix ships, the same photo silently stops appearing, with no code change to the photo itself — only the redaction filter newly enforcing a flag that was always false

## Root Cause

```js
// reviewIncident, before fix
if (action === 'approve') {
  incident.status = 'NEW';
} else {
  incident.status = 'REJECTED';
}
```

The comment directly above this block already claimed photos get marked approved on approve — the implementation just never matched the comment. Likely drifted apart during an earlier refactor of the review flow.

## Fix Applied

```js
if (action === 'approve') {
  incident.status = 'NEW';
  incident.photos.forEach(photo => { photo.approved = true; });
} else {
  incident.status = 'REJECTED';
}
```

Also ran a one-time backfill against the live database: every already-published (`NEW`/`IN_PROGRESS`/`RESOLVED`) incident with any `approved: false` photo had its photos marked approved, since those incidents will never go through `reviewIncident` again and would otherwise have stayed broken permanently. 5 incidents / 6 photos were affected.

## Files Changed

- `backend/controllers/incidentController.js` — `reviewIncident`
- `backend/tests/integration/incidents.test.js` — IT-034-A, regression test asserting approve marks all photos approved
- One-time database backfill (not a code change — run manually against the live Atlas cluster, script discarded after use)

## Discovered By

User reported photos missing from `/incidents` while manually testing the just-shipped IDOR fix locally (20/07/26). Diagnosed by comparing an anonymous vs. admin-authenticated fetch of the same incidents — the admin view showed the photos with `approved: false`, revealing the flag had never been set rather than the display logic being broken.
