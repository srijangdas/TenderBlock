# TenderBlock Operations Portal

Local-only Admin and Auditor UI, reusing the Bidder/Lister portal's login layout, header, wordmark, colors, and theme behavior.

## Run locally

From this folder in PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:5174`. The app starts in browser demo mode by default.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin.demo@tenderblock.local` | `Demo@12345` |
| Auditor | `auditor.demo@tenderblock.local` | `Demo@12345` |

These are local simulated accounts and sample queue data. They do not create users in the Spring Boot database, and demo actions are not sent to the backend.

## Use the backend

Copy `.env.example` to `.env.local`, set `VITE_DEMO_MODE=false`, then start the Spring Boot API on `http://localhost:8080` and run Vite again. Vite proxies `/api/v1` requests to Spring Boot. The account must already exist in that backend and have the correct staff role.

Connected endpoints currently present in this repository:

- `POST /api/v1/auth/login`
- Admin: `GET /admin/users/pending`, `GET /admin/users`, `GET /admin/tenders/pending`, `PATCH /admin/users/{id}/verify`, `PATCH /admin/users/{id}/reject`, `PATCH /admin/tenders/{id}/approve`, `PATCH /admin/tenders/{id}/reject`
- Auditor: `GET /auditor/reports`, `GET /tenders/{id}` (held-tender status), `POST /auditor/reports/{id}/claim`, `POST /auditor/reports/{id}/resolve`, `POST /auditor/tenders/{id}/award`

In the current backend, resolving a report with `issueConfirmed: true` voids the held tender; the UI calls this out before submission. If no issue is confirmed, the report is dismissed, and the auditor may award the held tender after all its reports are resolved. There is no auditor endpoint to browse completed awards for retrospective review, so that future audit view is not represented here. Auditor registration is intentionally absent; the legacy registration route is not called.

## Source layout

- `src/pages/` — sign-in and operations workspace pages
- `src/components/` — shared headers, theme toggle, sidebar, dialogs, and display components
- `src/context/` — authentication session and dark/light theme
- `src/api/` — backend client and role-specific API methods
- `src/data/` — local demo accounts and example queue data
