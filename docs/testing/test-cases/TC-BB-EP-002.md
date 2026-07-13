# TC-BB-EP-002 — Reporter Email Equivalence Partitioning

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-EP-002 |
| **Technique** | Black-Box — Equivalence Partitioning |
| **Component** | POST /api/incidents — `reporterEmail` field |
| **Objective** | Verify the API requires a valid `reporterEmail` on every submission (used to confirm the reporter lives in the complex), while `complainantName`/`complainantAddress` stay optional unless a formal complaint is requested |

---

## Equivalence Partitions

| Partition | Class | Values |
|-----------|-------|--------|
| EP1 | Valid email address | `user@gmail.com`, `resident@nci.ie` |
| EP2 | Invalid email format | `notanemail`, `user@`, `@domain.com`, `user@domain` |
| EP3 | Missing email | Field omitted, `null`, empty string `""` |

---

## Test Cases

### TC-BB-EP-002-1: Valid email address
| | |
|---|---|
| **Input** | `reporterEmail: "resident@gmail.com"` with valid incident body |
| **Expected** | HTTP 201; incident saved with `reporterEmail: "resident@gmail.com"`; confirmation email dispatched via Resend |
| **Result** | PASS |

### TC-BB-EP-002-2: Another valid email (different domain)
| | |
|---|---|
| **Input** | `reporterEmail: "tony.n@charlemont.ie"` |
| **Expected** | HTTP 201; incident saved; email sent |
| **Result** | PASS |

### TC-BB-EP-002-3: Email field omitted
| | |
|---|---|
| **Input** | No `reporterEmail` field in request |
| **Expected** | HTTP 400 — `reporterEmail` is required on every report, anonymous or not |
| **Result** | PASS |

### TC-BB-EP-002-4: Invalid format — no domain
| | |
|---|---|
| **Input** | `reporterEmail: "notanemail"` |
| **Expected** | HTTP 400 — rejected by the regex validator at both controller and schema level |
| **Result** | PASS |

### TC-BB-EP-002-5: Anonymous report — no name/address, valid email only
| | |
|---|---|
| **Input** | Valid incident body + `reporterEmail`, no `complainantName`/`complainantAddress`, no `sendComplaintTo` |
| **Expected** | HTTP 201 — a resident can still report anonymously (no name, no address, no complaint sent) as long as their email is present |
| **Result** | PASS |

### TC-BB-EP-002-6: Formal complaint requested without name/address
| | |
|---|---|
| **Input** | Valid incident body + `reporterEmail` + `sendComplaintTo=tuath`, but `complainantName`/`complainantAddress` omitted |
| **Expected** | HTTP 400 — name and address are required only when escalating to Túath/DCC |
| **Result** | PASS |

---

## Notes
`reporterEmail` moved from optional to always-required (`backend/models/Incident.js`, `backend/controllers/incidentController.js`) so every report — including anonymous ones — is tied to a verifiable resident email. `complainantName`/`complainantAddress` remain optional and are validated only when `sendComplaintTo` is non-empty, preserving the ability to submit photos/reports anonymously.

Automated coverage: `UT-033-A` – `UT-033-C` (model), `IT-022-A` – `IT-022-E`, `IT-023` (integration).
