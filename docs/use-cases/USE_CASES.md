# CharlemontWatch — Use Case Document

**Project:** CharlemontWatch Community Safety Platform
**Version:** 1.2
**Date:** 2026-07-16

---

## 1. System Boundary

CharlemontWatch is a community incident reporting web application for the Charlemont Street area of Dublin. The system allows residents to submit incident reports (with optional photos and an optional formal complaint to Túath Housing and/or Dublin City Council), track the progress of their own submissions, view approved incidents on a public feed, vote on their satisfaction with Túath Housing and leave moderated comments alongside the vote, share the vote, and send a general contact message for questions, feedback, or press enquiries outside the incident-report flow. A single admin user reviews submissions, moderates photo content, manages incident statuses, and maintains the integrity of the public board.

The system boundary includes:
- The React frontend (browser-based SPA)
- The Node.js/Express REST API (backend)
- MongoDB Atlas (data persistence)
- AWS S3 (photo storage)
- Resend (transactional email)

---

## 2. Actors

### Primary Actors

| Actor | Description |
|---|---|
| **Resident** | A member of the public. No account required, but must provide a valid email on every report to confirm residency. Can report incidents, attach photos, optionally escalate to a formal complaint (providing name and address), track their own submissions by shortId, vote on satisfaction with Túath Housing and/or leave a comment (email only), delete their own comment via an emailed link, share the vote, and send a general contact message. |
| **Admin** | An authenticated user with `role: admin`. Responsible for reviewing submissions, moderating photos, updating statuses, and deleting incidents. Only one admin account exists. |

### Secondary Actors

| Actor | Description |
|---|---|
| **Resend (Email Service)** | Sends transactional emails: submission confirmation, admin notification on new submission, status update emails when an incident progresses, formal complaint emails to Túath Housing / Dublin City Council, and Contact Us messages to the admin. |
| **Túath Housing / Dublin City Council** | Recipients of formal complaint emails when a resident opts to escalate a report (UC-16). Legally required to acknowledge and respond within statutory timeframes. |
| **AWS S3** | Stores uploaded photo files. Returns a permanent public URL for each uploaded image. |
| **MongoDB Atlas** | Persists all incident records, satisfaction votes, vote comments, user accounts, and photo metadata. |

---

## 3. Use Case List

| ID | Use Case | Primary Actor | Description |
|---|---|---|---|
| UC-01 | Report an Incident | Resident | Submit a new incident report with type, location, description, required email, optional photos, and an optional formal complaint escalation |
| UC-02 | Track a Report | Resident | Look up a specific incident by its shortId (e.g. `CW-A1B2C3`) or MongoDB ObjectId |
| UC-03 | View All Public Incidents | Resident | Browse the public feed of all approved (AWAITING_RESPONSE, NO_RESPONSE, IN_PROGRESS, RESOLVED) incidents |
| UC-04 | View Incident Details | Resident | View full details of a single incident including photos and status |
| UC-05 | Admin Login | Admin | Authenticate using email and password to access the admin dashboard |
| UC-06 | Review Pending Queue | Admin | View all incidents with status `PENDING_REVIEW` awaiting moderation |
| UC-07 | Approve Incident | Admin | Approve a pending incident, moving it to `AWAITING_RESPONSE` and publishing it publicly |
| UC-08 | Reject Incident | Admin | Reject a pending incident, setting status to `REJECTED` and hiding it from the public feed |
| UC-09 | Toggle Photo Approval | Admin | Individually approve or reject specific photos on a pending incident before approving the report |
| UC-10 | Update Incident Status | Admin | Change an approved incident's status between `AWAITING_RESPONSE`, `NO_RESPONSE`, `IN_PROGRESS`, and `RESOLVED` |
| UC-11 | Delete Incident | Admin | Permanently delete an incident from the system |
| UC-12 | Admin Logout | Admin | End the authenticated admin session and clear the JWT token |
| UC-13 | Receive Submission Confirmation | Resident | Receive an automated email confirming their report was received |
| UC-14 | Receive Status Update Email | Resident | Receive an automated email when their incident's status changes |
| UC-15 | Add Photo to Existing Incident | Admin | Upload an additional photo to an incident that has already been submitted |
| UC-16 | Send a Formal Complaint | Resident | Escalate an incident report to Túath Housing and/or Dublin City Council, triggering a legally-required official response |
| UC-17 | Submit a Satisfaction Vote and/or Comment | Resident | Rate satisfaction with Túath Housing as low/medium/high and/or leave a comment, from one form needing only an email; one vote per email, changeable at any time |
| UC-18 | View Satisfaction Results | Resident | View the public aggregate breakdown of satisfaction votes |
| UC-19 | Send a Contact Message | Resident | Send a general question, feedback, or press enquiry to the admin outside the incident-report flow |
| UC-20 | Delete Own Comment | Resident | Delete their own vote comment (pending or published) using the private link emailed when it was posted |
| UC-21 | Moderate Vote Comments | Admin | Approve pending vote comments so they appear publicly, or delete any comment |
| UC-22 | Share the Vote | Resident | Share `charlemontwatch.ie/vote` via the phone's share sheet, WhatsApp, Facebook, or a copied link, with a dedicated link preview |

---

## 4. Detailed Use Cases

---

### UC-01 — Report an Incident

**Actor:** Resident
**Goal:** Submit a new incident report to the CharlemontWatch system

**Preconditions:**
- The resident is on the CharlemontWatch website
- The backend API is reachable
- No login is required

**Main Flow:**
1. Resident navigates to `/report`
2. Resident selects an incident type from: Graffiti, Anti-Social Behaviour, Safety Hazard, Maintenance Issue
3. System displays type-specific fields based on the selection
4. Resident enters a location description
5. Resident enters a free-text description of the incident
6. Resident enters their email address (required — confirms residency and enables status updates)
7. Resident optionally attaches up to 10 photos
8. Resident optionally opts to send a formal complaint (UC-16) by selecting Túath Housing and/or Dublin City Council and providing their name and address
9. Resident submits the form
10. System uploads any attached photos to AWS S3, resizing and re-encoding each as JPEG before upload
11. System saves the incident to MongoDB with status `PENDING_REVIEW`
12. System sends a confirmation email to the resident
13. System sends a notification email to the admin
14. If a formal complaint was requested, system sends complaint email(s) to Túath Housing and/or Dublin City Council (UC-16)
15. System redirects the resident to `/success/CW-XXXXXX` with their unique shortId

**Alternative Flows:**

*A1 — No photos attached:*
- Step 7 and the photo-upload portion of step 10 are skipped; incident is saved with an empty photos array

*A2 — No formal complaint requested:*
- Step 8 and step 14 are skipped; the incident is reported anonymously (no name or address collected, only the required email)

*A3 — S3 upload fails for one or more photos:*
- Failed uploads are silently skipped; the incident is still saved with any successfully uploaded photos

**Postconditions:**
- A new incident record exists in MongoDB with status `PENDING_REVIEW`
- The incident is NOT visible on the public feed until admin approval
- The resident has a shortId they can use to track their submission
- If a complaint was requested, Túath Housing and/or Dublin City Council have received a formal complaint email

**Exceptions:**

| Condition | System Response |
|---|---|
| Required fields missing (type, location, description) | Form validation prevents submission; error shown inline |
| Missing or invalid email | Backend returns 400 "a valid email is required" |
| Complaint requested without name or address | Backend returns 400; complaint is not sent |
| API unreachable | Frontend shows a generic connection error message |
| More than 10 photos attached | Multer rejects the request; backend returns 400 |

---

### UC-05 — Admin Login

**Actor:** Admin
**Goal:** Authenticate and gain access to the admin dashboard

**Preconditions:**
- A user account with `role: admin` exists in MongoDB
- The backend API is reachable
- The admin knows their email and password

**Main Flow:**
1. Admin navigates directly to `/auth` (no link is visible to the public)
2. Admin enters their email address
3. Admin enters their password
4. Admin clicks Login
5. System sends credentials to `POST /api/auth/login`
6. Backend looks up the user by email
7. Backend verifies the password against the bcrypt hash
8. Backend checks that `user.role === 'admin'`
9. Backend generates a signed JWT (7-day expiry)
10. Frontend stores the JWT in `localStorage`
11. System redirects the admin to `/admin`

**Alternative Flows:**

*A1 — Incorrect password:*
- Step 7 fails; backend returns 401
- Frontend displays "Invalid credentials or insufficient permissions"
- No token is issued

*A2 — Email not found:*
- Step 6 returns no user; backend returns 401 with the same generic message (no enumeration of valid emails)

*A3 — Account exists but role is not admin:*
- Step 8 fails; backend returns 403
- Frontend displays the same generic error message

**Postconditions:**
- Admin holds a valid JWT stored in `localStorage`
- Admin is redirected to `/admin` and sees the full dashboard
- Header shows Dashboard and Sign Out buttons

**Exceptions:**

| Condition | System Response |
|---|---|
| API unreachable | `login()` catches the error and returns `false`; frontend shows error message |
| JWT_SECRET missing from env | Server throws on token signing; 500 returned |
| Token expires after 7 days | Subsequent authenticated requests return 401; admin must log in again |

---

### UC-07 — Approve Incident

**Actor:** Admin
**Goal:** Approve a pending incident submission so it becomes publicly visible

**Preconditions:**
- Admin is authenticated (valid JWT in localStorage)
- At least one incident exists with status `PENDING_REVIEW`
- Admin is on the Review Queue tab of `/admin`

**Main Flow:**
1. Admin opens the Review Queue tab
2. System fetches all `PENDING_REVIEW` incidents from `GET /api/incidents/admin/pending`
3. System displays each incident with type, location, description, reporter email, date, and photos
4. Admin optionally reviews and toggles individual photo approvals (UC-09)
5. Admin clicks Approve on an incident
6. System sends `PATCH /api/incidents/admin/:id/review` with `{ action: "approve" }`
7. Backend resolves the incident by shortId using `findByAnyId`
8. Backend sets `incident.status = 'AWAITING_RESPONSE'` and marks all photos as `approved: true`
9. Backend saves the updated incident
10. Frontend removes the incident from the pending queue
11. Frontend refreshes the public incidents list
12. Incident is now visible on the public feed with status `AWAITING_RESPONSE`

**Alternative Flows:**

*A1 — Admin rejects individual photos before approving:*
- Between steps 4 and 5, admin toggles specific photos to `approved: false` via UC-09
- On approval, only photos with `approved: true` are visible publicly (schema supports this; UI filtering can be added later)

*A2 — Admin clicks Reject instead (UC-08):*
- Step 6 sends `{ action: "reject" }`
- Backend sets `incident.status = 'REJECTED'`
- Incident is permanently hidden from the public feed

**Postconditions:**
- Incident status is `AWAITING_RESPONSE` in MongoDB
- Incident appears on the public feed at `/incidents`
- Incident no longer appears in the admin Review Queue
- All photos are marked `approved: true`

**Exceptions:**

| Condition | System Response |
|---|---|
| Incident was deleted between queue load and approval | Backend returns 404; frontend shows "Failed to approve incident. Please try again." |
| Network timeout during approval | Axios throws; frontend shows error message; incident status unchanged |
| Token expired | Backend returns 401; admin is redirected to login |

---

### UC-02 — Track a Report

**Actor:** Resident
**Goal:** Look up the current status of a previously submitted incident report

**Preconditions:**
- Resident has a shortId (e.g. `CW-A1B2C3`) from their submission confirmation
- The backend API is reachable

**Main Flow:**
1. Resident navigates to `/track`
2. Resident enters their shortId into the search field
3. Resident clicks Search (or presses Enter)
4. System normalises the input: shortIds are uppercased; 24-char hex ObjectIds are left as-is
5. System sends `GET /api/incidents/:id`
6. Backend performs a dual lookup: `findOne({ shortId })` first, then `findById` fallback
7. Backend returns the full incident record
8. Frontend displays: type, location, description, current status, date, photos, and type-specific data

**Alternative Flows:**

*A1 — Incident is still PENDING_REVIEW:*
- Backend returns the incident (public route allows reporters to track their own pending submission)
- Frontend displays status as "Pending Review" with the violet status badge

*A2 — Incident not found:*
- Backend returns 404
- Frontend displays "No incident found with that ID. Please check the reference and try again."

*A3 — Network or server error:*
- Axios returns a non-404 error
- Frontend displays "Something went wrong. Please check your connection and try again."

**Postconditions:**
- Resident can see the current status of their report
- No data is modified

**Exceptions:**

| Condition | System Response |
|---|---|
| Empty search field | Frontend prevents submission; no API call made |
| API unreachable | Non-404 error branch shown |

---

### UC-10 — Update Incident Status

**Actor:** Admin
**Goal:** Progress an approved incident through its lifecycle (AWAITING_RESPONSE → NO_RESPONSE / IN_PROGRESS → RESOLVED)

**Preconditions:**
- Admin is authenticated
- The incident has been approved and has a status of `AWAITING_RESPONSE`, `NO_RESPONSE`, `IN_PROGRESS`, or `RESOLVED`
- Admin is on the Manage Incidents tab of `/admin`

**Main Flow:**
1. Admin selects a status filter (Awaiting Response, No Response, In Progress, or Resolved)
2. System displays all incidents matching that status
3. Admin clicks "Update Status" on a specific incident
4. System opens a modal displaying the incident ID and a status dropdown
5. Admin selects the new status from the dropdown
6. Admin clicks "Update Status" to confirm
7. System sends `PATCH /api/incidents/admin/:id/status` with `{ status }`
8. Backend resolves the incident using `findByAnyId`
9. Backend validates the new status is within `ACTIVE_STATUSES`
10. Backend updates `incident.status` and `incident.updatedAt`, saves to MongoDB
11. Backend triggers a status update email to the reporter
12. Frontend updates the incident in local state
13. Modal closes; incident reflects the new status

**Alternative Flows:**

*A1 — Admin cancels the modal:*
- Admin clicks Cancel; modal closes with no changes made

*A2 — Admin selects the same status as current:*
- Request is still sent; backend saves with no effective change; no error

**Postconditions:**
- Incident status is updated in MongoDB
- Reporter receives a status update email
- The incident card in the UI reflects the new status badge immediately

**Exceptions:**

| Condition | System Response |
|---|---|
| Invalid status sent (e.g. `PENDING_REVIEW`) | Backend returns 400 "Invalid status"; frontend shows error banner |
| Incident not found | Backend returns 404; frontend shows "Failed to update status. Please try again." |
| Resend fails | Email error is swallowed silently; status is still updated successfully |

---

### UC-16 — Send a Formal Complaint

**Actor:** Resident
**Goal:** Escalate an incident report as a formal complaint to Túath Housing and/or Dublin City Council, triggering a legally-required official response

**Preconditions:**
- Resident is completing the Report an Incident form (UC-01)
- Resident has provided a valid email

**Main Flow:**
1. Resident ticks "Túath Housing" and/or "Dublin City Council" on the report form
2. System reveals the Name and Address fields
3. Resident enters their full name and address
4. Resident submits the report (UC-01)
5. Backend validates that name and address are present since a complaint was requested
6. Backend saves `complainantName`, `complainantAddress`, and `sendComplaintTo` on the incident
7. For each selected organisation, backend sends a formatted complaint email (via Resend) containing the complainant's details, the incident details, and the applicable complaints procedure reference, with `replyTo` set to the resident's email
8. The recipient organisation(s) receive the complaint at their configured complaint address

**Alternative Flows:**

*A1 — Only one organisation selected:*
- Only that organisation's complaint email is sent

*A2 — Name or address missing:*
- Backend returns 400 before the incident is saved; no complaint is sent

*A3 — Recipient address not configured on the server:*
- The affected send is skipped and logged server-side; the incident report itself still succeeds

**Postconditions:**
- Túath Housing and/or Dublin City Council have received a formal complaint email referencing the incident's shortId
- The complaint is legally required to be acknowledged within 5 working days (Túath) or 3 working days (Dublin City Council), with a full written response within 30 working days

**Exceptions:**

| Condition | System Response |
|---|---|
| Complaint requested without name | Backend returns 400 "name is required to send a formal complaint" |
| Complaint requested without address | Backend returns 400 "address is required to send a formal complaint" |
| Email send fails | Error is swallowed silently and logged; other sends in the same request still proceed |

---

### UC-17 — Submit a Satisfaction Vote and/or Comment

**Actor:** Resident
**Goal:** Publicly register (or change) a satisfaction rating for Túath Housing, leave a comment, or both

**Preconditions:**
- Resident is on the Home page vote card or the standalone `/vote` page
- No login required

**Main Flow:**
1. Resident optionally selects a rating: Low, Medium, or High (clicking the selected rating again clears it)
2. Resident optionally writes a comment (max 1000 characters); once they start typing, an optional "Name to show" field appears
3. Resident enters their email address (the only required field)
4. Resident clicks Submit
5. Frontend checks that an email is present and that at least a rating or a comment was given
6. If a rating was chosen, system sends `POST /api/satisfaction` with `{ email, rating }`; the backend upserts a `SatisfactionVote` keyed by the lowercased email
7. If a comment was written, system sends `POST /api/satisfaction/comments` with `{ email, text, name, website }`; the backend saves a `VoteComment` with status `pending` (blank name stored as "A resident"), emails the admin, and emails the commenter a private delete link (UC-20)
8. Steps 6 and 7 run in parallel and are reported independently
9. In the left column, a thank-you message replaces the share buttons, confirming exactly what was recorded, with the prompt "Now ask a neighbour to have their say" and share buttons (UC-22)

**Alternative Flows:**

*A1 — Resident has already voted with this email:*
- Step 6 overwrites the existing vote rather than creating a duplicate; the total vote count does not increase

*A2 — Only one of the two submissions succeeds:*
- The thank-you message confirms the part that succeeded and an error names the part that failed, so the resident doesn't resend both

*A3 — Concurrent vote submissions race on a brand-new email:*
- MongoDB's unique index on `email` may reject one of the two upserts; backend returns 409 and the resident is asked to try again

*A4 — Honeypot field filled (bot):*
- The comment endpoint returns success without saving or emailing anything

**Postconditions:**
- At most one `SatisfactionVote` exists per email, reflecting the latest rating
- Any comment is stored as `pending` and is not public until approved (UC-21)
- No email addresses are ever exposed publicly; only approved comment text, display name, and date are shown

**Exceptions:**

| Condition | System Response |
|---|---|
| No email entered | Frontend shows "Please enter your email." |
| Neither rating nor comment given | Frontend shows "Choose a rating, write a comment, or both." |
| Invalid email | Backend returns 400 "a valid email is required" |
| Invalid rating | Backend returns 400 "rating must be one of: low, medium, high" |
| Comment over 1000 characters / name over 50 | Backend returns 400 |
| More than 10 votes/minute or 5 comments/hour from the same IP | Rate limiter returns 429 |

---

### UC-19 — Send a Contact Message

**Actor:** Resident
**Goal:** Send a general question, feedback, or press enquiry to the admin, outside the incident-report flow

**Preconditions:**
- Resident is on the CharlemontWatch website
- The backend API is reachable
- No login is required

**Main Flow:**
1. Resident navigates to `/contact` (linked from the header)
2. Resident enters their name, email address, and a message (up to 5000 characters)
3. Resident submits the form
4. System sends `POST /api/contact` with `{ name, email, message }`
5. Backend validates that name, email, and message are all present, the email is a valid format, and the message does not exceed 5000 characters
6. Backend sends an email to the admin via Resend, with the subject prefixed `[Contact Form]`, the resident's name and email in the body, and `replyTo` set to the resident's email so the admin can reply directly
7. Frontend displays a "Message Sent" confirmation

**Alternative Flows:**

*A1 — Automated/bot submission:*
- A hidden honeypot field (`website`) is present in the form but invisible to real users
- If a bot fills it in, the backend returns 200 "success" without sending an email, so the bot cannot tell its submission was silently dropped

*A2 — Email send fails:*
- The error is swallowed silently and logged server-side; the frontend still shows a generic error state if the request itself fails, but a downstream Resend failure does not surface to the resident

**Postconditions:**
- The admin has received an email with the resident's message and can reply directly to their address
- No record of the message is persisted in MongoDB — this is a stateless, email-only flow

**Exceptions:**

| Condition | System Response |
|---|---|
| Missing or empty name | Backend returns 400 "name is required" |
| Missing or invalid email | Backend returns 400 "a valid email is required" |
| Missing or empty message | Backend returns 400 "message is required" |
| Message exceeds 5000 characters | Backend returns 400 "message must be 5000 characters or fewer" |
| API unreachable | Frontend shows a generic error message |

---

### UC-20 — Delete Own Comment

**Actor:** Resident
**Goal:** Remove a comment they posted, without an account

**Preconditions:**
- Resident posted a comment (UC-17) and received the "Your comment on the Túath Housing vote" email

**Main Flow:**
1. Resident clicks "Delete my comment" in the email, opening `/comment/delete?token=…`
2. System sends `POST /api/satisfaction/comments/mine` with `{ token }`; the backend hashes the token (SHA-256), finds the matching comment, and returns its name, text, status, and date
3. Page shows the comment and whether it is published or awaiting approval
4. Resident clicks "Delete my comment" (opening the link alone never deletes, so email link scanners can't trigger it)
5. System sends `POST /api/satisfaction/comments/mine/delete` with `{ token }`; backend deletes the comment
6. Page confirms "Your comment has been deleted."

**Postconditions:**
- The comment is permanently removed, whether it was pending or published

**Exceptions:**

| Condition | System Response |
|---|---|
| Missing, malformed, unknown, or already-used token | Backend returns 404; page says the link isn't valid or the comment has already been deleted |
| More than 30 lookups/deletes per 15 minutes from the same IP | Rate limiter returns 429 |

**Notes:** Only the SHA-256 hash of the token is stored, and the hash is never returned by any endpoint, including admin ones. Tokens are sent in the request body, not the URL path, so they don't appear in server request logs.

---

### UC-21 — Moderate Vote Comments

**Actor:** Admin
**Goal:** Decide which resident comments appear publicly under the vote

**Preconditions:**
- Admin is logged in (UC-05) and has been emailed that a new comment is waiting

**Main Flow:**
1. Admin opens the Admin Dashboard and selects the "Comments" tab
2. System sends `GET /api/satisfaction/comments/admin`; comments are listed with "Awaiting approval" first, then "Published", each showing name, email, date, and text
3. Admin clicks "Approve" on a pending comment; system sends `PATCH /api/satisfaction/comments/admin/:id/approve` and the comment moves to Published
4. Or admin clicks "Delete", then "Confirm delete"; system sends `DELETE /api/satisfaction/comments/admin/:id`

**Postconditions:**
- Approved comments appear (newest first, up to 50) under "What residents are saying" on the vote card, 6 at a time with a "Show more comments" button
- Deleted comments are removed permanently

**Exceptions:**

| Condition | System Response |
|---|---|
| Missing/invalid token or non-admin user | 401 / 403 |
| Unknown or malformed comment id | 404 "Comment not found" |

---

### UC-22 — Share the Vote

**Actor:** Resident
**Goal:** Invite neighbours to vote

**Main Flow:**
1. Resident uses the share controls on the vote card (or in the thank-you message after submitting)
2. On touch devices with the Web Share API, one "Share this vote" button opens the phone's share sheet
3. Elsewhere, WhatsApp (pre-filled message including the current vote count), Facebook, and "Copy link" buttons are shown
4. The shared link is always `https://charlemontwatch.ie/vote`, regardless of the address the site is running on

**Postconditions:**
- Link-preview crawlers requesting `/vote` receive a dedicated title, description, and 1200×630 vote card image (`og-vote.jpg`) from the Vercel middleware, with no backend call

---

## 5. Use Case Relationships

| Relationship | Type | Description |
|---|---|---|
| UC-07 includes UC-09 | `<<include>>` | Admin can toggle photo approval before approving an incident |
| UC-07 extends UC-08 | `<<extend>>` | Reject is an alternative action available at the same point as Approve |
| UC-01 includes UC-13 | `<<include>>` | Confirmation email is triggered as part of the report submission flow |
| UC-10 includes UC-14 | `<<include>>` | Status update email is triggered as part of updating an incident status |
| UC-01 extends UC-16 | `<<extend>>` | Formal complaint escalation is optional and triggered at report submission time |
| UC-17 extends UC-18 | `<<extend>>` | Submitting a vote refreshes the results shown by UC-18, but viewing results does not require voting first |
| UC-17 includes UC-20 (email) | `<<include>>` | Posting a comment triggers the email containing the private delete link used by UC-20 |
| UC-17 precedes UC-21 | Precondition | A comment must be submitted before it can be approved or deleted by the admin |
| UC-17 extends UC-22 | `<<extend>>` | After submitting, the thank-you message prompts the resident to share the vote |
| UC-05 precedes UC-06, UC-07, UC-08, UC-09, UC-10, UC-11, UC-21 | Precondition | Admin must be logged in to perform any admin action |
