# CharlemontWatch

**Community-led incident reporting and tracking for Charlemont Street, Dublin.**

CharlemontWatch lets residents document safety, maintenance, and quality-of-life issues with photo evidence, track them through to resolution, and when a report alone isn't enough, send a formal complaint directly to Túath Housing and/or Dublin City Council on their own behalf.

[![CI](https://github.com/DublinNico/CharlemontWatch/actions/workflows/ci.yml/badge.svg)](https://github.com/DublinNico/CharlemontWatch/actions/workflows/ci.yml)

**Live:** [charlemontwatch.ie](https://charlemontwatch.ie) — frontend on Vercel, backend API on Render (`charlemontwatch.onrender.com`)

![CharlemontWatch home page](docs/images/home.png)

---

## Features

- **Report an incident** — Graffiti, Anti-Social Behaviour, Safety Hazards, and Maintenance Issues, each with type-specific detail fields
- **Photo evidence** — up to 10 photos per report, validated by real file content (not just declared MIME type) and automatically compressed before storage
- **Formal complaints** — optionally escalate a report directly to Túath Housing and/or Dublin City Council, with a formatted complaint email sent on the resident's behalf
- **Complaint-sent confirmation** — the admin dashboard shows a live "Sent" badge per recipient once Resend confirms a complaint email actually delivered, rather than assuming the fire-and-forget send after approval worked
- **Bot protection** — Cloudflare Turnstile CAPTCHA (verified server-side) plus per-IP rate limiting on report submissions, with the token generated on demand at submit time so a long-filled-out report doesn't submit a stale token
- **Track by ID** — every report gets a unique `CW-XXXXXX` reference for status lookups, no account required; the tracking view shows how many working days each formal complaint has been waiting and flags overdue responses
- **Satisfaction voting and comments** — residents can publicly rate their satisfaction with Túath Housing (low/medium/high) and/or leave a comment from one form that needs only an email; one vote per email, changeable at any time. Comments are held for admin approval (new Comments tab in the dashboard, plus an email alert), and each commenter is emailed a private link to delete their own comment later
- **Shareable vote** — a standalone `/vote` page with share buttons (phone share sheet, WhatsApp, Facebook, copy link) and a "share with a neighbour" prompt after voting
- **Link previews** — shared report links (`/track?id=…`) and `/vote` get their own title, description and image on Facebook, WhatsApp and similar, via Vercel middleware; report photos declare their size so the image shows on the first share
- **Admin dashboard** — JWT-authenticated review queue, photo moderation, and status updates (Awaiting Response, No Response, In Progress, Resolved)
- **Contact Us** — spam-protected general enquiry form for questions, feedback, or press, separate from the incident-report flow
- **Safety guidance** — clear notices pointing residents to An Garda Síochána directly for emergencies or serious anti-social behaviour, since this platform isn't monitored in real time
- **Privacy by design** — GDPR-compliant privacy policy, no analytics or third-party tracking, defined data retention periods
- **Responsive design** — works from phones up to large monitors, with a mobile menu and a page width that grows on wide screens

## Screenshots

| Report an Incident | All Incidents |
|---|---|
| ![Report an Incident form](docs/images/report-incident.png) | ![All Incidents browse page](docs/images/all-incidents.png) |

| About |
|---|
| ![About page](docs/images/about.png) |

## Tech Stack

- **Frontend** — React + Vite + TypeScript, React Router, Tailwind CSS v4 (theme tokens in `frontend/src/styles/theme.css`), shadcn/ui (Radix UI primitives), self-hosted Geist and Geist Mono fonts, Axios, Lucide icons, Leaflet + OpenStreetMap (site footer location map)

- **Backend** — Node.js + Express, MongoDB + Mongoose, JWT auth (bcryptjs), Multer + Sharp (photo upload + compression), AWS S3 (photo storage), Resend (email), Sentry (error monitoring), Helmet + express-rate-limit + express-mongo-sanitize + Cloudflare Turnstile (security hardening)

- **Deployment** — Vercel (frontend), Render (backend API), UptimeRobot + a redundant GitHub Actions keep-alive ping (uptime monitoring + cold-start prevention)

- **Testing** — Jest + Supertest (backend), Vitest + React Testing Library (frontend), Playwright (E2E), Artillery (load testing) — 277 automated tests (218 backend + 44 frontend + 15 E2E) across unit, integration, security, and E2E suites

- **CI/CD** — GitHub Actions runs the full backend and frontend suites, a frontend type check, Playwright E2E, and `npm audit` dependency checks (backend production dependencies at high severity, frontend at critical) on every push to `dev` and PR to `main`, plus a daily encrypted `mongodump` backup workflow (GPG-encrypted before upload since the repo is public)

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or [Atlas](https://www.mongodb.com/atlas))
- An AWS S3 bucket (for photo uploads)
- A [Resend](https://resend.com) account (for transactional email)

### 1. Clone and install

```bash
git clone https://github.com/DublinNico/CharlemontWatch.git
cd CharlemontWatch
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy the example files and fill in your own values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See `backend/.env.example` and `frontend/.env.example` for the full list of variables (MongoDB URI, JWT secret, AWS S3 credentials, Resend API key, admin key, etc.).

### 3. Run the app

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm start
```

Visit `http://localhost:5173`.

## Testing

```bash
# Backend — unit, integration, and security tests + coverage
cd backend && npm test

# Frontend — unit tests
cd frontend && npm test

# Frontend — end-to-end tests (Playwright)
# The admin login specs expect VITE_ADMIN_KEY=charlemont2026, as set in CI
cd frontend && npm run test:e2e
```

## Documentation

- [`docs/testing/TestingReport.md`](docs/testing/TestingReport.md) — full test plan, coverage, and execution results
- [`docs/use-cases/`](docs/use-cases) — use case documentation
- [`docs/bugs/`](docs/bugs) — resolved bug write-ups
