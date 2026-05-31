# BUG-011 — Admin Header Dropdown Not Responding to Clicks

| Field | Detail |
|---|---|
| **Date** | 27/05/26 |
| **Status** | Fixed |
| **Severity** | Medium |
| **Area** | Frontend / Navigation |

## Description
After logging in as admin, clicking the avatar/name button in the header did nothing. The dropdown menu (Dashboard, Logout) never appeared, leaving no visible way to sign out or navigate to the dashboard.

## Steps to Reproduce
1. Log in as admin at `/auth`
2. Click the avatar or name displayed in the top-right header
3. Observe no dropdown appears

## Root Cause
The shadcn/Radix `DropdownMenu` component was not responding reliably in this context — likely a portal or z-index conflict with other page elements.

## Fix Applied
Replaced the dropdown entirely with two always-visible inline buttons:
- **Dashboard** (blue outline) — navigates to `/admin`
- **Sign Out** (red outline) — calls `logout()` and redirects to home

This approach is simpler, more accessible, and has no dependency on Radix portal behaviour.

## Files Changed
- `frontend/src/app/components/Header.tsx`
