# TC-BB-EP-001 — Incident Type Equivalence Partitioning

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-EP-001 |
| **Technique** | Black-Box — Equivalence Partitioning |
| **Component** | POST /api/incidents — `incidentType` field |
| **Objective** | Verify the API accepts all valid incident types and rejects all invalid values |

---

## Equivalence Partitions

| Partition | Class | Values |
|-----------|-------|--------|
| EP1 | Valid | `graffiti`, `antisocial`, `safetyhazard`, `maintenance` |
| EP2 | Invalid — unknown string | `vandalism`, `noise`, `flood`, `""` |
| EP3 | Invalid — null / missing | `null`, field omitted entirely |

---

## Test Cases

### TC-BB-EP-001-1: Valid type — graffiti
| | |
|---|---|
| **Input** | `incidentType: "graffiti"`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 201, `{ success: true, incidentId: "CW-XXXXXX" }` |
| **Result** | PASS |

### TC-BB-EP-001-2: Valid type — antisocial
| | |
|---|---|
| **Input** | `incidentType: "antisocial"`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 201, `{ success: true }` |
| **Result** | PASS |

### TC-BB-EP-001-3: Valid type — safetyhazard
| | |
|---|---|
| **Input** | `incidentType: "safetyhazard"`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 201, `{ success: true }` |
| **Result** | PASS |

### TC-BB-EP-001-4: Valid type — maintenance
| | |
|---|---|
| **Input** | `incidentType: "maintenance"`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 201, `{ success: true }` |
| **Result** | PASS |

### TC-BB-EP-001-5: Invalid type — unknown string
| | |
|---|---|
| **Input** | `incidentType: "vandalism"`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 500 with validation error; incident NOT saved to database |
| **Result** | PASS |

### TC-BB-EP-001-6: Invalid type — empty string
| | |
|---|---|
| **Input** | `incidentType: ""`, `location: "Block A"`, `description: "Test"` |
| **Expected** | HTTP 500 with validation error |
| **Result** | PASS |

### TC-BB-EP-001-7: Invalid type — field omitted
| | |
|---|---|
| **Input** | `location: "Block A"`, `description: "Test"` (no `incidentType`) |
| **Expected** | HTTP 500, `incidentType is required` |
| **Result** | PASS |

---

## Notes
The Mongoose schema enforces the enum `['graffiti', 'antisocial', 'safetyhazard', 'maintenance']` with `required: true`. Any value outside this set causes a `ValidatorError` before the document reaches the database. See `UT-015` in the automated test suite for direct model validation coverage.
