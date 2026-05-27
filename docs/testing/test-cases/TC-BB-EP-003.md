# TC-BB-EP-003 — Incident Status Update Equivalence Partitioning

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-EP-003 |
| **Technique** | Black-Box — Equivalence Partitioning |
| **Component** | PATCH /api/incidents/:id/status — `status` field |
| **Objective** | Verify the admin status-update endpoint accepts valid statuses and rejects invalid values |

---

## Equivalence Partitions

| Partition | Class | Values |
|-----------|-------|--------|
| EP1 | Valid statuses | `NEW`, `IN_PROGRESS`, `RESOLVED` |
| EP2 | Invalid — unknown string | `PENDING`, `CLOSED`, `open`, `""` |
| EP3 | Invalid — null / missing | `null`, field omitted |

---

## Test Cases

### TC-BB-EP-003-1: Valid status — NEW
| | |
|---|---|
| **Pre-condition** | Incident exists; caller has admin JWT |
| **Input** | `{ "status": "NEW" }` |
| **Expected** | HTTP 200, `{ success: true, incident: { status: "NEW", ... } }` |
| **Result** | PASS |

### TC-BB-EP-003-2: Valid status — IN_PROGRESS
| | |
|---|---|
| **Input** | `{ "status": "IN_PROGRESS" }` |
| **Expected** | HTTP 200, incident status updated to `IN_PROGRESS`; status-update email dispatched if `reporterEmail` present |
| **Result** | PASS |

### TC-BB-EP-003-3: Valid status — RESOLVED
| | |
|---|---|
| **Input** | `{ "status": "RESOLVED" }` |
| **Expected** | HTTP 200, incident resolved; email sent to reporter |
| **Result** | PASS |

### TC-BB-EP-003-4: Invalid status — unknown string "PENDING"
| | |
|---|---|
| **Input** | `{ "status": "PENDING" }` |
| **Expected** | HTTP 400, `{ "error": "Invalid status" }` |
| **Result** | PASS |

### TC-BB-EP-003-5: Invalid status — lowercase "resolved"
| | |
|---|---|
| **Input** | `{ "status": "resolved" }` |
| **Expected** | HTTP 400, `{ "error": "Invalid status" }` (validation is case-sensitive) |
| **Result** | PASS |

### TC-BB-EP-003-6: Invalid status — empty string
| | |
|---|---|
| **Input** | `{ "status": "" }` |
| **Expected** | HTTP 400, `{ "error": "Invalid status" }` |
| **Result** | PASS |

### TC-BB-EP-003-7: Unauthenticated request
| | |
|---|---|
| **Input** | Valid status, no Authorization header |
| **Expected** | HTTP 401, `{ "error": "No token provided" }` |
| **Result** | PASS |

### TC-BB-EP-003-8: Authenticated as resident (not admin)
| | |
|---|---|
| **Input** | Valid status, resident JWT |
| **Expected** | HTTP 403, `{ "error": "Admin access required" }` |
| **Result** | PASS |

---

## Notes
The `updateIncidentStatus` controller performs an explicit array check:
```js
if (!['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
  return res.status(400).json({ error: 'Invalid status' });
}
```
This guard runs before the Mongoose update, so invalid values never reach the database.
