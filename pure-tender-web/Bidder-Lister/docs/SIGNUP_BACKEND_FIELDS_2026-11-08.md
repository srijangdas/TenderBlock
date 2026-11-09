# TenderBlock Signup: Backend-Only Fields (8 November 2026)

Checked against `srijangdas/TenderBlock` backend commit `2b13f5d4703c92a4a6dbf7fc59d9704343e98985`.

## Account registration

`POST /api/v1/auth/register/{role}` with `role=CONTRACTOR` for Bidder, `role=AUTHORITY` for Lister.

JSON: `{ "fullName": "...", "email": "...", "password": "..." }`.

The role is a path parameter. `confirmPassword` is only browser validation and is not sent.

## Company profile

`POST /api/v1/company/profile`, using the registration response's bearer token.

JSON: `{"companyName":"...", "registrationNumber":null, "gstin":null, "pan":null, "address":"...", "contactNumber":"...", "website":null}`.

`companyName`, `address`, and `contactNumber` are required. `registrationNumber`, `gstin`, `pan`, and `website` are supported but optional. This signup form exposes only `registrationNumber` of those optional fields. If blank, the DTO mapping emits `null`.

Removed unsupported signup fields: **age**, **designation**, **yearsOfExperience**, **organizationType**, and **sector/line of work**. They are absent from the team's account and company-profile request DTOs.

The same lean signup is shown in demo and live modes. In the demo, no nonexistent profile fields are stored from signup. The separate Tender form still has sector metadata for demo-only tenders; the real tender DTO does not support sector.

## Where the changes are

- `src/pages/RegisterPage.jsx` — reduced fields, backend-matched validation, optional registration number.
- `src/pages/ProfilePage.jsx` — removed unsupported age-related/profile display fields.
- `src/api/dtos.js` — demo registration now passes only supported visible fields.
- `src/api/demoStore.js` — no longer assigns an unsupported `sector` from signup.
- `tests/register-dto.test.mjs` — asserts the lean demo signup DTO.

## Important existing limitation

The live backend creates an account first and creates its company profile second. If the second request fails, the account may exist without a company profile. This UI still needs a recoverable profile-completion screen using `GET/PUT /api/v1/company/profile/me` or additional backend coordination; avoid registering a second time with the same email.

These changes do **not** establish a successful full Vite build or a complete backend end-to-end test. Run `npm.cmd install`, `npm.cmd run test:dto`, `npm.cmd run test:team`, `npm.cmd run test:demo`, `npm.cmd run lint`, and `npm.cmd run build` from `pure-tender-web` before committing.
