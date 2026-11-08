# TenderBlock Evaluator Portal

Local-only Evaluator UI, reusing the Bidder/Lister portal's login layout, header, wordmark, colors, and theme behavior.

## Run locally

From this folder in PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:5175`. The app starts in browser demo mode by default.

### Demo account

| Role | Email | Password |
|---|---|---|
| Evaluator | `evaluator.demo@tenderblock.local` | `Demo@12345` |

This is a local simulated account with sample tenders and bids. It does not create a user in the Spring Boot database, and demo evaluations are not sent to the backend. The demo registration form is also only a preview.

## Use the backend

Copy `.env.example` to `.env.local`, set `VITE_DEMO_MODE=false`, then start the Spring Boot API on `http://localhost:8080` and run Vite again. Vite proxies `/api/v1` requests to Spring Boot. The account must already exist in that backend with the `EVALUATOR` role.

Connected endpoints currently present in this repository:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register/EVALUATOR` (sends only `fullName`, `email`, and `password`; new accounts start `PENDING` and need Admin verification)
- `GET /api/v1/evaluator/tenders/my`
- `POST /api/v1/evaluator/tenders/{tenderId}/open-bids`
- `GET /api/v1/evaluator/tenders/{tenderId}/bids`
- `GET /api/v1/evaluator/bids/{bidId}/proposal`
- `GET /api/v1/evaluator/bids/{bidId}/evaluation`
- `PUT /api/v1/evaluator/bids/{bidId}/evaluation`
- `POST /api/v1/evaluator/bids/{bidId}/evaluation/finalize`

## Source layout

- `src/pages/` — sign-in, registration, and evaluator workspace pages
- `src/components/` — shared headers, form elements, assignment rows, and bid scoring cards
- `src/context/` — authentication session and dark/light theme
- `src/api/` — backend client, authentication, and evaluator endpoint methods
- `src/data/` — local demo accounts, tenders, bids, and scores
