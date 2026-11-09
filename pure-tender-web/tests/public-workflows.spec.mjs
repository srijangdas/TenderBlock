import { test, expect } from '@playwright/test';
import { login, mockApi, pageData, tender } from './helpers.mjs';

test('public registration sends only supported account and company fields',async({page})=>{
  const calls=await mockApi(page,'CONTRACTOR',async(c,r)=>{
    if(c.path==='/auth/register/CONTRACTOR'){await r.fulfill({status:201,json:{accessToken:'registration-token',userId:'new-user',fullName:'New Bidder',email:'new@example.test',role:'CONTRACTOR',accountStatus:'PENDING'}});return true;}
    if(c.path==='/company/profile'){await r.fulfill({status:201,json:{companyName:'New Company',address:'Main Street',contactNumber:'9876543210'}});return true;}
  });
  await page.goto('/register');
  for(const [id,value] of Object.entries({fullName:'New Bidder',email:'new@example.test',organizationName:'New Company',address:'Main Street',phoneNumber:'9876543210',password:'Password@123',confirmPassword:'Password@123'})) await page.locator(`#${id}`).fill(value);
  await page.locator('input[name="role"][value="BIDDER"]').check();
  await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(/\/bidder$/);
  expect(JSON.parse(calls.find(c=>c.path==='/auth/register/CONTRACTOR').body)).toEqual({fullName:'New Bidder',email:'new@example.test',password:'Password@123'});
  const profileCall=calls.find(c=>c.path==='/company/profile');expect(profileCall.headers.authorization).toBe('Bearer registration-token');
  expect(JSON.parse(profileCall.body)).toEqual({companyName:'New Company',registrationNumber:null,gstin:null,pan:null,address:'Main Street',contactNumber:'9876543210',website:null});
  await page.goto('/bidder/tenders/tender-1');await expect(page.getByText('Account verification required',{exact:true})).toBeVisible();
});

test('lister creates a SUBMITTED tender using the Java DTO and IST dates',async({page})=>{
  const calls=await mockApi(page,'AUTHORITY',async(c,r)=>{if(c.path==='/tenders'&&c.method==='POST'){await r.fulfill({status:201,json:{...tender,...JSON.parse(c.body),status:'SUBMITTED'}});return true;}});
  await login(page,'AUTHORITY');await page.goto('/lister/create');
  for(const [id,value] of Object.entries({title:'New school bridge',description:'Bridge across the canal',budget:'12000.50',submissionDeadline:'2035-12-10T17:30',openingDate:'2035-12-11T17:30'})) await page.locator(`#${id}`).fill(value);
  await page.getByRole('button',{name:'Submit for Admin approval'}).click();
  await expect(page.getByText('Tender saved',{exact:true})).toBeVisible();
  expect(JSON.parse(calls.find(c=>c.path==='/tenders'&&c.method==='POST').body)).toEqual({title:'New school bridge',description:'Bridge across the canal',estimatedValue:'12000.50',submissionDeadline:'2035-12-10T12:00:00.000Z',openingDate:'2035-12-11T12:00:00.000Z'});
});

test('bidder draft, proposal upload, and submission use the backend sequence',async({page})=>{
  let draft;
  const calls=await mockApi(page,'CONTRACTOR',async(c,r)=>{
    if(c.path==='/bids/tender/tender-1'){draft={id:'draft-1',tenderId:'tender-1',quotedAmount:'9000.25',status:'DRAFT',proposalUploaded:false};await r.fulfill({status:201,json:draft});return true;}
    if(c.path==='/bids/draft-1/proposal'){draft.proposalUploaded=true;await r.fulfill({status:204});return true;}
    if(c.path==='/bids/draft-1/submit'){await r.fulfill({json:{...draft,status:'SUBMITTED'}});return true;}
  });
  await login(page,'CONTRACTOR');await page.goto('/bidder/tenders/tender-1');
  await page.locator('#team-bid-amount').fill('9000.25');
  await page.getByLabel('Proposal PDF',{exact:true}).setInputFiles({name:'proposal.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n1 0 obj <</Type /Catalog>> endobj\n%%EOF')});
  await page.getByRole('button',{name:'Submit bid',exact:true}).click();
  await expect(page.getByText('Bid submitted',{exact:true})).toBeVisible();
  const mutations=calls.filter(c=>c.path.startsWith('/bids/')&&c.method!=='GET');
  expect(mutations.map(c=>[c.method,c.path])).toEqual([['POST','/bids/tender/tender-1'],['PUT','/bids/draft-1/proposal'],['POST','/bids/draft-1/submit']]);
  expect(JSON.parse(mutations[0].body)).toEqual({quotedAmount:'9000.25'});expect(mutations[1].body).toContain('name="file"');expect(mutations[1].headers['content-type']).toContain('multipart/form-data; boundary=');
});

test('failed upload preserves the draft reference for a retry',async({page})=>{
  let attempt=0;
  const calls=await mockApi(page,'CONTRACTOR',async(c,r)=>{
    if(c.path==='/bids/tender/tender-1'||(c.path==='/bids/draft-1'&&c.method==='PUT')){await r.fulfill({json:{id:'draft-1',status:'DRAFT'}});return true;}
    if(c.path==='/bids/draft-1/proposal'){attempt++;await r.fulfill(attempt===1?{status:503,json:{message:'Storage unavailable'}}:{status:204});return true;}
    if(c.path==='/bids/draft-1/submit'){await r.fulfill({json:{id:'draft-1',tenderId:'tender-1',status:'SUBMITTED'}});return true;}
  });
  await login(page,'CONTRACTOR');await page.goto('/bidder/tenders/tender-1');await page.locator('#team-bid-amount').fill('5000');
  await page.getByLabel('Proposal PDF',{exact:true}).setInputFiles({name:'proposal.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n%%EOF')});
  await page.getByRole('button',{name:'Submit bid',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Draft reference: draft-1'})).toBeVisible();
  await page.getByRole('button',{name:'Submit bid',exact:true}).click();await expect(page.getByText('Bid submitted',{exact:true})).toBeVisible();
  expect(calls.filter(c=>c.path==='/bids/tender/tender-1'&&c.method==='POST')).toHaveLength(1);
});

test('evaluator registration keeps staff role selection fixed and returns to staff login',async({page})=>{
  const calls=await mockApi(page,'EVALUATOR',async(c,r)=>{if(c.path==='/auth/register/EVALUATOR'){await r.fulfill({status:201,json:{userId:'new-evaluator',role:'EVALUATOR',accessToken:'pending-token',accountStatus:'PENDING'}});return true;}});
  await page.goto('/staff/register/evaluator');
  for(const [id,value] of Object.entries({fullName:'New Evaluator',email:'expert@example.test',password:'Password@123',confirmPassword:'Password@123'}))await page.locator(`#${id}`).fill(value);
  await page.getByRole('button',{name:'Create evaluator account',exact:true}).click();await expect(page).toHaveURL(/\/staff\/login$/);
  await expect(page.getByRole('status')).toContainText('An Admin must verify');
  expect(JSON.parse(calls.find(c=>c.path==='/auth/register/EVALUATOR').body)).toEqual({fullName:'New Evaluator',email:'expert@example.test',password:'Password@123'});
  expect(await page.evaluate(()=>sessionStorage.getItem('tenderblock_session_v3'))).toBeNull();
});

test('pending evaluator sees verification status before protected API calls',async({page})=>{
  const calls=await mockApi(page,'EVALUATOR',async(c,r)=>{if(c.path==='/auth/login'){await r.fulfill({json:{accessToken:'pending-token',userId:'pending-evaluator',role:'EVALUATOR',accountStatus:'PENDING',fullName:'Pending Expert'}});return true;}});
  await login(page,'EVALUATOR');await expect(page.getByRole('heading',{name:'Account verification required'})).toBeVisible();expect(calls.some(c=>c.path.startsWith('/evaluator/'))).toBeFalsy();
});
