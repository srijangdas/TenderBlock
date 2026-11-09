> **Historical v4 document.** Some endpoint/role limitations described here are addressed by the new `backend-overlay`. Follow the integration kit root `README.md` and `docs/API_CONTRACT.md` for the updated implementation. Do not treat this file as a deployment checklist.

# Spring Boot integration contract — review with backend team

## Ground truth in the team repository, checked 30 October 2026
Repository: https://github.com/srijangdas/TenderBlock at main (`PureTender/`).

At inspection time the published backend contained:
- `POST /api/v1/auth/register` — `RegisterRequest(fullName, email, password)` and `AuthResponse(accessToken, tokenType, userId, fullName, email, role)`.
- `POST /api/v1/auth/login` — `LoginRequest(email, password)`; response shape is the same flat `AuthResponse`.
- `/api/blockchain/assets` and `/api/blockchain/asset` — testing functions using sample asset chaincode, NOT TenderBlock tender/bid transactions.
- `Role` enum: `AUTHORITY, CONTRACTOR, EVALUATOR, AUDITOR, ADMIN`.
- The registration service **always assigns CONTRACTOR** and login JWT creation hardcodes `CONTRACTOR` into the token even if the actual user is a staff account. See `docs/patches/AuthService-role-claim.patch`.
- No TenderController, BidController, evaluator, auditor or admin workflow endpoints were present in the checked main-branch tree.

The new 5-actor workflow uses `LISTER, BIDDER, ADMIN, EVALUATOR, AUDITOR`. **Backend agreement and migration are necessary**. The frontend maps legacy `AUTHORITY` and `CONTRACTOR` for display, but cannot assign LISTER in live mode until the server supports it.

## Required final backend decisions

1. Public registration: choose `BIDDER` or `LISTER`, exactly one. Never allow privileged staff roles in public registration. Public accounts start `verified=false`; Admin verifies before privileged operations. Define whether all Bidders need verification as the whiteboard suggests.
2. Profile fields: persist `fullName, email, phoneNumber, age, organizationName, organizationType, registrationId, industry, address, designation, yearsOfExperience, role` and a password hash. Never return a password hash.
3. Decide whether GET `/api/v1/users/me` is necessary. Current AuthResponse contains user fields, but not the full profile or `verified`; an authenticated profile endpoint is recommended.
4. JWT must carry the user's real assigned role and the server must enforce the role/resource checks on every operation.
5. Agree file-size/type limits, off-chain storage path, SHA-256 digest generation, and the bid-commitment scheme (canonical representation + protected salt if sealed bid opening is required).
6. Decide opening/closing, deadline enforcement, evaluator assignment, scoring, auditor assignment, flagging, award selection and audit visibility. The UI demo's highest-score award is a simulation, not a procurement recommendation.
7. Distinguish PostgreSQL acceptance, persisted outbox event, Fabric submission, Fabric commit, and local hash comparison. Never turn `PENDING` into `CONFIRMED` only because HTTP returned 200.

## Proposed endpoints, NOT currently present in published backend

| HTTP | Path | Role | Request/response idea |
| --- | --- | --- | --- |
| GET | `/api/v1/tenders` | Public or BIDDER | List visible PUBLISHED tenders; optionally paginated |
| GET | `/api/v1/tenders/{id}` | Authorized | Tender DTO |
| GET | `/api/v1/tenders/mine` | LISTER | List own drafts and submissions |
| POST | `/api/v1/tenders` | LISTER | TenderCreateRequest → Tender DTO (`DRAFT`) |
| PATCH | `/api/v1/tenders/{id}` | LISTER owner | Draft edit DTO → Tender DTO |
| POST | `/api/v1/tenders/{id}/request-approval` | LISTER owner | `PENDING_APPROVAL` transition |
| GET | `/api/v1/admin/review-queue` | ADMIN | `{users:[...],tenders:[...]}` |
| GET | `/api/v1/admin/auditors` | ADMIN | Authorized auditor summaries |
| POST | `/api/v1/admin/users/{id}/verify` | ADMIN | Mark account verified; record audit |
| POST | `/api/v1/admin/tenders/{id}/approve` | ADMIN | `{auditorId}` → publish with outbox |
| GET | `/api/v1/admin/tenders` | ADMIN | Published/under evaluation/awarded/flagged tenders |
| POST | `/api/v1/admin/tenders/{id}/close` | ADMIN | Enforce deadline before closing |
| POST | `/api/v1/admin/tenders/{id}/finalize` | ADMIN | Approval/flag after evaluation and audit checks |
| POST | `/api/v1/tenders/{id}/bids` | BIDDER | multipart amount, proposalSummary, remarks, eligibilityProof, proposalDocument |
| GET | `/api/v1/bids/me` | BIDDER | Only user's bids, never other bidder's confidential data |
| PATCH | `/api/v1/bids/{id}` | BIDDER owner | multipart changed amount/summary, optional replacement files, deadline check |
| GET | `/api/v1/evaluator/tenders` | EVALUATOR | Assigned opened tenders and permitted bid fields |
| POST | `/api/v1/evaluator/bids/{id}/evaluation` | Assigned EVALUATOR | `{score,remarks}` |
| GET | `/api/v1/audit/assigned` | AUDITOR | Assigned tender + permitted bids |
| POST | `/api/v1/audit/bids/{id}/verify` | Assigned AUDITOR | multipart `document` and `kind` (`proposal`/`evidence`); return verification result |
| GET | `/api/v1/tenders/{id}/audit` | AUDITOR/ADMIN | Event list with transaction references and statuses |

### DTO examples

**TenderCreateRequest** proposed:
```json
{
  "title": "Laboratory equipment procurement",
  "description": "Supply and install laboratory devices",
  "sector": "Education",
  "department": "Research Department",
  "budget": 3500000,
  "submissionDeadline": "2027-02-01T17:00:00.000Z",
  "eligibilityCriteria": "3 years of relevant work",
  "requiredDocuments": "Registration certificate; proposal PDF"
}
```

**Login response already implemented in your team's repository:**
```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "userId": "<UUID>",
  "fullName": "Sample User",
  "email": "user@example.org",
  "role": "CONTRACTOR"
}
```

**Admin review queue** proposed:
```json
{
  "users": [{"id":"<UUID>","fullName":"First User","email":"new@example.org","role":"BIDDER","verified":false}],
  "tenders": [{"id":"<UUID>","title":"Tender title","status":"PENDING_APPROVAL"}]
}
```

**Ledger status** recommended fields on tender/bid/transaction responses:
```json
{
  "ledgerStatus": "PENDING",
  "transactionId": null,
  "verified": null,
  "messageCode": "FABRIC_SUBMISSION_QUEUED"
}
```
Allowed statuses should be settled: `NOT_SUBMITTED, PENDING, SUBMITTED, CONFIRMED, FAILED, RECONCILIATION_REQUIRED`. Demo-only fields such as `DEMO_ONLY` must never be accepted as proof of a confirmed Fabric transaction.

## Client file mapping

- `src/api/dtos.js` — request mapping and response normalization.
- `src/api/services.js` — live/demo adapter; verify each endpoint against the final controller path.
- `src/api/http.js` — network errors, HTTP errors, JSON, multipart handling and bearer token.
- `src/context/AuthContext.jsx` — session state; never rely on role guards as server-side authorization.

**Do not merge this API proposal into your backend without agreement with the team**. The earlier SDD and newest whiteboard use different role and route names; the canonical contract must be decided jointly.
