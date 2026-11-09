> **Historical v4 document.** Some endpoint/role limitations described here are addressed by the new `backend-overlay`. Follow the integration kit root `README.md` and `docs/API_CONTRACT.md` for the updated implementation. Do not treat this file as a deployment checklist.

> **Note (v3):** This file was carried over from the earlier Bidder/Lister-only edition. For current API endpoints and the five-actor implementation, start with [SPRING_BOOT_API_CONTRACT.md](SPRING_BOOT_API_CONTRACT.md), [IMPLEMENTATION_MATRIX.md](IMPLEMENTATION_MATRIX.md), and [GITHUB_MERGE_GUIDE.md](GITHUB_MERGE_GUIDE.md). Some descriptions below refer to older placeholder screens.

# API and DTO integration checklist

This UI has been built **against proposed contracts**, because the live Spring Boot registration and tender DTOs are not yet verified. The GitHub repo's public React app was still the default Vite starter when checked on 2026-10-30. The uploaded SRS/SDD specify older role names (`CONTRACTOR` and `AUTHORITY`), while the newer whiteboard has `BIDDER` and `LISTER`.

Confirm these changes with your backend teammate **before** setting `VITE_DEMO_MODE=false`.

| Frontend call | Proposed endpoint | Open question |
| --- | --- | --- |
| Register | `POST /api/v1/auth/register` | Exact `RegisterRequest` JSON; how LISTER provisioning/verification works |
| Login | `POST /api/v1/auth/login` | `LoginRequest`, JWT field `accessToken` or `token`, `user` DTO |
| Current user | `GET /api/v1/users/me` | Response JSON and mapped role values |
| List tenders | `GET /api/v1/tenders` | Status and paginated content shape |
| My tenders | `GET /api/v1/tenders?mine=true` | Whether server accepts this filter |
| Create draft | `POST /api/v1/tenders` | `TenderCreateRequest` fields, whether budget/sector are supported |
| Admin approval request | `POST /api/v1/tenders/{id}/request-approval` | Endpoint is NOT in earlier SDD and must be added or changed |
| Submit bid + files | `POST /api/v1/tenders/{id}/bids` | Whether multipart allowed, accepted part names, required metadata |
| My bids | `GET /api/v1/bids/me` | Confirm endpoint and confidentiality policy |

## Proposed `RegisterRequest`
```json
{
  "fullName": "Asha Sharma",
  "email": "asha@company.example",
  "password": "sent-only-over-TLS",
  "phoneNumber": "+91 9876543210",
  "organizationName": "Example Construction Pvt Ltd",
  "organizationType": "Private company",
  "registrationId": "ORG-001",
  "industry": "Infrastructure",
  "address": "Office, Jaipur",
  "role": "BIDDER"
}
```
This is an **example**, not a claimed backend DTO. The backend MUST enforce role assignment and cannot trust the client role without verification. In particular, public registration of LISTER may require admin approval.

## Privacy / trust boundary
- No OAuth/Google/GitHub sign-in (user explicitly excluded it).
- Demo passwords are hashed in browser and stored in localStorage **only for learning**, never use this pattern as actual authentication.
- Demo file inputs store filename metadata only, not document bytes.
- No real Hyperledger transaction or bid hash verification exists in this frontend.
- For production: Spring Security/JWT, server-side BCrypt/Argon2, rate-limiting, protected storage, HTTPS, CORS and role/resource access controls, secure upload validation.
- A frontend route guard is only a convenience. The backend must check each request.
- The public landing page is anonymous and therefore cannot know the visitor is Admin/Evaluator/Auditor. Link staff directly to `/staff/login` or provide a separate staff domain/path.
