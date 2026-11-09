# Backend handoff

Inspected `srijangdas/TenderBlock`, branch `main`, commit `f2e498e49cc766ec3536ae039f00358b9c3d4a62` on 9 November 2026. The source of truth was the Java controllers, DTOs, enums and services under `PureTender/src/main/java`. The packaged machine-readable snapshot is `backend-contract.json`.

37 frontend operations match implemented Java controller methods. This is a route/source check, not a guarantee that the database, Fabric network or deployed server is healthy.

## Existing contracts retained

- Authentication: POST `/auth/login`, POST `/auth/register/{role}`. Read `accessToken`, `userId`, `fullName`, `email`, `role`, `accountStatus` from the flat AuthResponse. The public user flow maps Bidder to CONTRACTOR and Lister to AUTHORITY. Evaluator applications fix the URL role to EVALUATOR.
- Public account creation sends exactly `fullName`, `email`, `password`. Company information is a separate authenticated POST `/company/profile`. If company creation fails after account creation, the account still exists; the UI supports recovery under Profile without registering again.
- Tender creation/update sends `title`, `description`, `estimatedValue`, `submissionDeadline`, `openingDate`. Datetime inputs are displayed in IST and sent as UTC instants. Decimal money strings avoid rounding large Java BigDecimal values through JavaScript Number.
- Tender creation returns SUBMITTED. Admin approves with PATCH `/admin/tenders/{id}/approve`, body `{ "evaluatorId": "<UUID>" }`. Rejection is PATCH with `{ "reason": "..." }`, at most 1000 characters.
- Bidding: POST `/bids/tender/{id}` with `{ "quotedAmount": "9000.25" }` → PUT `/bids/{id}/proposal` using multipart field `file` → POST `/bids/{id}/submit`. The upload's 204 response is valid. A retry reuses the saved draft reference.
- Admin account verification/rejection uses PATCH. Review and evaluator-selection queues load every Spring Page.
- Evaluator assignments: GET `/evaluator/tenders/my`. Opening bids uses POST. Scores use PUT `/evaluator/bids/{id}/evaluation` with `technicalScore`, `financialScore`, `remarks`; both scores must be supplied, from 0–100 with at most two decimal places. Finalization uses POST `/evaluation/finalize`. Final scores are locked; changing a saved draft requires saving again before submission.
- Auditor reports: GET `/auditor/reports`, POST `/reports/{id}/claim`, POST `/reports/{id}/resolve` with `issueConfirmed` and `resolutionNotes` (1–5000 characters). Held-tender award uses POST `/auditor/tenders/{id}/award` with `winningBidId` and optional `remarks` (at most 2000 characters). The backend remains responsible for report assignment, ownership, verification, tender state and award eligibility.
- Authenticated downloads use Bearer headers, not tokens in URLs. A 401 clears the common session. A 403 is reported without pretending success or changing the user's role.

All paths below are relative to `/api/v1`.

## Pending endpoints

The following routes were referenced by the supplied frontends but are absent from the inspected Java controllers. Their proposed response shapes describe what the existing UI consumes; these are not claims about an implemented API.

| Method and path | Proposed response | Current frontend behavior |
| --- | --- | --- |
| GET `/admin/tenders/{tenderId}/document` | File bytes with Content-Type, preferably PDF; optional Content-Disposition filename | Shows a clear download-unavailable message; tender fields remain reviewable. |
| GET `/auditor/tenders/flagged` | Spring Page of `{tenderId,tenderTitle,authorityName,status,flaggedAt,reportCount}` | On failure, derives related tender IDs from integrity reports and retrieves actual status with existing GET `/tenders/{id}`. Does not infer ON_HOLD or award eligibility. |
| GET `/auditor/tenders/completed` | Spring Page of `{tenderId,tenderTitle,authorityName,status,completedAt,winningBidId}` | Shows an availability notice. Does not invent completed tenders. |
| GET `/auditor/tenders/{tenderId}/audit` | `{tenderId,tenderTitle,status,databaseIntegrity,blockchainIntegrity,bids:[{bidId,bidderId,bidderName,databaseIntegrity,blockchainIntegrity}]}` | For 403/404/405/501, tries existing GET `/tenders/{id}` for basic details and keeps report actions available. Bid/integrity details remain unknown. The same codes can also represent an access or record problem; the fallback never grants access. |
| GET `/auditor/bids/{bidId}/proposal` | Authorized proposal file bytes, preferably application/pdf | Shows download unavailable; never substitutes the evaluator-only download URL. |

Optional endpoints are attempted so that their UI starts working once matching backend implementations are added. They receive the same authenticated transport and error handling as existing endpoints.

## Manual integration pass

Start the Java backend with its existing PostgreSQL/Fabric configuration and test with real accounts:

1. Register Bidder, Lister and Evaluator; verify them with an existing Admin.
2. Complete company profiles; create a Lister tender, reject/edit as applicable, then approve and assign an evaluator.
3. Submit a Bidder quotation and valid PDF. Retry a failed upload and verify there is only one draft. Confirm deadline, verification and ownership enforcement.
4. After the opening date, open bids, save and finalize evaluations. Check automatic award/hold behavior and the resulting award response against your Fabric network.
5. Claim and resolve actual integrity reports; award only when permitted by the backend. Check expired tokens and denied roles.
6. Implement the pending endpoints when ready, then exercise tender documents, auditor bid details, completed lists and auditor proposal downloads.

No Java source changes, database migrations, staff provisioning, deployments or repository writes were performed for this deliverable.
