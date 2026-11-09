> **Historical v4 document.** Some endpoint/role limitations described here are addressed by the new `backend-overlay`. Follow the integration kit root `README.md` and `docs/API_CONTRACT.md` for the updated implementation. Do not treat this file as a deployment checklist.

# TenderBlock header, theme and registration update

## What was changed

- `src/components/PublicHeader.jsx`: exactly one public **Sign up** button at top right, to `/register`; a separate moon/sun theme toggle. The same single CTA appears in mobile navigation. This wording is intentional: the user clarified that they mean *creating a first-time account*, not logging in to an existing account.
- `src/pages/RegisterPage.jsx`: full Bidder/Lister form and existing-account link to `/login`. **Do not replace the login page**. Staff use `/staff/login` directly, without the public landing page.
- `src/context/ThemeContext.jsx` and `src/components/ThemeToggle.jsx`: app-wide theme state and toggle, localStorage preference, automatic system default. Registered in `src/main.jsx` and present in public, staff, bidder and lister headers.
- `src/index.css`: Tailwind v4 `.dark` variant and shared dark theme colours.
- `src/pages/LandingPage.jsx`: first-time account calls-to-action point to `/register`, not `/access`.
- `src/api/dtos.js` + `src/api/services.js`: **live** registration serializes *only* fullName/email/password exactly as `RegisterRequest.java`; demo registration serializes the extended Bidder/Lister form. Lister registration is intentionally disabled in live mode until the backend changes roles.

## Backend JSON: currently published GitHub repository

Java `RegisterRequest.java`:

```json
{ "fullName": "Example User", "email": "user@example.com", "password": "SafePassword123" }
```

Java `LoginRequest.java`:

```json
{ "email": "user@example.com", "password": "SafePassword123" }
```

The current Spring Boot `Role.java` defines `AUTHORITY`, `CONTRACTOR`, `EVALUATOR`, `AUDITOR`, `ADMIN`. Public registration unconditionally creates `CONTRACTOR`. It does *not* accept Bidder vs Lister role selection and does not persist age, industry, phone number, institute etc. The React demo captures those fields locally, but **a real integration needs the backend team to extend `RegisterRequest`, `User`, role enum and service validation**. Never claim extra details were saved in the backend until it is updated.

## Where the demo messages originate

- `src/components/DemoNotice.jsx` is the notice embedded into `src/components/AuthLayout.jsx` and `src/components/WorkspaceLayout.jsx`.
- `src/pages/LoginPage.jsx` includes example demo account buttons.
- `src/pages/StaffLoginPage.jsx` includes staff demo account text.
- `src/pages/StaffWorkspacePage.jsx` includes a staff demo warning.
- `src/pages/LandingPage.jsx` and `src/components/TeamFooter.jsx` contain public marketing/about copy; the frontpage prototype wording has been rewritten, but the local demo is still only a demo.
- `src/api/demoStore.js` contains local-only accounts, fixtures and simulation; `.env` `VITE_DEMO_MODE=true` activates it.

**Do not hide all indicators of simulated blockchain activity while keeping demo mode enabled.** You can edit wording in the components above, but demo statuses must remain clear. To use real Spring Boot, set `VITE_DEMO_MODE=false` and implement the missing backend endpoints/roles, then restart Vite.

## Windows VS Code steps

1. Extract updated ZIP and open folder `TenderBlock_Complete_Frontend_v4` (the one containing `package.json`).
2. Open Terminal > New Terminal.
3. Run `node -v` and `npm.cmd -v` (PowerShell alternative to `npm -v`).
4. Copy config with `Copy-Item .env.example .env` (skip if `.env` already exists).
5. Confirm `VITE_DEMO_MODE=true` for now.
6. Run `npm.cmd install`, `npm.cmd run dev`.
7. Open Vite URL, usually `http://localhost:5173/`. Use `Ctrl+F5` if you still see cached text.
8. Run `npm.cmd run test:dto`, `npm.cmd run test:demo`, `npm.cmd run build`, `npm.cmd run lint` to check the project.

If you are modifying an older extracted copy in VS Code, replace its matching `src` and configuration files (back up any teammate edits first), or open the new full project and work in a dedicated Git feature branch.
