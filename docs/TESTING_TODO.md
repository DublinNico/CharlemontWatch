# CharlemontWatch — Testing Todo List

---

## 🔴 Critical — Fix identified gaps from current test suite

- [x] **Email format validation test** — added regex validator to `reporterEmail` in Incident schema; UT-033 confirms `"notanemail"` is rejected
- [x] **MIME magic-byte test** — added `validateMagicBytes` middleware to `upload.js` (no external package); UT-041 confirms a PDF renamed to `.jpg` is rejected
- [x] **Upload middleware unit test** — Supertest suite covering MIME filter, 5MB limit, magic-byte check, and no-file passthrough (UT-038–UT-042); upload.js now at 95% coverage
- [x] **User model pre-save hook test** — mongodb-memory-server wired up; UT-034 confirms password is hashed on save and not re-hashed on unrelated updates
- [x] **Email service catch-path test** — UT-035–UT-037 confirm all three catch blocks swallow SendGrid errors silently

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
- [ ] **ReportIncident form** — submit with all graffiti fields → calls `addIncident` with correct data
- [ ] **ReportIncident form** — submit without required fields → shows validation error, does not submit
- [x] **TrackReport** — search with valid CW-XXXXXX ID → displays incident card (FT-009, FT-009-B cache hit)
- [x] **TrackReport** — search with unknown ID → shows "not found" message (FT-010, FT-010-B network error)
- [x] **AdminDashboard** — renders incidents list for authenticated admin (FT-011, FT-011-B)
- [x] **AdminDashboard** — status update button calls `updateIncidentStatus` (FT-012)
- [x] **Header** — hides Dashboard/Sign Out when unauthenticated; shows username + buttons when authenticated (FT-007, FT-008)

---

## 🟡 End-to-End Tests — Add Playwright

- [ ] **Submit a graffiti report** — fill form, attach photo, submit → confirmation page shows incident ID
- [ ] **Track a report by ID** — enter ID on TrackReport page → incident details displayed with photos
- [ ] **Browse all incidents** — navigate to /incidents → list renders, type filter works, status filter works
- [ ] **Click incident card** — navigates to TrackReport with correct incident loaded
- [ ] **Admin login** — enter credentials → redirected to admin dashboard
- [ ] **Admin update status** — change status NEW → IN_PROGRESS → RESOLVED
- [ ] **Admin delete incident** — incident removed from list after delete
- [ ] **Anonymous report** — submit without email → incident saved, no crash
- [ ] **Mobile responsiveness** — run above flows at 375px viewport (iPhone SE)

---

## 🟡 Security Tests

- [ ] **JWT tampering** — modify payload of a valid token → API returns 401
- [ ] **JWT from different secret** — token signed with wrong secret → 401
- [ ] **NoSQL injection** — send `{ "email": { "$gt": "" } }` to `/api/auth/login` → should be sanitised and return 401, not bypass auth (requires `express-mongo-sanitize`)
- [ ] **XSS in description** — submit incident with `<script>alert(1)</script>` in description field → stored as plain text, rendered escaped in frontend
- [ ] **Brute-force login** — 20 rapid login attempts → rate limiter blocks after threshold (requires `express-rate-limit`)
- [ ] **Resident cannot delete incident** — resident JWT on DELETE endpoint → 403
- [ ] **Resident cannot update status** — resident JWT on PATCH status → 403

---

## 🟡 Performance Tests — Add k6 or Artillery

- [ ] **Incident creation under load** — 50 concurrent POST /api/incidents/report → all return 201, response time < 2s
- [ ] **Get all incidents** — 100 concurrent GET /api/incidents → response time < 500ms
- [ ] **Login endpoint** — 20 concurrent logins → no errors, rate limiter does not block legitimate traffic

---

## 🟡 CI/CD

- [ ] **Add GitHub Actions workflow** — run `npm test` in `/backend` on every push to `dev` and every PR to `main`
- [ ] **Add coverage threshold** — fail CI if statement coverage drops below 70%
- [ ] **Add frontend lint check** — run `tsc --noEmit` in CI to catch TypeScript errors before merge

---

## Summary

| Category | Items |
|----------|-------|
| 🔴 Critical gaps (current suite) | 5 |
| 🟠 Integration tests (Supertest) | 21 |
| 🟠 Frontend unit tests (Vitest) | 13 |
| 🟡 E2E tests (Playwright) | 9 |
| 🟡 Security tests | 7 |
| 🟡 Performance tests | 3 |
| 🟡 CI/CD | 3 |
| **Total** | **61** |
