# TenderBlock — Live Bidder/Lister v7 changes (8 Nov 2026)

## Read this first

This update is based on the **newer 8 Nov signup-aligned v6 source** (`TenderBlock_Bidder_Lister_Signup_Backend_Aligned_2026-11-08.zip`), not the older 7 Nov v6 ZIP. It preserves the existing Demo Mode because the team has not yet finished its final integration decision.

Backend contract reviewed from the GitHub `backend` branch of `srijangdas/TenderBlock`, commit `2b13f5d4703c92a4a6dbf7fc59d9704343e98985`. API endpoints can change if teammates push more commits.

## Live API calls (unchanged and aligned)

### Authentication and company profile

- `POST /api/v1/auth/register/CONTRACTOR` — Bidder; `{ "fullName", "email", "password" }`.
- `POST /api/v1/auth/register/AUTHORITY` — Lister; same JSON.
- `POST /api/v1/auth/login` — `{ "email", "password" }`.
- `POST /api/v1/company/profile` — create profile using bearer token.
- `GET /api/v1/company/profile/me` — load own profile.
- `PUT /api/v1/company/profile/me` — edit own profile while PENDING.

Profile JSON: `{ "companyName": "...", "registrationNumber": null, "gstin": null, "pan": null, "address": "...", "contactNumber": "...", "website": null }`.

### Bidder

- `GET /api/v1/tenders/published?page=0&size=10`
- `GET /api/v1/tenders/{tenderId}`
- `POST /api/v1/bids/tender/{tenderId}` — JSON `{"quotedAmount":"12500.50"}` (BigDecimal numeric *string* to avoid JS rounding).
- `PUT /api/v1/bids/{bidId}` — same JSON for draft updates.
- `PUT /api/v1/bids/{bidId}/proposal` — FormData field `file` with one PDF (10 MB max).
- `POST /api/v1/bids/{bidId}/submit`
- `GET /api/v1/bids/my?page=0&size=10`
- `GET /api/v1/bids/{bidId}`
- `GET /api/v1/bids/{bidId}/proposal` — authenticated download; server filename respected.

### Lister

- `POST /api/v1/tenders` — JSON `{ "title":"...", "description":"...", "estimatedValue":"12500.50", "submissionDeadline":"2030-05-01T05:00:00.000Z", "openingDate":"2030-05-02T05:00:00.000Z" }`.
- `GET /api/v1/tenders/my?page=0&size=10`
- `GET /api/v1/tenders/{tenderId}`
- `PUT /api/v1/tenders/{tenderId}` — same five-field JSON.
- `PATCH /api/v1/tenders/{tenderId}/cancel` — `{ "reason":"..." }`.

Real tender creation returns `SUBMITTED`, **not** `DRAFT`. Admin later approves/publishes; this frontend does not call an invented `request approval` endpoint in live mode.

## File-by-file changes

| Path | What changed |
|---|---|
| `src/api/contracts.js` | Exact decimal-string money; correct company profile field mapping; fixed-IST-to-UTC date conversion; tender validation. |
| `src/api/services.js` | Recovery when registration succeeds but profile saving fails; live company-profile get/create/update service; 10-record Spring Page queries; PDF download filename from Content-Disposition. |
| `src/context/AuthContext.jsx` | Persist profile edits into session; mark session expired on authenticated HTTP 401. |
| `src/components/RequireRole.jsx` | Redirect expired sessions to login with reason indicator. |
| `src/pages/LoginPage.jsx` | Show an expired-session notice. Login JSON stays `{email,password}`. |
| `src/pages/RegisterPage.jsx` | Recoverable signup notification when second profile request fails. Registration ID remains OPTIONAL. |
| `src/pages/ProfilePage.jsx` | Live `GET /me`, create missing profiles via `POST`, edit existing pending profiles via `PUT`. Include organization name, contact, address, registration, optional GSTIN/PAN/website. Staff and Demo Mode not edited. |
| `src/components/TenderForm.jsx` | 200-character title, paise input, date-time inputs interpreted as IST, `SUBMITTED` Admin-approval message. |
| `src/components/TeamBidForm.jsx` | Preserve exact quotation without Number() and validate two-decimal amount. One PDF upload and draft flow unchanged. |
| `src/components/TenderDetailsPanel.jsx` | Do not show unsupported demo eligibility/document details as though live fields; avoid showing new bid form until existing-bid lookup succeeds. |
| `src/components/TenderTable.jsx` | Hide unsupported sector in team-live table; clarify search is current-page-only. |
| `src/pages/BidderPage.jsx` | Visible pagination of published tenders and own bids; fetch exact tender for deep links; guard bid creation until existing bids have been checked. |
| `src/pages/ListerPage.jsx` | Visible My Tenders paging; live dashboard links to dedicated Create Tender page instead of repeating its form; statuses remain server-driven. |
| `src/components/PaginationControls.jsx` | NEW reusable previous/next pagination with counts. |
| `src/utils/decimal.js` | NEW BigDecimal-safe input validator (17 integer digits, 2 decimals, >= 0.01). |
| `src/utils/dateTime.js` | NEW fixed IST parser and reverse conversion for datetime-local. |
| `src/utils/format.js` | Show INR paise without rounding integer, BigInt-safe decimal-string display and full date/time in IST. |
| `tests/team-contract.test.mjs`, `tests/backend-2026-11-07.test.mjs` | Contract tests updated for decimal strings. |
| `tests/live-v7.test.mjs` | NEW tests for large exact amounts, dates, optional profile fields. |
| `package.json` | Version 7.0.0, run added regression test via `npm run test:team`. |

## Important boundaries (not fixed by this frontend change)

1. The backend does NOT provide `sector`, `eligibilityCriteria`, `requiredDocuments`, `designation`, `age`, or `yearsOfExperience`. This frontend does not invent their persistence. Demo pages may still display some of them.
2. The backend currently returns `authorityName` from the **Lister user's full name**, not company profile `companyName`. The backend team must change its response mapping if the website needs issuing organization name.
3. No `GET /auth/me` endpoint currently provides an updated account status. After Admin verification, sign **out and back in** to refresh the stored login `accountStatus`. A frontend refresh button cannot retrieve a fresh account status from the existing API.
4. The Java Staff/Admin/Evaluator/Auditor service implementations in the older bundled staff pages **are not aligned** with the current backend and are **not changed here**, because those actors are owned by the other frontend teammate. In particular, current Admin approval is `PATCH /api/v1/admin/tenders/{id}/approve` with `{ "evaluatorId": "<UUID>" }`, not the old `POST`/`auditorId` pattern.
5. Money is transmitted as JSON **decimal strings**, which Jackson normally coerces to `BigDecimal`; this must be verified against the teammate's real runtime settings. **Backend JSON numbers** already parsed to JS Number can lose precision; for full end-to-end precision, the backend should serialize BigDecimal as decimal strings too.
6. Pagination now uses Spring Data Page metadata; within-page search does not search ALL database tenders because no server search endpoint exists. Dashboard overview counts still fetch all own tenders via the legacy list adapter (up to 100 x 100 records).
7. This package does NOT alter the Java backend, PostgreSQL or Hyperledger Fabric. It cannot eliminate their startup requirements.
8. Session tokens are still stored in sessionStorage (existing v6 design); no refresh-token endpoint exists. For production, review token storage/security with the backend team.

## Checks performed

- `npm run test:team` — PASS.
- `npm run test:dto` — PASS.
- `npm run test:demo` — PASS.
- TypeScript JS/JSX parser checked 51 source/test files — 0 syntax errors.
- `npm run build` and `npm run lint` could not be run in this environment: Vite/ESLint dependencies were missing; offline npm package installation returned ENOTCACHED.
- **Live end-to-end testing against running Spring Boot/PostgreSQL was not performed.**

## Run in Windows PowerShell

Extract the full ZIP into a NEW folder; keep your existing working project as a backup. Open PowerShell at the extracted `pure-tender-web` folder, and run:

```powershell
Copy-Item .env.example .env
# Check .env: VITE_DEMO_MODE=false, VITE_BACKEND_TARGET=http://localhost:8080
npm.cmd install
npm.cmd run test:team
npm.cmd run build
npm.cmd run lint
npm.cmd run dev
```

For live registration/login you must start Spring Boot and its PostgreSQL database (Fabric remains a backend startup configuration problem). For frontend-only preview, change `VITE_DEMO_MODE=true` in `.env` and restart Vite.

Only copy these frontend files into your own Git feature branch. Do not stage local `.env`, `node_modules` or `dist` and do not overwrite your teammate's backend or staff code.
