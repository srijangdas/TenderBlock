import { test, expect } from '@playwright/test';
const origin='http://127.0.0.1:5176';
async function staffLogin(page, role){await page.goto(`${origin}/staff/login`);await page.getByLabel('Email address',{exact:true}).fill(`${role}@demo.test`);await page.getByLabel('Password',{exact:true}).fill('Demo@12345');await page.getByRole('button',{name:'Sign in as staff'}).click();await expect(page).toHaveURL(/\/staff\/workspace$/);}

test('demo admin verification persists across role sessions',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await staffLogin(page,'admin');
  await page.getByRole('button',{name:'Account reviews',exact:true}).click();await expect(page.getByText('New Bidder',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.getByRole('button',{name:'Logout',exact:true}).click();await staffLogin(page,'admin');await page.getByRole('button',{name:'Account reviews',exact:true}).click();await expect(page.getByText('New Bidder',{exact:true})).toHaveCount(0);expect(errors).toEqual([]);
});

test('demo scoring persists after reload and all staff share one session',async({page})=>{
  await staffLogin(page,'evaluator');await page.getByRole('button',{name:'Open assignment',exact:true}).first().click();
  const card=page.locator('.bid-card').first();await card.getByLabel('Technical score',{exact:true}).fill('80');await card.getByLabel('Financial score',{exact:true}).fill('90');await card.getByRole('button',{name:'Save draft'}).click();
  await expect(card.getByRole('button',{name:'Submit score'})).toBeEnabled();await card.getByRole('button',{name:'Submit score'}).click();await expect(card.getByText('Evaluation submitted',{exact:true})).toBeVisible();
  await page.reload();await page.getByRole('button',{name:'Open assignment',exact:true}).first().click();await expect(page.locator('.bid-card').first().getByLabel('Technical score',{exact:true})).toHaveValue('80');
  expect(await page.evaluate(()=>Object.keys(sessionStorage).filter(k=>/session/.test(k)))).toEqual(['tenderblock_session_v3']);
});

test('demo auditor claim and resolution persist and audit detail renders',async({page})=>{
  await staffLogin(page,'auditor');await page.getByRole('button',{name:'Integrity reports',exact:true}).click();await page.getByRole('button',{name:'Claim report',exact:true}).first().click();
  await page.getByRole('button',{name:'Record finding',exact:true}).first().click();await page.getByRole('button',{name:'No issue found'}).click();await page.getByLabel('Resolution notes').fill('No issue in demo record.');await page.getByRole('button',{name:'Record resolution'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Flagged tenders',exact:true}).click();await page.getByRole('button',{name:/Regional Water Treatment Plant/}).click();await expect(page.getByText(/Demo Only/i).first()).toBeVisible();
});
