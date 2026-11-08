import assert from 'node:assert/strict';
import { TEAM_ROUTES, toTeamBidRequest, toTeamCompanyProfileRequest, toTeamRegisterRequest, toTeamTenderRequest } from '../src/api/contracts.js';
import { normalizeBid, normalizeBidList, normalizeTender, toCurrentUser } from '../src/api/dtos.js';
import { createTeamBidClient, readTeamPages } from '../src/api/teamBidClient.js';

assert.equal(TEAM_ROUTES.createBid('t1'), '/bids/tender/t1');
assert.equal(TEAM_ROUTES.updateBid('b1'), '/bids/b1');
assert.equal(TEAM_ROUTES.uploadProposal('b1'), '/bids/b1/proposal');
assert.equal(TEAM_ROUTES.downloadProposal('b1'), '/bids/b1/proposal');
assert.equal(TEAM_ROUTES.submitBid('b1'), '/bids/b1/submit');
assert.equal(TEAM_ROUTES.myBids, '/bids/my');
assert.equal(TEAM_ROUTES.myTenders, '/tenders/my');
assert.equal(TEAM_ROUTES.publishedTenders, '/tenders/published');
assert.equal(TEAM_ROUTES.cancelTender('t1'), '/tenders/t1/cancel');
assert.deepEqual(toTeamBidRequest('0.29'), { quotedAmount: '0.29' });
assert.deepEqual(toTeamBidRequest('150000.50'), { quotedAmount: '150000.50' });
assert.throws(() => toTeamBidRequest('25.555'), /decimal places/);
assert.throws(() => toTeamBidRequest('0'), /decimal places/);
assert.deepEqual(toTeamRegisterRequest({fullName:'  Alice  ',email:'ALICE@example.com',password:'longsecret'}),
  {fullName:'Alice',email:'alice@example.com',password:'longsecret'});
assert.deepEqual(toTeamCompanyProfileRequest({organizationName:'Shop',registrationId:'REG1',address:'Road',phoneNumber:'9999999999'}),
  {companyName:'Shop',registrationNumber:'REG1',gstin:null,pan:null,address:'Road',contactNumber:'9999999999',website:null});
const tender = toTeamTenderRequest({title:' Sample ',description:' Work ',budget:'100000',submissionDeadline:'2030-07-01T10:00',openingDate:'2030-07-02T10:00'});
assert.deepEqual(Object.keys(tender),['title','description','estimatedValue','submissionDeadline','openingDate']);
assert.ok(Date.parse(tender.openingDate) > Date.parse(tender.submissionDeadline));
assert.equal(normalizeTender({id:'t1',estimatedValue:900,authorityId:'u1',status:'SUBMITTED'}).budget,900);
assert.equal(toCurrentUser({userId:'a1',role:'CONTRACTOR',accountStatus:'VERIFIED'}).role,'BIDDER');
assert.equal(toCurrentUser({userId:'a1',role:'AUTHORITY',accountStatus:'PENDING'}).verified,false);
assert.deepEqual(normalizeBidList({content:[{id:'b1',quotedAmount:123.45,status:'DRAFT',proposalUploaded:true}]}).map(x => [x.amount,x.status,x.proposalUploaded]), [[123.45,'DRAFT',true]]);

const requests=[];
const backend = async (path,opts={}) => {
  requests.push({path, ...opts});
  if (path === '/bids/tender/t1') return {id:'b1',tenderId:'t1',quotedAmount:100,status:'DRAFT',proposalUploaded:false};
  if (path === '/bids/b1' && opts.method === 'PUT') return {id:'b1',tenderId:'t1',quotedAmount:101,status:'DRAFT',proposalUploaded:false};
  if (path === '/bids/b1/proposal') return null; // Spring returns HTTP 204.
  if (path === '/bids/b1/submit') return {id:'b1',tenderId:'t1',quotedAmount:101,status:'SUBMITTED',proposalUploaded:true};
  if (path === '/bids/b1' && !opts.method) return {id:'b1',tenderId:'t1',quotedAmount:101,status:'DRAFT',proposalUploaded:true};
  if (path.startsWith('/bids/my?')) return {content:[{id:'b1',tenderId:'t1',quotedAmount:101,status:'DRAFT'}],last:true,totalPages:1};
  throw new Error('Unknown mocked URL '+path);
};
const api = createTeamBidClient(backend);
assert.equal((await api.createDraft('t1',100,'jwt')).id,'b1');
assert.equal((await api.updateDraft('b1',101,'jwt')).amount,101);
const pdf = new Blob(['%PDF-1.4\nexample'],{type:'application/pdf'});
await api.uploadProposal('b1',pdf,'jwt');
assert.equal((await api.submitDraft('b1','jwt')).status,'SUBMITTED');
assert.equal((await api.detail('b1','jwt')).proposalUploaded,true);
assert.equal((await api.mine('jwt'))[0].quotedAmount,101);
assert.equal(requests[0].method,'POST');
assert.deepEqual(requests[0].body,{quotedAmount:'100'});
assert.equal(requests[1].method,'PUT');
assert.deepEqual(requests[1].body,{quotedAmount:'101'});
assert.equal(requests[2].method,'PUT');
assert.ok(requests[2].body instanceof FormData);
assert.equal(requests[2].body.get('file').name,'proposal.pdf');
assert.equal(requests[3].method,'POST');
assert.equal(requests[3].path,'/bids/b1/submit');
await assert.rejects(() => api.uploadProposal('b1',new Blob(['hello'],{type:'text/plain'}),'jwt'),/PDF/);

const pages = [];
const all = await readTeamPages('/tenders/my','jwt',async path => {
  pages.push(path);
  return path.includes('page=0')
    ? {content:[{id:'one'}],last:false,totalPages:2}
    : {content:[{id:'two'}],last:true,totalPages:2};
});
assert.deepEqual(all.map(x=>x.id),['one','two']);
assert.deepEqual(pages,['/tenders/my?page=0&size=100','/tenders/my?page=1&size=100']);
console.log('PASS: team backend (commit 2b13f5d470) routes, DTOs, bid draft/upload/submit, pagination and role normalization');
