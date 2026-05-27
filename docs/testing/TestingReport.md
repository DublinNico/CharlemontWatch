# CharlemontWatch — Software Testing Report

| | |
|---|---|
| 
| **Name: Tony Nicoletti** | Tony Nicoletti |
| 
| **GitHub Repository** | https://github.com/DublinNico/CharlemontWatch |
| **Date** | 27 May 2026 |

---

## Section 1: Introduction

### 1.1 Application Description

**CharlemontWatch** is a community incident-reporting web application built for residents of Charlemont Street, Dublin. It allows residents to report, track, and monitor local incidents through a browser-based interface, and provides administrators with tools to manage and update incident statuses.

The application is a full-stack system comprising:

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, shadcn/ui component library, React Router 7
- **Backend:** Node.js, Express 4, MongoDB (via Mongoose 7), JWT authentication, AWS S3 (photo storage), SendGrid (transactional email)

**Incident Types supported:**
| Frontend Label | API Value |
|---|---|
| Graffiti | `graffiti` |
| Anti-Social Behaviour | `antisocial` |
| Safety Hazard | `safetyhazard` |
| Maintenance Issue | `maintenance` |

**Core Workflows:**
1. Any resident can submit an incident report, optionally attaching up to 10 photos
2. A unique reference code (e.g. `CW-A3F9B2`) is generated per report and emailed to the reporter
3. Residents can track their report status using the reference code
4. Admin users authenticate via JWT and can update statuses (`NEW → IN_PROGRESS → RESOLVED`) or delete reports
5. All incidents are publicly browsable at `/incidents`

### 1.2 Testing Objectives

1. Verify that all valid inputs produce correct outputs and that invalid inputs are rejected with appropriate error messages
2. Achieve 100% branch coverage on the authentication middleware — the security-critical path
3. Verify that anonymous reports (no email provided) never trigger email dispatch
4. Confirm that the Incident and User Mongoose schemas enforce all constraints at the model layer
5. Identify gaps in the current implementation (e.g. missing email-format validation, MIME-type verification) and document them for remediation

---

## Section 2: Test Plan

### 2.1 Scope

**In scope:**
- Backend REST API endpoints (`/api/incidents`, `/api/auth`)
- Authentication and authorisation middleware
- Incident and User Mongoose model validation
- Email service logic (SendGrid integration, skip-on-null guard)
- ID generation utility

**Out of scope:**
- Frontend React components (no Vitest/React Testing Library tests in this submission)
- AWS S3 upload pipeline (requires live cloud credentials)
- SendGrid live email delivery (mocked in unit tests)
- End-to-end browser flows (no Playwright/Cypress in this submission)
- Performance and load testing

### 2.2 Test Types

| Type | Description | Section |
|------|-------------|---------|
| Black-box — Equivalence Partitioning | Partition input domains into valid/invalid classes | Section 3 |
| Black-box — Boundary Value Analysis | Test at and around numeric/count limits | Section 3 |
| White-box — Branch Coverage | Ensure every branch in critical functions is executed | Section 4 |
| White-box — Statement Coverage | Ensure every statement in utility functions is executed | Section 4 |
| Automated Unit Tests (Jest) | Programmatic tests run via `npm test` | Section 5 |

### 2.3 Test Environment

| Component | Details |
|-----------|---------|
| OS | Windows 11 Home (10.0.26200) |
| Node.js | v18+ |
| Test runner | Jest 29.7.0 |
| Database | MongoDB Atlas (mocked/in-memory for unit tests via Mongoose validateSync) |
| Browser | Chrome (manual black-box tests) |
| API client | Postman / curl (manual API tests) |

### 2.4 Test Data

- Unit tests use inline mock objects (no database connection required)
- SendGrid is mocked with `jest.mock('@sendgrid/mail')`
- JWT signing uses a fixed test secret: `charlemont-test-secret-key`
- Manual tests use a live MongoDB Atlas cluster (test collection)

### 2.5 Entry Criteria

- Backend server starts without error (`npm run dev`)
- All dependencies installed (`npm install` in `/backend`)
- `.env` file present with all required keys

### 2.6 Exit Criteria

- All 48 automated unit tests pass
- All black-box and white-box manual test cases documented with PASS/FAIL
- Coverage report generated and reviewed
- All critical-path branches (authentication middleware) at 100% coverage

### 2.7 Tools

| Tool | Purpose |
|------|---------|
| Jest 29 | Unit test runner and coverage reporter |
| Postman | Manual API endpoint testing |
| MongoDB Compass | Database state inspection |
| Chrome DevTools | Frontend network request inspection |

---

## Section 3: Black-Box Test Cases

Black-box testing treats the system as a black box — inputs and outputs are examined without knowledge of internal implementation. Two techniques are applied: **Equivalence Partitioning** (EP) and **Boundary Value Analysis** (BVA).

### 3.1 Equivalence Partitioning

Equivalence Partitioning divides the input domain into classes where all values in a class are expected to behave the same. One representative value from each class is tested.

#### EP Test Suite Summary

| Test ID | Component | Partitions | Cases |
|---------|-----------|-----------|-------|
| TC-BB-EP-001 | incidentType field | Valid types / Invalid types / Missing | 7 |
| TC-BB-EP-002 | reporterEmail field | Valid email / Invalid format / Anonymous | 5 |
| TC-BB-EP-003 | status update field | Valid statuses / Invalid statuses / Auth errors | 8 |
| TC-BB-EP-004 | User registration | New email / Duplicate / Missing fields | 6 |

#### TC-BB-EP-001 — Incident Type (condensed)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| EP1-1 | `incidentType: "graffiti"` | HTTP 201 | PASS |
| EP1-2 | `incidentType: "antisocial"` | HTTP 201 | PASS |
| EP1-3 | `incidentType: "safetyhazard"` | HTTP 201 | PASS |
| EP1-4 | `incidentType: "maintenance"` | HTTP 201 | PASS |
| EP2-1 | `incidentType: "vandalism"` | HTTP 500, validation error | PASS |
| EP2-2 | `incidentType: ""` | HTTP 500, validation error | PASS |
| EP3-1 | field omitted | HTTP 500, required error | PASS |

*Full test case detail: [TC-BB-EP-001.md](test-cases/TC-BB-EP-001.md)*

#### TC-BB-EP-002 — Reporter Email (condensed)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| EP1-1 | `"resident@gmail.com"` | 201, email sent | PASS |
| EP3-1 | field omitted | 201, no email sent | PASS |
| EP3-2 | `null` | 201, no email sent | PASS |
| EP2-1 | `"notanemail"` | 201, stored as-is (**gap noted**) | PASS (gap) |

*Full test case detail: [TC-BB-EP-002.md](test-cases/TC-BB-EP-002.md)*

#### TC-BB-EP-003 — Status Update (condensed)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| EP1-1 | `"NEW"` | HTTP 200 | PASS |
| EP1-2 | `"IN_PROGRESS"` | HTTP 200 | PASS |
| EP1-3 | `"RESOLVED"` | HTTP 200 | PASS |
| EP2-1 | `"PENDING"` | HTTP 400 "Invalid status" | PASS |
| EP2-2 | `"resolved"` (lowercase) | HTTP 400 | PASS |
| EP3-1 | No JWT | HTTP 401 | PASS |
| EP3-2 | Resident JWT | HTTP 403 | PASS |

*Full test case detail: [TC-BB-EP-003.md](test-cases/TC-BB-EP-003.md)*

#### TC-BB-EP-004 — User Registration (condensed)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| EP1-1 | New unique email | HTTP 201 + JWT | PASS |
| EP2-1 | Duplicate email | HTTP 400 "Email already registered" | PASS |
| EP3-1 | Missing email | HTTP 500, validation error | PASS |
| EP3-2 | Missing password | HTTP 500, validation error | PASS |
| Extra | `UPPER@TEST.COM` | Stored as `upper@test.com` | PASS |

*Full test case detail: [TC-BB-EP-004.md](test-cases/TC-BB-EP-004.md)*

---

### 3.2 Boundary Value Analysis

BVA focuses on values at the edges of acceptable ranges, where defects are most likely to occur.

#### TC-BB-BVA-001 — Photo Count Boundaries

| Test | Photos | Expected | Result |
|------|--------|----------|--------|
| BVA-001-1 | 0 (minimum) | 201, `photos: []` | PASS |
| BVA-001-2 | 1 | 201, 1 photo stored | PASS |
| BVA-001-3 | 9 (below max) | 201, 9 photos stored | PASS |
| BVA-001-4 | 10 (at maximum) | 201, 10 photos stored | PASS |
| BVA-001-5 | 11 (above max, on create) | 201, first 10 stored (silently truncated) | PASS |
| BVA-001-6 | Add to full incident (10 → 11) | HTTP 400 "Maximum 10 photos allowed" | PASS |
| BVA-001-7 | Add to 9-photo incident (9 → 10) | 200, succeeds | PASS |

*Full test case detail: [TC-BB-BVA-001.md](test-cases/TC-BB-BVA-001.md)*

#### TC-BB-BVA-002 — Photo File Size Boundaries

The limit is **5,242,880 bytes** (5 × 1024 × 1024).

| Test | File Size | Expected | Result |
|------|-----------|----------|--------|
| BVA-002-1 | 1 KB | Accepted | PASS |
| BVA-002-2 | 5,242,879 bytes (limit − 1) | Accepted | PASS |
| BVA-002-3 | 5,242,880 bytes (at limit) | Accepted | PASS |
| BVA-002-4 | 5,242,881 bytes (limit + 1) | Rejected, `LIMIT_FILE_SIZE` | PASS |
| BVA-002-5 | GIF (wrong MIME type) | Rejected, type not allowed | PASS |
| BVA-002-6 | PDF renamed to JPG | Accepted (MIME spoof — **gap noted**) | PASS (gap) |

*Full test case detail: [TC-BB-BVA-002.md](test-cases/TC-BB-BVA-002.md)*

---

## Section 4: White-Box Test Cases

White-box testing uses knowledge of the internal code structure. Two techniques are applied: **Branch Coverage** and **Statement Coverage**.

### 4.1 authenticate Middleware — Branch Coverage

Source: `backend/middleware/auth.js`

| Branch | Trigger | Test | Result |
|--------|---------|------|--------|
| No token present | Missing Authorization header | TC-WB-001-A | PASS |
| Valid token | Bearer + valid JWT | TC-WB-001-B | PASS |
| Invalid token | Tampered signature | TC-WB-001-C | PASS |
| Expired token | Token signed with past expiry | TC-WB-001-D | PASS |

**Branch coverage: 100%** | *Full detail: [TC-WB-001.md](test-cases/TC-WB-001.md)*

### 4.2 adminOnly Middleware — Branch Coverage

Source: `backend/middleware/auth.js`

| Branch | Trigger | Test | Result |
|--------|---------|------|--------|
| Admin role | `req.user.role === 'admin'` | TC-WB-002-A | PASS |
| Resident role | `req.user.role === 'resident'` | TC-WB-002-B | PASS |
| Unknown role | `req.user.role === 'superuser'` | TC-WB-002-C | PASS |
| Undefined user | `req.user = undefined` | TC-WB-002-D | PASS |

**Branch coverage: 100%** | *Full detail: [TC-WB-002.md](test-cases/TC-WB-002.md)*

### 4.3 generateShortId — Statement Coverage

Source: `backend/utils/idUtils.js`

All 5 statements execute on every call. Tests verify format, length, prefix, and uniqueness.

**Statement coverage: 100%** | *Full detail: [TC-WB-003.md](test-cases/TC-WB-003.md)*

### 4.4 Email Service — Branch Coverage

Source: `backend/services/emailService.js`

| Branch | Function | Trigger | Test | Result |
|--------|----------|---------|------|--------|
| Skip (null email) | sendResidentConfirmation | `!residentEmail` true | TC-WB-004-A | PASS |
| Skip (undefined email) | sendResidentConfirmation | `!residentEmail` true | TC-WB-004-B | PASS |
| Send email | sendResidentConfirmation | `!residentEmail` false | TC-WB-004-C | PASS |
| Skip (null email) | sendStatusUpdate | `!residentEmail` true | TC-WB-004-E | PASS |
| Send email | sendStatusUpdate | `!residentEmail` false | TC-WB-004-F | PASS |

*Full detail: [TC-WB-004.md](test-cases/TC-WB-004.md)*

### 4.5 createIncident typeData — Branch Coverage

Source: `backend/controllers/incidentController.js`

| Branch | Trigger | Test | Result |
|--------|---------|------|--------|
| graffiti branch | `incidentType === 'graffiti'` | TC-WB-005-A | PASS |
| antisocial branch | `incidentType === 'antisocial'` | TC-WB-005-B | PASS |
| safetyhazard branch | `incidentType === 'safetyhazard'` | TC-WB-005-C | PASS |
| maintenance branch | `incidentType === 'maintenance'` | TC-WB-005-D | PASS |
| Boolean coercion | `isProfane: "true"` → `true` | TC-WB-005-F | PASS |

*Full detail: [TC-WB-005.md](test-cases/TC-WB-005.md)*

---

## Section 5: Automated Testing

### 5.1 Overview

Automated unit tests are implemented using **Jest 29** and run via `npm test` in the `backend/` directory. Jest is configured to run files matching `tests/unit/**/*.test.js` and to produce a coverage report.

```
npm test           # run once
npm run test:watch # re-run on file change
npm run test:coverage # run with detailed coverage output
```

### 5.2 Test Files and Functionalities Tested

| File | Functionality Tested | Tests |
|------|---------------------|-------|
| `tests/unit/generateShortId.test.js` | ID format, prefix, length, uniqueness | UT-001 – UT-002 (5 tests) |
| `tests/unit/auth.middleware.test.js` | authenticate middleware (all branches), adminOnly middleware (all branches) | UT-005 – UT-010 (9 tests) |
| `tests/unit/emailService.test.js` | Skip-on-null guard, email addressing, subject content, admin notification | UT-011 – UT-013 (12 tests) |
| `tests/unit/incidentModel.test.js` | Required field validation, enum validation (incidentType, status), defaults, photo array | UT-014 – UT-018 (14 tests) |
| `tests/unit/userModel.test.js` | comparePassword (correct, wrong, empty, case-sensitive), schema validation, role default/enum | UT-019 – UT-025 (8 tests) |

**Total: 48 tests across 5 test suites**

---

### 5.3 Code Snippets

#### generateShortId.test.js
```js
const { generateShortId } = require('../../utils/idUtils');

describe('generateShortId (UT-001, UT-002)', () => {
  test('UT-001-B: matches format CW-XXXXXX (6 uppercase hex characters)', () => {
    const id = generateShortId();
    expect(id).toMatch(/^CW-[0-9A-F]{6}$/);
  });

  test('UT-001-D: total length is always 9 characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateShortId()).toHaveLength(9);
    }
  });

  test('UT-002: generates unique IDs across 500 calls', () => {
    const ids = new Set(Array.from({ length: 500 }, generateShortId));
    expect(ids.size).toBe(500);
  });
});
```

#### auth.middleware.test.js
```js
process.env.JWT_SECRET = 'charlemont-test-secret-key';
const { authenticate, adminOnly } = require('../../middleware/auth');

describe('authenticate middleware', () => {
  test('UT-005: returns 401 when no Authorization header is present', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  test('UT-007-B: returns 401 for an expired token', () => {
    const token = jwt.sign(
      { _id: 'abc123', email: 'user@test.com', role: 'resident' },
      'charlemont-test-secret-key',
      { expiresIn: '-1s' }
    );
    req.headers.authorization = `Bearer ${token}`;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('adminOnly middleware', () => {
  test('UT-010: returns 403 when req.user is undefined', () => {
    const req = { user: undefined };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    adminOnly(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

#### emailService.test.js
```js
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

const sgMail = require('@sendgrid/mail');
const { sendResidentConfirmation } = require('../../services/emailService');

describe('sendResidentConfirmation', () => {
  test('UT-011-A: does NOT call sgMail.send when residentEmail is null', async () => {
    await sendResidentConfirmation(mockIncident, null);
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('UT-011-E: email subject contains the incident shortId', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = sgMail.send.mock.calls[0][0];
    expect(msg.subject).toContain('CW-ABC123');
  });
});
```

#### incidentModel.test.js
```js
const Incident = require('../../models/Incident');

describe('Incident model validation', () => {
  test('UT-015-A: rejects an invalid incidentType value', () => {
    const doc = new Incident({
      incidentType: 'vandalism',
      location: 'Block A',
      description: 'Test',
    });
    const err = doc.validateSync();
    expect(err.errors.incidentType).toBeDefined();
  });

  test('UT-016-B: defaults status to "NEW" when not provided', () => {
    const doc = new Incident({
      incidentType: 'graffiti',
      location: 'Block A',
      description: 'Test',
    });
    expect(doc.status).toBe('NEW');
  });
});
```

#### userModel.test.js
```js
describe('User model — comparePassword', () => {
  test('UT-019: returns true when the correct password is supplied', async () => {
    const result = await user.comparePassword('SecurePass123!');
    expect(result).toBe(true);
  });

  test('UT-022: returns false for a password that is close but not exact', async () => {
    const result = await user.comparePassword('securepass123!'); // wrong case
    expect(result).toBe(false);
  });
});
```

---

### 5.4 Unit Test Execution Results

All 48 tests were executed on 27 May 2026. The full console output from `npm test` is shown below:

```
PASS tests/unit/generateShortId.test.js
  generateShortId (UT-001, UT-002)
    ✓ UT-001-A: returns a string (25 ms)
    ✓ UT-001-B: matches format CW-XXXXXX (6 uppercase hex characters) (2 ms)
    ✓ UT-001-C: always begins with the CW- prefix (16 ms)
    ✓ UT-001-D: total length is always 9 characters (22 ms)
    ✓ UT-002: generates unique IDs across 500 calls (9 ms)

PASS tests/unit/auth.middleware.test.js
  authenticate middleware
    ✓ UT-005: returns 401 and error message when no Authorization header is present (39 ms)
    ✓ UT-006-A: calls next() when token is valid (23 ms)
    ✓ UT-006-B: attaches decoded payload to req.user when token is valid (9 ms)
    ✓ UT-007-A: returns 401 for a tampered (invalid signature) token (5 ms)
    ✓ UT-007-B: returns 401 for an expired token (6 ms)
  adminOnly middleware
    ✓ UT-008: calls next() when req.user has role "admin" (3 ms)
    ✓ UT-009-A: returns 403 when req.user has role "resident" (2 ms)
    ✓ UT-009-B: returns 403 when req.user has an unknown role (2 ms)
    ✓ UT-010: returns 403 when req.user is undefined (unauthenticated) (4 ms)

PASS tests/unit/emailService.test.js
  sendResidentConfirmation
    ✓ UT-011-A: does NOT call sgMail.send when residentEmail is null (18 ms)
    ✓ UT-011-B: does NOT call sgMail.send when residentEmail is undefined (1 ms)
    ✓ UT-011-C: calls sgMail.send exactly once when a valid email is provided (86 ms)
    ✓ UT-011-D: email is addressed to the resident (6 ms)
    ✓ UT-011-E: email subject contains the incident shortId (21 ms)
    ✓ UT-011-F: email is sent from the configured sender address (4 ms)
  sendStatusUpdate
    ✓ UT-012-A: does NOT call sgMail.send when residentEmail is null (3 ms)
    ✓ UT-012-B: does NOT call sgMail.send when residentEmail is undefined (2 ms)
    ✓ UT-012-C: calls sgMail.send exactly once when a valid email is provided (4 ms)
    ✓ UT-012-D: email is addressed to the resident (3 ms)
  sendAdminNotification
    ✓ UT-013: calls sgMail.send and addresses email to ADMIN_EMAIL (277 ms)
    ✓ UT-013-B: subject contains the incident location (3 ms)

PASS tests/unit/incidentModel.test.js
  Incident model validation
    ✓ UT-014-A: fails validation when incidentType is missing (21 ms)
    ✓ UT-014-B: fails validation when location is missing (2 ms)
    ✓ UT-014-C: fails validation when description is missing (2 ms)
    ✓ UT-015-A: rejects an invalid incidentType value (2 ms)
    ✓ UT-015-B: accepts "graffiti" as a valid incidentType (2 ms)
    ✓ UT-015-C: accepts "antisocial" as a valid incidentType (1 ms)
    ✓ UT-015-D: accepts "safetyhazard" as a valid incidentType (2 ms)
    ✓ UT-015-E: accepts "maintenance" as a valid incidentType (1 ms)
    ✓ UT-016-A: rejects an invalid status value (2 ms)
    ✓ UT-016-B: defaults status to "NEW" when not provided (2 ms)
    ✓ UT-016-C: accepts "IN_PROGRESS" as a valid status (1 ms)
    ✓ UT-016-D: accepts "RESOLVED" as a valid status (1 ms)
    ✓ UT-017: photos array defaults to empty (2 ms)
    ✓ UT-018: allows up to 10 photo objects to be pushed (8 ms)

PASS tests/unit/userModel.test.js
  User model — comparePassword
    ✓ UT-019: returns true when the correct password is supplied (129 ms)
    ✓ UT-020: returns false when an incorrect password is supplied (109 ms)
    ✓ UT-021: returns false for an empty string password (107 ms)
    ✓ UT-022: returns false for a password that is close but not exact (108 ms)
  User model — schema validation
    ✓ UT-023-A: fails validation when email is missing (6 ms)
    ✓ UT-023-B: fails validation when password is missing (2 ms)
    ✓ UT-024: defaults role to "resident" (1 ms)
    ✓ UT-025: rejects an invalid role value (1 ms)

Test Suites: 5 passed, 5 total
Tests:       48 passed, 48 total
Snapshots:   0 total
Time:        6.558 s
```

### 5.5 Coverage Report

```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   76.92 |    57.69 |   80.00 |   77.63 |
 middleware/      |         |          |         |         |
  auth.js         |  100.00 |   100.00 |  100.00 |  100.00 |
  upload.js       |    0.00 |     0.00 |    0.00 |    0.00 |
 models/          |         |          |         |         |
  Incident.js     |  100.00 |   100.00 |  100.00 |  100.00 |
  User.js         |   63.63 |     0.00 |   50.00 |   70.00 |
 services/        |         |          |         |         |
  emailService.js |   90.90 |    68.75 |  100.00 |   90.90 |
 utils/           |         |          |         |         |
  idUtils.js      |  100.00 |   100.00 |  100.00 |  100.00 |
------------------|---------|----------|---------|---------|
```

**Key observations:**
- `auth.js` — 100% across all metrics (security-critical path fully covered)
- `Incident.js` — 100% (all schema branches exercised)
- `idUtils.js` — 100%
- `upload.js` — 0% (Multer middleware requires a live multipart request; not unit-testable without integration test setup)
- `User.js` — 63.6% statements (bcrypt pre-save hook not triggered by `validateSync`; covered by manual registration tests)

---

## Section 6: Conclusions

### 6.1 Findings

1. **Authentication is robust.** The `authenticate` and `adminOnly` middleware achieve 100% branch coverage and handle all edge cases: missing tokens, expired tokens, tampered tokens, undefined users, and non-admin roles.

2. **Schema validation is effective.** Mongoose enum constraints on `incidentType` and `status` prevent invalid data from reaching the database. Required field enforcement catches missing `location` and `description`.

3. **Two implementation gaps were identified:**
   - **Email format validation:** The `reporterEmail` field accepts any string (e.g. `"notanemail"`). A Mongoose `match` validator should be added to enforce RFC 5322 format.
   - **MIME type verification:** The upload middleware trusts the client-declared MIME type, making it possible to upload non-image files by spoofing the Content-Type header. The `file-type` npm package should be used to verify actual file bytes.

4. **Inconsistent photo-limit enforcement:** When submitting a new report with 11 files, the first 10 are silently accepted. When adding to an existing report, an explicit 400 error is returned. The creation path should also return an explicit error rather than silently dropping files.

5. **Legacy incidents without shortId** — 8 of 9 incidents in the live database pre-date the `shortId` field. A database migration script to backfill `shortId` values would prevent future lookup ambiguity.

### 6.2 Lessons Learned

- Extracting `generateShortId` into a separate `utils/idUtils.js` module during the testing phase improved testability without changing behaviour — a good example of test-driven refactoring.
- Mocking external services (SendGrid) with `jest.mock()` made email tests fast and deterministic, isolating the logic from network conditions.
- Using `mongoose.Document.prototype.validateSync()` enabled full schema testing without a database connection, making tests portable and fast.
- Branch coverage metrics from Jest/Istanbul revealed the `upload.js` file as a gap — it requires an integration test with a real multipart request, not achievable with pure unit tests.

### 6.3 Recommended Next Steps

| Priority | Recommendation |
|----------|---------------|
| High | Add email-format validator to User and Incident schemas |
| High | Replace MIME-type check with magic-byte inspection using `file-type` |
| Medium | Add **integration tests** using Supertest to test full request/response cycles |
| Medium | Add **frontend unit tests** using Vitest and React Testing Library |
| Medium | Add **E2E tests** using Playwright to cover full user journeys (report → track → resolve) |
| Low | Add **GitHub Actions** CI workflow to auto-run `npm test` on every PR |
| Low | Backfill missing `shortId` values on legacy database documents |
| Low | Add load testing with k6 to verify performance under concurrent submissions |

---

## Appendix: Requirements Specification

### A.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow any user to submit an incident report without creating an account |
| FR-02 | Each incident report shall be assigned a unique reference ID in the format `CW-XXXXXX` |
| FR-03 | The system shall support four incident types: Graffiti, Anti-Social Behaviour, Safety Hazard, and Maintenance Issue |
| FR-04 | Each incident type shall collect type-specific fields in addition to common fields (location, description) |
| FR-05 | Users shall be able to attach up to 10 photos per incident report |
| FR-06 | Photos shall be stored in AWS S3 and be publicly accessible via URL |
| FR-07 | When a reporter provides an email address, the system shall send a confirmation email containing the reference ID |
| FR-08 | The system shall allow any user to track an incident by entering its reference ID |
| FR-09 | The system shall allow any user to browse all submitted incidents, filterable by type and status |
| FR-10 | Admin users shall be able to update incident status (NEW → IN_PROGRESS → RESOLVED) |
| FR-11 | The system shall send an email notification to the reporter when incident status changes |
| FR-12 | Admin users shall be able to delete incident reports |
| FR-13 | Admin authentication shall be enforced via JWT with a 7-day expiry |
| FR-14 | New admin accounts shall be created via the `/api/auth/register` endpoint |
| FR-15 | Incident reference IDs shall be unique and collision-resistant |

### A.2 Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-01 | Passwords shall be hashed using bcrypt with a minimum cost factor of 10 before storage | Security |
| NFR-02 | JWT tokens shall expire after 7 days | Security |
| NFR-03 | The API shall accept CORS requests only from localhost origins during development | Security |
| NFR-04 | Uploaded files shall be restricted to JPEG, PNG, and WebP formats | Security |
| NFR-05 | Individual photo files shall not exceed 5MB | Performance |
| NFR-06 | Email notifications shall be dispatched asynchronously and shall not block the HTTP response | Performance |
| NFR-07 | The backend API shall respond to incident creation requests in under 2 seconds under normal load | Performance |
| NFR-08 | The application shall be deployable on any Node.js 18+ environment | Portability |
| NFR-09 | All incident data shall be persisted in MongoDB Atlas with replication across 3 shards | Reliability |
| NFR-10 | The system shall function correctly when the email service (SendGrid) is unavailable, logging the error silently | Reliability |
| NFR-11 | The frontend shall be fully usable on Chrome, Firefox, and Safari on both desktop and mobile | Usability |
| NFR-12 | Anonymous reporting shall be supported — no account or personal information shall be required to submit a report | Usability |
