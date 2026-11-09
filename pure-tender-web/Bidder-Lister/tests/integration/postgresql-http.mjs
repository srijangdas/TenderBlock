// Real HTTP through the shipped frontend services/DTOs, not an injected/mock request.
// PostgreSQL and the actual Java backend must already be running; see README_INTEGRATION.
import assert from 'node:assert/strict';
import { build } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';

const api = `${process.env.TENDERBLOCK_BACKEND_ORIGIN || 'http://127.0.0.1:8083'}/api/v1`;
const phase = process.env.AUDIT_PHASE || 'accepted-boundary';
assert.ok(['accepted-boundary', 'unavailable-boundary'].includes(phase));
const statePath = process.env.AUDIT_STATE_PATH;
assert.ok(statePath, 'Set AUDIT_STATE_PATH to a PRIVATE temporary path outside the frontend (contains test passwords).');
const outDir = resolve('node_modules/.cache/postgresql-http');
process.env.VITE_API_BASE_URL = api;
process.env.VITE_DEMO_MODE = 'false';
await build({ mode: 'production', logLevel: 'warn', build: {
  ssr: 'src/api/services.js', outDir, emptyOutDir: true,
  rollupOptions: { preserveEntrySignatures: 'strict', output: { entryFileNames: 'services.mjs' } },
} });
const { authApi, companyProfileApi, tenderApi, bidApi } = await import(pathToFileURL(resolve(outDir, 'services.mjs')));
const nativeFetch = globalThis.fetch;
const receipts = [], results = [];
let current = 'setup';
const scrub = value => JSON.parse(JSON.stringify(value, (key, item) => /token|password/i.test(key) ? '<redacted>' : item));
globalThis.fetch = async (url, options = {}) => {
  const response = await nativeFetch(url, options);
  let payload = null;
  if (options.body instanceof FormData) payload = Object.fromEntries([...options.body].map(([key, file]) => [key, { name: file.name, type: file.type, bytes: file.size }]));
  else if (options.body) payload = scrub(JSON.parse(options.body));
  const pdfResponse = response.headers.get('content-type')?.includes('pdf');
  const raw = pdfResponse ? '<PDF bytes>' : await response.clone().text();
  let body; try { body = scrub(JSON.parse(raw)); } catch { body = raw; }
  receipts.push({ test: current, method: options.method || 'GET', path: new URL(url).pathname + new URL(url).search, payload, status: response.status, response: body,
    rawBody: raw.replace(/("(?:accessToken|token|refreshToken|password)"\s*:\s*)"(?:\\.|[^"\\])*"/gi, '$1"<redacted>"') });
  return response;
};
const json = async (path, method = 'GET', token, body) => {
  const response = await fetch(api + path, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const raw = await response.text();
  return { status: response.status, data: raw ? JSON.parse(raw) : null };
};
const check = async (name, fn) => {
  current = name;
  try { await fn(); results.push({ name, status: 'passed' }); console.log('PASS:', name); }
  catch (error) { results.push({ name, status: 'failed', error: error.message }); throw error; }
};
const deny = operation => assert.rejects(operation, error => error.status === 403);
const password = 'AuditPass123!';
const form = role => ({ role, fullName: 'PostgreSQL Audit', email: `pg-${role.toLowerCase()}-${randomUUID()}@audit.test`, password,
  organizationName: 'PostgreSQL Integration Company', address: '10 Audit Road', phoneNumber: '9876543210' });
const tenderForm = title => ({ title, description: 'Real frontend client / Java / PostgreSQL audit', budget: '9007199254740993.45',
  submissionDeadline: '2030-07-01T10:30', openingDate: '2030-07-02T10:30' });
const pdf = Buffer.from('%PDF-1.4\nPostgreSQL byte-for-byte integration proposal\n%%EOF');
const replacement = Buffer.from('%PDF-1.4\nUpdated PostgreSQL proposal\n%%EOF');
const file = (data = pdf) => new File([data], 'proposal.pdf', { type: 'application/pdf' });
let state;
try {
  if (phase === 'accepted-boundary') {
    state = { password };
    await check('Bidder and Lister registration + separate company-profile POST + pending login', async () => {
      for (const role of ['BIDDER', 'LISTER']) {
        const f = form(role), registered = await authApi.register(f);
        assert.equal(registered.profileSaved, true);
        const account = await authApi.login(f);
        assert.equal(account.user.role, role);
        assert.equal(account.user.accountStatus, 'PENDING');
        assert.equal(account.user.organizationName, f.organizationName);
        state[role] = { ...account, email: f.email };
        const p = await companyProfileApi.update({ ...f, organizationName: 'Updated pending profile' }, account.token);
        assert.equal(p.companyName, 'Updated pending profile');
      }
    });
    await check('Pending-account browsing and verified-only mutation restrictions', async () => {
      assert.ok(Array.isArray((await tenderApi.listPage(state.BIDDER.token)).items));
      await deny(() => tenderApi.create(state.LISTER.user, tenderForm('Forbidden pending tender'), state.LISTER.token));
      await deny(() => bidApi.createDraft(state.BIDDER.user, randomUUID(), '10', state.BIDDER.token));
      await deny(() => bidApi.mine(state.BIDDER.user, state.BIDDER.token));
    });
    await check('Missing company profile: ambiguous 403 login recovery, then explicit POST', async () => {
      for (const role of ['CONTRACTOR', 'AUTHORITY']) {
        const f = form(role), created = await json(`/auth/register/${role}`, 'POST', undefined, { fullName: f.fullName, email: f.email, password });
        assert.equal(created.status, 201);
        const account = await authApi.login(f);
        assert.equal(account.user.profileMissing, null);
        assert.ok(account.user.profileLoadError);
        await companyProfileApi.create(f, account.token);
        assert.equal((await companyProfileApi.mine(account.token)).companyName, f.organizationName);
      }
    });
    await check('Fixture Admin verifies accounts; server blocks verified profile edits', async () => {
      const a = await json('/auth/login', 'POST', undefined, { email: 'admin@audit.test', password });
      const e = await json('/auth/login', 'POST', undefined, { email: 'evaluator@audit.test', password });
      assert.equal(a.status, 200); assert.equal(e.status, 200);
      state.admin = a.data; state.evaluator = e.data;
      for (const role of ['BIDDER', 'LISTER']) {
        const account = state[role];
        assert.equal((await json(`/admin/users/${account.user.id}/verify`, 'PATCH', a.data.accessToken)).status, 200);
        state[role] = { ...await authApi.login({ email: account.email, password }), email: account.email };
        assert.equal(state[role].user.accountStatus, 'VERIFIED');
        await deny(() => companyProfileApi.update(form(role), state[role].token));
      }
    });
    await check('Lister tender POST/PUT and own list; explicit Fabric acceptance double', async () => {
      const l = state.LISTER;
      state.tender = await tenderApi.create(l.user, tenderForm('PostgreSQL tender'), l.token);
      assert.equal(state.tender.status, 'SUBMITTED');
      assert.equal(state.tender.budget, '9007199254740993.45');
      const updated = await tenderApi.update(l.user, state.tender.id, tenderForm('PostgreSQL edited tender'), l.token);
      assert.equal(updated.title, 'PostgreSQL edited tender');
      assert.ok((await tenderApi.mine(l.user, l.token)).some(t => t.id === state.tender.id));
    });
    await check('Fixture Admin publishes; pending Bidder browses published Page/detail', async () => {
      assert.equal((await json(`/admin/tenders/${state.tender.id}/approve`, 'PATCH', state.admin.accessToken, { evaluatorId: state.evaluator.userId })).status, 200);
      const f = form('BIDDER'); await authApi.register(f); const pending = await authApi.login(f);
      assert.ok((await tenderApi.listPage(pending.token)).items.some(t => t.id === state.tender.id));
      assert.equal((await tenderApi.detail(state.tender.id, pending.token)).budget, '9007199254740993.45');
      await deny(() => bidApi.createDraft(pending.user, state.tender.id, '100', pending.token));
    });
    await check('Bidder creates draft; exact quoted amount survives PostgreSQL NUMERIC', async () => {
      const b = state.BIDDER;
      state.bid = await bidApi.createDraft(b.user, state.tender.id, '9007199254740993.45', b.token);
      assert.equal(state.bid.status, 'DRAFT');
      assert.equal(state.bid.amount, '9007199254740993.45');
      assert.equal((await bidApi.detail(b.user, state.bid.id, b.token)).amount, '9007199254740993.45');
      await deny(() => bidApi.finalizeDraft(b.user, state.bid.id, b.token));
      await deny(() => bidApi.createDraft(b.user, state.tender.id, '100', b.token));
    });
    await check('PDF preflight refuses oversize/bad header before making HTTP requests', async () => {
      const n = receipts.length, b = state.BIDDER;
      await assert.rejects(() => bidApi.uploadProposal(b.user, state.bid.id, file(Buffer.alloc(2 * 1024 * 1024)), b.token), /1 MB/);
      await assert.rejects(() => bidApi.uploadProposal(b.user, state.bid.id, file(Buffer.from('not a PDF')), b.token), /PDF/);
      assert.equal(receipts.length, n);
    });
    await check('Multipart file upload 204, final submit 200; PostgreSQL PDF byte match', async () => {
      const b = state.BIDDER;
      await bidApi.uploadProposal(b.user, state.bid.id, file(), b.token);
      const submitted = await bidApi.finalizeDraft(b.user, state.bid.id, b.token);
      assert.equal(submitted.status, 'SUBMITTED');
      const response = await fetch(`${api}/bids/${state.bid.id}/proposal`, { headers: { Authorization: `Bearer ${b.token}` } });
      assert.equal(response.status, 200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
    });
    await check('Submitted quote/PDF replacement; no second submit; owner isolation', async () => {
      const b = state.BIDDER, n = receipts.length;
      await bidApi.updateDraft(b.user, state.bid.id, '1900.50', b.token);
      await bidApi.uploadProposal(b.user, state.bid.id, file(replacement), b.token);
      const stored = await bidApi.detail(b.user, state.bid.id, b.token);
      assert.equal(stored.status, 'SUBMITTED'); assert.equal(stored.amount, '1900.50');
      assert.equal(receipts.slice(n).filter(r => r.path.endsWith('/submit')).length, 0);
      const response = await fetch(`${api}/bids/${state.bid.id}/proposal`, { headers: { Authorization: `Bearer ${b.token}` } });
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), replacement);
      const f = form('BIDDER'); await authApi.register(f); const outsider = await authApi.login(f);
      assert.equal((await json(`/admin/users/${outsider.user.id}/verify`, 'PATCH', state.admin.accessToken)).status, 200);
      await deny(() => bidApi.detail(outsider.user, state.bid.id, outsider.token));
      const denied = await fetch(`${api}/bids/${state.bid.id}/proposal`, { headers: { Authorization: `Bearer ${outsider.token}` } });
      assert.equal(denied.status, 403);
      state.unsubmitted = await bidApi.createDraft(outsider.user, state.tender.id, '100', outsider.token);
      await bidApi.uploadProposal(outsider.user, state.unsubmitted.id, file(), outsider.token);
      state.outsider = { ...outsider, email: f.email };
    });
    state.replacementHash = createHash('sha256').update(replacement).digest('hex');
    writeFileSync(statePath, JSON.stringify(state), { mode: 0o600 });
  } else {
    state = JSON.parse(readFileSync(statePath, 'utf8'));
    for (const role of ['BIDDER', 'LISTER', 'outsider']) state[role] = { ...state[role], ...await authApi.login({ email: state[role].email, password: state.password }) };
    await check('Accounts, company profiles, tenders, bids and PDF persist after backend restart', async () => {
      assert.equal((await tenderApi.detail(state.tender.id, state.BIDDER.token)).title, 'PostgreSQL edited tender');
      assert.equal((await bidApi.detail(state.BIDDER.user, state.bid.id, state.BIDDER.token)).amount, '1900.50');
      const response = await fetch(`${api}/bids/${state.bid.id}/proposal`, { headers: { Authorization: `Bearer ${state.BIDDER.token}` } });
      assert.equal(response.status, 200);
      assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), state.replacementHash);
    });
    await check('Unavailable Fabric: tender creation fails; database transaction rolls back', async () => {
      const l = state.LISTER, before = await tenderApi.mine(l.user, l.token);
      await deny(() => tenderApi.create(l.user, tenderForm('Must roll back unavailable Fabric'), l.token));
      assert.equal((await tenderApi.mine(l.user, l.token)).length, before.length);
    });
    await check('Unavailable Fabric: final submission fails; uploaded bid remains DRAFT', async () => {
      const b = state.outsider;
      await deny(() => bidApi.finalizeDraft(b.user, state.unsubmitted.id, b.token));
      assert.equal((await bidApi.detail(b.user, state.unsubmitted.id, b.token)).status, 'DRAFT');
    });
    await check('Unavailable Fabric: submitted quote/PDF update fails and rolls back', async () => {
      const b = state.BIDDER;
      await deny(() => bidApi.updateDraft(b.user, state.bid.id, '999', b.token));
      await deny(() => bidApi.uploadProposal(b.user, state.bid.id, file(), b.token));
      assert.equal((await bidApi.detail(b.user, state.bid.id, b.token)).amount, '1900.50');
      const response = await fetch(`${api}/bids/${state.bid.id}/proposal`, { headers: { Authorization: `Bearer ${b.token}` } });
      assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), state.replacementHash);
    });
  }
} finally {
  globalThis.fetch = nativeFetch;
  mkdirSync('audit-evidence', { recursive: true });
  writeFileSync(`audit-evidence/postgresql-${phase}.json`, JSON.stringify({ backend: 'b6f73c88a484469473581f6032591fbb0df12a24', phase,
    scope: 'Shipped frontend adapters + real HTTP + unmodified Java services/security/JPA + actual PostgreSQL. Fabric transport is an explicit test double, NOT a tested Fabric ledger.', results, receipts }, null, 2) + '\n');
}
