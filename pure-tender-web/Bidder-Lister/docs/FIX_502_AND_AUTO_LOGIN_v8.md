# v8 — Registration gateway error and direct workspace access

## Why `Request failed (502)` happened

The Vite dev proxy attempted `POST /api/v1/auth/register/CONTRACTOR` and printed `ECONNREFUSED`. This means nothing was accepting its request at the configured Spring Boot target (`http://localhost:8080` in `.env.example`). The browser could render React independently, but live registration depends on Spring Boot and its PostgreSQL user repository. Hyperledger Fabric is not part of the registration operation; however, the backend `FabricService` initializes in `@PostConstruct` and may stop Java startup if Fabric prerequisites are missing. This backend startup dependency cannot be repaired in React.

## Changes from v7

- `src/context/AuthContext.jsx`: successful team registration now signs in using the `accessToken` returned by Spring Boot, without submitting credentials again. Demo signup also signs in using the demo store; other backend contract remains unchanged.
- `src/api/authSession.js`: pure response mapper; trusts backend returned role and account status rather than form values. Does not save password in the session.
- `src/api/services.js`: retains the returned company profile for the initial session; if profile creation fails after account registration, retains the valid registration session, marks company profile missing and supports completion in My Profile.
- `src/pages/RegisterPage.jsx`: after successful registration, routes directly to `/bidder` or `/lister`. A failed backend request **never** creates a synthetic live account. For HTTP 502, advises to check connectivity and attempt login before repeating registration.
- `src/pages/LoginPage.jsx`: successful sign-in now opens the role dashboard rather than the profile page.
- `src/components/WorkspaceLayout.jsx`: prominent account-pending notice on both role dashboards; incomplete company-profile link; register success message.
- `src/api/http.js`: more actionable HTTP 502/503/504 error message explaining backend proxy connectivity.
- `tests/registration-v8.test.mjs`: checks server-returned JWT/session role and pending status plus partial-profile recovery.

## Run on Windows (PowerShell)

```powershell
cd E:\Project\TenderBlock-SEM-Test\pure-tender-web
Copy-Item .env.example .env
# Set VITE_DEMO_MODE=false to use the real backend, or true for frontend-only demonstration.
npm.cmd install
npm.cmd run test:team
npm.cmd run dev
```

In another terminal, verify `Test-NetConnection localhost -Port 8080`. If `TcpTestSucceeded: False`, **real** registration is unavailable until the backend is running. Do not change `VITE_DEMO_MODE` to `true` and present accounts as database-backed.

On successful real registration (`201 Created`), the backend returns `accessToken`, `role` (`CONTRACTOR`/`AUTHORITY`), and `accountStatus: PENDING`. The frontend uses the token to open the role dashboard, with a pending Admin-verification message. Later account approval may require signing out and signing back in to refresh status.

**Important:** No full Spring Boot / PostgreSQL / Fabric integration run was possible in this environment. Check with your teammate that the Spring Boot backend is actually listening on port 8080.
