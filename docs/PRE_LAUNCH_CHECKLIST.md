# CharlemontWatch — Pre-Launch Checklist

**Status: launched 2026-07-16.** Backend live on Render, frontend live on Vercel. This checklist is kept as a historical record and for the small number of items still open post-launch — see the 🔴/🟠/🟡 sections below for what's left.

---

## 🔴 Critical — Must fix before going live

### Security
- [x] **Replace JWT_SECRET** — strong 256-bit random secret generated and set directly in Render's environment variables (not committed)
- [x] **Hide admin login from public** — route changed from `/auth` to `/cw-admin`; page only renders if `?key=VITE_ADMIN_KEY` is present in the URL, otherwise redirects to home. `VITE_ADMIN_KEY` changed from the placeholder to a strong secret in `frontend/.env.production` before launch.
- [x] **Restrict CORS to production domain** — `CORS_ALLOWED_ORIGINS` set to the live Vercel frontend URL in Render's environment variables
- [x] **Add rate limiting** — `express-rate-limit` added to `/api/auth/login` (10 req/min per IP, skipped in test env); ST-005 confirms 429 after threshold
- [x] **Enable HTTPS** — both Render and Vercel provide TLS by default; live URLs are HTTPS-only
- [x] **Add `helmet`** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.); one-line install on the Express app
- [x] **Add NoSQL injection protection** — `express-mongo-sanitize` added to `app.js`; ST-003 confirms operator payloads are rejected before reaching the DB
- [x] **Add email format validation** to the Incident schema (`reporterEmail`) — regex validator added; `"notanemail"` now rejected (UT-033)
- [x] **Add magic-byte MIME verification** on uploads — `validateMagicBytes` middleware checks actual file buffer bytes; PDF-disguised-as-JPEG now rejected (UT-041)
- [x] **Add explicit input validation in `createIncident`** — 400 returned for missing/invalid `incidentType`, `location`, `description` before any DB or type logic runs
- [x] **Escape HTML in all outgoing emails** — `escapeHtml()` applied to all user-supplied fields in resident confirmation, admin notification, and complaint emails
- [x] **Remove hardcoded personal email fallback** — missing `TUATH_COMPLAINT_EMAIL`/`DCC_COMPLAINT_EMAIL` now logs a warning and skips rather than defaulting to a personal address
- [x] **Migrate email provider to Resend** — `@sendgrid/mail` replaced; complaint emails confirmed landing in inbox; free tier: 3,000 emails/month
- [x] **Make `reporterEmail` mandatory on every report** — previously optional; now required (400 if missing/invalid) so every submission, anonymous or not, is tied to a verifiable resident email. `complainantName`/`complainantAddress` remain optional and are only required when `sendComplaintTo` is set — anonymous reporting (photos + description only) still works.
- [x] **Strip CR/LF from email subject lines** — `sanitizeHeader()` added to `emailService.js`; `incident.location` is no longer interpolated raw into subject lines, closing an email header-injection vector (UT-044, UT-045)
- [x] **Apply `mongoSanitize()` to multipart routes** — the global instance in `app.js` never ran on `POST /report` / `POST /:id/photos` since `multer` parses the body after it; now applied at the route level, after `validateMagicBytes`
- [x] **Rate limit `/api/satisfaction`** — `express-rate-limit` added to `POST /api/satisfaction` (10 req/min per IP, skipped in test env), mirroring the login limiter
- [x] **Handle duplicate-key race on satisfaction vote upsert** — `submitVote` now catches MongoDB E11000 and returns 409 instead of a misleading 500

### Environment & Config
- [x] **Replace all hardcoded `localhost:5000`** in the frontend — `AppContext.tsx:4` and `TrackReport.tsx:10` both hardcode the local API URL; move to `import.meta.env.VITE_API_URL`
- [x] **Create `frontend/.env.production`** with the real deployed API URL — a post-launch bug (fixed via PR #15) found this file still had the placeholder `https://your-api-domain.com/api` baked into the Vite build, silently breaking every API call on the live site; now points at `https://charlemontwatch.onrender.com/api`
- [x] **Set `NODE_ENV=production`** on the backend server — set in Render's environment variables
- [x] **Update `FRONTEND_URL`** in backend env to the live domain — set to the Vercel frontend URL in Render's environment variables; used in email tracking links

### Database
- [x] **Backfill `shortId` on legacy incidents** — checked production DB 2026-07-17: those legacy incidents are gone (cleaned up since this was written) and all 4 incidents currently in the database already have a `shortId`. Nothing to migrate.

---

## 🟠 Important — Should fix before going live

### Backend
- [x] **Don't expose raw error messages in production** — `err.message` replaced with `'Internal Server Error'` in global error handler; `createIncident` now returns 400 for `ValidationError` and generic 500 for all other errors (BUG-015, BUG-016)
- [x] **Add request logging** — `morgan` middleware to log every request; essential for debugging production issues
- [x] **Add MongoDB indexes** — `incidentType`, `status`, and `reportedDate` should be indexed for query performance as data grows
- [x] **Explicit 400 when >10 photos submitted on create** — `MulterError` handler added to Express app; now returns 400 consistently (IT-005)
- [x] **Trim `sendComplaintTo` values before matching** — `"tuath, dcc"` (with a space after the comma) was silently dropping `dcc`; values are now trimmed before the allow-list filter (IT-033)

### Frontend
- [x] **Test production build** — run `npm run build` in `/frontend` and verify output has no errors or missing assets
- [x] **Add an error boundary** — if the API is unreachable the app shows a blank screen; a React error boundary should show a friendly fallback message
- [x] **Fix email tracking link in `emailService.js`** — `sendResidentConfirmation` still uses the old hash-based `/#track` path; should be the React Router path `/track`
- [x] **Type `Incident.reporterEmail` as optional** — legacy DB rows predate the mandatory-email change; the type now matches reality instead of falsely promising every fetched incident has an email
- [x] **Trim reporter/complainant fields before submission** — `ReportIncident.tsx` validated with `.trim()` but submitted the untrimmed value, so `" jane@example.com"` passed frontend validation only to be rejected by the backend's stricter regex; now trimmed once and reused

### Email
- [ ] **Verify Resend sender domain** — add `charlemontwatch.ie` to Resend → Domains and set up SPF/DKIM DNS records; until then emails send from `onboarding@resend.dev`
- [ ] **Test all three email flows in production** — resident confirmation, admin notification, status update

---

## 🟡 Nice to have — Before or shortly after launch

### Monitoring & Ops
- [x] **Set up error monitoring** — Sentry installed on backend and frontend; set `SENTRY_DSN` (backend) and `VITE_SENTRY_DSN` (frontend) env vars to activate
- [x] **Set up uptime monitoring** — UptimeRobot monitor pinging `https://charlemontwatch.onrender.com/api/health` every 5 minutes, keeping Render's free tier from cold-starting
- [x] **Set up database backups** — Atlas Cloud Backups aren't available on the M0 free tier at all (hard platform limit, not a config toggle); instead added `.github/workflows/backup.yml` — daily `mongodump`, GPG-encrypted (repo is public) before upload as a 30-day-retention workflow artifact. Pending: PR #20 merge + one manual `workflow_dispatch` run to confirm end-to-end (untestable pre-merge since GitHub only allows dispatching workflows that already exist on the default branch).

### Testing
- [x] **Add Supertest integration tests** — 37 integration tests covering all incident, auth, and satisfaction routes (IT-001 – IT-033)
- [x] **Add frontend unit tests** — 33 Vitest + React Testing Library tests covering AppContext, Header, TrackReport, AdminDashboard, ReportIncident, SatisfactionWidget (FT-001 – FT-016)
- [x] **Add E2E tests (Playwright)** — 15 test cases × 2 browser profiles = 30 runs; covers report, track, browse, admin login/update/delete, mobile viewport (ET-001 – ET-014)
- [x] **Set up GitHub Actions CI** — `.github/workflows/ci.yml` runs backend tests + coverage threshold + frontend tsc + Vitest on push to `dev` and PRs to `main`

### Features
- [x] **Add resident satisfaction voting system** — public low/medium/high vote on Túath Housing (`/api/satisfaction`); one vote per email, upserted so residents can change their vote; results shown as a public bar chart on the Home page, no emails exposed via `/api/satisfaction/summary`
- [x] **Add image compression before S3 upload** — `sharp` resizes photos to a max 1920px edge and re-encodes as JPEG (quality 80) in both `createIncident` and `addPhoto`, reducing storage/bandwidth cost for full-resolution phone photos
- [x] **Add a 404 page** — unknown routes previously fell through to React Router's default error screen; `NotFound.tsx` now renders a branded page via a catch-all route
- [x] **Add `sitemap.xml` and `robots.txt`** — lists the 6 public routes, disallows `/admin` and `/cw-admin`; hardcodes `charlemontwatch.ie` — **update if the registered domain differs**

### Code Quality & Accessibility
- [x] **Extract shared email regex** — the same regex was duplicated in `incidentController.js`, `satisfactionController.js`, and `SatisfactionVote.js`; now a single `EMAIL_REGEX` constant in `backend/utils/validators.js`
- [x] **Use Mongoose `timestamps: true` on `SatisfactionVote`** — replaces manual `createdAt`/`updatedAt` fields and the controller's manual `updatedAt` assignment on every upsert
- [x] **Add `aria-pressed` to satisfaction rating buttons** — selection state was previously conveyed by colour only

### Legal (GDPR — Ireland)
- [x] **Write a privacy policy** — `/privacy` page created covering data collected, usage, retention, GDPR rights, and contact
- [x] **Add a data retention policy** — included in privacy policy: reports 2yr, emails deleted with report, photos deleted with report, logs 90 days
- [x] **Add cookie/consent notice** — not required; no analytics or third-party tracking scripts in use

### Infrastructure
- [x] **Deploy backend** — live on Render (free tier), `https://charlemontwatch.onrender.com`
- [x] **Deploy frontend** — live on Vercel (Hobby/free tier), `https://charlemontwatch-frontend.vercel.app`
- [ ] **Set custom domain** and point DNS — `charlemontwatch.ie` purchased 2026-07-16, DNS still propagating; not yet pointed at either deployment
- [x] **Enforce HTTPS** — both Render and Vercel redirect HTTP → HTTPS by default

---

## Summary

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 Critical | 23 | 23 | 0 |
| 🟠 Important | 12 | 10 | 2 |
| 🟡 Nice to have | 21 | 20 | 1 |
| **Total** | **56** | **53** | **3** |

**Still open:** Resend sender domain verification — DNS records (SPF/DKIM/DMARC) are correctly in place at Register365, but can't verify until `charlemontwatch.ie` is delegated in the `.ie` registry (pending, no reply from Register365 support yet); production email flow testing (blocked on the above); custom domain DNS (same registry delegation blocker).
