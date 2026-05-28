# CharlemontWatch — Testing Todo List

---

## 🔴 Critical — Fix identified gaps from current test suite

- [ ] **Email format validation test** — add validator to `reporterEmail` field in Incident schema, then add EP test case confirming `"notanemail"` is rejected with HTTP 400 (currently stored as-is — gap found in TC-BB-EP-002)
- [ ] **MIME magic-byte test** — add `file-type` package to upload middleware, then add BVA test confirming a PDF renamed to `.jpg` is rejected (gap found in TC-BB-BVA-002)
- [ ] **Upload middleware unit test** — `upload.js` has 0% coverage; add Supertest test that sends a real multipart request to cover file type and size enforcement
- [ ] **User model pre-save hook test** — `User.js` lines 26–28 (bcrypt hash on save) are uncovered; need an in-memory DB (mongodb-memory-server) to trigger `.save()` and verify password is hashed before storage
- [ ] **Email service catch-path test** — lines 54, 86, 122 in `emailService.js` are the `catch` blocks; mock `sgMail.send` to reject and confirm the error is swallowed silently without crashing the request

---

## 🟠 Integration Tests — Add Supertest

- [ ] **POST /api/incidents/report** — valid body → 201 + shortId returned
- [ ] **POST /api/incidents/report** — missing required field → 500 validation error
- [ ] **POST /api/incidents/report** — invalid incidentType → 500 validation error
- [ ] **POST /api/incidents/report** — with photo attachment → photo URL stored in DB
- [ ] **POST /api/incidents/report** — 11 photos submitted → explicit 400 (after fix)
- [ ] **GET /api/incidents** — returns array of all incidents
- [ ] **GET /api/incidents?status=NEW** — filters correctly
- [ ] **GET /api/incidents?type=graffiti** — filters correctly
- [ ] **GET /api/incidents/:id** — valid shortId → returns incident
- [ ] **GET /api/incidents/:id** — valid MongoDB ObjectId → returns incident (fallback)
- [ ] **GET /api/incidents/:id** — unknown ID → 404
- [ ] **PATCH /api/incidents/admin/:id/status** — valid status + admin JWT → 200
- [ ] **PATCH /api/incidents/admin/:id/status** — invalid status → 400
- [ ] **PATCH /api/incidents/admin/:id/status** — no JWT → 401
- [ ] **PATCH /api/incidents/admin/:id/status** — resident JWT → 403
- [ ] **DELETE /api/incidents/admin/:id** — admin JWT → 200, incident removed
- [ ] **DELETE /api/incidents/admin/:id** — no JWT → 401
- [ ] **POST /api/auth/register** — new email → 201 + JWT
- [ ] **POST /api/auth/register** — duplicate email → 400
- [ ] **POST /api/auth/login** — correct credentials → 200 + JWT
- [ ] **POST /api/auth/login** — wrong password → 401
- [ ] **POST /api/auth/login** — unknown email → 401

---

## 🟠 Frontend Unit Tests — Add Vitest + React Testing Library

- [ ] **AppContext** — `addIncident` calls POST `/api/incidents/report` with correct payload
- [ ] **AppContext** — `refreshIncidents` fetches and maps API response to frontend `Incident` type
- [ ] **AppContext** — `login` stores JWT in localStorage and sets `isAuthenticated`
- [ ] **AppContext** — `logout` clears token and user state
- [ ] **AppContext** — `updateIncidentStatus` calls PATCH with correct status
- [ ] **AppContext** — `deleteIncident` calls DELETE and removes item from state
- [ ] **ReportIncident form** — submit with all graffiti fields → calls `addIncident` with correct data
- [ ] **ReportIncident form** — submit without required fields → shows validation error, does not submit
- [ ] **TrackReport** — search with valid CW-XXXXXX ID → displays incident card
- [ ] **TrackReport** — search with unknown ID → shows "not found" message
- [ ] **AdminDashboard** — renders incidents list for authenticated admin
- [ ] **AdminDashboard** — status update button calls `updateIncidentStatus`
- [ ] **Header** — shows Sign In when unauthenticated, username when authenticated

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
