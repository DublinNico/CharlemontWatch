# CharlemontWatch — Pre-Launch Checklist

---

## 🔴 Critical — Must fix before going live

### Security
- [ ] **Replace JWT_SECRET** — current value in `.env` is a weak placeholder; generate a strong 256-bit random secret for production
- [ ] **Restrict CORS to production domain** — `server.js` currently allows all `localhost:*` origins; must be changed to the actual deployed frontend URL
- [x] **Add rate limiting** — `express-rate-limit` added to `/api/auth/login` (10 req/min per IP, skipped in test env); ST-005 confirms 429 after threshold
- [ ] **Enable HTTPS** — without it, admin credentials travel in plaintext; use a host that provides TLS (Vercel, Render, Railway all do this for free)
- [ ] **Add `helmet`** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.); one-line install on the Express app
- [x] **Add NoSQL injection protection** — `express-mongo-sanitize` added to `app.js`; ST-003 confirms operator payloads are rejected before reaching the DB
- [x] **Add email format validation** to the Incident schema (`reporterEmail`) — regex validator added; `"notanemail"` now rejected (UT-033)
- [x] **Add magic-byte MIME verification** on uploads — `validateMagicBytes` middleware checks actual file buffer bytes; PDF-disguised-as-JPEG now rejected (UT-041)

### Environment & Config
- [ ] **Replace all hardcoded `localhost:5000`** in the frontend — `AppContext.tsx:4` and `TrackReport.tsx:10` both hardcode the local API URL; move to `import.meta.env.VITE_API_URL`
- [ ] **Create `frontend/.env.production`** with `VITE_API_URL=https://your-api-domain.com/api`
- [ ] **Set `NODE_ENV=production`** on the backend server
- [ ] **Update `FRONTEND_URL`** in backend `.env` to the live domain — currently `localhost:3000`; used in email tracking links

### Database
- [ ] **Backfill `shortId` on 8 legacy incidents** — 8 of 9 incidents in MongoDB have no `shortId`; run migration script to generate and persist them

---

## 🟠 Important — Should fix before going live

### Backend
- [x] **Don't expose raw error messages in production** — `err.message` replaced with `'Internal Server Error'` in global error handler; `createIncident` now returns 400 for `ValidationError` and generic 500 for all other errors (BUG-015, BUG-016)
- [ ] **Add request logging** — `morgan` middleware to log every request; essential for debugging production issues
- [ ] **Add MongoDB indexes** — `incidentType`, `status`, and `reportedDate` should be indexed for query performance as data grows
- [x] **Explicit 400 when >10 photos submitted on create** — `MulterError` handler added to Express app; now returns 400 consistently (IT-005)

### Frontend
- [ ] **Test production build** — run `npm run build` in `/frontend` and verify output has no errors or missing assets
- [ ] **Add an error boundary** — if the API is unreachable the app shows a blank screen; a React error boundary should show a friendly fallback message
- [ ] **Fix email tracking link in `emailService.js`** — `sendResidentConfirmation` still uses the old hash-based `/#track` path; should be the React Router path `/track`

### Email
- [ ] **Verify SendGrid sender domain** — `reports@charlemontwatch.ie` must have SPF/DKIM DNS records set up or emails will go to spam
- [ ] **Test all three email flows in production** — resident confirmation, admin notification, status update

---

## 🟡 Nice to have — Before or shortly after launch

### Monitoring & Ops
- [ ] **Set up error monitoring** — Sentry (or similar) to catch unhandled exceptions and API errors in production
- [ ] **Set up uptime monitoring** — Freshping or UptimeRobot to alert if the backend goes down
- [ ] **Enable MongoDB Atlas automated backups** — set a daily backup schedule on the Atlas cluster

### Testing
- [x] **Add Supertest integration tests** — 21 integration tests covering all incident and auth routes (IT-001 – IT-021)
- [x] **Add frontend unit tests** — 25 Vitest + React Testing Library tests covering AppContext, Header, TrackReport, AdminDashboard, ReportIncident (FT-001 – FT-014)
- [x] **Add E2E tests (Playwright)** — 15 test cases × 2 browser profiles = 30 runs; covers report, track, browse, admin login/update/delete, mobile viewport (ET-001 – ET-014)
- [x] **Set up GitHub Actions CI** — `.github/workflows/ci.yml` runs backend tests + coverage threshold + frontend tsc + Vitest on push to `dev` and PRs to `main`

### Legal (GDPR — Ireland)
- [ ] **Write a privacy policy** — the app collects reporter emails and incident descriptions; GDPR requires a published policy
- [ ] **Add a data retention policy** — define how long incident data and emails are stored
- [ ] **Add cookie/consent notice** if any analytics or third-party scripts are added

### Infrastructure
- [ ] **Deploy backend** — Railway, Render, or Fly.io recommended for Node/Express
- [ ] **Deploy frontend** — Vercel or Netlify (automatic from GitHub)
- [ ] **Set custom domain** and point DNS
- [ ] **Enforce HTTPS** — ensure the deployment platform redirects HTTP → HTTPS

---

## Summary

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 Critical | 12 | 4 | 8 |
| 🟠 Important | 8 | 3 | 5 |
| 🟡 Nice to have | 13 | 4 | 9 |
| **Total** | **33** | **11** | **22** |
