# CharlemontWatch — Use Case Document

**Project:** CharlemontWatch Community Safety Platform
**Version:** 1.0
**Date:** 2026-05-28

---

## 1. System Boundary

CharlemontWatch is a community incident reporting web application for the Charlemont Street area of Dublin. The system allows residents to anonymously submit incident reports (with optional photos), track the progress of their own submissions, and view approved incidents on a public feed. A single admin user reviews submissions, moderates photo content, manages incident statuses, and maintains the integrity of the public board.

The system boundary includes:
- The React frontend (browser-based SPA)
- The Node.js/Express REST API (backend)
- MongoDB Atlas (data persistence)
- AWS S3 (photo storage)
- SendGrid (transactional email)

---

## 2. Actors

### Primary Actors

| Actor | Description |
|---|---|
| **Resident** | An anonymous member of the public. No account required. Can report incidents, attach photos, and track their own submissions by shortId. |
| **Admin** | An authenticated user with `role: admin`. Responsible for reviewing submissions, moderating photos, updating statuses, and deleting incidents. Only one admin account exists. |

### Secondary Actors

| Actor | Description |
|---|---|
| **SendGrid (Email Service)** | Sends transactional emails: submission confirmation to the resident (if email provided), admin notification on new submission, and status update emails when an incident progresses. |
| **AWS S3** | Stores uploaded photo files. Returns a permanent public URL for each uploaded image. |
| **MongoDB Atlas** | Persists all incident records, user accounts, and photo metadata. |

---

## 3. Use Case List

| ID | Use Case | Primary Actor | Description |
|---|---|---|---|
| UC-01 | Report an Incident | Resident | Submit a new incident report with type, location, description, optional photos, and optional email |
| UC-02 | Track a Report | Resident | Look up a specific incident by its shortId (e.g. `CW-A1B2C3`) or MongoDB ObjectId |
| UC-03 | View All Public Incidents | Resident | Browse the public feed of all approved (NEW, IN_PROGRESS, RESOLVED) incidents |
| UC-04 | View Incident Details | Resident | View full details of a single incident including photos and status |
| UC-05 | Admin Login | Admin | Authenticate using email and password to access the admin dashboard |
| UC-06 | Review Pending Queue | Admin | View all incidents with status `PENDING_REVIEW` awaiting moderation |
| UC-07 | Approve Incident | Admin | Approve a pending incident, moving it to `NEW` and publishing it publicly |
| UC-08 | Reject Incident | Admin | Reject a pending incident, setting status to `REJECTED` and hiding it from the public feed |
| UC-09 | Toggle Photo Approval | Admin | Individually approve or reject specific photos on a pending incident before approving the report |
| UC-10 | Update Incident Status | Admin | Change an approved incident's status between `NEW`, `IN_PROGRESS`, and `RESOLVED` |
| UC-11 | Delete Incident | Admin | Permanently delete an incident from the system |
| UC-12 | Admin Logout | Admin | End the authenticated admin session and clear the JWT token |
| UC-13 | Receive Submission Confirmation | Resident | Receive an automated email confirming their report was received (if email was provided) |
| UC-14 | Receive Status Update Email | Resident | Receive an automated email when their incident's status changes (if email was provided) |
| UC-15 | Add Photo to Existing Incident | Admin | Upload an additional photo to an incident that has already been submitted |

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
6. Resident optionally enters their email address for updates
7. Resident optionally attaches up to 10 photos
8. Resident submits the form
9. System uploads any attached photos to AWS S3
10. System saves the incident to MongoDB with status `PENDING_REVIEW`
11. System sends a confirmation email to the resident (if email was provided)
12. System sends a notification email to the admin
13. System redirects the resident to `/success/CW-XXXXXX` with their unique shortId

**Alternative Flows:**

*A1 — No photos attached:*
- Steps 7 and 9 are skipped; incident is saved with an empty photos array

*A2 — No email provided:*
- Step 11 is skipped; confirmation and status update emails will not be sent

*A3 — S3 upload fails for one or more photos:*
- Failed uploads are silently skipped; the incident is still saved with any successfully uploaded photos

**Postconditions:**
- A new incident record exists in MongoDB with status `PENDING_REVIEW`
- The incident is NOT visible on the public feed until admin approval
- The resident has a shortId they can use to track their submission

**Exceptions:**

| Condition | System Response |
|---|---|
| Required fields missing (type, location, description) | Form validation prevents submission; error shown inline |
| API unreachable | Frontend shows a generic connection error message |
| More than 10 photos attached | Only the first 10 are processed; remainder silently dropped |

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
8. Backend sets `incident.status = 'NEW'` and marks all photos as `approved: true`
9. Backend saves the updated incident
10. Frontend removes the incident from the pending queue
11. Frontend refreshes the public incidents list
12. Incident is now visible on the public feed with status `NEW`

**Alternative Flows:**

*A1 — Admin rejects individual photos before approving:*
- Between steps 4 and 5, admin toggles specific photos to `approved: false` via UC-09
- On approval, only photos with `approved: true` are visible publicly (schema supports this; UI filtering can be added later)

*A2 — Admin clicks Reject instead (UC-08):*
- Step 6 sends `{ action: "reject" }`
- Backend sets `incident.status = 'REJECTED'`
- Incident is permanently hidden from the public feed

**Postconditions:**
- Incident status is `NEW` in MongoDB
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
- Frontend displays status as "Pending Review" with the purple badge

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
**Goal:** Progress an approved incident through its lifecycle (NEW → IN_PROGRESS → RESOLVED)

**Preconditions:**
- Admin is authenticated
- The incident has been approved and has a status of `NEW`, `IN_PROGRESS`, or `RESOLVED`
- Admin is on the Manage Incidents tab of `/admin`

**Main Flow:**
1. Admin selects a status filter tab (NEW, IN_PROGRESS, or RESOLVED)
2. System displays all incidents matching that status
3. Admin clicks "Update Status" on a specific incident
4. System opens a modal displaying the incident ID and a status dropdown
5. Admin selects the new status from the dropdown
6. Admin clicks "Update Status" to confirm
7. System sends `PATCH /api/incidents/admin/:id/status` with `{ status }`
8. Backend resolves the incident using `findByAnyId`
9. Backend validates the new status is within `ACTIVE_STATUSES`
10. Backend updates `incident.status` and `incident.updatedAt`, saves to MongoDB
11. Backend triggers a status update email to the reporter (if email was provided)
12. Frontend updates the incident in local state
13. Modal closes; incident reflects the new status

**Alternative Flows:**

*A1 — Admin cancels the modal:*
- Admin clicks Cancel; modal closes with no changes made

*A2 — Admin selects the same status as current:*
- Request is still sent; backend saves with no effective change; no error

**Postconditions:**
- Incident status is updated in MongoDB
- Reporter receives a status update email (if email was on record)
- The incident card in the UI reflects the new status badge immediately

**Exceptions:**

| Condition | System Response |
|---|---|
| Invalid status sent (e.g. `PENDING_REVIEW`) | Backend returns 400 "Invalid status"; frontend shows error banner |
| Incident not found | Backend returns 404; frontend shows "Failed to update status. Please try again." |
| SendGrid fails | Email error is swallowed silently; status is still updated successfully |

---

## 5. Use Case Relationships

| Relationship | Type | Description |
|---|---|---|
| UC-07 includes UC-09 | `<<include>>` | Admin can toggle photo approval before approving an incident |
| UC-07 extends UC-08 | `<<extend>>` | Reject is an alternative action available at the same point as Approve |
| UC-01 includes UC-13 | `<<include>>` | Confirmation email is triggered as part of the report submission flow |
| UC-10 includes UC-14 | `<<include>>` | Status update email is triggered as part of updating an incident status |
| UC-05 precedes UC-06, UC-07, UC-08, UC-09, UC-10, UC-11 | Precondition | Admin must be logged in to perform any admin action |
