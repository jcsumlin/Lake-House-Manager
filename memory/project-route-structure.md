---
name: project-route-structure
description: TanStack Router route structure and layout hierarchy for Lake House Manager
metadata:
  type: project
---

**Current route structure:**
```
src/routes/
  __root.tsx          — root shell (ConvexProvider, error boundary, 404 handler)
  _app.tsx            — authenticated layout route (wraps all app pages with AppShell)
  _app/
    index.tsx         — / (dashboard, currently placeholder)
  login.tsx           — /login
  api/
    auth/
      -$.ts           — auth proxy stub (prefixed with - to exclude from route tree)
```

**Layout hierarchy:**
- `__root.tsx` → provides Convex + QueryClient context, renders error/404 components
- `_app.tsx` → renders `<AppShell>` with nav, wraps authenticated pages via `<Outlet />`
- Pages under `_app/` get the shell automatically

**Adding new routes:**
- Authenticated pages → create under `src/routes/_app/`
- Public pages (login, invite) → create directly in `src/routes/`

**AppShell nav config** is in `src/components/layout/AppShell.tsx`:
- `primaryNav` — Home, Calendar, Tasks (shown in both bottom bar and sidebar)
- `secondaryNav` — Maintenance, Expenses, Inventory, Documents, Contacts, Announcements, Settings (sidebar + "More" sheet on mobile)
