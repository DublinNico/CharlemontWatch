# CharlemontWatch — Testing Todo List

---

## 🔴 Critical — Fix identified gaps from current test suite

- [x] **Email format validation test** — added regex validator to `reporterEmail` in Incident schema; UT-033 confirms `"notanemail"` is rejected
- [x] **MIME magic-byte test** — added `validateMagicBytes` middleware to `upload.js` (no external package); UT-041 confirms a PDF renamed to `.jpg` is rejected
- [x] **Upload middleware unit test** — Supertest suite covering MIME filter, 5MB limit, magic-byte check, and no-file passthrough (UT-038–UT-042); upload.js now at 95% coverage
- [x] **User model pre-save hook test** — mongodb-memory-server wired up; UT-034 confirms password is hashed on save and not re-hashed on unrelated updates
- [x] **Email service catch-path test** — UT-035–UT-037 confirm all three catch blocks swallow SendGrid errors silently
- [x] **sendComplaintEmails tests** — UT-038-A–G cover: Túath-only send, DCC-only send, both recipients (2 emails), empty recipients (no send), complainant name in Túath email, location in DCC email, SendGrid error swallowed silently
- [x] **escapeHtml injection tests** — UT-038-H confirms `<script>` in complainant name is escaped to `&lt;script&gt;`; UT-038-I confirms `<img>` in incident description is escaped
- [x] **complaintReady integration tests** — IT-022 confirms invalid complainant email blocks complaint fields from DB; IT-023 confirms missing phone does the same
- [ ] **ErrorBoundary.componentDidCatch** — Sentry hook not tested; accepted gap (see TestingReport §6.1.1)

---

## 🟠 Integration Tests — Add Supertest

- [x] **POST /api/incidents/report** — valid body → 201 + shortId returned (IT-001)
- [x] **POST /api/incidents/report** — missing required field → 500 validation error (IT-002)
- [x] **POST /api/incidents/report** — invalid incidentType → 500 validation error (IT-003)
- [x] **POST /api/incidents/report** — with photo attachment → photo URL stored in DB (IT-004)
- [x] **POST /api/incidents/report** — 11 photos submitted → 400 (IT-005; fixed: multer error now caught and returned as 400)
- [x] **GET /api/incidents** — returns array of all incidents, PENDING_REVIEW/REJECTED excluded (IT-006)
- [x] **GET /api/incidents?status=NEW** — filters correctly (IT-007)
- [x] **GET /api/incidents?type=graffiti** — filters correctly (IT-008)
- [x] **GET /api/incidents/:id** — valid shortId → returns incident (IT-009)
- [x] **GET /api/incidents/:id** — valid MongoDB ObjectId → returns incident (fallback) (IT-010)
- [x] **GET /api/incidents/:id** — unknown ID → 404 (IT-011)
- [x] **PATCH /api/incidents/admin/:id/status** — valid status + admin JWT → 200 (IT-012)
- [x] **PATCH /api/incidents/admin/:id/status** — invalid status → 400 (IT-013)
- [x] **PATCH /api/incidents/admin/:id/status** — no JWT → 401 (IT-014)
- [x] **PATCH /api/incidents/admin/:id/status** — resident JWT → 403 (IT-015)
- [x] **DELETE /api/incidents/admin/:id** — admin JWT → 200, incident removed (IT-016)
- [x] **DELETE /api/incidents/admin/:id** — no JWT → 401 (IT-017)
- [x] **POST /api/auth/register** — route removed → 404 (IT-021)
- [x] **POST /api/auth/login** — correct credentials → 200 + JWT (IT-018, UT-030)
- [x] **POST /api/auth/login** — wrong password → 401 (IT-019, UT-028)
- [x] **POST /api/auth/login** — unknown email → 401 (IT-020, UT-027)

---

## 🟠 Frontend Unit Tests — Add Vitest + React Testing Library

- [x] **AppContext** — `addIncident` calls POST `/api/incidents/report` with correct payload and mapped incidentType (FT-002, FT-002-B)
- [x] **AppContext** — `refreshIncidents` fetches and maps API response to frontend `Incident` type (FT-001)
- [x] **AppContext** — `login` stores JWT in localStorage and sets `isAuthenticated` (FT-003, FT-003-B)
- [x] **AppContext** — `logout` clears token and user state (FT-004)
- [x] **AppContext** — `updateIncidentStatus` calls PATCH with correct status and updates local state (FT-005)
- [x] **AppContext** — `deleteIncident` calls DELETE and removes item from state (FT-006)
- [x] **ReportIncident form** — submit with all graffiti fields → calls `addIncident` with correct data (FT-013, FT-013-B)
- [x] **ReportIncident form** — submit button disabled without type; addIncident not called without type (FT-014, FT-014-B, FT-014-C)
- [x] **TrackReport** — search with valid CW-XXXXXX ID → displays incident card (FT-009, FT-009-B cache hit)
- [x] **TrackReport** — search with unknown ID → shows "not found" message (FT-010, FT-010-B network error)
- [x] **AdminDashboard** — renders incidents list for authenticated admin (FT-011, FT-011-B)
- [x] **AdminDashboard** — status update button calls `updateIncidentStatus` (FT-012)
- [x] **Header** — hides Dashboard/Sign Out when unauthenticated; shows username + buttons when authenticated (FT-007, FT-008)

---

## 🟡 End-to-End Tests — Add Playwright

- [x] **Submit a graffiti report** — fill form, submit → confirmation page shows incident ID (ET-001)
- [x] **Track a report by ID** — enter ID on TrackReport page → incident details displayed (ET-003)
- [x] **Browse all incidents** — navigate to /incidents → list renders, type filter works (ET-005, ET-006)
- [x] **Click incident card** — navigates to TrackReport with correct incident loaded (ET-007)
- [x] **Admin login** — enter credentials → redirected to admin dashboard (ET-008, ET-008-B)
- [x] **Admin update status** — change status NEW → IN_PROGRESS (ET-009)
- [x] **Admin delete incident** — incident removed from list after delete (ET-010)
- [x] **Anonymous report** — submit without email → success page, no crash (ET-002)
- [x] **Mobile responsiveness** — all flows verified at 375px viewport with Chromium mobile emulation (ET-011–ET-014)

---

## 🟡 Security Tests

- [x] **JWT tampering** — already covered by UT-007-A (tampered signature → 401)
- [x] **JWT from different secret** — already covered by UT-007-B (expired/invalid token → 401)
- [x] **NoSQL injection** — `express-mongo-sanitize` added to app.js; ST-003 confirms operator payloads are rejected with 400 before reaching the DB
- [x] **XSS in description** — ST-004 confirms `<script>` is stored verbatim; React escapes it at render time
- [x] **Brute-force login** — `express-rate-limit` added to `/api/auth/login` (skip in test env); ST-005 confirms 429 after threshold using an isolated mini-app
- [x] **Resident cannot delete incident** — ST-006 confirms resident JWT on DELETE returns 403 and incident remains in DB
- [x] **Resident cannot update status** — already covered by IT-015 (resident JWT on PATCH status → 403)

---

## 🟡 Performance Tests — Add k6 or Artillery

- [x] **Incident creation under load** — 50 VUs over 10s via Artillery; threshold p95 < 2s, all 201 (`npm run test:perf:post`)
- [x] **Get all incidents** — 100 VUs over 10s via Artillery; threshold p95 < 500ms, all 200 (`npm run test:perf:get`)
- [x] **Login endpoint** — 20 requests spread over 3 min (~7/min, under 10/min rate limit); threshold all 200, no 429s (`npm run test:perf:login`)

---

## 🟡 CI/CD

- [x] **Add GitHub Actions workflow** — `.github/workflows/ci.yml` runs backend tests + frontend tests + TypeScript check on push to `dev` and PRs to `main`
- [x] **Add coverage threshold** — `jest.config.js` now enforces statements/functions/lines ≥ 70%, branches ≥ 65%; CI fails if coverage drops below
- [x] **Add frontend lint check** — `tsc --noEmit` runs in the `frontend` CI job before Vitest

---

## Summary

| Category | Items |
|----------|-------|
| 🔴 Critical gaps (current suite) | 6 (1 accepted gap remaining) |
| 🟠 Integration tests (Supertest) | 21 |
| 🟠 Frontend unit tests (Vitest) | 13 |
| 🟡 E2E tests (Playwright) | 9 |
| 🟡 Security tests | 7 |
| 🟡 Performance tests | 3 |
| 🟡 CI/CD | 3 |
| **Total** | **61** |
