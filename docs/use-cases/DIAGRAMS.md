# CharlemontWatch — System Diagrams

All diagrams use [Mermaid](https://mermaid.js.org/) and render natively on GitHub.

---

## 1. Use Case Diagram

```mermaid
graph LR
    Resident(["👤 Resident\n(Anonymous)"])
    Admin(["🔐 Admin"])

    subgraph CharlemontWatch System
        subgraph Public
            UC01["UC-01\nReport an Incident"]
            UC02["UC-02\nTrack a Report"]
            UC03["UC-03\nView All Incidents"]
            UC04["UC-04\nView Incident Details"]
        end

        subgraph Admin Only
            UC05["UC-05\nAdmin Login"]
            UC06["UC-06\nReview Pending Queue"]
            UC07["UC-07\nApprove Incident"]
            UC08["UC-08\nReject Incident"]
            UC09["UC-09\nToggle Photo Approval"]
            UC10["UC-10\nUpdate Incident Status"]
            UC11["UC-11\nDelete Incident"]
            UC12["UC-12\nAdmin Logout"]
        end

        subgraph Automated
            UC13["UC-13\nSend Confirmation Email"]
            UC14["UC-14\nSend Status Update Email"]
        end
    end

    Resident --> UC01
    Resident --> UC02
    Resident --> UC03
    UC03 --> UC04

    Admin --> UC05
    Admin --> UC06
    Admin --> UC07
    Admin --> UC08
    Admin --> UC09
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12

    UC01 -.->|triggers| UC13
    UC10 -.->|triggers| UC14
    UC07 -.->|includes| UC09
```

---

## 2. Incident Lifecycle — State Diagram

```mermaid
stateDiagram-v2
    direction LR
    [*] --> PENDING_REVIEW : Resident submits report

    PENDING_REVIEW --> NEW : Admin approves
    PENDING_REVIEW --> REJECTED : Admin rejects

    NEW --> IN_PROGRESS : Admin updates status
    IN_PROGRESS --> RESOLVED : Admin updates status
    IN_PROGRESS --> NEW : Admin rolls back
    RESOLVED --> IN_PROGRESS : Admin re-opens

    REJECTED --> [*]
    RESOLVED --> [*]

    note right of PENDING_REVIEW
        Hidden from public feed.
        Visible to reporter via Track.
    end note

    note right of REJECTED
        Hidden from public feed.
        Permanent.
    end note
```

---

## 3. Sequence Diagram — Report an Incident (UC-01)

```mermaid
sequenceDiagram
    actor Resident
    participant Frontend
    participant Backend
    participant S3
    participant MongoDB
    participant SendGrid

    Resident->>Frontend: Fill form (type, location, description, email?)
    Resident->>Frontend: Attach photos (optional)
    Frontend->>Backend: POST /api/incidents/report (multipart/form-data)

    alt Photos attached
        loop For each photo (max 10)
            Backend->>S3: Upload file buffer
            S3-->>Backend: Public photo URL
        end
    end

    Backend->>MongoDB: Save incident (status: PENDING_REVIEW)
    MongoDB-->>Backend: Incident saved with shortId

    opt Reporter email provided
        Backend--)SendGrid: Send confirmation email
    end
    Backend--)SendGrid: Send admin notification email

    Backend-->>Frontend: { incidentId: "CW-XXXXXX" }
    Frontend->>Resident: Redirect to /success/CW-XXXXXX
```

---

## 4. Sequence Diagram — Admin Review Flow (UC-05, UC-06, UC-07, UC-08, UC-09)

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant Backend
    participant MongoDB
    participant SendGrid

    Admin->>Frontend: Navigate to /auth
    Frontend->>Backend: POST /api/auth/login { email, password }
    Backend->>MongoDB: Find user, verify password, check role=admin
    MongoDB-->>Backend: User record
    Backend-->>Frontend: JWT token
    Frontend->>Frontend: Store token in localStorage
    Frontend->>Admin: Redirect to /admin

    Admin->>Frontend: Open Review Queue tab
    Frontend->>Backend: GET /api/incidents/admin/pending (Bearer token)
    Backend->>MongoDB: Find { status: PENDING_REVIEW }
    MongoDB-->>Backend: Pending incidents
    Backend-->>Frontend: Incident list
    Frontend->>Admin: Display pending incidents

    opt Toggle individual photo
        Admin->>Frontend: Click photo approve/reject toggle
        Frontend->>Backend: PATCH /api/incidents/admin/:id/photos/:photoId/review
        Backend->>MongoDB: Update photo.approved
        Backend-->>Frontend: Updated incident
        Frontend->>Admin: Photo border updates (green/red)
    end

    alt Approve
        Admin->>Frontend: Click Approve
        Frontend->>Backend: PATCH /api/incidents/admin/:id/review { action: "approve" }
        Backend->>MongoDB: status = NEW, all photos approved = true
        MongoDB-->>Backend: Saved
        Backend-->>Frontend: Success
        Frontend->>Frontend: Remove from queue, refresh public feed
        Frontend->>Admin: Incident disappears from queue
    else Reject
        Admin->>Frontend: Click Reject
        Frontend->>Backend: PATCH /api/incidents/admin/:id/review { action: "reject" }
        Backend->>MongoDB: status = REJECTED
        MongoDB-->>Backend: Saved
        Backend-->>Frontend: Success
        Frontend->>Admin: Incident disappears from queue
    end
```

---

## 5. Sequence Diagram — Track a Report (UC-02)

```mermaid
sequenceDiagram
    actor Resident
    participant Frontend
    participant Backend
    participant MongoDB

    Resident->>Frontend: Navigate to /track
    Resident->>Frontend: Enter shortId (e.g. CW-A1B2C3)
    Frontend->>Frontend: Normalise input (uppercase if shortId, preserve case if ObjectId)
    Frontend->>Backend: GET /api/incidents/CW-A1B2C3

    Backend->>MongoDB: findOne({ shortId: "CW-A1B2C3" })

    alt Found by shortId
        MongoDB-->>Backend: Incident record
    else Not found by shortId
        Backend->>MongoDB: findById("CW-A1B2C3")
        MongoDB-->>Backend: null (invalid ObjectId format)
    end

    alt Incident found
        Backend-->>Frontend: Incident data
        Frontend->>Resident: Display type, location, status, photos, date
    else Not found (404)
        Backend-->>Frontend: { error: "Incident not found" }
        Frontend->>Resident: "No incident found with that ID"
    else Server/network error
        Backend-->>Frontend: 5xx or timeout
        Frontend->>Resident: "Something went wrong. Please check your connection"
    end
```

---

## 6. Sequence Diagram — Update Incident Status (UC-10)

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant Backend
    participant MongoDB
    participant SendGrid

    Admin->>Frontend: Open Manage Incidents tab
    Admin->>Frontend: Select status filter (NEW / IN_PROGRESS / RESOLVED)
    Frontend->>Admin: Display filtered incidents

    Admin->>Frontend: Click "Update Status" on an incident
    Frontend->>Admin: Open status modal

    Admin->>Frontend: Select new status from dropdown
    Admin->>Frontend: Click Confirm

    Frontend->>Backend: PATCH /api/incidents/admin/:id/status { status }
    Backend->>MongoDB: findByAnyId(id)
    MongoDB-->>Backend: Incident record
    Backend->>MongoDB: incident.status = newStatus, save
    MongoDB-->>Backend: Saved

    opt Reporter email on record
        Backend--)SendGrid: Send status update email
    end

    Backend-->>Frontend: { success: true, incident }
    Frontend->>Frontend: Update incident in local state
    Frontend->>Admin: Modal closes, badge updates
```

---

## 7. System Context Diagram

```mermaid
graph TB
    Resident(["👤 Resident\n(Anonymous)"])
    Admin(["🔐 Admin"])

    subgraph CharlemontWatch Platform
        FE["React Frontend\nVite + TypeScript\nTailwind CSS"]
        BE["Node.js Backend\nExpress REST API"]
    end

    subgraph External Services
        DB[("MongoDB Atlas\nCloud Database")]
        S3["AWS S3\neu-north-1\nPhoto Storage"]
        SG["SendGrid\nTransactional Email"]
    end

    Resident -- "HTTP (browser)" --> FE
    Admin -- "HTTP (browser)" --> FE
    FE -- "REST API calls\nlocalhost:5000" --> BE
    BE -- "Mongoose ODM" --> DB
    BE -- "AWS SDK" --> S3
    BE -- "SMTP / API" --> SG
```
