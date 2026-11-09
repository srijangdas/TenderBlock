> **Historical v4 document.** Some endpoint/role limitations described here are addressed by the new `backend-overlay`. Follow the integration kit root `README.md` and `docs/API_CONTRACT.md` for the updated implementation. Do not treat this file as a deployment checklist.

# Requirements-to-code matrix (30 October 2026)

| Original requirement | Implemented location | Reality in this package |
| --- | --- | --- |
| Public bidder/lister landing page | `pages/LandingPage.jsx`, `components/TeamFooter.jsx` | Complete UI; contacts left blank |
| Staff should not see public landing page | `/staff/login` route in `App.jsx`, `StaffLoginPage.jsx` | Direct staff URL, no public header |
| First-time account registration | `pages/RegisterPage.jsx`, `api/dtos.js` | Name, age, phone, company/institute, registration, sector, optional experience/designation; demo only for full profile |
| Bidder/Lister mutually exclusive | Registration radio, `demoStore.demoRegister`, route guards | Enforced in demo/browser; Spring backend needs role migration |
| Real login / staff role restriction | `api/services.js`, `context/AuthContext.jsx` | Matches current flat Spring AuthResponse; current backend does not issue proper LISTER role or support full profiles |
| Profile page after login | `pages/ProfilePage.jsx`, `LoginPage.jsx` | Implemented; role-specific CTA |
| Lister creates / edits draft | `components/TenderForm.jsx`, `pages/EditTenderPage.jsx` | Implemented and tested in demo; live endpoint missing |
| Admin verifies account | `pages/StaffWorkspacePage.jsx`, `demoStore.demoVerifyUser` | Demo only; server endpoint absent |
| Lister requests approval; Admin approves and assigns auditor | Lister + Admin UI, `demoStore.demoApproveTender` | Demo only; simulated ledger digest, no Fabric transaction |
| Bidder sector recommendations | `pages/BidderPage.jsx` | Exact category matching in the UI |
| Bidder can attach PDFs and submit | `components/BidForm.jsx` | Demo computes SHA-256 and stores filenames/hashes, not actual file bytes |
| Bidder can update before deadline | `pages/EditBidPage.jsx`, `api/services.js`, `demoStore.demoUpdateBid` | Implemented and tested in demo; server must enforce deadline |
| Deadline-based closing | Admin UI, `demoCloseTender` | Enforced by demo code; server workflow missing |
| Evaluator sees bids and gives scores | `StaffWorkspacePage.jsx`, `demoEvaluateBid` | Demo after closing; real sealed-bid privacy and evaluator assignment pending |
| Auditor compares PDF and logs outcome | `StaffWorkspacePage.jsx`, `demoVerifyBidFile`, `demoAuditEvents` | Local browser digest comparison, NOT blockchain verification |
| Admin final decision or flag | `demoFinalizeTender` | Demo only; scoring and selection policy not academically validated |
| Real Fabric transaction and confirmed audit | `docs/SPRING_BOOT_API_CONTRACT.md` | NOT IMPLEMENTED on actual ledger; requires backend service, chaincode/outbox |
| Real PostgreSQL CRUD | `api/services.js` (calls) | Frontend client written; backend REST endpoints not yet present |
| GitHub integration | `docs/GITHUB_MERGE_GUIDE.md` | Instructions prepared; **no changes pushed** |
| Runnable Vite/Tailwind build | `package.json`, `vite.config.js`, `src/index.css` | JS/JSX syntax and demo tests verified; npm install/build not verified here |

**Definitions:** “Implemented in demo” does not mean “deployed as a trusted or multi-user service”. The local browser data can be edited by the user and cannot provide real security or cryptographic trust in the ledger.
