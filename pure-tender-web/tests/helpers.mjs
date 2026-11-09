import { expect } from '@playwright/test';
export const tender = {id:'tender-1',title:'Bridge Construction',description:'A new district bridge',estimatedValue:1000000,status:'PUBLISHED',submissionDeadline:'2035-12-10T12:00:00Z',openingDate:'2035-12-11T12:00:00Z',authorityId:'lister-1',authorityName:'District Works',createdAt:'2026-11-01T10:00:00Z'};
export const pendingTender = {...tender,id:'pending-1',status:'SUBMITTED'};
export const assignment = {tenderId:'assignment-1',title:'Hospital Equipment',status:'UNDER_EVALUATION',submissionDeadline:'2026-11-01T12:00:00Z',openingDate:'2026-11-02T12:00:00Z',submittedBidCount:1};
export const bid = {bidId:'bid-1',tenderId:'assignment-1',contractorName:'Acme Medical',quotedAmount:450000,status:'OPENED',submittedAt:'2026-10-31T10:00:00Z',proposalUploaded:true};
export const report = {reportId:'report-1',tenderId:'held-1',tenderTitle:'Water Plant',bidId:'held-bid-1',type:'MISSING_BLOCKCHAIN_RECORD',source:'SYSTEM',description:'Award ledger record requires investigation',evidenceReference:'TX-1',status:'OPEN',createdAt:'2026-11-07T10:00:00Z'};
export const pageData = items => ({content:items,number:0,size:100,totalPages:1,totalElements:items.length,last:true});
export async function mockApi(page, role, override = () => undefined) {
  const calls=[];
  await page.route('**/api/v1/**',async route=>{
    const req=route.request(); const url=new URL(req.url()); const path=url.pathname.replace('/api/v1','');
    const call={path,method:req.method(),body:req.postData(),headers:req.headers(),query:url.searchParams};calls.push(call);
    const custom=await override(call,route);
    if(custom===true)return;
    const json=(data,status=200)=>route.fulfill({status,json:data});
    if(path==='/auth/login')return json({userId:`${role.toLowerCase()}-1`,fullName:`Test ${role}`,email:`${role.toLowerCase()}@test.local`,role,accountStatus:'VERIFIED',accessToken:`token-${role}`});
    if(path==='/company/profile/me')return json({companyName:'Test Company',address:'Main Road',contactNumber:'+919876543210'});
    if(path==='/tenders/published'||path==='/tenders/my')return json(pageData([tender]));
    if(path==='/bids/my')return json(pageData([]));
    if(path==='/admin/users/pending')return json(pageData([{id:'pending-user',fullName:'Pending User',email:'pending@test.local',role:'CONTRACTOR',status:'PENDING'}]));
    if(path==='/admin/users')return json(pageData([{id:'expert-1',fullName:'Expert Evaluator',email:'expert@test.local',role:'EVALUATOR',status:'VERIFIED'}]));
    if(path==='/admin/tenders/pending')return json(pageData([pendingTender]));
    if(path==='/evaluator/tenders/my')return json(pageData([assignment]));
    if(path==='/evaluator/tenders/assignment-1/bids')return json([bid]);
    if(path==='/evaluator/bids/bid-1/evaluation'&&req.method()==='GET')return json({message:'No evaluation yet'},404);
    if(path==='/auditor/reports')return json(pageData([report]));
    if(path==='/tenders/held-1')return json({...tender,id:'held-1',title:'Water Plant',status:'ON_HOLD'});
    if(path.startsWith('/tenders/'))return json(tender);
    return json({message:'Endpoint not implemented in test fixture'},404);
  });
  return calls;
}
export async function login(page,role) {
  const staff=['ADMIN','AUDITOR','EVALUATOR'].includes(role);
  await page.goto(staff?'/staff/login':'/login');
  await page.getByLabel(/^Email address/).fill(`${role.toLowerCase()}@test.local`);
  await page.getByLabel(/^Password/).fill('Password@123');
  await page.getByRole('button',{name:staff?'Sign in as staff':'Sign in',exact:true}).click();
  await expect(page).toHaveURL(staff?/\/staff\/workspace$/:role==='AUTHORITY'?/\/lister$/:/\/bidder$/);
}
export function noCrashes(page){const errors=[];page.on('pageerror',e=>errors.push(e.message));return errors;}
