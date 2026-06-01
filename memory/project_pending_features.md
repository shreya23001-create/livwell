---
name: project-pending-features
description: Outstanding features and work remaining in the Livwell engineering app
metadata:
  type: project
---

Google Login (OAuth2) must be added to the customer auth page (`/customer`) and optionally agent/admin login pages.

**Why:** User explicitly requested it alongside the Customer Dashboard build.

**How to apply:** When starting the Google login task, implement OAuth2 via `@abacritt/angularx-social-login` or Angular's native approach. Wire it into `AuthService.loginDirect()` for seamless role-based redirect.

## Remaining work (as of 2026-05-20)

- **Google Login** — customer auth + optionally agent/admin login pages
- **Forgot Password flow** — link exists on login pages, no implementation yet
- **Agent Calendar** — folder exists at `src/app/agent/calendar/`, no component built
- **Agent Login page** — verify `src/app/public/agent-login/` is fully built
- **Admin CMS** — folder exists at `src/app/admin/cms/`, nothing built
- **Data persistence** — all CRUD data resets on page refresh (in-memory signals only)
- **Property detail pages** (admin/agent drill-down)
- **Notifications** — bell icon in admin topbar is decorative only
