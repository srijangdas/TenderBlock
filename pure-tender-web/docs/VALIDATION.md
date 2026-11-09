# Validation performed

Checked on 9 November 2026 using Node.js 24.22.1, npm 11.9.0 and Chromium in the managed Linux environment.

| Check | Result |
| --- | --- |
| Dependency installation and lockfile | Passed |
| `npm run lint` | Passed, no warnings/errors |
| `npm run build` | Passed, live production bundle |
| `npm run build:demo` | Passed, browser demonstration bundle; dist was subsequently rebuilt in live mode |
| `BACKEND_SOURCE=../backend-reference/PureTender npm run test:contracts` | Passed: 37 implemented operations matched the inspected Java controllers |
| `npm run test:contracts` using the packaged snapshot | Passed; reports 5 pending optional endpoints |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test` | 22 passed, 0 skipped, 0 failed, 0 flaky |

The final browser suite covered:

- Login, reload, common Bearer headers and logout for Bidder, Lister, Admin, Evaluator and Auditor.
- Unauthenticated staff links and wrong-role redirection.
- Admin verification, evaluator assignment/approval, rejection error feedback and subsequent Spring pages.
- Required scoring, saving, invalidating saved state after edits, finalization and proposal downloads.
- Auditor claims, resolution payloads, held-award availability and fallback behavior when optional endpoints are missing.
- Shared 401 expiry, mobile overflow and dark theme.
- Public registration and separate company-profile DTOs, pending-account restrictions, and Lister tender creation with precise amounts and IST/UTC conversion.
- Bid draft creation, multipart proposal upload with 204 response, final submission, and reuse of a draft after failed upload.
- Evaluator application and pending-staff verification feedback.
- Persistent demo Admin verification, evaluation scores and auditor findings across reloads/sessions.

`test-results-summary.json` records the test names and outcomes. `screenshots/evaluator-mobile-dark.png` is a browser capture reviewed during validation.

## Test boundaries

Live-mode browser tests use intercepted HTTP fixtures whose DTO shapes were checked against Java source. The demo tests use the actual shared browser-local store. The route checker inspects Java controller method/path declarations; it can be rerun against a local PureTender checkout.

The actual Java application, PostgreSQL database and Hyperledger Fabric network were not started or exercised. No real accounts or backend records were created. This validation does not establish deployed API availability, backend authorization correctness, real PDF persistence, database behavior, Fabric transactions, or end-to-end award/integrity behavior. Those checks remain for the user's manual integration testing.
