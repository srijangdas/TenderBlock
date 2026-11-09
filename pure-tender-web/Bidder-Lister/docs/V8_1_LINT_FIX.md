# v8.1 ESLint fix (2026-11-08)

This is v8.1 with only lint-focused changes. No backend requests, routing logic, or role authorization have been modified.

- `src/api/services.js`: safely sanitizes PDF filenames without a control-character regex (`no-control-regex`).
- `src/components/TenderTable.jsx`: removes the unused `formatCurrency` import.
- `eslint.config.js`: sets `argsIgnorePattern: '^[A-Z_]'` alongside the existing `varsIgnorePattern` because JSX-only component identifiers (e.g., `Icon`) in callback parameters are considered unused by ESLint core without the React JSX-use plugin. These are actual components used in JSX, not dead code.

Run `npm.cmd install`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:team`, `npm.cmd run test:dto`, `npm.cmd run test:demo` in Windows PowerShell.

To merge into an existing cloned repository, copy only the three modified source/configuration files; do not replace your teammate's staff dashboard.
