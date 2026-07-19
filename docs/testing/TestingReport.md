# CharlemontWatch — Software Testing Report

| | |
|---|---|
| 
| **Name:** | Tony Nicoletti |
| 
| **GitHub Repository** | https://github.com/DublinNico/CharlemontWatch |
| **Date** | 27/05/26 (updated 31/05/26, updated 31/05/26 v2, updated 31/05/26 v3, updated 16/07/26, updated 19/07/26) |

---

## Section 1: Introduction

### 1.1 Application Description

**CharlemontWatch** is a community incident-reporting web application built for residents of Charlemont Street, Dublin. It allows residents to report, track, and monitor local incidents through a browser-based interface, and provides administrators with tools to manage and update incident statuses.

The application is a full-stack system comprising:

- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, shadcn/ui component library, React Router 7
- **Backend:** Node.js, Express 4, MongoDB (via Mongoose 7), JWT authentication, AWS S3 (photo storage), Resend (transactional email)

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
6. Residents can optionally send a formal complaint to Túath Housing and/or Dublin City Council when submitting a report; a complaint email is dispatched on their behalf, containing their contact details and the incident summary
7. Residents can send a general "Contact Us" message (question, feedback, press enquiry) outside the incident-report flow; the admin receives it by email with Reply-To set to the sender

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
- Email service logic (Resend integration, skip-on-null guard)
- ID generation utility

**Out of scope:**
- AWS S3 upload pipeline (requires live cloud credentials; mocked in integration tests)
- Resend live email delivery (mocked in unit tests)

### 2.2 Test Types

| Type | Description | Section |
|------|-------------|---------|
| Black-box — Equivalence Partitioning | Partition input domains into valid/invalid classes | Section 3 |
| Black-box — Boundary Value Analysis | Test at and around numeric/count limits | Section 3 |
| White-box — Branch Coverage | Ensure every branch in critical functions is executed | Section 4 |
| White-box — Statement Coverage | Ensure every statement in utility functions is executed | Section 4 |
| Automated Unit Tests (Jest) | Programmatic backend tests run via `npm test` in `/backend` | Section 5 |
| Automated Integration Tests (Supertest) | Full HTTP request/response cycle against an in-memory MongoDB database | Section 5 |
| Automated Frontend Unit Tests (Vitest + RTL) | React component and context logic tests run via `npm test` in `/frontend` | Section 5 |
| Automated E2E Tests (Playwright) | Full browser flows against the Vite dev server with API route interception; run on Desktop Chrome and 375px mobile viewport | Section 5 |
| Automated Security Tests (Jest + Supertest) | NoSQL injection, XSS storage, brute-force rate limiting, and authorisation boundary checks | Section 5 |
| Performance Tests (Artillery) | Load scenarios run against a live backend to verify response time thresholds under concurrent traffic | Section 5 |

### 2.3 Test Environment

| Component | Details |
|-----------|---------|
| OS | Windows 11 Home (10.0.26200) |
| Node.js | v18+ |
| Test runner | Jest 29.7.0 |
| Database | MongoDB Atlas (production); `mongodb-memory-server` (integration tests); `validateSync` (unit tests) |
| Browser | Chrome (manual black-box tests) |
| API client | Postman / curl (manual API tests); Supertest (automated integration tests) |
| Frontend test environment | happy-dom (via Vitest) — switched from jsdom due to ESM incompatibility in Ubuntu CI |

### 2.4 Test Data

- Unit tests use inline mock objects (no database connection required)
- Integration tests use `mongodb-memory-server` (isolated in-memory MongoDB per test suite)
- Resend is mocked with `jest.mock('resend')` in all automated tests
- AWS S3 is mocked with `jest.mock('../../config/s3')` in integration tests
- JWT signing uses a fixed test secret: `charlemont-test-secret-key`
- Manual tests use a live MongoDB Atlas cluster (test collection)

### 2.5 Entry Criteria

- Backend server starts without error (`npm run dev`)
- All dependencies installed (`npm install` in `/backend`)
- `.env` file present with all required keys

### 2.6 Exit Criteria

- All 235 automated tests pass (122 backend unit + 55 backend integration + 5 security + 38 frontend unit + 15 E2E)
- All black-box and white-box manual test cases documented with PASS/FAIL
- Coverage reports generated and reviewed for both backend and frontend
- All critical-path branches (authentication middleware) at 100% coverage
- All identified gaps from the original report remediated and verified by automated tests

### 2.7 Tools

| Tool | Purpose |
|------|---------|
| Jest 29 | Backend unit and integration test runner and coverage reporter |
| Supertest | HTTP integration testing against the Express app |
| mongodb-memory-server | In-memory MongoDB for integration tests (no Atlas connection required) |
| Vitest 4 | Frontend unit test runner (Vite-native, Jest-compatible API) |
| React Testing Library | Component rendering and interaction for frontend tests |
| jsdom | Browser-like DOM environment for Vitest |
| Playwright 1.60 | E2E browser automation; runs on Desktop Chrome and Chromium mobile (375px) |
| Artillery | Performance / load testing; runs against a live backend (`npm run test:perf` in `/backend`) |
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
| EP2-1 | `incidentType: "vandalism"` | HTTP 400, validation error | PASS |
| EP2-2 | `incidentType: ""` | HTTP 400, validation error | PASS |
| EP3-1 | field omitted | HTTP 400, required error | PASS |

*Full test case detail: [TC-BB-EP-001.md](test-cases/TC-BB-EP-001.md)*

#### TC-BB-EP-002 — Reporter Email (condensed)

`reporterEmail` is mandatory on every report (anonymous or not); `complainantName`/`complainantAddress` are only required when `sendComplaintTo` is set.

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| EP1-1 | `"resident@gmail.com"` | 201, email sent | PASS |
| EP3-1 | field omitted | 400, `reporterEmail` required | PASS |
| EP2-1 | `"notanemail"` | 400, validation error | PASS |
| EP4-1 | valid email, no name/address, no complaint | 201 — anonymous report still works | PASS |
| EP4-2 | `sendComplaintTo` set, name/address omitted | 400 — required only to send a formal complaint | PASS |

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
| BVA-001-5 | 11 (above max, on create) | 400, `LIMIT_FILE_COUNT` error (**gap fixed**) | PASS |
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
| BVA-002-6 | PDF renamed to JPG | 400, magic-byte mismatch (**gap fixed**) | PASS |

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
| antisocial branch | `incidentType === 'antisocial'` (fields: antisocialType only — estimatedPeopleInvolved and reportedToGarda removed 31/05/26) | TC-WB-005-B | PASS |
| safetyhazard branch | `incidentType === 'safetyhazard'` | TC-WB-005-C | PASS |
| maintenance branch | `incidentType === 'maintenance'` | TC-WB-005-D | PASS |
| Boolean coercion | `isProfane: "true"` → `true` | TC-WB-005-F | PASS |

*Full detail: [TC-WB-005.md](test-cases/TC-WB-005.md)*

---

## Section 5: Automated Testing

### 5.1 Overview

**Backend** tests use **Jest 29**, run via `npm test` in the `backend/` directory. Jest picks up both `tests/unit/**/*.test.js` and `tests/integration/**/*.test.js`. Integration tests use **Supertest** and **mongodb-memory-server** — no Atlas connection required.

```bash
# backend/
npm test              # run all tests (unit + integration)
npm run test:watch    # re-run on file change
npm run test:coverage # run with detailed coverage output
```

**Frontend unit** tests use **Vitest 4** with **React Testing Library**, run via `npm test` in the `frontend/` directory. Components are rendered into a **jsdom** environment. Axios and context hooks are mocked with `vi.mock()` to isolate the unit under test.

```bash
# frontend/
npm test              # run all frontend unit tests
npm run test:watch    # re-run on file change
npm run test:coverage # run with V8 coverage output
```

**E2E tests** use **Playwright 1.60**, run via `npm run test:e2e` in the `frontend/` directory. Tests run against the Vite dev server (auto-started by Playwright's `webServer` config). All API calls to `http://localhost:5000` are intercepted by a single catch-all `page.route()` handler that returns controlled mock responses — no live backend required. Two browser profiles are tested: Desktop Chrome and Chromium at 375×667px (iPhone SE).

```bash
# frontend/
npm run test:e2e      # run all E2E tests (headless)
npm run test:e2e:ui   # open Playwright visual dashboard
```

### 5.2 Test Files and Functionalities Tested

#### Unit Tests

| File | Functionality Tested | Tests |
|------|---------------------|-------|
| `tests/unit/generateShortId.test.js` | ID format, prefix, length, uniqueness | UT-001 – UT-002 (5 tests) |
| `tests/unit/auth.middleware.test.js` | authenticate middleware (all branches), adminOnly middleware (all branches) | UT-005 – UT-010 (9 tests) |
| `tests/unit/emailService.test.js` | Skip-on-null guard, email addressing, subject content, admin notification, Resend error catch-paths, sendComplaintEmails (Túath/DCC/both/empty/content/error), HTML escaping of complainant name and incident description, CR/LF header-injection stripping in subject lines, always-present tracking link + FRONTEND_URL-based footer link on photo-less reports, sendContactMessage (admin recipient, Reply-To sender, HTML escaping, error swallowed) | UT-011 – UT-013, UT-035 – UT-037, UT-038-A – UT-038-I, UT-044 – UT-045, UT-053-A – UT-053-D + additional coverage (43 tests) |
| `tests/unit/incidentModel.test.js` | Required field validation, enum validation (incidentType, status), defaults, photo array, mandatory reporterEmail (format + anonymous-still-allowed) | UT-014 – UT-018, UT-033 (19 tests) |
| `tests/unit/userModel.test.js` | Pre-save bcrypt hook, comparePassword, schema validation, role default/enum | UT-019 – UT-025, UT-034 (10 tests) |
| `tests/unit/authController.test.js` | Login input validation, credential checks, JWT generation, email normalisation, 500 error path | UT-026 – UT-032 (15 tests) |
| `tests/unit/upload.middleware.test.js` | MIME type filter, 5MB size limit, magic-byte validation (JPEG/PNG/WebP/spoofed PDF), no-file passthrough | UT-038 – UT-042 (8 tests) |
| `tests/unit/satisfactionVoteModel.test.js` | Required field validation (email, rating), email format, rating enum (low/medium/high) | UT-043-A – UT-043-G (7 tests) |
| `tests/unit/webhookController.test.js` | Resend bounce-webhook signature verification (missing secret, invalid signature), delivery-failure event handling (bounced/complained/delivery_delayed) with incident/recipient tag extraction, Sentry reporting gated on SENTRY_DSN | UT-059 – UT-064 (6 tests) |

**Unit test total: 122 tests across 9 test suites** *(recount 19/07/26 — `emailService.test.js` grew to 43 tests with the tracking-link coverage; `webhookController.test.js` is new)*

#### Integration Tests

| File | Functionality Tested | Tests |
|------|---------------------|-------|
| `tests/integration/incidents.test.js` | POST/GET/PATCH/DELETE incident routes; auth guards; photo upload; 11-file limit; status filtering; reporter identity validation (reporterEmail mandatory, anonymous reports allowed without name/address, complainantName/complainantAddress required only when sendComplaintTo is set); photo compression to JPEG before S3 upload; sendComplaintTo values trimmed so "tuath, dcc" keeps both recipients | IT-001 – IT-017, IT-022 – IT-023, IT-032 – IT-033 + additional coverage (36 tests) |
| `tests/integration/auth.test.js` | Login (correct/wrong/unknown); register route removed (404) | IT-018 – IT-021 (4 tests) |
| `tests/integration/satisfaction.test.js` | POST vote validation (email/rating), upsert-on-revote (no duplicates), case-insensitive email matching, GET summary aggregation (zero state, accurate counts, no emails exposed) | IT-024 – IT-031 (8 tests) |
| `tests/integration/contact.test.js` | POST /api/contact: valid submission sends email with admin recipient + sender Reply-To (IT-045); 400 on missing name/email/message (IT-046 – IT-048); 400 when message exceeds 5000 chars (IT-049); honeypot field silently drops spam without sending (IT-050); HTML-special characters escaped in email body (IT-051) | IT-045 – IT-051 (7 tests) |

**Integration test total: 55 tests across 4 test suites** *(recount 16/07/26 — `incidents.test.js` had grown to 36 tests since this table was last updated; prior figure of 25 was stale. `contact.test.js` is new.)*

#### Frontend Unit Tests (Vitest + React Testing Library)

| File | Functionality Tested | Tests |
|------|---------------------|-------|
| `src/test/AppContext.test.tsx` | `refreshIncidents` API mapping, `addIncident` FormData/POST, `login`/`logout` localStorage, `updateIncidentStatus` PATCH + state, `deleteIncident` DELETE + state | FT-001 – FT-006 (8 tests) |
| `src/test/Header.test.tsx` | Auth-conditional rendering: unauthenticated hides Dashboard/Sign Out; authenticated shows username + buttons | FT-007 – FT-008 (4 tests) |
| `src/test/TrackReport.test.tsx` | Search hits API and renders incident card; cache hit skips API call; 404 shows not-found message; network error shows error message | FT-009 – FT-010 (4 tests) |
| `src/test/AdminDashboard.test.tsx` | Incidents list renders location and ID badge; status update modal calls `updateIncidentStatus` with selected value | FT-011 – FT-012 (3 tests) |
| `src/test/ReportIncident.test.tsx` | Graffiti submission calls `addIncident` with correct payload; navigates to success on submit; shows error on failure; submit disabled without type; `addIncident` not called without type | FT-013 – FT-014 (6 tests) |
| `src/test/SatisfactionWidget.test.tsx` | Results bar percentages and zero-vote state; validation errors (missing rating/email); `submitSatisfactionVote` called with correct args; confirmation + "Update Vote" state after submit; error message on rejected submit | FT-015 – FT-016 (8 tests) |
| `src/test/Contact.test.tsx` | POST payload shape including empty honeypot field; "Message Sent" confirmation; server-provided and generic error messages; disabled/"Sending…" state while in flight | FT-017 (5 tests) |

**Frontend unit test total: 38 tests across 7 test suites**

#### E2E Tests (Playwright)

| File | Flows Covered | Tests |
|------|--------------|-------|
| `e2e/report-incident.spec.ts` | Graffiti report submission → success page; anonymous report | ET-001 – ET-002 (2 tests) |
| `e2e/track-report.spec.ts` | Track by ID → incident card displayed; unknown ID → not-found message | ET-003 – ET-004 (2 tests) |
| `e2e/all-incidents.spec.ts` | Incident list renders; type filter pills; card click navigates to track | ET-005 – ET-007 (3 tests) |
| `e2e/admin.spec.ts` | Admin login (correct/wrong credentials); update status NEW → IN_PROGRESS; delete incident | ET-008 – ET-010 (4 tests) |
| `e2e/mobile.spec.ts` | Incident list, report form, track search, header — all at 375px viewport | ET-011 – ET-014 (4 tests) |

**E2E total: 15 test cases across 5 spec files — 30 total runs (each case runs on Desktop Chrome + 375px mobile)**

#### Security Tests (Jest + Supertest)

| File | Coverage | Tests |
|------|----------|-------|
| `tests/security/security.test.js` | NoSQL injection (operator payloads rejected); XSS description stored as plain text; brute-force rate limit (429 after threshold); resident JWT cannot delete incidents | ST-003 – ST-006 (5 tests) |

*Note: ST-001 (JWT tampering) and ST-002 (wrong secret) are covered by UT-007-A/B. ST-007 (resident cannot update status) is covered by IT-015.*

**Security total: 5 tests across 1 suite**

#### Performance Tests (Artillery)

Artillery scenarios run against a live backend (`npm run dev` in `/backend` first):

| Script | Scenario | Threshold |
|--------|----------|-----------|
| `npm run test:perf:get` | 100 VUs over 10s → GET /api/incidents | p95 < 500ms |
| `npm run test:perf:post` | 50 VUs over 10s → POST /api/incidents/report | p95 < 2000ms |
| `npm run test:perf:login` | 20 requests over 3 min → POST /api/auth/login | p95 < 1000ms, no 429s |

Observed results on 31/05/26: GET p95 = 72ms, POST p95 = 95ms — both well inside thresholds.

**Grand total: 235 automated tests across 27 test suites**

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
const mockResendSend = jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null });
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: mockResendSend } })) }));

const { sendResidentConfirmation } = require('../../services/emailService');

describe('sendResidentConfirmation', () => {
  test('UT-011-A: does NOT call Resend send when residentEmail is null', async () => {
    await sendResidentConfirmation(mockIncident, null);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  test('UT-011-E: email subject contains the incident shortId', async () => {
    await sendResidentConfirmation(mockIncident, 'resident@test.com');
    const msg = mockResendSend.mock.calls[0][0];
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

### 5.4 Test Execution Results

All 220 tests were executed on 16/07/26.

**Backend** (`npm test` in `/backend`):

```
PASS tests/unit/generateShortId.test.js        (5 tests)
PASS tests/unit/auth.middleware.test.js        (9 tests)
PASS tests/unit/emailService.test.js          (43 tests)
PASS tests/unit/incidentModel.test.js         (19 tests)
PASS tests/unit/userModel.test.js             (10 tests)
PASS tests/unit/authController.test.js        (15 tests)
PASS tests/unit/upload.middleware.test.js      (8 tests)
PASS tests/unit/satisfactionVoteModel.test.js  (7 tests)
PASS tests/unit/webhookController.test.js      (6 tests)
PASS tests/integration/incidents.test.js      (36 tests)
PASS tests/integration/auth.test.js            (4 tests)
PASS tests/integration/satisfaction.test.js    (8 tests)
PASS tests/integration/contact.test.js         (7 tests)
PASS tests/security/security.test.js           (5 tests)

Test Suites: 14 passed, 14 total
Tests:       182 passed, 182 total
```

**Frontend** (`npm test` in `/frontend`):

```
PASS src/test/AppContext.test.tsx              (8 tests)
PASS src/test/Header.test.tsx                 (4 tests)
PASS src/test/TrackReport.test.tsx            (4 tests)
PASS src/test/AdminDashboard.test.tsx         (3 tests)
PASS src/test/ReportIncident.test.tsx          (6 tests)
PASS src/test/SatisfactionWidget.test.tsx      (8 tests)
PASS src/test/Contact.test.tsx                 (5 tests)

Test Files:  7 passed (7)
Tests:       38 passed (38)
```

**E2E** (`npm run test:e2e` in `/frontend`):

```
Running 30 tests using 5 workers

[chromium] e2e/report-incident.spec.ts  ✓ ET-001 ✓ ET-002
[chromium] e2e/track-report.spec.ts     ✓ ET-003 ✓ ET-004
[chromium] e2e/all-incidents.spec.ts    ✓ ET-005 ✓ ET-006 ✓ ET-007
[chromium] e2e/admin.spec.ts            ✓ ET-008 ✓ ET-008-B ✓ ET-009 ✓ ET-010
[chromium] e2e/mobile.spec.ts           ✓ ET-011 ✓ ET-012 ✓ ET-013 ✓ ET-014
[mobile]   (same 15 tests at 375px viewport — all pass)

30 passed (18.1s)
```

### 5.5 Coverage Reports

#### Backend Coverage

*(refreshed 19/07/26 — added `controllers/webhookController.js`, `routes/webhooks.js`, and `utils/validators.js`, all missing from the previous table)*

```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   82.20 |    75.74 |   86.79 |   83.93 |
 app.js                     |   77.35 |    40.00 |   42.85 |   83.33 |
 controllers/                |         |          |         |         |
  authController.js          |  100.00 |   100.00 |  100.00 |  100.00 |
  contactController.js       |   90.47 |   100.00 |  100.00 |   90.47 |
  incidentController.js      |   64.32 |    68.88 |   80.00 |   65.43 |
  satisfactionController.js  |   72.41 |    66.66 |  100.00 |   71.42 |
  webhookController.js       |  100.00 |    87.50 |  100.00 |  100.00 |
 middleware/                 |         |          |         |         |
  auth.js                    |  100.00 |   100.00 |  100.00 |  100.00 |
  upload.js                  |   95.65 |    96.96 |  100.00 |  100.00 |
 models/                     |         |          |         |         |
  Incident.js                |  100.00 |   100.00 |  100.00 |  100.00 |
  SatisfactionVote.js        |  100.00 |   100.00 |  100.00 |  100.00 |
  User.js                    |  100.00 |   100.00 |  100.00 |  100.00 |
 routes/                     |         |          |         |         |
  auth.js                    |  100.00 |   100.00 |  100.00 |  100.00 |
  contact.js                 |  100.00 |   100.00 |  100.00 |  100.00 |
  incidents.js               |  100.00 |   100.00 |  100.00 |  100.00 |
  satisfaction.js            |  100.00 |   100.00 |  100.00 |  100.00 |
  webhooks.js                |  100.00 |   100.00 |  100.00 |  100.00 |
 services/                   |         |          |         |         |
  emailService.js            |   93.05 |    71.05 |  100.00 |   96.92 |
 utils/                      |         |          |         |         |
  idUtils.js                 |  100.00 |   100.00 |  100.00 |  100.00 |
  validators.js               |  100.00 |   100.00 |  100.00 |  100.00 |
----------------------------|---------|----------|---------|---------|
```

**Key observations:**
- `auth.js`, `authController.js`, `Incident.js`, `SatisfactionVote.js`, `User.js`, `idUtils.js`, `validators.js`, `routes/*` — 100% across all metrics
- `contactController.js` — 90.5% statements; the two uncovered lines are the generic 500 catch-block, not exercised by IT-045–051 which only cover the validation and success paths
- `upload.js` — 95.6% statements (one unreachable branch in the WebP multi-file path; all critical paths covered by UT-038–UT-042)
- `emailService.js` — 93% statements/97% lines; ~71% branch (untested branches are template literal ternary expressions for optional photo count display — not logic branches)
- `webhookController.js` — 100% statements/lines, 87.5% branch; the one uncovered branch is the `event.data?.tags` optional-chaining fallback for a malformed webhook payload with no `data` object at all — every test scenario sends a well-formed payload, so this defensive-only branch is never exercised
- `incidentController.js` — 64.3% statements; the uncovered paths are type-specific field extraction branches (graffiti, antisocial, safetyhazard, maintenance sub-fields), S3 error handling, and `addPhoto`/`reviewIncident`/`reviewPhoto` endpoints not yet covered by integration tests
- `satisfactionController.js` — 72.4% statements; uncovered paths are error-handling branches
- `app.js` — 76.5% statements; CORS rejection path and error handlers not exercised in current integration tests (tested manually)

#### Frontend Coverage

Frontend coverage is collected via Vitest's V8 provider across `src/app/**/*.{ts,tsx}` (excluding `src/app/components/ui/`):

| Area | Notes |
|------|-------|
| `context/AppContext.tsx` | Core functions (addIncident, refreshIncidents, login, logout, updateIncidentStatus, deleteIncident) fully covered by FT-001–FT-006 |
| `components/Header.tsx` | Both auth states covered by FT-007–FT-008 |
| `pages/TrackReport.tsx` | Happy path, cache hit, 404, and network error covered by FT-009–FT-010 |
| `pages/AdminDashboard.tsx` | Incidents list and status update flow covered by FT-011–FT-012 |
| `pages/ReportIncident.tsx` | Unit tests cover submit logic and validation guards (FT-013–FT-014); E2E tests cover full form submission flow (ET-001–ET-002) |

---

## Section 6: Conclusions

### 6.1 Findings

1. **Authentication is robust.** The `authenticate` and `adminOnly` middleware achieve 100% branch coverage and handle all edge cases: missing tokens, expired tokens, tampered tokens, undefined users, and non-admin roles.

2. **Schema validation is effective.** Mongoose enum constraints on `incidentType` and `status` prevent invalid data from reaching the database. Required field enforcement catches missing `location` and `description`.

3. **Two implementation gaps were identified and subsequently fixed:**
   - **Email format validation (fixed):** A regex validator was added to the `reporterEmail` field in `Incident.js`. Strings like `"notanemail"` now fail Mongoose validation and are rejected. Verified by UT-033.
   - **MIME type verification (fixed):** A `validateMagicBytes` middleware was added to `upload.js`. It inspects the actual file buffer bytes after Multer has read the file into memory, catching files with spoofed Content-Type headers. A PDF renamed to `.jpg` is now rejected with HTTP 400. Verified by UT-041 and IT-005.

4. **Inconsistent photo-limit enforcement (fixed):** The Express app now includes a `multer.MulterError` handler that returns HTTP 400 for `LIMIT_FILE_COUNT` errors. Submitting 11 photos to the report endpoint now returns an explicit 400 rather than silently truncating. Verified by IT-005.

5. **Three further bugs found and fixed during code review (31 May 2026):**
   - **BUG-012 — Magic-byte multi-upload bypass (High):** `validateMagicBytes` only inspected `req.files[0]`; files at indices 1–9 bypassed the check entirely. Fixed by looping over all files. The `b.length < 12` global guard was also corrected — it now applies only to the WebP check, which actually requires bytes 8–11, not to JPEG/PNG.
   - **BUG-013 — Anti-social field name mismatch (High):** `createIncident` wrote `typeData.reportedToGarda` but the Mongoose schema field is `reportedToTuath`. The value was silently dropped on every save. Fixed by correcting the field name.
   - **BUG-014 — Optimistic clipboard UI (Low):** `handleCopy` in `IncidentCard` called `setCopied(true)` synchronously before `navigator.clipboard.writeText()` resolved. Fixed by moving the state update into `.then()`.

6. **Legacy incidents without shortId** — 8 of 9 incidents in the live database pre-date the `shortId` field. A database migration script to backfill `shortId` values would prevent future lookup ambiguity.

### 6.1.1 Accepted Test Gap

**`ErrorBoundary.componentDidCatch`** — the Sentry capture hook in the class error boundary is not covered by automated tests. Testing it requires throwing an exception from a child component inside React Testing Library, then asserting on a mocked Sentry call. The project has no existing ErrorBoundary test file and the setup cost is disproportionate to the risk: `Sentry.captureException` is a no-op when Sentry is uninitialised (no DSN set), so there is no reachable failure mode in development or CI. Accepted as a known gap.

~~**`pages/Contact.tsx` frontend unit test**~~ — RESOLVED 16/07/26. `src/test/Contact.test.tsx` added: FT-017-A – FT-017-E cover payload shape (including the empty honeypot field), the success confirmation, server-provided and generic error messages, and the disabled/"Sending…" in-flight state.

### 6.2 Lessons Learned

- Extracting `generateShortId` into a separate `utils/idUtils.js` module during the testing phase improved testability without changing behaviour — a good example of test-driven refactoring.
- Mocking external services (SendGrid) with `jest.mock()` made email tests fast and deterministic, isolating the logic from network conditions.
- Using `mongoose.Document.prototype.validateSync()` enabled full schema testing without a database connection, making tests portable and fast.
- Branch coverage metrics from Jest/Istanbul revealed the `upload.js` file as a gap — addressed by adding Supertest-based integration tests that send real multipart HTTP requests.
- Extracting the Express app into `app.js` (separate from `server.js`) was essential for integration testing — it allows `require('./app')` without triggering the MongoDB connection or the HTTP listener.
- For frontend context tests, using `mockResolvedValue` (rather than `mockResolvedValueOnce`) was necessary because `AppProvider` fires `refreshIncidents()` on mount, which would silently consume a one-shot mock before the test's own call.
- Mocking `useApp` at the module level (via `vi.mock`) made component tests (Header, TrackReport, AdminDashboard) fast and isolated — no real network calls, no Router side-effects beyond `MemoryRouter`.

### 6.3 Recommended Next Steps

| Priority | Recommendation | Status |
|----------|---------------|--------|
| High | Add email-format validator to Incident schema (`reporterEmail`) | ✅ Done — UT-033 |
| High | Replace MIME-type check with magic-byte inspection | ✅ Done — `validateMagicBytes` middleware, UT-041 |
| High | Return explicit 400 when >10 photos submitted on create | ✅ Done — `MulterError` handler in `app.js`, IT-005 |
| Medium | Add **integration tests** using Supertest | ✅ Done — IT-001 – IT-021 (21 tests) |
| Medium | Add **frontend unit tests** using Vitest and React Testing Library | ✅ Done — FT-001–FT-012 (19 tests) |
| Medium | Add **E2E tests** using Playwright to cover full user journeys | ✅ Done — ET-001–ET-014 (15 cases, 30 runs) |
| Low | Add **GitHub Actions** CI workflow to auto-run `npm test` on every PR | ✅ Done — `.github/workflows/ci.yml`; runs backend (112 tests + coverage threshold) and frontend (tsc + 25 Vitest tests) on push to `dev` and PRs to `main` |
| Low | Backfill missing `shortId` values on legacy database documents | Pending |
| Low | Add load testing with k6 to verify performance under concurrent submissions | ✅ Done — Artillery scenarios, GET p95=72ms, POST p95=95ms |
| Low | Add `helmet` secure HTTP headers to Express | ✅ Done — `helmet` added to `app.js` |
| Low | Add `morgan` request logging | ✅ Done — `morgan` added to `app.js` (skipped in test env) |
| Low | Replace hardcoded `localhost:5000` in frontend with env var | ✅ Done — `VITE_API_URL` used in `AppContext.tsx` and `TrackReport.tsx` |
| Low | Add Sentry error monitoring | ✅ Done — `@sentry/node` and `@sentry/react` installed, gated on `SENTRY_DSN` / `VITE_SENTRY_DSN` env vars |
| Low | Add MongoDB indexes for `incidentType` and `reportedDate` | ✅ Done — `index: true` added to Incident schema |
| Low | Fix email tracking link `/#track` → `/track` | ✅ Done — corrected in `emailService.js` |
| Low | Add React error boundary | ✅ Done — `ErrorBoundary.tsx` wraps entire app; shows fallback on crash |
| Low | Add scroll-to-top on route navigation | ✅ Done — `ScrollToTop.tsx` layout route resets scroll on every navigation |
| Low | Add GDPR privacy policy page | ✅ Done — `/privacy` page with data collected, retention policy, rights, and contact details |
| Low | Formal complaint forwarding to Túath Housing / Dublin City Council | ✅ Done — optional complaint section on report form; `sendComplaintEmails` dispatches formatted complaint emails to selected organisations |
| Low | Remove "Already reported to Garda" field | ✅ Done — checkbox, schema field (`reportedToTuath`), controller extraction, and all frontend API mappings removed (31/05/26) |
| Low | Update Anti-Social Behaviour options | ✅ Done — added Urination / Defecation; removed Fighting and Estimated Number of People |
| Low | Add About Us button to header | ✅ Done — visible on all pages, navigates to `/about` |
| Low | Update How It Works (Home + About) | ✅ Done — 5-step flow now includes Escalate step explaining Túath/DCC complaint option |
| Low | UK English throughout frontend | ✅ Done — neighbourhood, organised, behaviour |
| Low | Add explicit input validation in `createIncident` | ✅ Done — 400 guards for missing/invalid `incidentType`, `location`, `description` before type-specific logic runs |
| Low | Apply `escapeHtml` to resident confirmation and admin notification emails | ✅ Done — `location`, `status`, `incidentType`, `description`, `reporterEmail` all escaped before HTML interpolation |
| Low | Remove hardcoded personal email fallback from complaint sender config | ✅ Done — missing `TUATH_COMPLAINT_EMAIL` / `DCC_COMPLAINT_EMAIL` now logs a warning and skips rather than falling back to a personal address |
| Low | Migrate email provider from SendGrid to Resend | ✅ Done — `@sendgrid/mail` replaced with `resend`; complaint emails confirmed landing in inbox |
| Low | Make `reporterEmail` mandatory on every incident report | ✅ Done — verifies the reporter lives in the complex; anonymous reporting (no name/address, no complaint) still works, since `complainantName`/`complainantAddress` remain optional unless `sendComplaintTo` is set |
| Low | Add resident satisfaction voting system | ✅ Done — new `SatisfactionVote` model/controller/routes (`/api/satisfaction`, `/api/satisfaction/summary`); one vote per email, upserted so votes can be changed; `SatisfactionWidget` on the Home page shows a public low/medium/high results bar with no emails exposed |
| Low | Compress incident photos before S3 upload | ✅ Done — `sharp` resizes to a max 1920px edge and re-encodes as JPEG (quality 80) in both `createIncident` and `addPhoto`, capping storage/bandwidth cost for full-resolution phone photos |
| Low | Strip CR/LF from email subject lines | ✅ Done — `sanitizeHeader()` in `emailService.js` prevents header-injection via `incident.location` in admin notification and complaint email subjects |
| Low | Add `mongoSanitize()` to multipart routes | ✅ Done — the global instance never ran on `POST /report`/`POST /:id/photos` since multer parses the body after it; now applied at the route level after `validateMagicBytes` |
| Low | Code review fixes (satisfaction voting + reporter email pass) | ✅ Done — `sendComplaintTo` values now trimmed ("tuath, dcc" keeps both recipients); `getSummary` no longer leaks `error.message`; `submitVote` returns 409 on a duplicate-key upsert race; shared `EMAIL_REGEX` extracted to `backend/utils/validators.js`; `SatisfactionVote` uses Mongoose `timestamps: true`; rate limiter added to `POST /api/satisfaction`; `aria-pressed` added to rating buttons; `Incident.reporterEmail` made optional in the frontend type to match legacy rows; report form now trims email/name/address before submission; corrected stale copy in `About.tsx` ("Túath's" was rendering with a stray space) and `PrivacyPolicy.tsx` (reporter email described as optional when it's required) |
| Low | Add a "Contact Us" page for general questions/feedback outside the incident-report flow | ✅ Done 16/07/26 — `POST /api/contact` validates name/email/message, honeypot spam field, HTML-escaped body, Reply-To set to sender; new `Contact.tsx` page linked from the header; covered by IT-045–051 (backend) and FT-017 (frontend) |

---

## Appendix: Requirements Specification

### A.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | The system shall allow any user to submit an incident report without creating an account |
| FR-02 | Each incident report shall be assigned a unique reference ID in the format `CW-XXXXXX` |
| FR-03 | The system shall support four incident types: Graffiti, Anti-Social Behaviour, Safety Hazard, and Maintenance Issue |
| FR-04 | Each incident type shall collect type-specific fields in addition to common fields (location, description). Anti-Social Behaviour options: Loitering, Noise / Disturbance, Vandalism, Urination / Defecation, Other |
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
| FR-16 | Users shall be able to optionally send a formal complaint to Túath Housing and/or Dublin City Council when submitting an incident report |
| FR-17 | Every incident report shall require a valid reporter email; if a formal complaint is selected, the user must additionally provide their full name and address. Anonymous reporting (no name/address, no complaint) shall remain available |
| FR-18 | The system shall display a GDPR-compliant privacy policy at `/privacy` covering data collected, retention periods, user rights, and contact details |
| FR-19 | The system shall allow any user to submit a satisfaction rating (low/medium/high) for Túath Housing, identified by email; resubmitting with the same email shall update the existing vote rather than creating a duplicate |
| FR-20 | The system shall publicly display aggregate satisfaction vote counts without exposing voter email addresses |
| FR-21 | The system shall allow any user to send a general "Contact Us" message (name, email, message) outside the incident-report flow; the message shall be emailed to the admin with Reply-To set to the sender's address, and shall include a honeypot field to silently discard automated spam submissions |

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
| NFR-10 | The system shall function correctly when the email service (Resend) is unavailable, logging the error silently | Reliability |
| NFR-11 | The frontend shall be fully usable on Chrome, Firefox, and Safari on both desktop and mobile | Usability |
| NFR-12 | Anonymous reporting shall be supported — no account or personal information shall be required to submit a report | Usability |
| NFR-13 | The application shall publish a privacy policy compliant with GDPR (Ireland), covering data collected, retention periods, and user rights | Legal / Compliance |
| NFR-14 | The backend shall set secure HTTP headers (CSP, HSTS, X-Frame-Options) via `helmet` in production | Security |
| NFR-15 | All unhandled exceptions in production shall be captured by Sentry; monitoring is gated on the presence of `SENTRY_DSN` / `VITE_SENTRY_DSN` env vars | Observability |
