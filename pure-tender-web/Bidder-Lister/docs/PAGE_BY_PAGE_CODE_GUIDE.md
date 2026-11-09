# TenderBlock — frontend divided by page (v4 code)

This package contains the original v4 project, **not four independent React apps**. All pages share `App.jsx`, `AuthContext.jsx`, `services.js`, `dtos.js`, `index.css`, and `main.jsx`. This organization makes it possible to work on one feature at a time without duplicating authentication or backend API calls.

## 1. Initial landing page — `/`

**Main code:** `src/pages/LandingPage.jsx`

**Also used:** `src/components/PublicHeader.jsx`, `src/components/HeroIllustration.jsx`, `src/components/TeamFooter.jsx`, `src/components/Brand.jsx`, `src/components/ThemeToggle.jsx`, `src/context/ThemeContext.jsx`, `src/data/constants.js`, `src/index.css`.

Contains the public About, benefits, how it works, team/contact, and single **Sign up** call-to-action. The Sign up link goes to `/register`. Staff users should enter via the separate `/staff/login` address, never the public landing page.

**Change text here:** About and feature paragraphs in `LandingPage.jsx`; team contacts in `constants.js`; navigation and button in `PublicHeader.jsx`.

## 2. Authentication — `/register` and `/login`

**Main code:** `src/pages/RegisterPage.jsx`, `src/pages/LoginPage.jsx`.

**Also used:** `src/components/AuthLayout.jsx`, `src/components/FormField.jsx`, `src/context/AuthContext.jsx`, `src/api/services.js`, `src/api/dtos.js`, `src/api/http.js`, `src/data/constants.js`.

`RegisterPage.jsx` handles first-time account creation; `LoginPage.jsx` is for existing users. The homepage's **Sign up** button points to the registration page, and registration includes a link to login. The login page redirects to `/profile` after successful authentication.

### Important real API contract

The current published Java `RegisterRequest` accepts **only** `fullName`, `email`, `password` and automatically creates a `CONTRACTOR` user. `LoginRequest` accepts only `email`, `password`. The extra profile fields and public choice between `BIDDER` / `LISTER` work **only in demo mode** until the backend team extends its DTOs and role policy. The frontend currently maps `CONTRACTOR` to BIDDER and does not support live Lister signup. This is an interim adapter, not an agreed permanent contract.

`src/api/dtos.js` contains the JSON mapping. Do not include passwords in Git commits or screenshots. The application stores demo data in browser storage only; it is not production authentication.

## 3. Bidder after-login pages — `/profile`, `/bidder`, `/bidder/my-bids`

**Main code:** `src/pages/BidderPage.jsx`, `src/pages/ProfilePage.jsx`.

**Also used:** `src/components/TenderTable.jsx`, `src/components/TenderDetailsPanel.jsx`, `src/components/BidForm.jsx`, `src/pages/EditBidPage.jsx`, `src/components/WorkspaceLayout.jsx`, `src/components/RequireRole.jsx`, `src/api/services.js`, `src/api/demoStore.js`, `src/utils/format.js`.

`BidderPage` lists approved/published tenders, filters by the user's sector, and displays selected tender details. `BidForm.jsx` is the actual bid submission UI (inside TenderDetailsPanel). `MyBidsPage` is **exported from the same `BidderPage.jsx` file**. `EditBidPage.jsx` handles bid changes before the deadline in demo mode.

Backend must re-check eligibility, confidentiality, deadline, and document uploads. The frontend cannot secure these alone.

## 4. Lister after-login pages — `/profile`, `/lister`, `/lister/my-tenders`

**Main code:** `src/pages/ListerPage.jsx`, `src/pages/ProfilePage.jsx`.

**Also used:** `src/components/TenderForm.jsx`, `src/pages/EditTenderPage.jsx`, `src/components/WorkspaceLayout.jsx`, `src/components/RequireRole.jsx`, `src/components/StatusBadge.jsx`, `src/api/services.js`, `src/api/demoStore.js`.

`ListerPage` shows summary cards and a create-tender form. `MyTendersPage` is **exported from the same `ListerPage.jsx` file**, and handles requesting Admin approval. `EditTenderPage.jsx` handles draft edits.

Lister cannot publish directly; Admin approval comes first in the proposed workflow. Live tender endpoints are still proposed, not implemented in the published backend.

## Shared routing, CSS and API files

- `src/App.jsx` — page URL -> React component, protected routes, and staff routes.
- `src/main.jsx` — mounts React, browser router, auth provider, theme provider.
- `src/context/AuthContext.jsx` — login/session/user management.
- `src/context/ThemeContext.jsx` — light/dark theme state.
- `src/api/dtos.js` — JSON field transformations for Spring Boot.
- `src/api/services.js` — demo vs live API method calls.
- `src/api/http.js` — `fetch`, JSON/FormData, errors, authorization header.
- `src/index.css` — Tailwind and reusable styles.
- `src/components/WorkspaceLayout.jsx` — sidebar/header for Bidder/Lister workspaces.

## Recommended Git workflow

In Git Bash, while inside your **cloned** `E:/Projects/TenderBlock` repository:

```bash
git switch main
# If GitHub connectivity is available, fetch the latest main first.
git switch -c feature/frontend-five-role-ui
# Then copy/integrate this project's files INTO pure-tender-web/, not the repository root.
git status
```

**Do not blindly replace the other team's `package.json`, Vite config, and code**: compare with the currently checked-out Git branch and merge dependencies appropriately. Put your code inside `pure-tender-web/` as agreed with teammates. You may create smaller sequential commits, but first ensure the shared code required by the pages is included so that the branch builds.

```bash
git add pure-tender-web/
git diff --cached --stat
git commit -m "feat(frontend): integrate landing, auth, bidder and lister flows"
git push -u origin feature/frontend-five-role-ui
```

The local feature branch can be created without network access; remote push needs GitHub connectivity.

## Running this standalone ZIP for UI testing

```powershell
# In the directory that contains package.json
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Set `VITE_DEMO_MODE=true` for the browser demo; default public URL is typically `http://localhost:5173/`.

Use `npm.cmd run test:demo` and `npm.cmd run test:dto` for built-in non-browser tests. `npm.cmd run build` should be run after dependency installation. **The live Spring Boot backend and real Fabric transaction integration are not complete in this code.**
