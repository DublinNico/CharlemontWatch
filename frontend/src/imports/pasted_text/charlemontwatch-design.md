 App Description

  CharlemontWatch is a community-led incident reporting and tracking web app for residents of
  Charlemont Street, Dublin. It lets residents document safety, maintenance, and quality-of-life
  issues — graffiti, anti-social behaviour, hazards, and building maintenance — and publicly track
  resolution progress. The goal is to build an evidence base that holds Tuath Housing and Dublin City
   Council accountable.

  Users: Residents (reporters/viewers) and Housing Admin staff.
  Tech: React SPA, hash-based routing, mobile-responsive.
  Brand tone: Civic, trustworthy, community-driven.

  ---
  Figma Design Prompts

  Design System / Style Guide Frame

  Design a style guide for CharlemontWatch, a civic community reporting app.

  Brand: Shield/eye logo, name "CharlemontWatch", tagline "Keeping Charlemont Safe, Together"

  Colors:
  - Primary: #1976d2 (blue), hover #1565c0
  - Accent: #42a5f5 (light blue, used in header gradients)
  - Status New: #1976d2 on #e3f2fd
  - Status In Progress: #f57c00 on #fff3e0
  - Status Resolved: #388e3c on #e8f5e9
  - Incident type Graffiti: #f57c00
  - Incident type Anti-Social: #d32f2f
  - Incident type Safety Hazard: #fbc02d
  - Incident type Maintenance: #388e3c
  - Background: #f5f5f5, Surface: #ffffff
  - Text: #333333 / #666666, Border: #eeeeee

  Typography: System font stack (Segoe UI / Roboto / sans-serif)
  - H1 28–32px bold, Body 14px, Small 12px

  Components to include: primary/secondary/danger buttons, input fields with focus state,
  status badge pills (NEW / IN PROGRESS / RESOLVED), incident-type cards with left color border,
  card container with shadow, error and success alert banners, photo thumbnail grid.

  ---
  Screen 1 — Home Page

  Design the Home page for CharlemontWatch, a community incident reporting app for Dublin.

  Layout: Full-width header gradient (#1976d2 → #42a5f5) with white CW shield logo,
  "CharlemontWatch" wordmark, tagline "Keeping Charlemont Safe, Together".
  Logout button top-right (shown when authenticated).

  Below header, a stats card with 4 boxes in a row:
  - Total Reports (blue), New (blue), In Progress (orange), Resolved (green)
  Each box has a large bold number and label underneath.

  Then a 2×3 responsive card grid (min 280px per card). Cards:
  1. Shield icon — "Report an Incident" — "Submit a new safety or maintenance issue" — blue "Report
  Now" button
  2. Magnifier icon — "Track Your Report" — "Check the status of your submission" — blue "Track"
  button
  3. List icon — "View All Incidents" — "Browse all community reports" — blue "View All" button
  4. Info icon — "About" — "Learn how this platform works" — outline "Learn More" button
  5. Lock icon — "Admin Dashboard" (only if logged in) — blue button
  6. Person icon — "Login / Register" (only if not logged in) — outline button

  Background: #f5f5f5. Cards: white, 4px border radius, soft box shadow.
  Mobile: single column stack.

  ---
  Screen 2 — Report an Incident (Form)

  Design the Report an Incident page for a civic web app.

  Header bar: white background, left arrow "← Back to Home", centered title "Report an Incident",
  subtitle "Help keep Charlemont safe".

  Main form card (white, max-width 700px, centered):
  Fields in vertical stack with 15px gaps:
  1. Incident Type — dropdown: Graffiti / Anti-Social Behaviour / Safety Hazard / Maintenance Issue
  2. Location — text input, placeholder "e.g. Charlemont Street near the bridge"
  3. Description — textarea (4 rows)
  4. Reporter Email (optional) — text input with helper text "Only used to send you status updates"
  5. Conditional fields section (appears below based on Incident Type selection):
     - Show a lightly shaded inset panel with the type-specific fields
     - Example for Maintenance: Issue Type dropdown, Priority dropdown (Low/Medium/High/Critical),
       Work Category dropdown, and a "Describe the issue" textarea if "Other" selected
  6. Photo Upload — dashed border upload zone "Click to upload or drag photos here (max 10)",
     below it a horizontal scroll row of photo thumbnails (150×150px) with × remove buttons

  Submit button: full-width, blue (#1976d2), "Submit Report", disabled/loading state shown.

  Background: #f5f5f5. Form card: white with shadow.

  ---
  Screen 3 — Report Success

  Design a success confirmation screen for a civic incident reporting web app.

  Centered card on #f5f5f5 background (max-width 500px):
  - Large green checkmark circle at top (#388e3c)
  - Heading: "Report Received" in #388e3c, bold
  - Subtext: "Your report has been submitted. Save the ID below to track progress."
  - Incident ID display box: dashed blue border (#1976d2), light blue background (#e3f2fd),
    monospace font, large letter spacing, e.g. "CW-A3F9B2"
  - Helper text: "Use this ID on the Track page to check for updates"
  - Two buttons side by side: "Track This Report" (blue primary) and "Back to Home" (outline)

  ---
  Screen 4 — Track Your Report

  Design the Track Your Report page for CharlemontWatch.

  Header: same site header as Home page.

  Below header: live stats card (same 4-box layout as Home).

  Search section: white card, centered input field "Enter Incident ID (e.g. CW-A3F9B2)"
  with a blue "Search" button to the right.

  Results card (shown after search, max-width 700px):
  Left border (4px, color-coded by incident type).
  Inside:
  - Type label as colored heading (e.g. orange "MAINTENANCE ISSUE")
  - Row: ID badge | Location | Reported date
  - Description paragraph
  - Status pill badge (NEW in blue / IN PROGRESS in orange / RESOLVED in green)
  - Type-specific details section in a lightly shaded inset panel
  - Photo grid: 3-column grid of 150×150px thumbnails with click-to-enlarge

  Below results: "How It Works" section — 4 numbered steps in a horizontal card row.
  Below that: "Incident Types" — 4 cards each with a coloured left bar and short description.

  Bottom CTA: "Ready to report?" with two buttons.
  Background: #f5f5f5.

  ---
  Screen 5 — All Incidents

  Design the All Incidents browse page for a community safety reporting app.

  Header: site header.

  Incident type filter row: 4 clickable cards in a horizontal row, each representing a type
  (Graffiti, Anti-Social, Safety Hazard, Maintenance). Active card has a blue highlight border.
  Each card has the type's accent color as a left bar or indicator dot.

  Filter bar below: two dropdowns side by side — "Status" and "Type". Full-width on mobile.

  Count label: "12 incidents found" in muted gray.

  Incident list: responsive card grid (min-width 400px). Each incident card:
  - Left border in incident type color
  - Type label colored heading
  - Location line, description excerpt (2 lines max with ellipsis)
  - Reported date (small gray text)
  - Status badge pill (top-right corner)
  - Thumbnail strip if photos exist (3 small thumbnails in a row)

  Empty state: centered icon + "No incidents found" + suggestion to adjust filters.

  Background: #f5f5f5.

  ---
  Screen 6 — About Page

  Design the About page for CharlemontWatch, a community accountability platform.

  Header with tagline: "About CharlemontWatch — Community-led. Transparent. Accountable."

  Sections in vertical stack (max-width 900px, centered), each as a white card:
  1. Mission Statement — icon + paragraph text
  2. "How It Works" — 4 horizontal numbered steps (circle number + title + description)
  3. "Who We Pressure" — 2 side-by-side cards: Tuath Housing | Dublin City Council
  4. "Why This Matters" — paragraph
  5. "Uploading Photos" — icon + bullet list of tips
  6. "Safety & Privacy" — orange warning-style card with rules list (do NOT name individuals, etc.)
  7. "Anonymous or Identified?" — two-column comparison

  Bottom: two CTA buttons: "Report an Incident" (blue) and "View All Incidents" (outline).
  Background: #f5f5f5.

  ---
  Screen 7 — Admin Login / Register

  Design an admin authentication screen for a civic web app.

  Centered card on a dark or medium-blue background (#1976d2 gradient):
  - CW Shield logo at top
  - Heading: "Admin Login" (or "Create Account" for register state)
  - Subheading: "Manage incident reports"

  Form fields vertically stacked:
  - Email input
  - Password input
  - Name input (registration state only)
  - Submit button (blue, full width): "Login" / "Register"
  - Toggle link below: "Don't have an account? Register" / "Already have an account? Login"

  Error banner (red, shown on failed login): inline at top of card.
  Success banner (green): inline at top of card.

  Card: white, 8px border radius, soft shadow, max-width 400px.

  ---
  Screen 8 — Admin Dashboard

  Design an admin dashboard for a community incident management tool.

  Header: site header with "Admin Dashboard" title, "Back to Home" and "Logout" buttons top-right.

  Status filter tab bar: 3 pill-style toggle buttons — NEW (blue) | IN PROGRESS (orange) | RESOLVED
  (green).
  Active tab is filled/highlighted, inactive are outline style.

  Incident list below (full width):
  Each incident card in the list:
  - Type label colored heading
  - Full short ID badge, Location, Description
  - Reporter email (or "Anonymous" in muted italic)
  - Reported date, photo count badge
  - Status pill badge (top-right)
  - Two action buttons bottom-right: "Update Status" (blue outline) and "Delete" (red outline)

  Status Update Modal (overlay):
  - Semi-transparent dark overlay
  - White modal card (max-width 400px)
  - Title "Update Status", Incident ID shown
  - Dropdown: "Select status" (NEW / IN_PROGRESS / RESOLVED)
  - Buttons: "Update Status" (blue) | "Cancel" (gray outline)

  Empty state: centered message "No incidents with status NEW" etc.
  Background: #f5f5f5.

  ---
  Mobile Screens (Responsive)

  Design mobile (375px width) versions of: Home, Report Form, Track, and Incidents pages
  for CharlemontWatch.

  Key mobile changes:
  - Navigation cards stack to single column
  - Stats boxes wrap to 2×2 grid
  - All buttons become full-width
  - Incident cards take full width
  - Incident type filter row scrolls horizontally
  - Filter dropdowns stack vertically
  - Photo grid reduces to 2 columns
  - Header becomes compact (logo + title only, hamburger or back button)

  Maintain same color palette and card styles as desktop.