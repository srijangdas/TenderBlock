# TenderBlock frontend — Bidder and Lister integration (v6)

This is a React + Vite + Tailwind CSS frontend based on the refined v5 UI, adapted to the **actual team Java backend snapshot**.

**Backend branch:** `backend` from `https://github.com/srijangdas/TenderBlock`, commit `2b13f5d4703c92a4a6dbf7fc59d9704343e98985` retrieved on 2026-11-07. At retrieval, `main` pointed to the same commit. Do not assume newer teammate pushes preserve these DTOs; compare before final merge.

## Start in VS Code (Windows PowerShell)

Open the `pure-tender-web` folder (the folder with `package.json`), then:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run test:team
npm.cmd run test:dto
npm.cmd run test:demo
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Open http://localhost:5173/. Your Spring Boot API must run on http://localhost:8080/ with PostgreSQL and its configured Fabric setup. The Vite proxy forwards `/api/v1` to Spring Boot. If you only need a standalone UI demo, change `.env` to `VITE_DEMO_MODE=true` and restart Vite. **Do not claim demo actions reached a real server or blockchain.**

## What changed from v5

- Preserved the landing page, login, registration, dark mode, Bidder/Lister layouts and their React Router paths.
- Registration: `POST /api/v1/auth/register/CONTRACTOR` or `/AUTHORITY`, only `fullName`, `email`, `password`; then separate company-profile POST with `companyName`, `registrationNumber`, `gstin`, `pan`, `address`, `contactNumber`, `website`.
- Maps backend `CONTRACTOR` → user-facing Bidder, `AUTHORITY` → Lister. Displays `accountStatus` from the Java login response.
- Lister: `POST /api/v1/tenders`, `GET /api/v1/tenders/my`, `PUT /api/v1/tenders/{id}`, `PATCH /api/v1/tenders/{id}/cancel`. Uses `title`, `description`, `estimatedValue`, `submissionDeadline`, `openingDate` only. New tenders start `SUBMITTED`, not `DRAFT`. Admin approval publishes them.
- Bidder: `GET /api/v1/tenders/published`; `POST /api/v1/bids/tender/{id}` creates DRAFT with `quotedAmount`; `PUT /api/v1/bids/{id}/proposal` uploads one PDF with multipart key **`file`**; `POST /api/v1/bids/{id}/submit` finalizes. Quotation updates use `PUT /api/v1/bids/{id}` *only while DRAFT*.
- Bid history: `GET /api/v1/bids/my`, `GET /api/v1/bids/{id}`, and authorized download `GET /api/v1/bids/{id}/proposal`. Handles Spring Data `Page` responses and displays `quotedAmount`, `proposalUploaded`, and `BidStatus` accurately.
- Recoverable upload: if the draft is created but upload/submission fails, the UI keeps its draft ID. The user may reopen it under **My bids** and retry. This avoids duplicate draft creation.
- The backend DTO does **not** accept a separate eligibility-proof PDF, proposal summary, sector recommendations or Lister eligibility lists; v6 hides those unsupported input fields in live mode and retains them only in the clearly labelled browser demo.

## Important constraints

1. This is a **frontend-only update**. It neither edits nor endorses the correctness of the team's Java or blockchain code.
2. The Staff workspace retains its older demo/overlay API mapping and needs a separate backend contract update by the staff owner. Your task here is Bidder and Lister.
3. Some backend features can only be exercised after role-specific accounts are Admin-verified. The frontend shows that requirement, and the Java backend enforces it.
4. This source was syntax-parsed and tested with mocked API calls; **a live integrated Vite + Spring Boot + PostgreSQL + Fabric run has not been verified here**.
5. If your teammate pushes again, first recheck the commit and read its changed `*Controller.java`, request DTOs and response DTOs before merging.

For a detailed endpoint list and merge procedure, see `docs/BACKEND_ALIGNMENT_2026-11-07.md`.
