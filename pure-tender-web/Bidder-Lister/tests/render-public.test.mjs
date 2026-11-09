import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const original = process.env.VITE_DEMO_MODE;
try {
  // A stale environment flag must not enable demo behavior in production.
  process.env.VITE_DEMO_MODE = 'true';
  for (const [mode, expectedDemo] of [['production', false], ['demo', true]]) {
    const outDir = path.resolve('node_modules/.cache/tenderblock-public-render', mode);
    await build({ mode, logLevel: 'warn', build: {
      ssr: 'tests/render-public.jsx', outDir, emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'render-public.mjs' } },
    } });
    execFileSync(process.execPath, [path.join(outDir, 'render-public.mjs')], {
      stdio: 'inherit', env: { ...process.env, EXPECT_DEMO: String(expectedDemo) },
    });
  }
} finally {
  if (original === undefined) delete process.env.VITE_DEMO_MODE;
  else process.env.VITE_DEMO_MODE = original;
}
