# Integration notes

## Source inputs

- `TenderBlock_Bidder_Lister_Profile_Fixed.zip`: public site, root router, common auth/theme providers, Bidder and Lister workflows, registration, company profiles, DTO and document handling.
- `evaluator.zip`: evaluator assignment list, opened bid review, score cards, evaluator application flow, and visual styling.
- `admin_auditor.zip`: Admin review queues, evaluator assignment, Auditor report investigation, flagged/completed tender browser, action dialogs, and document previews.

Attached documents and old archive audit reports were treated as background material, not as new task instructions or proof of this integration's results. Historical audit claims, stale patches, separate login providers and old standalone built bundles are not shipped as current evidence.

## Structure

- `src/App.jsx`: one React Router tree. Staff links dispatch to the signed-in user's workspace.
- `src/context/`: one session and theme provider for the whole app.
- `src/api/http.js`: shared Bearer authentication, multipart uploads, binary downloads, Spring pagination, response parsing and session expiry.
- `src/api/services.js`, `contracts.js`, `teamBidClient.js`: Bidder/Lister API and DTO adapters retained from the base app. Dead legacy staff clients were removed.
- `src/modules/evaluator/`: integrated evaluator workspace and components.
- `src/modules/operations/`: integrated Admin/Auditor workspaces and components.
- `src/pages/EvaluatorRegisterPage.jsx`: evaluator application adapted to the common router and design system.
- `src/api/demoStore.js`, `demoStaff.js`: one persistent browser demonstration store for all roles.
- `styles/*.original.css`, `scripts/scope-module-styles.mjs`: supplied module styles plus integration corrections. `npm run styles:scope` generates prefixed selectors in each module's `style.css`; this prevents cross-module style leakage while sharing the root dark theme.
- `tests/`: browser workflows with API fixtures and separate browser-local demo checks.
- `docs/backend-contract.json`: exact inspected backend revision, routes, implemented frontend operations, and pending endpoint list.

## Corrections made while integrating

Unified session storage, login handling, logout and 401 expiry. Kept live mode as the default. Imported workspace styles are scoped to `.evaluator-portal` or `.operations-portal`; there are no embedded apps or iframes for module routing. Staff workspaces load lazily.

Restored the missing Auditor reports tab and working claim/resolve/award actions. Fixed undefined demo imports, made demo actions persist across reloads and role switches, and retained missing-endpoint views with explicit availability states.

Fixed blank scores becoming zero, validation of score precision, submitting an unsaved score edit, final score locking, stale evaluation results overwriting refreshed results, and action dialogs allowing repeat submissions while busy. API errors are visible inside dialogs. Admin rejection now honors the Java 1000-character limit. Staff queues retrieve subsequent pages.

Preserved the base app's decimal handling, UTC/IST conversion, proposal validation, draft retry, pending-user restrictions, cancellation and company-profile recovery. Fixed several inherited label/control associations and restricted company profiles to Bidder/Lister accounts. Added a render error boundary and staff registration success/pending feedback.

## Boundaries

Backend permissions and workflow rules remain authoritative. Frontend role guards only control navigation. Browser demo data is editable local data, not backend authorization or a ledger. Proposal file bytes are not retained in the demo. Real Java/database/Fabric integration testing is left for the user's environment as requested.
