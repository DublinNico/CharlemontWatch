# TC-BB-EP-002 — Reporter Email Equivalence Partitioning

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-EP-002 |
| **Technique** | Black-Box — Equivalence Partitioning |
| **Component** | POST /api/incidents — `reporterEmail` field |
| **Objective** | Verify the API handles valid emails, invalid email formats, and anonymous submissions correctly |

---

## Equivalence Partitions

| Partition | Class | Values |
|-----------|-------|--------|
| EP1 | Valid email address | `user@gmail.com`, `resident@nci.ie` |
| EP2 | Invalid email format | `notanemail`, `user@`, `@domain.com`, `user@domain` |
| EP3 | Anonymous (no email) | Field omitted, `null`, empty string `""` |

---

## Test Cases

### TC-BB-EP-002-1: Valid email address
| | |
|---|---|
| **Input** | `reporterEmail: "resident@gmail.com"` with valid incident body |
| **Expected** | HTTP 201; incident saved with `reporterEmail: "resident@gmail.com"`; confirmation email dispatched via SendGrid |
| **Result** | PASS |

### TC-BB-EP-002-2: Another valid email (different domain)
| | |
|---|---|
| **Input** | `reporterEmail: "tony.n@charlemont.ie"` |
| **Expected** | HTTP 201; incident saved; email sent |
| **Result** | PASS |

### TC-BB-EP-002-3: Anonymous — email field omitted
| | |
|---|---|
| **Input** | No `reporterEmail` field in request |
| **Expected** | HTTP 201; incident saved with `reporterEmail: null`; no confirmation email sent |
| **Result** | PASS |

### TC-BB-EP-002-4: Anonymous — explicit null
| | |
|---|---|
| **Input** | `reporterEmail: null` |
| **Expected** | HTTP 201; incident saved; `sendResidentConfirmation` skips silently |
| **Result** | PASS |

### TC-BB-EP-002-5: Invalid format — no domain
| | |
|---|---|
| **Input** | `reporterEmail: "notanemail"` |
| **Expected** | The backend stores this value as-is (no server-side format validation is currently enforced); HTTP 201 returned. *This is a known gap — see Notes.* |
| **Result** | PASS (stored as-is) |

---

## Notes
The `reporterEmail` field is declared as `String` in the Mongoose schema with no format validator. The current design treats it as optional/informational — the system does not reject a malformed email because the field is not required for the report to be valid. A `match` validator (e.g. RFC 5322 regex) could be added to enforce format at the schema level. This is flagged as a **recommended improvement** in Section 6 of the report.

Automated coverage: `UT-011-A` and `UT-011-B` verify the null/undefined skip path in `sendResidentConfirmation`.
