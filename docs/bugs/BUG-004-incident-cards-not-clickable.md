# BUG-004 — Incident Cards Not Clickable on All Incidents Page

| Field | Detail |
|---|---|
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Frontend / Navigation |

## Description
Clicking on an incident card on the All Incidents page did nothing. Users had no way to navigate to the detail / track view for a specific incident.

## Steps to Reproduce
1. Navigate to `/incidents`
2. Click on any incident card
3. Observe nothing happens — no navigation occurs

## Root Cause
The `IncidentCard` component in `AllIncidents.tsx` was rendered without an `onClick` handler. The navigation logic was never wired up.

## Fix Applied
Added `` onClick={() => navigate(`/track?id=${incident.id}`)} `` to each card, routing the user to the Track Report page pre-filled with the incident's shortId.

## Files Changed
- `frontend/src/app/pages/AllIncidents.tsx`
