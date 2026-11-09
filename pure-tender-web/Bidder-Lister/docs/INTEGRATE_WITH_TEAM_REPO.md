> **Note (v3):** This file was carried over from the earlier Bidder/Lister-only edition. For current API endpoints and the five-actor implementation, start with [SPRING_BOOT_API_CONTRACT.md](SPRING_BOOT_API_CONTRACT.md), [IMPLEMENTATION_MATRIX.md](IMPLEMENTATION_MATRIX.md), and [GITHUB_MERGE_GUIDE.md](GITHUB_MERGE_GUIDE.md). Some descriptions below refer to older placeholder screens.

# Integrating this frontend into `srijangdas/TenderBlock`

As inspected on October 30, 2026, `pure-tender-web/src/App.jsx` was still the Vite starter. The team repository has `PureTender` for Spring Boot and `pure-tender-web` for React.

## Recommended workflow

**Do not push a separate `TenderBlock_Bidder_Lister_UI/` folder as a second frontend.** Merge this project's source into the team's existing `pure-tender-web` folder on a dedicated branch.

```powershell
git clone https://github.com/srijangdas/TenderBlock.git
cd TenderBlock
git switch -c feature/bidder-lister-pages
cd pure-tender-web
```

1. Make a backup of the existing frontend or inspect its current changes in `git status`.
2. Copy the contents of this starter's `src/` into `pure-tender-web/src/`, reconciling files that already exist (`App.jsx`, `main.jsx`, styles). **Do not overwrite teammate work without review.**
3. Copy `vite.config.js`, `.env.example` and update dependencies and scripts from `package.json`. Tailwind 4 uses the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in CSS.
4. Run `npm install` and then `npm run dev`. In another terminal, run `npm run build` and `npm run lint`.
5. Commit only frontend code and no private `.env` files or credentials.

```powershell
git add pure-tender-web
git commit -m "feat(frontend): add bidder and lister landing auth and workspace flows"
git push -u origin feature/bidder-lister-pages
```

Open a pull request to `main` and request backend/lead review of `src/api/dtos.js` and `src/api/services.js`. Do **not** merge until the server contract and role policy are agreed.

## Questions for team lead

- Does registration allow LISTER, or must Admin provision/promote the account after verification? The earlier SRS said public registration creates CONTRACTOR only, while the new whiteboard includes both BIDDER and LISTER registration.
- Does the backend use `BIDDER` and `LISTER`, or still the older `CONTRACTOR` and `AUTHORITY` enum values?
- What exact Java request/response DTO fields are implemented for auth and tender creation?
- Is bid upload a multipart request with named parts or a two-step upload then submit process?
- What endpoint submits a Lister's draft for Admin approval?
- What are the confirmed status values for Admin review and blockchain processing?

The application must not claim a real Fabric transaction or confirmed document hash just because a button was clicked. Those states come from trusted backend results.
