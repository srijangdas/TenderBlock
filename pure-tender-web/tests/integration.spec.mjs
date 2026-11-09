import { test, expect } from '@playwright/test';
import { mockApi, login, noCrashes, pageData, tender, assignment, bid, report } from './helpers.mjs';

for(const role of ['CONTRACTOR','AUTHORITY','ADMIN','EVALUATOR','AUDITOR']) {
  test(`shared login and reload for ${role}`,async({page})=>{
    const errors=noCrashes(page);const calls=await mockApi(page,role);
    await login(page,role);await page.reload();
    await expect(page.getByText('Unable to display this page',{exact:true})).toHaveCount(0);
    await expect(page.getByText(`Test ${role}`,{exact:false}).first()).toBeVisible();
    const authenticated=calls.filter(c=>!['/auth/login'].includes(c.path));
    expect(authenticated.length).toBeGreaterThan(0);
    expect(authenticated.every(c=>c.headers.authorization===`Bearer token-${role}`)).toBeTruthy();
    expect(errors).toEqual([]);
    const logout=page.getByRole('button',{name:/^(Logout|Sign out)$/i}).first();
    await logout.click();await expect(page).toHaveURL(/\/(staff\/login|login)$/);
  });
}

test('unauthenticated staff deep links and wrong-role access redirect',async({page})=>{
  await page.goto('/evaluator');await expect(page).toHaveURL(/\/staff\/login$/);
  await mockApi(page,'CONTRACTOR');await login(page,'CONTRACTOR');
  await page.goto('/staff/workspace');await expect(page).toHaveURL(/\/bidder$/);
});

test('admin verifies applicants and approves with the evaluator ID',async({page})=>{
  let approved=false, verified=false;
  const calls=await mockApi(page,'ADMIN',async(c,r)=>{
    if(c.path==='/admin/users/pending'&&verified){await r.fulfill({json:pageData([])});return true;}
    if(c.path==='/admin/tenders/pending'&&approved){await r.fulfill({json:pageData([])});return true;}
    if(c.path==='/admin/users/pending-user/verify'){verified=true;await r.fulfill({json:{userId:'pending-user',status:'VERIFIED'}});return true;}
    if(c.path==='/admin/tenders/pending-1/approve'){approved=true;await r.fulfill({json:{...tender,status:'PUBLISHED'}});return true;}
  });
  await login(page,'ADMIN');await page.getByRole('button',{name:'Account reviews'}).click();
  await page.getByRole('button',{name:'Verify',exact:true}).click();await expect(page.getByText('Pending User',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Tender approvals',exact:true}).click();
  await page.getByRole('button',{name:'Approve & assign'}).click();
  await page.getByLabel('Assigned evaluator').selectOption('expert-1');
  await page.getByRole('button',{name:'Confirm approval'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(calls.find(c=>c.path.endsWith('/approve')).method).toBe('PATCH');
  expect(JSON.parse(calls.find(c=>c.path.endsWith('/approve')).body)).toEqual({evaluatorId:'expert-1'});
});

test('admin rejection failure stays visible in the action dialog',async({page})=>{
  const calls=await mockApi(page,'ADMIN',async(c,r)=>{if(c.path==='/admin/tenders/pending-1/reject'){await r.fulfill({status:409,json:{message:'Tender was changed by another reviewer'}});return true;}});
  await login(page,'ADMIN');await page.getByRole('button',{name:'Tender approvals',exact:true}).click();
  await page.getByRole('button',{name:'Reject tender',exact:true}).click();
  await page.getByLabel('Reason',{exact:true}).fill('Invalid deadline');
  await page.getByRole('dialog').getByRole('button',{name:'Reject tender',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Tender was changed by another reviewer');
  expect(JSON.parse(calls.find(c=>c.path.endsWith('/reject')).body)).toEqual({reason:'Invalid deadline'});
});

test('staff queues fetch subsequent Spring pages',async({page})=>{
  let secondPage=false;
  await mockApi(page,'ADMIN',async(c,r)=>{if(c.path==='/admin/users/pending'){
    if(c.query.get('page')==='1'){secondPage=true;await r.fulfill({json:{...pageData([{id:'last-user',fullName:'Last Page User',email:'last@example.test',role:'CONTRACTOR',status:'PENDING'}]),number:1,totalPages:2}});}
    else await r.fulfill({json:{...pageData([{id:'first',fullName:'First User',role:'CONTRACTOR',status:'PENDING'}]),last:false,totalPages:2}});return true;
  }});
  await login(page,'ADMIN');await page.getByRole('button',{name:'Account reviews'}).click();
  await expect(page.getByText('Last Page User',{exact:true})).toBeVisible();expect(secondPage).toBeTruthy();
});

test('evaluator saves scores, prevents unsaved finalization, and downloads proposals',async({page})=>{
  let evaluation=null;
  const calls=await mockApi(page,'EVALUATOR',async(c,r)=>{
    if(c.path==='/evaluator/bids/bid-1/evaluation'){
      if(c.method==='PUT')evaluation={...JSON.parse(c.body),status:'DRAFT'};
      await r.fulfill({status:evaluation?200:404,json:evaluation||{message:'No evaluation yet'}});return true;
    }
    if(c.path.endsWith('/evaluation/finalize')){evaluation={...evaluation,status:'FINALIZED'};await r.fulfill({json:evaluation});return true;}
    if(c.path.endsWith('/proposal')){await r.fulfill({contentType:'application/pdf',body:Buffer.from('%PDF-1.4\nproposal\n%%EOF')});return true;}
  });
  await login(page,'EVALUATOR');await page.getByRole('button',{name:/Open assignment/i}).click();
  await expect(page.getByText('Acme Medical',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Save draft'}).click();
  await expect(page.getByText('Enter both scores before saving.')).toBeVisible();
  expect(calls.filter(c=>c.method==='PUT')).toHaveLength(0);
  await page.getByLabel('Technical score',{exact:true}).fill('85.25');await page.getByLabel('Financial score',{exact:true}).fill('90');
  await page.getByRole('button',{name:'Save draft'}).click();await expect(page.getByRole('button',{name:'Submit score'})).toBeEnabled();
  await page.getByLabel('Technical score',{exact:true}).fill('86');await expect(page.getByRole('button',{name:'Submit score'})).toBeDisabled();
  await page.getByRole('button',{name:'Save draft'}).click();await page.getByRole('button',{name:'Submit score'}).click();
  await expect(page.getByText('Evaluation submitted',{exact:true})).toBeVisible();
  expect(JSON.parse(calls.filter(c=>c.method==='PUT').at(-1).body)).toEqual({technicalScore:86,financialScore:90,remarks:''});
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Proposal PDF'}).click();expect((await download).suggestedFilename()).toMatch(/proposal\.pdf$/);
});

test('auditor reports work when optional endpoints are missing',async({page})=>{
  let current={...report};
  const calls=await mockApi(page,'AUDITOR',async(c,r)=>{
    if(c.path==='/auditor/reports'){await r.fulfill({json:pageData([current])});return true;}
    if(c.path.endsWith('/claim')){current={...current,status:'UNDER_REVIEW'};await r.fulfill({json:current});return true;}
    if(c.path.endsWith('/resolve')){current={...current,status:'DISMISSED',resolutionNotes:JSON.parse(c.body).resolutionNotes};await r.fulfill({json:current});return true;}
  });
  const errors=noCrashes(page);await login(page,'AUDITOR');
  await page.getByRole('button',{name:'Integrity reports',exact:true}).click();await page.getByRole('button',{name:'Claim report',exact:true}).click();
  await expect(page.getByRole('button',{name:'Record finding'})).toBeVisible();await page.getByRole('button',{name:'Record finding'}).click();
  await page.getByRole('button',{name:'No issue found'}).click();await page.getByLabel('Resolution notes').fill('Reviewed source records; no discrepancy.');await page.getByRole('button',{name:'Record resolution'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Award held tender'})).toBeVisible();
  expect(JSON.parse(calls.find(c=>c.path.endsWith('/resolve')).body)).toEqual({issueConfirmed:false,resolutionNotes:'Reviewed source records; no discrepancy.'});
  await page.getByRole('button',{name:'Flagged tenders',exact:true}).click();await page.getByRole('button',{name:/Water Plant/}).click();
  await expect(page.getByText('Bid audit details are not available yet.',{exact:false})).toBeVisible();expect(errors).toEqual([]);
});

test('401 clears the common session and returns staff to login',async({page})=>{
  let expire=false;await mockApi(page,'ADMIN',async(c,r)=>{if(expire&&c.path.startsWith('/admin/')){await r.fulfill({status:401,json:{message:'Expired'}});return true;}});
  await login(page,'ADMIN');await expect(page.getByText('Needs your attention')).toBeVisible();await expect(page.getByRole('button',{name:/Refresh/})).toBeEnabled();expire=true;await page.getByRole('button',{name:/Refresh/}).click();
  await expect(page).toHaveURL(/\/staff\/login/);await expect(page.getByText('Your session expired. Sign in again.')).toBeVisible();
});

test('mobile workspace and shared theme',async({page})=>{
  await page.setViewportSize({width:390,height:844});await mockApi(page,'EVALUATOR');await login(page,'EVALUATOR');
  await expect(page.getByRole('heading',{name:'Assigned to you.'})).toBeVisible();
  await page.getByRole('button',{name:'Switch to dark theme'}).click();await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.screenshot({path:'test-results/evaluator-mobile-dark.png',fullPage:true});
});
