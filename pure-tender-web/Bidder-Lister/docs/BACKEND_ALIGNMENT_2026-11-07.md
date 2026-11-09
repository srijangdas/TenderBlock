# TenderBlock backend alignment — Bidder and Lister

## Verified source snapshot

- GitHub: https://github.com/srijangdas/TenderBlock
- Branch reviewed: `backend`
- Pinned commit: `2b13f5d4703c92a4a6dbf7fc59d9704343e98985`
- Date: 2026-11-07
- Backend scope inspected: controllers, auth/role DTOs, tender and bid DTOs, services, models, repositories, security config, Fabric service, Maven dependencies and app setup files.
- **No Java backend files were modified.** No live local Spring Boot/PostgreSQL/Fabric test was performed.

## API contract matrix

| Actor and use | Method and path (after `/api/v1`) | JSON / request body | Response |
|---|---|---|---|
| Public Bidder signup | POST `/auth/register/CONTRACTOR` | `fullName,email,password` | `accessToken,tokenType,userId,fullName,email,role,accountStatus` |
| Public Lister signup | POST `/auth/register/AUTHORITY` | `fullName,email,password` | Same auth response |
| Login | POST `/auth/login` | `email,password` | Same auth response |
| Company profile creation | POST `/company/profile` | `companyName,registrationNumber,gstin,pan,address,contactNumber,website` | CompanyProfileResponse |
| My company profile | GET `/company/profile/me` | none | CompanyProfileResponse |
| Lister create | POST `/tenders` | `title,description,estimatedValue,submissionDeadline,openingDate` | TenderResponse with `SUBMITTED` |
| Lister list | GET `/tenders/my?page=0&size=100` | none | Page of TenderResponse |
| Lister update | PUT `/tenders/{id}` | Same tender body | TenderResponse |
| Lister cancel | PATCH `/tenders/{id}/cancel` | `reason` (1–2000 chars) | TenderCancellationResponse |
| Bidder published list | GET `/tenders/published?page=0&size=100` | none | Page of TenderResponse |
| Tender detail | GET `/tenders/{id}` | none | TenderResponse |
| Bidder draft | POST `/bids/tender/{tenderId}` | `quotedAmount` numeric | BidResponse (`DRAFT`) |
| Bidder update draft | PUT `/bids/{bidId}` | `quotedAmount` numeric | BidResponse |
| Bidder proposal upload | PUT `/bids/{bidId}/proposal` | multipart form key `file` (PDF, ≤10MB) | 204 No Content |
| Bidder finalize | POST `/bids/{bidId}/submit` | no body | BidResponse (`SUBMITTED`) |
| Bidder list | GET `/bids/my?page=0&size=100` | none | Page of BidResponse |
| Bidder details | GET `/bids/{bidId}` | none | BidResponse |
| Bidder proposal download | GET `/bids/{bidId}/proposal` | bearer token header | PDF bytes |

Backend `BidResponse` includes `id,tenderId,tenderTitle,contractorId,contractorName,quotedAmount,status,submittedAt,openedAt,createdAt,updatedAt,proposalUploaded`. The frontend normalizes `quotedAmount` into its display `amount` without modifying backend JSON.

### Example request bodies

**Create tender:**
```json
{
  "title": "Library maintenance",
  "description": "Repairs and maintenance of library facilities.",
  "estimatedValue": 1200000,
  "submissionDeadline": "2030-01-10T10:00:00.000Z",
  "openingDate": "2030-01-11T10:00:00.000Z"
}
```

**Create draft bid:**
```json
{"quotedAmount": 1150000}
```

**Cancel tender:**
```json
{"reason":"The scope of work has been withdrawn."}
```

## Back-end enforced state rules (not changed by this frontend)

- New tenders have status `SUBMITTED`; Lister edits only while `SUBMITTED`; Admin publishes.
- Lister cancellation applies to their own `PUBLISHED` or `UNDER_EVALUATION` tenders.
- Bidding requires a `VERIFIED` Contractor and a published tender before the deadline.
- One bid per Contractor per tender; only a draft bid can be changed or have its PDF uploaded.
- The backend requires a PDF before it permits submitting the draft.
- Evaluation and Auditor roles have their own controllers; they are outside the scope of this Bidder/Lister UI update.
- The current Fabric service in this commit still exposes example `CreateAsset`/`GetAllAssets` operations. This frontend does not claim tender-specific on-chain transaction confirmation.

## What must be tested on a running team system

1. Register a Lister, create company profile, Admin verifies account.
2. Lister creates tender with opening date after deadline. Admin approves it with an assigned Evaluator.
3. Register Bidder and company profile, Admin verifies Bidder.
4. Bidder sees published tender, creates draft, uploads PDF, submits. Refresh My bids and download file.
5. Check that unverified account gets 403 for submission and that submitted bids cannot be edited.
6. Lister sees status change, and can cancel a published tender using a reason.
7. Backend engineer verifies DB state, evaluator opening after deadline and any Fabric integration separately.

## Exact Git steps after review (do not overwrite teammates' backend)

```bash
cd /e/Projects/TenderBlock
git fetch origin
git switch your-existing-feature-branch
# Review/copy the source files into pure-tender-web/; do not copy node_modules or .env
git status
git add pure-tender-web/
git diff --cached --stat
git commit -m "feat(frontend): align bidder lister flows with latest backend"
git push -u origin your-existing-feature-branch
```

If your branch already has an upstream, `git push` alone is enough. Merge through a pull request after the full local build and role-based API tests pass.
