# TC-BB-EP-004 — User Registration Equivalence Partitioning

| Field         | Value |
|---------------|-------|
| **Test ID**   | TC-BB-EP-004 |
| **Technique** | Black-Box — Equivalence Partitioning |
| **Component** | POST /api/auth/register |
| **Objective** | Verify registration accepts new unique emails and rejects duplicate registrations |

---

## Equivalence Partitions

| Partition | Class | Description |
|-----------|-------|-------------|
| EP1 | New (unique) email | Email not yet in the database |
| EP2 | Duplicate email | Email already registered |
| EP3 | Missing required field | email or password omitted |

---

## Test Cases

### TC-BB-EP-004-1: New unique email
| | |
|---|---|
| **Input** | `{ "email": "newuser@test.com", "password": "Pass123!", "name": "New User" }` |
| **Expected** | HTTP 201, `{ success: true, token: "...", user: { email: "newuser@test.com", role: "resident" } }` |
| **Result** | PASS |

### TC-BB-EP-004-2: Duplicate email
| | |
|---|---|
| **Pre-condition** | `existing@test.com` is already registered |
| **Input** | `{ "email": "existing@test.com", "password": "Pass123!" }` |
| **Expected** | HTTP 400, `{ "error": "Email already registered" }` |
| **Result** | PASS |

### TC-BB-EP-004-3: Missing email field
| | |
|---|---|
| **Input** | `{ "password": "Pass123!" }` |
| **Expected** | HTTP 500, Mongoose validation error (email required) |
| **Result** | PASS |

### TC-BB-EP-004-4: Missing password field
| | |
|---|---|
| **Input** | `{ "email": "test@test.com" }` |
| **Expected** | HTTP 500, Mongoose validation error (password required) |
| **Result** | PASS |

### TC-BB-EP-004-5: Newly registered user can log in immediately
| | |
|---|---|
| **Input** | Register `newlogin@test.com` then POST /api/auth/login with same credentials |
| **Expected** | Login returns HTTP 200 with a valid JWT |
| **Result** | PASS |

### TC-BB-EP-004-6: Email is stored in lowercase
| | |
|---|---|
| **Input** | `{ "email": "UPPER@TEST.COM", "password": "Pass123!" }` |
| **Expected** | HTTP 201; user stored with `email: "upper@test.com"` (User schema has `lowercase: true`) |
| **Result** | PASS |

---

## Notes
Password hashing is handled by the Mongoose pre-save hook using bcrypt (10 salt rounds). The plain-text password is never stored. This is directly tested by `UT-019` through `UT-022` in the automated unit test suite.
