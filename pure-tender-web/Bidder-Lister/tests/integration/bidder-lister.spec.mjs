import { test, expect } from '@playwright/test';
const origin = process.env.TENDERBLOCK_BACKEND_ORIGIN || 'http://127.0.0.1:8081';
const api = `${origin}/api/v1`;
const password = 'AuditPass123!';
const company = { organizationName: 'Integration Company', address: '10 Integration Road', phoneNumber: '9876543210' };
let staff;
const unique = label => `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const pdf = Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\n%%EOF');
const auth = token => ({ Authorization: `Bearer ${token}` });
async function register(request, role, withProfile = true) {
  const email = `${unique(role.toLowerCase())}@integration.test`;
  const response = await request.post(`${api}/auth/register/${role}`, { data: { fullName: 'Integration User', email, password } });
  expect(response.status()).toBe(201);
  const account = await response.json();
  if (withProfile) {
    const profile = await request.post(`${api}/company/profile`, { headers: auth(account.accessToken), data: {
      companyName: company.organizationName, address: company.address, contactNumber: company.phoneNumber,
      registrationNumber: null, gstin: null, pan: null, website: null,
    } });
    expect(profile.status()).toBe(201);
  }
  return { ...account, email };
}
async function login(page, account, role) {
  await page.goto('/login');
  await page.locator('#public-login-email').fill(account.email);
  await page.locator('#public-login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role === 'AUTHORITY' ? 'lister' : 'bidder'}$`));
}
async function verify(request, account) {
  const r = await request.patch(`${api}/admin/users/${account.userId}/verify`, { headers: auth(staff.admin.accessToken) });
  expect(r.status()).toBe(200);
}
async function publish(request, lister, amount = '1234.56') {
  const deadline = new Date(Date.now() + 86400000).toISOString();
  const opening = new Date(Date.now() + 172800000).toISOString();
  const r = await request.post(`${api}/tenders`, { headers: auth(lister.accessToken), data: {
    title: unique('Integration tender'), description: 'Actual Spring Boot integration test',
    estimatedValue: amount, submissionDeadline: deadline, openingDate: opening,
  } });
  expect(r.status()).toBe(201);
  const tender = await r.json();
  const approval = await request.patch(`${api}/admin/tenders/${tender.id}/approve`, {
    headers: auth(staff.admin.accessToken), data: { evaluatorId: staff.evaluator.userId },
  });
  expect(approval.status()).toBe(200);
  return tender;
}

test.beforeAll(async ({ request }) => {
  staff = {};
  for (const role of ['admin', 'evaluator']) {
    const r = await request.post(`${api}/auth/login`, { data: {
      email: process.env[`TENDERBLOCK_TEST_${role.toUpperCase()}_EMAIL`] || `${role}@audit.test`,
      password: process.env.TENDERBLOCK_TEST_STAFF_PASSWORD || password,
    } });
    expect(r.status(), 'Start the isolated Spring Boot harness described in README_INTEGRATION.md.').toBe(200);
    staff[role] = await r.json();
  }
  const fixtureLister = await register(request, 'AUTHORITY');
  await verify(request, fixtureLister);
  staff.restrictedTender = await publish(request, fixtureLister);
});

test.beforeEach(async ({ page }) => {
  page.auditRows = []; page.auditJobs = [];
  page.on('response', response => {
    if (!response.url().includes('/api/v1/')) return;
    const job = (async () => {
      const request = response.request();
      const scrub = value => JSON.parse(JSON.stringify(value, (key, item) => /token|password/i.test(key) ? '<redacted>' : item));
      let payload; try { payload = scrub(request.postDataJSON()); } catch { payload = request.method() === 'PUT' ? '<multipart file>' : null; }
      const raw = response.headers()['content-type']?.includes('pdf') ? '<PDF bytes>' : await response.text();
      let body; try { body = scrub(JSON.parse(raw)); } catch { body = raw; }
      const rawBody = raw.replace(/("(?:accessToken|token|refreshToken|password)"\s*:\s*)"(?:\\.|[^"\\])*"/gi, '$1"<redacted>"');
      page.auditRows.push({ method: request.method(), path: new URL(response.url()).pathname, payload, status: response.status(), response: body, rawBody });
    })();
    page.auditJobs.push(job);
  });
  await page.goto('/login');
  const demo = await page.evaluate(async () => (await import('/src/data/constants.js')).DEMO_MODE);
  expect(demo, 'Integration tests must use real API mode.').toBe(false);
});

test.afterEach(async ({ page }, testInfo) => {
  await Promise.allSettled(page.auditJobs || []);
  await testInfo.attach('actual-http-responses', { body: JSON.stringify(page.auditRows || [], null, 2), contentType: 'application/json' });
});

for (const role of ['CONTRACTOR', 'AUTHORITY']) {
  test(`${role}: registration, company profile, pending login and restrictions`, async ({ page, request }) => {
    const email = `${unique('ui-signup')}@integration.test`;
    await page.goto('/register');
    for (const [id, value] of Object.entries({ fullName: 'Browser Registration', email, ...company, password, confirmPassword: password })) {
      await page.locator(`#${id}`).fill(value);
    }
    await page.locator(`input[name=role][value=${role === 'CONTRACTOR' ? 'BIDDER' : 'LISTER'}]`).check();
    const registration = page.waitForResponse(r => r.url().endsWith(`/auth/register/${role}`) && r.request().method() === 'POST');
    const profile = page.waitForResponse(r => r.url().endsWith('/company/profile') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    expect((await registration).status()).toBe(201);
    expect((await profile).status()).toBe(201);
    const account = await (await registration).json();
    await expect(page).toHaveURL(new RegExp(`/${role === 'AUTHORITY' ? 'lister' : 'bidder'}$`));
    const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('tenderblock_session_v3')));
    expect(session.user.accountStatus).toBe('PENDING');
    await login(page, { email }, role);
    if (role === 'CONTRACTOR') {
      const forbidden = [];
      page.on('request', r => { if (r.url().includes('/api/v1/bids/my')) forbidden.push(r.url()); });
      await page.goto('/bidder/my-bids');
      await expect(page.getByText('Bid history available after Admin verification.', { exact: true })).toBeVisible();
      expect(forbidden).toEqual([]);
      const r = await request.get(`${api}/bids/my`, { headers: auth(account.accessToken) });
      expect(r.status()).toBe(403);
      const published = await request.get(`${api}/tenders/published?size=1`, { headers: auth(account.accessToken) });
      expect(published.status()).toBe(200);
      const opportunities = await published.json();
      expect(opportunities.content.length).toBeGreaterThan(0);
      const deniedDraft = await request.post(`${api}/bids/tender/${staff.restrictedTender.id}`, { headers: auth(account.accessToken), data: { quotedAmount: '100' } });
      expect(deniedDraft.status()).toBe(403);
      await page.goto('/bidder/tenders');
      await expect(page.getByRole('heading', { name: 'Published opportunities', exact: true })).toBeVisible();
    } else {
      await page.goto('/lister/create');
      await expect(page.getByRole('heading', { name: 'Admin verification required' })).toBeVisible();
      const r = await request.post(`${api}/tenders`, { headers: auth(account.accessToken), data: {
        title: 'Pending attempt', description: 'Must be refused', estimatedValue: '100',
        submissionDeadline: new Date(Date.now() + 86400000).toISOString(), openingDate: new Date(Date.now() + 172800000).toISOString(),
      } });
      expect(r.status()).toBe(403);
    }
    await page.goto('/profile');
    await expect(page.locator('#organizationName')).toHaveValue(company.organizationName);
    await page.locator('#organizationName').fill('Updated pending company');
    await page.getByRole('button', { name: 'Save profile changes', exact: true }).click();
    await expect(page.getByText('Company profile updated successfully.', { exact: true })).toBeVisible();
  });

  test(`${role}: profile recovery when the backend masks missing profile as 403`, async ({ page, request }) => {
    const account = await register(request, role, false);
    await login(page, account, role);
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: 'Retry loading profile' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save profile changes', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Create missing company profile', exact: true }).click();
    for (const [id, value] of Object.entries(company)) await page.locator(`#${id}`).fill(value);
    const create = page.waitForResponse(r => r.url().endsWith('/company/profile') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create company profile', exact: true }).click();
    expect((await create).status()).toBe(201);
    await expect(page.getByText('Company profile saved.', { exact: true })).toBeVisible();
  });
}

test('Lister tender create/edit, Bidder draft/upload/submit/download and submitted edit', async ({ page, request }) => {
  const lister = await register(request, 'AUTHORITY');
  const bidder = await register(request, 'CONTRACTOR');
  await verify(request, lister); await verify(request, bidder);
  await login(page, lister, 'AUTHORITY');
  await page.goto('/lister/create');
  const title = unique('Browser tender');
  for (const [id, value] of Object.entries({ title, description: 'Browser-created tender', budget: '2500.75', submissionDeadline: '2030-07-01T10:30', openingDate: '2030-07-02T10:30' })) await page.locator(`#${id}`).fill(value);
  const created = page.waitForResponse(r => r.url().endsWith('/api/v1/tenders') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Submit for Admin approval', exact: true }).click();
  const tender = await (await created).json();
  expect(tender.status).toBe('SUBMITTED');
  await page.goto(`/lister/tenders/${tender.id}/edit`);
  await page.locator('#title').fill(title + ' edited');
  const edited = page.waitForResponse(r => r.url().endsWith(`/tenders/${tender.id}`) && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Submit for Admin approval', exact: true }).click();
  expect((await edited).status()).toBe(200);
  const approve = await request.patch(`${api}/admin/tenders/${tender.id}/approve`, { headers: auth(staff.admin.accessToken), data: { evaluatorId: staff.evaluator.userId } });
  expect(approve.status()).toBe(200);
  await login(page, bidder, 'CONTRACTOR');
  await page.goto(`/bidder/tenders/${tender.id}`);
  await page.locator('#team-bid-amount').fill('2000.25');
  const draft = page.waitForResponse(r => r.url().endsWith(`/bids/tender/${tender.id}`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const bid = await (await draft).json();
  expect(bid.status).toBe('DRAFT');
  // Upload and final submission remain separate real backend operations.
  await page.locator('input[type=file]').setInputFiles({ name: 'proposal.pdf', mimeType: 'application/pdf', buffer: pdf });
  const uploaded = page.waitForResponse(r => r.url().endsWith(`/bids/${bid.id}/proposal`) && r.request().method() === 'PUT');
  const submitted = page.waitForResponse(r => r.url().endsWith(`/bids/${bid.id}/submit`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Submit bid', exact: true }).click();
  expect((await uploaded).status()).toBe(204);
  expect((await submitted).status()).toBe(200);
  await page.goto('/bidder/my-bids');
  const row = page.getByRole('row').filter({ hasText: bid.id });
  await expect(row).toContainText('SUBMITTED');
  const download = page.waitForEvent('download');
  await row.getByRole('button', { name: 'Download PDF' }).click();
  const stream = await (await download).createReadStream();
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  expect(Buffer.concat(chunks)).toEqual(pdf);
  await row.getByRole('link', { name: 'Edit submitted bid' }).click();
  await page.locator('#team-bid-amount').fill('1900.50');
  await page.locator('input[type=file]').setInputFiles({ name: 'replacement.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nreplacement proposal\n%%EOF') });
  const replaced = page.waitForResponse(r => r.url().endsWith(`/bids/${bid.id}/proposal`) && r.request().method() === 'PUT');
  const resubmits = [];
  page.on('request', r => { if (r.url().endsWith(`/bids/${bid.id}/submit`)) resubmits.push(r.url()); });
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText(`Changes saved to submitted bid ${bid.id}. It remains submitted; no second submission was made.`, { exact: true })).toBeVisible();
  expect((await replaced).status()).toBe(204);
  expect(resubmits).toEqual([]);
  const stored = await request.get(`${api}/bids/${bid.id}`, { headers: auth(bidder.accessToken) });
  expect((await stored.json()).quotedAmount).toBe(1900.5);
});

test('large monetary API values retain every digit in the frontend', async ({ page, request }) => {
  const lister = await register(request, 'AUTHORITY'), bidder = await register(request, 'CONTRACTOR');
  await verify(request, lister); await verify(request, bidder);
  const tender = await publish(request, lister, '9007199254740993.45');
  await login(page, bidder, 'CONTRACTOR');
  const value = await page.evaluate(async id => (await (await import('/src/api/services.js')).tenderApi.detail(id, JSON.parse(sessionStorage.getItem('tenderblock_session_v3')).token)).budget, tender.id);
  expect(value).toBe('9007199254740993.45');
});

test('oversized proposal is rejected before creating a draft', async ({ page, request }) => {
  const lister = await register(request, 'AUTHORITY'), bidder = await register(request, 'CONTRACTOR');
  await verify(request, lister); await verify(request, bidder);
  const tender = await publish(request, lister);
  await login(page, bidder, 'CONTRACTOR');
  await page.goto(`/bidder/tenders/${tender.id}`);
  await page.locator('#team-bid-amount').fill('100');
  await page.locator('input[type=file]').setInputFiles({ name: 'two-megabytes.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([pdf, Buffer.alloc(2 * 1024 * 1024)]) });
  const creates = [];
  page.on('request', r => { if (r.url().endsWith(`/bids/tender/${tender.id}`)) creates.push(r.url()); });
  await page.getByRole('button', { name: 'Submit bid', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('1 MB');
  expect(creates).toEqual([]);
});

test('profile browse link opens the tender browser', async ({ page, request }) => {
  const bidder = await register(request, 'CONTRACTOR');
  await login(page, bidder, 'CONTRACTOR');
  await page.goto('/profile');
  await page.getByRole('link', { name: 'Browse published tenders', exact: true }).click();
  await expect(page).toHaveURL(/\/bidder\/tenders$/);
});

test('a draft cannot be finally submitted without a PDF', async ({ page, request }) => {
  const lister = await register(request, 'AUTHORITY'), bidder = await register(request, 'CONTRACTOR');
  await verify(request, lister); await verify(request, bidder);
  const tender = await publish(request, lister);
  await login(page, bidder, 'CONTRACTOR');
  await page.goto(`/bidder/tenders/${tender.id}`);
  await page.locator('#team-bid-amount').fill('100');
  const draft = page.waitForResponse(r => r.url().endsWith(`/bids/tender/${tender.id}`) && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const bid = await (await draft).json();
  const submissions = [];
  page.on('request', r => { if (r.url().endsWith(`/bids/${bid.id}/submit`)) submissions.push(r.url()); });
  await page.getByRole('button', { name: 'Submit bid', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Upload your proposal PDF before submitting');
  expect(submissions).toEqual([]);
  const refused = await request.post(`${api}/bids/${bid.id}/submit`, { headers: auth(bidder.accessToken) });
  expect(refused.status()).toBe(403); // Current SecurityConfig masks the service's intended 400.
});
