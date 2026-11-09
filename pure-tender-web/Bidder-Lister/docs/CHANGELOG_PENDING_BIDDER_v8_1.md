# v8.1 — Bidder PENDING-account 403 fix (2026-11-08)

## Root cause

On the confirmed backend commit `2b13f5d470`, `BidService.getMyBids()` calls `getVerifiedContractor()`; this throws `403 Forbidden` when an authenticated Bidder has `PENDING` account status. The published-tenders endpoint does not require verification, and returns `200 OK` to the same user. This is an authorization policy mismatch with the frontend's eager bid-history fetch, not a missing JWT or bad role.

## Changes

- `src/pages/BidderPage.jsx`: Never call `bidApi.mine()` for an unverified team-backend Bidder. Published tender listing remains accessible. Show a verification message on `My bids` instead of issuing a blocked `GET /bids/my`. Restores normal bid-history fetch after a VERIFIED session is established.
- `src/pages/EditBidPage.jsx`: Explain verification requirement rather than attempting an inaccessible bid lookup for a pending user.
- `tests/pending-bidder-v8-1.test.mjs`: Regression assertions for these guards and live vs demo mode behavior.

## Not changed

- The team's Java backend authorization policy (requires Admin VERIFICATION to read the My Bids endpoint).
- Login, signup, JWT serialization and API paths.
- Demo Mode, Lister Mode, or Admin verification actions.

## To test locally

1. Start your local Spring Boot/H2 backend and keep it running.
2. Run Vite with `VITE_DEMO_MODE=false` and `VITE_BACKEND_CONTRACT=team`.
3. Sign in with a newly registered PENDING Bidder.
4. In DevTools Network: `GET /tenders/published` should return 200; there should be no `GET /bids/my` from the Bidder dashboard or My Bids page.
5. After Admin verification, log out and sign in again. Verified users can then access My Bids normally.

## Security

Never paste Authorization headers or JWT tokens into chat or reports. The Java `JwtFilter` in the reviewed backend logs the full token via `System.out.println(token)`; your backend teammate should remove this line. Rotate the previously exposed JWT signing secret and reauthenticate before distributing the app.
