## 1. Recommended product direction

Build a private, invite-only family operations app that helps everyone answer:

- Who is coming and when?
- What needs to be done before/during/after a stay?
- What is broken, low, or missing?
- Who paid for what?
- Where are important documents and instructions?
- How do mobile users quickly use it at the house?

The app should feel like:

- a shared family calendar
- a lightweight property operations hub
- a mobile-first household companion
- a PWA people can “install” on their phones

## 2. Required stack and how it fits

Your required stack is a good fit:

- Frontend: React + TypeScript + TanStack Start
- Hosting/runtime: Cloudflare Workers
- Backend/database/auth: Convex
- Tables: AG Grid
- Monitoring: Sentry
- Package manager: npm
- Linting/style enforcement: Biome
- Mobile/PWA: first-class requirement, not an afterthought

Based on current docs:

- TanStack Start is deployable to Cloudflare Workers using `@cloudflare/vite-plugin` and `wrangler`
- Convex works well with TanStack Start through React Query integration
- For auth with TanStack Start SSR/server functions, Convex’s Better Auth integration is the safest choice today
- AG Grid now favors `AgGridProvider` for shared module registration
- Sentry supports Cloudflare workers directly via `@sentry/cloudflare`

## 3. Key product goals

### Primary goals

- Make scheduling and house coordination easy
- Reduce text-message chaos
- Give family members a single source of truth
- Work well on phones at the lake with spotty service
- Be simple enough that non-technical family members actually use it

### Non-functional goals

- Mobile responsive at every screen size
- Installable as a PWA
- Fast initial load
- Real-time updates where useful
- Secure, invite-only access
- Excellent error monitoring
- Low maintenance deployment flow

## 4. Suggested feature set

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

- stay scheduling / reservations
- overlap detection
- arrival/departure info
- guest counts
- optional notes like “bringing dog” or “need crib”
- house events like dock install, cleaning day, family reunion

### C. Tasks and checklists
House operations feature.

Features:

- recurring opening/closing tasks
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
- categorize by area/system
- priority
- status workflow
- photos
- estimated/actual cost
- assigned person/vendor
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
Useful for food, tools, cleaning supplies, boat/lake gear.

Features:

- track key stocked items
- quantity / low-stock threshold
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
- boat/lift instructions
- vendor contacts
- manuals, permits, insurance docs

### H. Announcements
Simple internal communications.

Features:

- post updates
- pin important messages
- “seen by” tracking optional

## Phase 2 features

- push notifications
- weather alerts / storm prep checklist
- vendor portal or read-only caretaker access
- photo gallery by trip or issue
- occupancy analytics
- smart reminders based on upcoming stay
- offline write queue for limited actions
- barcode/QR scan for inventory
- asset management for boats, docks, golf cart, generator

## Phase 3 features

- AI search over documents and maintenance history
- budget forecasting
- seasonal operating mode
- lake rulebook acknowledgement
- contractor workflow and invoice approval

## 5. User roles and permissions

Keep permissions simple.

### Roles

#### Super Admin
- manage settings
- invite/remove users
- change roles
- manage property configuration

#### Family Admin
- create/edit stays
- manage tasks, maintenance, expenses, docs
- view everything

#### Family Member
- view all shared info
- create tasks/issues/expenses
- edit own entries
- complete assigned tasks

#### Guest / Caretaker
- limited access
- only specific routes/modules
- no financial data unless explicitly granted

## 6. Best auth approach with Convex

Because this app uses TanStack Start and Cloudflare SSR/runtime, I recommend:

- Convex as backend and source of truth
- Convex + Better Auth integration for authentication
- invite-only onboarding
- email magic link and/or email/password
- optional Google sign-in later

Why this approach:

- plain Convex Auth is still maturing for SSR-heavy flows
- Convex + Better Auth has documented TanStack Start support
- it gives a cleaner path for authenticated SSR, loaders, and server functions

### Auth flows

- admin invites user by email
- invited user creates account or signs in
- session stored securely
- role assigned via membership table
- protected routes enforced in TanStack Start loaders and Convex functions

## 7. High-level architecture

## App architecture

- Browser / PWA client
  - React UI
  - TanStack Start routing
  - responsive pages
  - service worker
- Cloudflare Workers
  - SSR / server entry
  - edge delivery
  - route handlers
  - optional asset/file proxying
- Convex
  - database
  - queries / mutations / actions
  - auth integration
  - real-time subscriptions
- Optional Cloudflare R2
  - documents
  - receipts
  - issue photos
  - manuals

## Recommended responsibility split

### TanStack Start
Use for:

- routing
- page composition
- loaders
- shell rendering
- PWA manifest/service worker integration
- edge deployment on Cloudflare

### Convex
Use for:

- all app data
- permissions
- real-time queries
- mutations/actions
- auth/session logic
- audit logging

### Cloudflare
Use for:

- runtime hosting
- edge delivery
- custom domain
- caching of static assets
- optional R2 file storage
- optional Cron/Queues later

## 8. Core modules and route map

Suggested route structure:

```text
src/routes/
  __root.tsx
  index.tsx                    // dashboard
  login.tsx
  invite.$token.tsx

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

## 9. Proposed data model in Convex

Design for one house now, but keep it multi-property capable.

### Core tables

#### users
- auth identity fields
- display name
- email
- avatar
- phone
- preferences

#### properties
- name
- timezone
- address
- Wi-Fi info
- seasonal settings
- emergency settings

#### memberships
- userId
- propertyId
- role
- status

#### stays
- propertyId
- createdBy
- startDate
- endDate
- status
- guestCount
- notes
- checkInChecklistTemplateId
- checkOutChecklistTemplateId

#### calendarEvents
- propertyId
- title
- type
- startAt
- endAt
- linkedStayId optional
- notes

#### tasks
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

#### taskTemplates
- propertyId
- name
- category
- checklistItems
- seasonalTag

#### maintenanceIssues
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

#### expenses
- propertyId
- paidBy
- amount
- category
- date
- description
- splitMethod
- receiptFileId
- reimbursementStatus

#### inventoryItems
- propertyId
- name
- category
- location
- quantity
- unit
- lowThreshold
- restockNeeded

#### shoppingListItems
- propertyId
- name
- quantity
- addedBy
- status
- linkedInventoryItemId optional

#### documents
- propertyId
- title
- category
- description
- fileKey / storage reference
- visibility
- uploadedBy

#### contacts
- propertyId
- name
- type
- phone
- email
- notes

#### announcements
- propertyId
- title
- body
- pinned
- createdBy
- expiresAt optional

#### notifications
- userId
- type
- payload
- readAt

#### auditLogs
- propertyId
- actorUserId
- entityType
- entityId
- action
- metadata
- createdAt

## 10. UX strategy: mobile-first and PWA-first

This is the most important part after core functionality.

## Mobile UX principles

- design for phone first, scale up to desktop
- bottom navigation for primary areas
- one-thumb actions for common tasks
- avoid dense desktop-style forms on mobile
- make “log issue”, “mark task done”, and “view today” extremely fast
- use cards on mobile, tables on larger screens

### Recommended mobile nav

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

### Quick actions on mobile

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
- recent dashboard data snapshot
- emergency info
- house guide basics
- last-viewed tasks/checklists

Do not aggressively cache sensitive/private document blobs unless explicitly intended.

### Install UX
- show “Install app” prompt when eligible
- custom instructions for iPhone/iPad “Add to Home Screen”
- first-run welcome explaining offline limitations

## 11. AG Grid strategy

Use AG Grid for admin-heavy and data-dense screens only.

Best places to use it:

- expenses
- inventory
- maintenance history
- membership/admin lists
- stay management on tablet/desktop

### Important mobile rule
Do not force AG Grid to be the main mobile experience for every screen.

Instead:

- desktop/tablet: AG Grid
- mobile: card/list views for most cases
- optional compact AG Grid only for simple 2–4 column tables

### AG Grid recommendation
Start with AG Grid Community unless you truly need Enterprise features like:

- server-side row model
- Excel export
- advanced grouping/pivoting
- master/detail

For a family lake house app, Community is probably enough at first.

### Current AG Grid implementation note
Use `AgGridProvider` for shared module registration, and keep module registration client-side for SSR safety.

## 12. Frontend architecture

## State/data pattern

Use:

- TanStack Start route loaders for page-level prefetching
- React Query integration with Convex
- `useSuspenseQuery` for SSR-friendly data loading
- Convex real-time updates for collaborative screens

### UI composition

Suggested structure:

```text
src/
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
```

### Styling
I recommend:

- Tailwind CSS for responsiveness and speed
- CSS variables for theme tokens
- a small internal component library for consistency

## 13. Backend architecture in Convex

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
    validation.ts
```

### Convex rules

- every query/mutation checks membership + role
- every write logs to audit trail when useful
- keep permissions centralized in shared helpers
- use validators consistently
- use indexes for calendar ranges, open tasks, issue status, and expenses by date/category

## 14. Cloudflare deployment plan

Deploy TanStack Start to Cloudflare Workers.

### Why Workers over Pages
- cleaner fit for TanStack Start full-stack behavior
- official TanStack/Cloudflare path exists
- SSR/server entry model aligns better

### Required platform setup
- `@cloudflare/vite-plugin`
- `wrangler`
- `wrangler.jsonc`
- `nodejs_compat` compatibility flag
- custom domain
- preview/staging environment
- production environment

### Suggested environments
- local
- preview
- staging
- production

### Secrets/config
Examples:

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `SENTRY_DSN`
- auth secrets
- file storage keys if using R2
- notification provider keys if added later

## 15. Sentry observability plan

Implement both client and server monitoring.

### Client-side
Use Sentry in React for:

- uncaught exceptions
- route/render failures
- error boundaries
- user context
- release tagging

### Cloudflare worker side
Use `@sentry/cloudflare` for:

- SSR/server errors
- request tracing
- edge runtime exceptions
- performance sampling

### Sentry best practices
- upload source maps
- set environment and release
- filter noisy browser-extension errors
- keep trace sample rate low in production after validation
- capture user ID/email only if acceptable for your privacy expectations

## 16. Security plan

### Access control
- invite-only app
- authenticated routes only
- role checks in Convex, not just frontend
- property-scoped access

### Data protection
- least-privilege role model
- audit important writes
- do not expose receipt/document URLs directly if avoidable
- secure file upload path
- limit personally sensitive data

### Session/auth
- short-lived tokens with refresh flow from auth system
- revoke membership access immediately
- require re-auth for admin-sensitive actions later if needed

## 17. Performance plan

### Performance goals
- good Lighthouse mobile score
- quick dashboard render on 4G
- minimal JS on initial routes
- smooth task completion on phones

### Tactics
- route-based code splitting
- lazy-load AG Grid screens
- lazy-load heavy document/file screens
- use loader prefetch for key routes
- compress images
- store large files outside main DB
- keep dashboard query small and aggregated

## 18. Accessibility plan

Treat accessibility as baseline, especially for older family members.

Requirements:

- keyboard reachable
- strong contrast
- large tap targets
- clear labels and validation
- semantic headings
- ARIA support in custom widgets
- screen-reader-friendly task and calendar views

## 19. Recommended MVP scope

If you want the best first release, build this first:

### MVP release
- auth/invite-only access
- dashboard
- stays/calendar
- tasks/checklists
- maintenance
- documents/house guide
- responsive design
- PWA installability
- Sentry
- admin/member roles

### MVP+ release
- expenses
- inventory + shopping list
- announcements
- file uploads
- notifications

## 20. Suggested delivery phases

## Phase 0: foundation
- repo setup
- TanStack Start on Cloudflare
- Convex integration
- auth integration
- ESLint
- Sentry
- responsive shell
- PWA baseline

## Phase 1: core coordination
- dashboard
- stays/calendar
- tasks/checklists
- memberships/roles

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

## 21. Testing strategy

### Unit/integration
- Vitest for utilities and business logic
- component tests for forms and role gating
- Convex function tests for permissions and data rules

### E2E
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

### Quality gates
- lint passes
- typecheck passes
- build passes
- basic Lighthouse checks
- no critical Sentry regressions after deploy

## 22. CI/CD plan

Using pnpm and GitHub Actions:

Pipeline:

1. install with pnpm
2. lint
3. typecheck
4. test
5. build
6. deploy Convex functions/schema
7. deploy Cloudflare Worker
8. attach release to Sentry

## 23. ESLint and code quality plan

Use ESLint to enforce:

- TypeScript best practices
- import ordering
- no unused vars
- no unsafe `any`
- React hooks rules
- consistent project conventions

Also recommended:

- Prettier for formatting
- strict TypeScript
- path aliases
- pre-commit hooks with lint-staged

## 24. Biggest implementation risks and mitigations

### Risk 1: Auth + SSR complexity
Mitigation:
- use Convex + Better Auth path
- centralize auth helpers early
- protect loaders and server functions consistently

### Risk 2: AG Grid on mobile
Mitigation:
- use cards/lists on phones
- reserve AG Grid for wider screens and admin pages

### Risk 3: PWA expectations vs actual offline capability
Mitigation:
- clearly define what works offline
- cache read-only essentials first
- defer complex offline writes to later

### Risk 4: Too much scope for first release
Mitigation:
- prioritize scheduling + tasks + maintenance + docs
- add expenses/inventory after adoption begins

## 25. My final recommendation

If I were building this, I would choose this exact implementation direction:

- TanStack Start on Cloudflare Workers
- Convex for data and realtime
- Convex + Better Auth for authentication
- mobile-first UI with bottom navigation
- PWA from day one
- AG Grid only for larger data-heavy screens
- Sentry in both browser and Cloudflare worker
- single repo with pnpm, strict TypeScript, ESLint
- MVP focused on calendar, tasks, maintenance, and documents

That gives you the highest chance of shipping something the family will actually use.

1. a detailed technical specification,
2. a phased implementation roadmap with tickets,
3. or a full starter project structure with package list, folders, and setup steps.
