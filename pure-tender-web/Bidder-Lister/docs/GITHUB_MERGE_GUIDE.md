# Merge the frontend into the team repository without overwriting work

Do not push the ZIP to `main` as a second independent app. Integrate only frontend files into the existing `pure-tender-web` directory and let the team review a pull request.

On Windows PowerShell (inside a folder where you want to clone):

```powershell
git clone https://github.com/srijangdas/TenderBlock.git
cd TenderBlock
git checkout -b feature/frontend-complete-workflows
```

1. Unzip this archive separately. Its root contains `src`, `package.json`, `vite.config.js`, `index.html`, `eslint.config.js`, `docs`, `tests`, and `.env.example`.
2. Copy the frontend `src`, `vite.config.js`, `index.html`, and `package.json` contents to **`pure-tender-web`**, reviewing conflicts with existing code. Do not delete teammate code.
3. Because the team's existing `package.json` and lockfile differ, run `npm install` from inside `pure-tender-web` to reconcile dependency versions and regenerate `package-lock.json`.
4. Add `.env` to `.gitignore`. Do not commit database passwords, JWT secrets, Fabric private keys, or demo personal data.
5. Run `npm run build`, `npm run lint`, and `npm run test:demo` after dependencies install. Fix errors before asking for review.
6. Verify that clicking the public root `/` opens the Landing page and `/staff/login` opens Staff login without a public landing page.
7. Stage only intended files:

```powershell
git status
git add pure-tender-web
git commit -m "feat(frontend): implement bidder lister and staff workflows"
git push -u origin feature/frontend-complete-workflows
```

Open a GitHub Pull Request against `main` and request review. Avoid force-pushing or directly editing the team's backend until DTOs and role migration have been agreed upon.

No GitHub changes were made by this artifact generation.
