# BUG-014 — Copy ID Button Showed Success Before Clipboard Write Resolved

| Field | Detail |
|---|---|
| **Date** | 31/05/26 |
| **Status** | Fixed |
| **Severity** | Low |
| **Area** | Frontend / UX |

## Description

The "Copy ID" button on the incident detail card set `copied = true` and displayed the green check icon immediately — before the `navigator.clipboard.writeText()` Promise resolved. If the clipboard write failed (e.g. clipboard permission denied, insecure context), the user still saw the success indicator despite nothing being copied.

## Root Cause

`navigator.clipboard.writeText()` is asynchronous and returns a Promise, but the code called it without `await` or `.then()`:

```js
// before (wrong)
navigator.clipboard.writeText(incident.id);
setCopied(true);  // fires synchronously, before clipboard write completes
setTimeout(() => setCopied(false), 2000);
```

## Fix Applied

Moved the state update into the `.then()` callback so it only fires on success:

```js
navigator.clipboard.writeText(incident.id).then(() => {
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
});
```

## Files Changed

- `frontend/src/app/components/IncidentCard.tsx`

## Discovered By

Code review (31/05/26)
