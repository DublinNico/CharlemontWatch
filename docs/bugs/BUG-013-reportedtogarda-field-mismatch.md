# BUG-013 — Anti-Social Incident Data Silently Dropped (reportedToGarda vs reportedToTuath)

| Field | Detail |
|---|---|
| **Date** | 31/05/26 |
| **Status** | Fixed |
| **Severity** | High |
| **Area** | Backend / Data |

## Description

Every anti-social behaviour incident submitted via the report form silently lost its "Reported to Tuath" field. The controller wrote `typeData.reportedToGarda` but the Mongoose schema field is named `reportedToTuath`. Because the key didn't match any schema field, Mongoose discarded it with no error. The field was always stored as `undefined` regardless of what the reporter submitted.

## Steps to Reproduce

1. Submit an anti-social behaviour incident with "Already reported to Garda" checked
2. Retrieve the saved incident from MongoDB
3. Observe `reportedToTuath` is `undefined` on the stored document

## Root Cause

Field name mismatch introduced when the schema was renamed from `reportedToGarda` to `reportedToTuath` (to reflect that Tuath Housing is the actual contact, not An Garda Síochána), but the corresponding `createIncident` controller line was not updated.

```js
// controller (wrong)
typeData.reportedToGarda = req.body.reportedToGarda === 'true';

// schema (correct)
reportedToTuath: Boolean,
```

## Fix Applied

```js
typeData.reportedToTuath = req.body.reportedToTuath === 'true';
```

## Files Changed

- `backend/controllers/incidentController.js`

## Discovered By

Code review (31/05/26)

## Subsequent Change

The `reportedToTuath` / `reportedToGarda` field was removed entirely from the schema, controller, and frontend on 31/05/26. The "Already reported to Garda" checkbox no longer exists in the report form. This bug is therefore moot — the field does not exist in any current version of the codebase.
