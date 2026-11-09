# TenderBlock frontend v9 — navigation, login, cancellation, backend alignment

Source base: TenderBlock Bidder/Lister v8.1 Lint Fixed; reviewed against GitHub main `dd24a9ea4f2b382abed1e25c5d2dbe3589741dd1`, backend updated-endpoints commit `8b7b5b7e3682ee3f16c60c7bafe87ceca984f092`. Checked November 8, 2026.

## Functional changes

1. `/` now embeds the actual public Bidder/Lister login form in the landing hero; the header Sign in anchor scrolls to it. `/login` remains for direct bookmarks/expired sessions. `/staff/login` is still separate.
2. `/bidder` now renders `BidderDashboardPage.jsx`: account-status, published-opportunity count, saved-bid count and recent links. **No tender search/table here.** `/bidder/tenders` is the searchable Browse Tenders page, with the original pagination/details/bid workflow.
3. `/lister` dashboard now shows only overview and recent tender status. The single creation entry is **Create tender in the sidebar** → `/lister/create` (`CreateTenderPage.jsx` / `TenderForm.jsx`). My Tenders page no longer adds another creation CTA.
4. `/lister/my-tenders` has **Cancel tender** under Action only for a verified Lister's `PUBLISHED` tender while `now < submissionDeadline`. Requires a reason (1–2000 chars), sends `PATCH /api/v1/tenders/{tenderId}/cancel` with JSON `{ "reason": "..." }`, then reloads the status. Demo mode uses explicitly simulated cancellation.
5. Updated backend allows bid updates after `SUBMITTED` (while tender is PUBLISHED and before its deadline). My Bids and Edit Bid pages now allow this. Save Changes updates amount and optional proposal PDF **without repeating POST /bids/{id}/submit**. Status `ON_HOLD` has a badge style.
6. Added regression checks in `tests/v9-navigation-cancellation.test.mjs` and demo cancellation test.

## Critical GitHub repository findings — 17 branches checked

- At the time of inspection, **`feature/bidder-lister`** HEAD `404265f5b7da22767a9053b5ec0c656cb7144a61` had React pages/components/tests but **lacked `src/api/`, `src/context/`, `src/data/`, and `src/utils/`**. Those imports are required by `App.jsx`. Its `package.json` and `package-lock.json` were still from the Vite starter (only React/React-DOM listed), rather than the full v8.1 runtime. **The branch cannot be considered independently build-ready**. You must restore the missing directories and replace/reconcile package.json, then regenerate package-lock.json using `npm install`.
- `main` HEAD `dd24a9ea4f2b382abed1e25c5d2dbe3589741dd1` includes the updated-endpoints backend commit; earlier partial frontend PRs #3/#4 were subsequently reverted from main.
- `backend` and `bug-fix/ai-init-debugging` currently point to `8b7b5b7...`, which is an ancestor of `main`.
- `feature/blockchain-link` is **diverged**, with an additional document-hash implementation commit that was not in `main` at the time checked. It does not change frontend REST request DTOs, but needs backend tests and team coordination before merging.
- `frontend` is diverged. Khush's current staff implementation wasn't present as a completed all-five-actor frontend in its inspected tree.
- `revert-8-main` contains additional revert / frontend history. Do not merge or reset these branches blindly.
- The other branches were either behind `main` or diverged due to earlier independent history. Listing branch heads and comparing changes is **not** equivalent to running every branch's Java build or end-to-end workflow.

## Remaining blockers / team coordination

**Important backend bug**: The current Java `TenderService.cancelTender` checks AUTHORITY role, VERIFIED status, tender ownership and PUBLISHED/UNDER_EVALUATION state, **but not `Instant.now().isBefore(tender.getSubmissionDeadline())`**. The UI respects the requested before-deadline rule; Shijanya must add this check in Spring Boot because frontend checks can be bypassed. The backend also permits cancellation of `UNDER_EVALUATION` tenders; that usually happens after the deadline, so your requested rule conflicts with that existing capability. Have the team agree on the intended policy.

The old `StaffWorkspacePage.jsx` / `adminApi`/`evaluatorApi`/`auditorApi` stubs in this standalone ZIP are **not** Khush's completed current staff code, and several old endpoints do not match the real backend. Do not overwrite the staff implementation when integrating it.

Other limitations: sector is not present in current team TenderResponse, so true sector-based recommendations cannot be implemented solely in the frontend; account status is refreshed on re-login, not pushed live; Vite localhost proxy is for local development, not public deployment; the current Fabric demonstration is not proof of an end-to-end blockchain ledger; contract/mock tests are not live Spring Boot/Postgres/Fabric integration.

## Running locally

From `pure-tender-web`:

```bash
npm install
npm run lint
npm run build
npm run test:team
npm run test:dto
npm run test:demo
npm run test:ui
```

The ZIP intentionally does not include `node_modules`, `dist`, `.env`, or a previously generated `package-lock.json`. **Run `npm install` and commit the generated/updated `package-lock.json` with `package.json`.** Note that the old package-lock in the Git branch is not compatible with this package.json until regenerated.

Local `.env` (do not commit):

```dotenv
VITE_DEMO_MODE=false
VITE_BACKEND_CONTRACT=team
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_TARGET=http://localhost:8080
```

Spring Boot and required local services must also run for real login, tender creation, bid submission, cancellation and verification.

## Git Bash integration into your existing clone

In Git Bash:

```bash
cd /e/SEM_Project/TenderBlock-Bidder-Lister-Git
git fetch origin
git switch feature/bidder-lister
git status --short
# Fix or commit any uncommitted work first; do not overwrite teammate work.
```

After extracting the v9 archive, replace the SOURCE folder path below with its actual location:

```bash
SRC="/e/TenderBlock_Bidder_Lister_Updated_v9_2026-11-08/pure-tender-web"
DEST="/e/SEM_Project/TenderBlock-Bidder-Lister-Git/pure-tender-web"
cp -R "$SRC/src/." "$DEST/src/"
cp -R "$SRC/tests/." "$DEST/tests/"
cp "$SRC/package.json" "$DEST/"
cp "$SRC/vite.config.js" "$DEST/"
cp "$SRC/eslint.config.js" "$DEST/"
cp "$SRC/index.html" "$DEST/"
cp "$SRC/.env.example" "$DEST/"
cd "$DEST"
npm install
npm run lint && npm run build && npm run test:team && npm run test:dto && npm run test:demo && npm run test:ui
cd ..
git status --short
git add pure-tender-web/src pure-tender-web/tests pure-tender-web/package.json pure-tender-web/package-lock.json pure-tender-web/vite.config.js pure-tender-web/eslint.config.js pure-tender-web/index.html pure-tender-web/.env.example
git diff --cached --stat
git commit -m "feat(frontend): separate dashboards and add landing login and cancellation"
git push origin feature/bidder-lister
```

Run the commands **only after reviewing staged files**. Keep `PureTender/`, the root `.gitignore`, and Khush's staff files intact. For a merged frontend, reconcile `App.jsx`, `AuthContext.jsx`, `services.js`, global styles and dependencies together rather than copying one teammate's whole folder over another's.
