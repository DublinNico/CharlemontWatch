# CharlemontWatch — Pre-Launch Checklist

---

## 🔴 Critical — Must fix before going live

### Security
- [ ] **Replace JWT_SECRET** — current value in `.env` is a weak placeholder; generate a strong 256-bit random secret for production
- [ ] **Restrict CORS to production domain** — `server.js` currently allows all `localhost:*` origins; must be changed to the actual deployed frontend URL
- [ ] **Add rate limiting** — no protection against brute-force on `/api/auth/login` or flood on `/api/incidents/report`; add `express-rate-limit` (admin login has no public link but the `/auth` URL is guessable)
- [ ] **Enable HTTPS** — without it, admin credentials travel in plaintext; use a host that provides TLS (Vercel, Render, Railway all do this for free)
- [ ] **Add `helmet`** — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.); one-line install on the Express app
- [ ] **Add NoSQL injection protection** — `express-mongo-sanitize` strips `$` operators from request bodies; prevents MongoDB operator injection attacks
- [ ] **Add email format validation** to the Incident schema (`reporterEmail`) — identified gap in testing (TC-BB-EP-002)
- [ ] **Add magic-byte MIME verification** on uploads — current check trusts client-declared Content-Type; a PDF can masquerade as JPEG (TC-BB-BVA-002 gap)

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
- [ ] **Don't expose raw error messages in production** — `res.status(500).json({ error: error.message })` leaks stack details; replace with a generic message when `NODE_ENV === 'production'`
- [ ] **Add request logging** — `morgan` middleware to log every request; essential for debugging production issues
- [ ] **Add MongoDB indexes** — `incidentType`, `status`, and `reportedDate` should be indexed for query performance as data grows
- [ ] **Explicit 400 when >10 photos submitted on create** — currently silently truncates to 10; should match the explicit error behaviour of the `addPhoto` endpoint

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
- [ ] **Add Supertest integration tests** — cover the full API request/response cycle including Multer, auth, and DB
- [ ] **Add E2E tests (Playwright)** — automate: submit report → receive ID → track → admin resolves
- [ ] **Set up GitHub Actions CI** — run `npm test` automatically on every push to `dev` and every PR to `main`

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

| Priority | Items |
|----------|-------|
| 🔴 Critical | 12 |
| 🟠 Important | 8 |
| 🟡 Nice to have | 12 |
| **Total** | **32** |
