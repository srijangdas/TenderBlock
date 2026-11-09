// Adapters for the single browser-local demo store used by all five roles.
// No method in this file is used by a live build.
import { demoSnapshot, demoSave, demoUsers } from './demoStore';
const now = () => new Date().toISOString();
const getTender = (db, id) => { const t = db.tenders.find(t => t.id === id); if (!t) throw new Error('Tender not found.'); return t; };
const getBid = (db, id) => { const b = db.bids.find(b => b.id === id); if (!b) throw new Error('Bid not found.'); return b; };
const tenderRow = t => ({ ...t, tenderId: t.id, tenderTitle: t.title, authorityName: t.createdBy, estimatedValue: t.budget });
export const demoStaff = {
  users: pending => demoUsers().map(u => ({ ...u, status: u.accountStatus })).filter(u => !pending || u.status === 'PENDING'),
  pendingTenders: () => demoSnapshot().tenders.filter(t => ['PENDING_APPROVAL','SUBMITTED'].includes(t.status)).map(tenderRow),
  userStatus(id, status) { const db = demoSnapshot(); const u = db.users.find(u => u.id === id); if (!u) throw new Error('User not found.'); Object.assign(u, { accountStatus: status, verified: status === 'VERIFIED' }); demoSave(db); return u; },
  approve(id, evaluatorId) { const db = demoSnapshot(); const t = getTender(db, id); if (!db.users.some(u => u.id === evaluatorId && u.role === 'EVALUATOR' && u.verified)) throw new Error('Select a verified evaluator.'); Object.assign(t, { status: 'PUBLISHED', assignedEvaluatorId: evaluatorId, publishedAt: now() }); demoSave(db); return tenderRow(t); },
  reject(id, reason) { const db = demoSnapshot(); const t = getTender(db,id); Object.assign(t,{status:'REJECTED',rejectionReason:reason}); demoSave(db); return tenderRow(t); },
  assignments() { return demoSnapshot().tenders.filter(t => t.assignedEvaluatorId === 'demo-evaluator').map(t => ({ ...tenderRow(t), submittedBidCount: demoSnapshot().bids.filter(b => b.tenderId === t.id).length })); },
  open(id) { const db=demoSnapshot();const t=getTender(db,id); if (Date.parse(t.openingDate || t.submissionDeadline) > Date.now()) throw new Error('Wait until the tender opening date.'); if (!['PUBLISHED','UNDER_EVALUATION'].includes(t.status)) throw new Error('This tender cannot be opened.'); t.status='UNDER_EVALUATION'; const bids=db.bids.filter(b=>b.tenderId===id);bids.forEach(b=>b.status='OPENED');demoSave(db);return {tenderId:id,openedCount:bids.length}; },
  bids(id) { return demoSnapshot().bids.filter(b=>b.tenderId===id).map(b=>({...b,bidId:b.id,contractorName:b.bidderName,quotedAmount:b.amount,proposalUploaded:Boolean(b.proposalFileName)})); },
  evaluation(id) { return demoSnapshot().evaluations?.[id] || null; },
  saveEvaluation(id, body) { const db=demoSnapshot();getBid(db,id);db.evaluations ||= {};if(db.evaluations[id]?.status==='FINALIZED')throw new Error('Finalized evaluations cannot be changed.');db.evaluations[id]={...body,bidId:id,status:'DRAFT'};demoSave(db);return db.evaluations[id]; },
  finalize(id) { const db=demoSnapshot();const b=getBid(db,id);const ev=db.evaluations?.[id];if(!ev)throw new Error('Save a draft first.');Object.assign(ev,{status:'FINALIZED',totalScore:(Number(ev.technicalScore)+Number(ev.financialScore))/2});Object.assign(b,{score:ev.totalScore,status:'EVALUATED'}); const t=getTender(db,b.tenderId); const bids=db.bids.filter(x=>x.tenderId===b.tenderId);if(bids.every(x=>db.evaluations[x.id]?.status==='FINALIZED')) {t.status='AWARDED';t.winningBidId=[...bids].sort((a,b)=>b.score-a.score)[0].id;t.awardedAt=now();}demoSave(db);return ev; },
  reports: () => demoSnapshot().reports || [],
  tender: id => tenderRow(getTender(demoSnapshot(),id)),
  flagged: () => demoSnapshot().tenders.filter(t=>t.status==='ON_HOLD').map(tenderRow),
  completed: () => demoSnapshot().tenders.filter(t=>t.status==='AWARDED').map(tenderRow),
  audit(id) {const db=demoSnapshot();const t=getTender(db,id);return {...tenderRow(t),databaseIntegrity:'DEMO_ONLY',blockchainIntegrity:'DEMO_ONLY',bids:this.bids(id).map(b=>({...b,bidderName:b.contractorName,databaseIntegrity:'DEMO_ONLY',blockchainIntegrity:'DEMO_ONLY'}))};},
  claim(id) {const db=demoSnapshot();const r=db.reports.find(r=>r.reportId===id);if(!r||r.status!=='OPEN')throw new Error('Only open reports can be claimed.');r.status='UNDER_REVIEW';demoSave(db);return r;},
  resolve(id,issueConfirmed,resolutionNotes) {const db=demoSnapshot();const r=db.reports.find(r=>r.reportId===id);if(!r||r.status!=='UNDER_REVIEW')throw new Error('Claim this report before resolving it.');Object.assign(r,{status:issueConfirmed?'RESOLVED':'DISMISSED',resolutionNotes,resolvedAt:now()});if(issueConfirmed)getTender(db,r.tenderId).status='VOIDED';demoSave(db);return r;},
  award(id,winningBidId,remarks) {const db=demoSnapshot();const t=getTender(db,id);if(t.status!=='ON_HOLD')throw new Error('Only held tenders can be awarded.');if(db.reports.some(r=>r.tenderId===id&&!['RESOLVED','DISMISSED'].includes(r.status)))throw new Error('Resolve all reports first.');if(!db.bids.some(b=>b.id===winningBidId&&b.tenderId===id))throw new Error('Choose a bid from this tender.');Object.assign(t,{status:'AWARDED',winningBidId,remarks,awardedAt:now()});demoSave(db);return t;},
};
