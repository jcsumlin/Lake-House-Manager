Absolutely — here is a rewritten version of your original plan, updated for a no-SSR architecture while keeping the same overall structure and intent.

---

# 1. Recommended product direction

Build a private, invite-only family operations app that helps everyone answer:

- Who is coming and when?
- What needs to be done before, during, and after a stay?
- What is broken, low, or missing?
- Who paid for what?
- Where are important documents and instructions?
- How do mobile users quickly use it at the house?

The app should feel like:

- a shared family calendar
- a lightweight property operations hub
- a mobile-first household companion
- a PWA people can install on their phones

Because this is a private, authenticated family app, SSR is not necessary. The app should instead be optimized as a fast client-rendered experience with strong mobile usability, realtime updates, and installable PWA behavior.

---

# 2. Required stack and how it fits

Your required stack is still a good fit, with one important change: the frontend should now be deployed as a client-rendered app instead of an SSR app.

## Recommended stack

- Frontend: React + TypeScript + TanStack Start
- Hosting: static frontend hosting
- Backend/database/auth: Convex
- Tables: AG Grid
- Monitoring: Sentry
- Package manager: npm
- Linting/style enforcement: Biome
- Mobile/PWA: first-class requirement

## How the stack fits

### TanStack Start
Use TanStack Start for:

- routing
- layouts
- route-based code splitting
- app shell structure
- error boundaries
- client-side navigation
- PWA integration

Use it as a client-rendered app framework, not as an SSR framework.

### Convex
Use Convex for:

- database
- queries and mutations
- realtime updates
- auth integration
- permissions
- backend business logic
- audit logging

Convex should be the main backend and source of truth.

### AG Grid
Use AG Grid for:

- admin-heavy screens
- dense tabular views
- desktop and tablet workflows

Do not make AG Grid the default mobile interaction model.

### Sentry
Use Sentry for:

- frontend error monitoring
- release tracking
- route/render failures
- production debugging

### Hosting
Because SSR is no longer required, the frontend can be deployed as static assets. Cloudflare can still be used for hosting, CDN, DNS, and optional R2 storage, but it no longer needs to be part of the page rendering path.

---

# 3. Key product goals

## Primary goals

- Make scheduling and house coordination easy
- Reduce text-message chaos
- Give family members a single source of truth
- Work well on phones at the lake with spotty service
- Be simple enough that non-technical family members actually use it

## Non-functional goals

- Mobile responsive at every screen size
- Installable as a PWA
- Fast initial load
- Real-time updates where useful
- Secure, invite-only access
- Excellent error monitoring
- Low-maintenance deployment flow

---

# 4. Suggested feature set

## MVP features

### A. Dashboard
A personalized home screen showing:

- upcoming stays
- today’s tasks
- open maintenance items
- recent announcements
- low inventory items
- quick links to emergency info, Wi-Fi, and house guide

### B. Shared calendar and stays
Core family coordination feature.

Features:

- stay scheduling and reservations
- overlap detection
- arrival and departure info
- guest counts
- optional notes like “bringing dog” or “need crib”
- house events like dock install, cleaning day, or family reunion

### C. Tasks and checklists
House operations feature.

Features:

- recurring opening and closing tasks
- pre-arrival checklist
- departure checklist
- chores by stay
- assign tasks to people
- due dates and completion tracking

Examples:

- turn on water
- put out trash bins
- check boat battery
- restock propane
- lock shed
- photograph storm damage

### D. Maintenance tracker
For repairs, recurring upkeep, and issue reporting.

Features:

- report an issue
- categorize by area or system
- priority
- status workflow
- photos
- estimated and actual cost
- assigned person or vendor
- maintenance history

### E. Expenses and reimbursements
Simple family finance coordination.

Features:

- log expense
- category
- who paid
- amount
- split rules
- receipt upload
- reimbursement status

### F. Inventory and supplies
Useful for food, tools, cleaning supplies, and lake gear.

Features:

- track key stocked items
- quantity and low-stock threshold
- shopping list generation
- storage location

### G. Documents and house guide
A knowledge base for the property.

Features:

- Wi-Fi info
- emergency contacts
- utility shutoff instructions
- septic rules
- trash day rules
- boat and lift instructions
- vendor contacts
- manuals, permits, and insurance docs

### H. Announcements
Simple internal communications.

Features:

- post updates
- pin important messages
- optional seen-by tracking

## Phase 2 features

- weather alerts / storm prep checklist
- Freeze watch alerts
- photo gallery by trip or issue
- occupancy analytics
- smart reminders based on upcoming stay
- offline write queue for limited actions
- stay checkout checklist and instructions for how to pay the maid
- asset management for boats, docks, screened in porch, cleaning supplies
- End of the season close up duties

## Phase 3 features

- AI search over documents and maintenance history
- budget forecasting
- seasonal operating mode
- lake rulebook acknowledgement
- contractor workflow and invoice approval

---

# 5. User roles and permissions

Keep permissions simple.

## Roles

### Super Admin
- manage settings
- invite and remove users
- change roles
- manage property configuration

### Family Admin
- create and edit stays
- manage tasks, maintenance, expenses, and docs
- view everything

### Family Member
- view all shared info
- create tasks, issues, and expenses
- edit own entries
- complete assigned tasks

### Guest / Caretaker
- limited access
- only specific routes and modules
- no financial data unless explicitly granted

---

# 6. Best auth approach with Convex

Because the app is now fully client-rendered, auth should be built around Convex as the source of truth.

## Recommended auth approach

- Convex as backend and source of truth
- Convex Auth integration for authentication
- invite-only onboarding
- email magic link and/or email/password

## Auth flows

- admin invites user by email
- invited user creates account or signs in
- session is established through Convex Auth
- role is assigned via membership table
- protected screens are gated in the client for UX
- actual access control is enforced in Convex queries and mutations

## Important auth rule

Client-side route guards are for UX only.

Actual security must be enforced in Convex:

- every query checks identity
- every mutation checks membership and role
- every read and write is property-scoped

---

# 7. High-level architecture

## App architecture

- Browser / PWA client
  - React UI
  - TanStack Start routing
  - responsive pages
  - service worker
  - installable app shell
- Convex
  - database
  - queries / mutations / actions
  - auth integration
  - real-time subscriptions
  - permissions and audit logging
- Optional Cloudflare
  - static asset hosting
  - CDN
  - custom domain
  - optional R2 file storage

## Recommended responsibility split

### TanStack Start
Use for:

- routing
- page composition
- layouts
- shell rendering in the browser
- PWA manifest and service worker integration
- route-based code splitting

### Convex
Use for:

- all app data
- permissions
- real-time queries
- mutations and actions
- auth and session logic
- audit logging

### Cloudflare
Use for:

- hosting the frontend
- caching static assets
- custom domain and DNS
- optional R2 file storage
- optional later edge utilities if needed

---

# 8. Core modules and route map

Suggested route structure:

```text
src/routes/
  __root.tsx
  index.tsx                    // dashboard or redirect into app shell
  login.tsx
  invite.$token.tsx

  app.tsx                      // authenticated shell

  app/
    index.tsx                  // dashboard

    calendar/
      index.tsx
      new.tsx
      $stayId.tsx

    tasks/
      index.tsx
      today.tsx
      templates.tsx
      $taskId.tsx

    maintenance/
      index.tsx
      new.tsx
      $issueId.tsx

    expenses/
      index.tsx
      new.tsx
      $expenseId.tsx

    inventory/
      index.tsx
      shopping-list.tsx
      $itemId.tsx

    documents/
      index.tsx
      $docId.tsx

    contacts/
      index.tsx

    announcements/
      index.tsx

    settings/
      index.tsx
      profile.tsx
      house.tsx
      members.tsx
```

## Route strategy

Use public routes only for:

- login
- invite flow
- optional offline fallback route

Put the main app inside an authenticated shell.

---

# 9. Proposed data model in Convex

Design for one house now, but keep it multi-property capable.

## Core tables

### users
- auth identity fields
- display name
- email
- avatar
- phone
- preferences

### properties
- name
- timezone
- address
- Wi-Fi info
- seasonal settings
- emergency settings

### memberships
- userId
- propertyId
- role
- status

### stays
- propertyId
- createdBy
- startDate
- endDate
- status
- guestCount
- notes
- checkInChecklistTemplateId
- checkOutChecklistTemplateId

### calendarEvents
- propertyId
- title
- type
- startAt
- endAt
- linkedStayId optional
- notes

### tasks
- propertyId
- title
- description
- type
- status
- priority
- assignedTo
- dueAt
- linkedStayId optional
- linkedMaintenanceId optional
- recurrenceRule optional

### taskTemplates
- propertyId
- name
- category
- checklistItems
- seasonalTag

### maintenanceIssues
- propertyId
- title
- description
- category
- area
- priority
- status
- reportedBy
- assignedTo
- vendorId optional
- estimatedCost
- actualCost
- photoIds
- openedAt
- resolvedAt

### expenses
- propertyId
- paidBy
- amount
- category
- date
- description
- splitMethod
- receiptFileId
- reimbursementStatus

### inventoryItems
- propertyId
- name
- category
- location
- quantity
- unit
- lowThreshold
- restockNeeded

### shoppingListItems
- propertyId
- name
- quantity
- addedBy
- status
- linkedInventoryItemId optional

### documents
- propertyId
- title
- category
- description
- fileKey or storage reference
- visibility
- uploadedBy

### contacts
- propertyId
- name
- type
- phone
- email
- notes

### announcements
- propertyId
- title
- body
- pinned
- createdBy
- expiresAt optional

### notifications
- userId
- type
- payload
- readAt

### auditLogs
- propertyId
- actorUserId
- entityType
- entityId
- action
- metadata
- createdAt

---

# 10. UX strategy: mobile-first and PWA-first

This is still one of the most important parts of the app.

## Mobile UX principles

- design for phone first, then scale up
- bottom navigation for primary areas
- one-thumb actions for common tasks
- avoid dense desktop-style forms on mobile
- make “log issue,” “mark task done,” and “view today” extremely fast
- use cards on mobile and tables on larger screens

## Recommended mobile nav

Bottom nav:

- Home
- Calendar
- Tasks
- More

“More” opens:

- Maintenance
- Expenses
- Inventory
- Documents
- Contacts
- Settings

## Quick actions on mobile

Floating or sticky action button:

- New stay
- Report issue
- Add expense
- Add shopping item
- Complete checklist

## PWA requirements

### Required
- web manifest
- app icons
- splash-friendly theme colors
- standalone display mode
- service worker
- install prompt handling
- offline fallback page
- cached app shell

### Offline strategy
Cache:

- shell
- icons
- common static assets
- recent dashboard snapshot
- emergency info
- house guide basics
- last-viewed tasks and checklists

Do not aggressively cache sensitive private document blobs unless explicitly intended.

### Install UX
- show install prompt when eligible
- show iPhone and iPad Add to Home Screen instructions
- explain offline limitations during onboarding

---

# 11. AG Grid strategy

Use AG Grid for admin-heavy and data-dense screens only.

Best places to use it:

- expenses
- inventory
- maintenance history
- membership and admin lists
- stay management on tablet and desktop

## Important mobile rule

Do not force AG Grid to be the main mobile experience for every screen.

Instead:

- desktop and tablet: AG Grid
- mobile: card and list views for most cases
- optional compact AG Grid only for simple small tables

## Recommendation
Start with AG Grid Community unless you truly need Enterprise features.

For a family lake house app, Community is probably enough at first.

---

# 12. Frontend architecture

## State and data pattern

Use:

- TanStack Start for routes, layouts, and code splitting
- Convex React client for app data
- Convex subscriptions for realtime screens
- Suspense and loading boundaries where appropriate
- React Query only for non-Convex external APIs if needed

## UI composition

Suggested structure:

```text
src/
  app/
    providers/
    router/
  components/
    ui/
    layout/
    forms/
    ag-grid/
  features/
    auth/
    dashboard/
    calendar/
    tasks/
    maintenance/
    expenses/
    inventory/
    documents/
    settings/
  lib/
    auth/
    convex/
    sentry/
    pwa/
    utils/
  routes/
  styles/
  service-worker/
```

## Styling
I recommend:

- Tailwind CSS for responsiveness and speed
- CSS variables for theme tokens
- a small internal component library for consistency

---

# 13. Backend architecture in Convex

Organize Convex by domain.

```text
convex/
  schema.ts
  auth.config.ts
  users.ts
  memberships.ts
  properties.ts
  stays.ts
  calendar.ts
  tasks.ts
  taskTemplates.ts
  maintenance.ts
  expenses.ts
  inventory.ts
  shopping.ts
  documents.ts
  contacts.ts
  announcements.ts
  notifications.ts
  audit.ts
  lib/
    auth.ts
    permissions.ts
    membership.ts
    validation.ts
    audit.ts
```

## Convex rules

- every query and mutation checks membership and role
- every write is property-scoped
- every important write logs to audit trail when useful
- keep permissions centralized in shared helpers
- use validators consistently
- use indexes for calendar ranges, open tasks, issue status, and expenses by date and category

---

# 14. Deployment plan

Deploy the frontend as a client-rendered static app.

## Hosting approach

Use static hosting for the frontend.

### Good options
- Cloudflare hosting and CDN
- another static host if preferred

If staying with Cloudflare, use it for:

- static asset hosting
- custom domain
- CDN
- optional R2

## Environment strategy

Suggested environments:

- local
- preview
- staging
- production

## Secrets and config

Examples:

- `VITE_CONVEX_URL`
- `VITE_APP_ENV`
- `SENTRY_DSN`
- auth configuration values
- file storage keys if using R2
- notification provider keys if added later

Because SSR is removed, the deployment flow is simpler:

- deploy frontend static assets
- deploy Convex schema and functions
- configure environment variables
- attach release tracking in Sentry

---

# 15. Sentry observability plan

Implement strong client-side monitoring.

## Client-side
Use Sentry in React for:

- uncaught exceptions
- route and render failures
- error boundaries
- user context
- release tagging

## Backend monitoring
Monitor backend failures through Convex logs and any Sentry-compatible reporting you add around backend integrations and critical workflows.

## Sentry best practices
- upload source maps
- set environment and release
- filter noisy browser-extension errors
- keep trace sample rate low in production after validation
- capture user ID or email only if acceptable for privacy expectations

---

# 16. Security plan

## Access control
- invite-only app
- authenticated routes only
- role checks in Convex, not just frontend
- property-scoped access

## Data protection
- least-privilege role model
- audit important writes
- do not expose receipt or document URLs directly if avoidable
- secure file upload path
- limit personally sensitive data

## Session and auth
- short-lived tokens with refresh flow from auth system
- revoke membership access immediately
- require re-auth for especially sensitive admin actions later if needed

## Important rule
The frontend is not the security boundary.

Convex is the security boundary.

---

# 17. Performance plan

## Performance goals
- good Lighthouse mobile score
- quick dashboard render on 4G
- minimal JS on initial routes
- smooth task completion on phones

## Tactics
- route-based code splitting
- lazy-load AG Grid screens
- lazy-load heavy document and file screens
- keep dashboard query small and aggregated
- compress images
- store large files outside the main DB
- cache shell assets aggressively in service worker
- prefetch likely next routes after login

---

# 18. Accessibility plan

Treat accessibility as baseline, especially for older family members.

Requirements:

- keyboard reachable
- strong contrast
- large tap targets
- clear labels and validation
- semantic headings
- ARIA support in custom widgets
- screen-reader-friendly task and calendar views

---

# 19. Recommended MVP scope

If you want the best first release, build this first:

## MVP release
- auth and invite-only access
- dashboard
- stays and calendar
- tasks and checklists
- maintenance
- documents and house guide
- responsive design
- PWA installability
- offline fallback and cached essentials
- Sentry
- admin and member roles

## MVP+ release
- expenses
- inventory and shopping list
- announcements
- file uploads
- notifications

---

# 20. Suggested delivery phases

## Phase 0: foundation
- repo setup
- TanStack Start client-rendered app setup
- Convex integration
- auth integration
- Biome
- Sentry
- responsive shell
- PWA baseline

## Phase 1: core coordination
- dashboard
- stays and calendar
- tasks and checklists
- memberships and roles

## Phase 2: operations
- maintenance
- documents
- contacts
- announcements

## Phase 3: finance and supplies
- expenses
- inventory
- shopping list
- receipt uploads

## Phase 4: polish
- notifications
- offline improvements
- analytics
- UX refinements

---

# 21. Testing strategy

## Unit and integration
- Vitest for utilities and business logic
- component tests for forms and role gating
- Convex function tests for permissions and data rules

## E2E
- Playwright on:
  - mobile viewport
  - tablet viewport
  - desktop viewport

Test flows:

- invite and sign in
- create stay
- complete checklist
- report maintenance issue
- install as PWA
- offline fallback behavior
- role-based access checks

## Quality gates
- lint passes
- typecheck passes
- build passes
- basic Lighthouse checks
- no critical Sentry regressions after deploy

---

# 22. CI/CD plan

Using npm and GitHub Actions:

Pipeline:

1. install with npm
2. lint with Biome
3. typecheck
4. test
5. build frontend
6. deploy Convex functions and schema
7. deploy static frontend
8. attach release to Sentry

---

# 23. Code quality plan

Use Biome to enforce:

- formatting
- linting
- import cleanup
- general consistency

Also recommended:

- strict TypeScript
- path aliases
- pre-commit hooks with lint-staged
- consistent project conventions
- avoid unsafe `any`
- enforce React hooks correctness

---

# 24. Biggest implementation risks and mitigations

## Risk 1: auth and invite flow complexity
Mitigation:
- use Convex Auth path
- centralize auth helpers early
- keep route gating simple
- enforce all permissions in Convex

## Risk 2: AG Grid on mobile
Mitigation:
- use cards and lists on phones
- reserve AG Grid for wider screens and admin pages

## Risk 3: PWA expectations vs actual offline capability
Mitigation:
- clearly define what works offline
- cache read-only essentials first
- defer complex offline writes to later

## Risk 4: too much scope for first release
Mitigation:
- prioritize scheduling, tasks, maintenance, and docs
- add expenses and inventory after adoption begins

## Risk 5: bundle size growth
Mitigation:
- split routes aggressively
- lazy-load AG Grid and heavy screens
- avoid loading admin tools for all users

---

# 25. Final recommendation

If I were building this with your updated no-SSR requirement, I would choose this exact implementation direction:

- TanStack Start as a client-rendered app framework
- Convex for data, realtime, auth, and permissions
- mobile-first UI with bottom navigation
- PWA from day one
- AG Grid only for larger data-heavy screens
- Sentry for client-side monitoring
- static frontend deployment
- single repo with npm, strict TypeScript, and Biome
- MVP focused on calendar, tasks, maintenance, and documents

That gives you the highest chance of shipping something the family will actually use, while keeping the architecture simpler than an SSR-based setup.

If you want, I can next turn this into either:

1. a polished product/engineering spec you can hand to a developer,
2. a phased roadmap with detailed tickets,
3. or a starter repo structure with exact packages, folders, and setup steps.