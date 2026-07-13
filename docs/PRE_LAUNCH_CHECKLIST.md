# CharlemontWatch — Pre-Launch Checklist

---

## 🔴 Critical — Must fix before going live

### Security
- [ ] **Replace JWT_SECRET** — current value in `.env` is a weak placeholder; generate a strong 256-bit random secret for production
- [x] **Hide admin login from public** — route changed from `/auth` to `/cw-admin`; page only renders if `?key=VITE_ADMIN_KEY` is present in the URL, otherwise redirects to home. Access: `https://your-domain.com/cw-admin?key=charlemont2026`. **Change `VITE_ADMIN_KEY` in `frontend/.env.production` before going live.**
- [ ] **Restrict CORS to production domain** — `server.js` currently allows all `localhost:*` origins; must be changed to the actual deployed frontend URL
- [x] **Add rate limiting** — `express-rate-limit` added to `/api/auth/login` (10 req/min per IP, skipped in test env); ST-005 confirms 429 after threshold
- [ ] **Enable HTTPS** — without it, admin credentials travel in plaintext; use a host that provides TLS (Vercel, Render, Railway all do this for free)
- [x] **Add `helmet`** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.); one-line install on the Express app
- [x] **Add NoSQL injection protection** — `express-mongo-sanitize` added to `app.js`; ST-003 confirms operator payloads are rejected before reaching the DB
- [x] **Add email format validation** to the Incident schema (`reporterEmail`) — regex validator added; `"notanemail"` now rejected (UT-033)
- [x] **Add magic-byte MIME verification** on uploads — `validateMagicBytes` middleware checks actual file buffer bytes; PDF-disguised-as-JPEG now rejected (UT-041)
- [x] **Add explicit input validation in `createIncident`** — 400 returned for missing/invalid `incidentType`, `location`, `description` before any DB or type logic runs
- [x] **Escape HTML in all outgoing emails** — `escapeHtml()` applied to all user-supplied fields in resident confirmation, admin notification, and complaint emails
- [x] **Remove hardcoded personal email fallback** — missing `TUATH_COMPLAINT_EMAIL`/`DCC_COMPLAINT_EMAIL` now logs a warning and skips rather than defaulting to a personal address
- [x] **Migrate email provider to Resend** — `@sendgrid/mail` replaced; complaint emails confirmed landing in inbox; free tier: 3,000 emails/month
- [x] **Make `reporterEmail` mandatory on every report** — previously optional; now required (400 if missing/invalid) so every submission, anonymous or not, is tied to a verifiable resident email. `complainantName`/`complainantAddress` remain optional and are only required when `sendComplaintTo` is set — anonymous reporting (photos + description only) still works.

### Environment & Config
- [x] **Replace all hardcoded `localhost:5000`** in the frontend — `AppContext.tsx:4` and `TrackReport.tsx:10` both hardcode the local API URL; move to `import.meta.env.VITE_API_URL`
- [x] **Create `frontend/.env.production`** with `VITE_API_URL=https://your-api-domain.com/api`
- [ ] **Set `NODE_ENV=production`** on the backend server
- [ ] **Update `FRONTEND_URL`** in backend `.env` to the live domain — currently `localhost:3000`; used in email tracking links

### Database
- [ ] **Backfill `shortId` on 8 legacy incidents** — 8 of 9 incidents in MongoDB have no `shortId`; run migration script to generate and persist them

---

## 🟠 Important — Should fix before going live

### Backend
- [x] **Don't expose raw error messages in production** — `err.message` replaced with `'Internal Server Error'` in global error handler; `createIncident` now returns 400 for `ValidationError` and generic 500 for all other errors (BUG-015, BUG-016)
- [x] **Add request logging** — `morgan` middleware to log every request; essential for debugging production issues
- [x] **Add MongoDB indexes** — `incidentType`, `status`, and `reportedDate` should be indexed for query performance as data grows
- [x] **Explicit 400 when >10 photos submitted on create** — `MulterError` handler added to Express app; now returns 400 consistently (IT-005)

### Frontend
- [x] **Test production build** — run `npm run build` in `/frontend` and verify output has no errors or missing assets
- [x] **Add an error boundary** — if the API is unreachable the app shows a blank screen; a React error boundary should show a friendly fallback message
- [x] **Fix email tracking link in `emailService.js`** — `sendResidentConfirmation` still uses the old hash-based `/#track` path; should be the React Router path `/track`

### Email
- [ ] **Verify Resend sender domain** — add `charlemontwatch.ie` to Resend → Domains and set up SPF/DKIM DNS records; until then emails send from `onboarding@resend.dev`
- [ ] **Test all three email flows in production** — resident confirmation, admin notification, status update

---

## 🟡 Nice to have — Before or shortly after launch

### Monitoring & Ops
- [x] **Set up error monitoring** — Sentry installed on backend and frontend; set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) env vars to activate
- [ ] **Set up uptime monitoring** — Freshping or UptimeRobot to alert if the backend goes down
- [ ] **Enable MongoDB Atlas automated backups** — set a daily backup schedule on the Atlas cluster

### Testing
- [x] **Add Supertest integration tests** — 35 integration tests covering all incident, auth, and satisfaction routes (IT-001 – IT-031)
- [x] **Add frontend unit tests** — 33 Vitest + React Testing Library tests covering AppContext, Header, TrackReport, AdminDashboard, ReportIncident, SatisfactionWidget (FT-001 – FT-016)
- [x] **Add E2E tests (Playwright)** — 15 test cases × 2 browser profiles = 30 runs; covers report, track, browse, admin login/update/delete, mobile viewport (ET-001 – ET-014)
- [x] **Set up GitHub Actions CI** — `.github/workflows/ci.yml` runs backend tests + coverage threshold + frontend tsc + Vitest on push to `dev` and PRs to `main`

### Features
- [x] **Add resident satisfaction voting system** — public low/medium/high vote on Túath Housing (`/api/satisfaction`); one vote per email, upserted so residents can change their vote; results shown as a public bar chart on the Home page, no emails exposed via `/api/satisfaction/summary`

### Legal (GDPR — Ireland)
- [x] **Write a privacy policy** — `/privacy` page created covering data collected, usage, retention, GDPR rights, and contact
- [x] **Add a data retention policy** — included in privacy policy: reports 2yr, emails deleted with report, photos deleted with report, logs 90 days
- [x] **Add cookie/consent notice** — not required; no analytics or third-party tracking scripts in use

### Infrastructure
- [ ] **Deploy backend** — Railway, Render, or Fly.io recommended for Node/Express
- [ ] **Deploy frontend** — Vercel or Netlify (automatic from GitHub)
- [ ] **Set custom domain** and point DNS
- [ ] **Enforce HTTPS** — ensure the deployment platform redirects HTTP → HTTPS

---

## Summary

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 Critical | 18 | 13 | 5 |
| 🟠 Important | 8 | 8 | 0 |
| 🟡 Nice to have | 14 | 10 | 4 |
| **Total** | **40** | **31** | **9** |
