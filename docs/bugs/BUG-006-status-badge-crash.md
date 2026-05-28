# BUG-006 — StatusBadge Crash on PENDING_REVIEW and REJECTED Statuses

| Field | Detail |
|---|---|
| **Status** | Fixed |
| **Severity** | Critical |
| **Area** | Frontend / UI Component |

## Description
The application crashed with an unhandled TypeError when any incident with a status of `PENDING_REVIEW` or `REJECTED` was rendered. This made the admin Review Queue completely unusable.

## Error Message
```
Unexpected Application Error!
Cannot read properties of undefined (reading 'icon')
TypeError: Cannot read properties of undefined (reading 'icon')
    at StatusBadge
```

## Steps to Reproduce
1. Log in as admin
2. Navigate to the Review Queue tab
3. Observe the full-page crash

## Root Cause
`StatusBadge` maintained a `configs` object keyed by `IncidentStatus`. When the dual-stage moderation feature added `PENDING_REVIEW` and `REJECTED` to the status enum, these two values were never added to the `configs` map. `configs[status]` returned `undefined`, and accessing `.icon` on `undefined` threw.

## Fix Applied
- Added config entries for both new statuses:
  - `PENDING_REVIEW` — purple badge, Eye icon
  - `REJECTED` — red badge, XCircle icon
- Typed `configs` as `Record<IncidentStatus, ...>` so TypeScript will catch any missing status in future

## Files Changed
- `frontend/src/app/components/StatusBadge.tsx`
