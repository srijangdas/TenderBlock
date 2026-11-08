import { DEMO } from './authApi';
import { http,pageItems } from './http';
import { demoReports,demoTenderStates } from '../data/demoData';

export const auditorApi={
  async reports(token){return DEMO?demoReports:pageItems(await http('/auditor/reports?page=0&size=100',{token}))},
  async flaggedTenders(token){return DEMO?demoFlaggedTenders:pageItems(await http('/auditor/tenders/flagged?page=0&size=100',{token}))},
  async completedTenders(token){return DEMO?demoCompletedTenders:pageItems(await http('/auditor/tenders/completed?page=0&size=100',{token}))},
  async auditTender(id,token){return DEMO?(demoAuditDetails[id]||{tenderId:id,bids:[]}):http(`/auditor/tenders/${id}/audit`,{token})},
  async proposal(id,token){
    if(!DEMO)return http(`/auditor/bids/${id}/proposal`,{token,responseType:'blob'});
    const content=`%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 68>>stream\nBT /F1 16 Tf 72 720 Td (TenderBlock demo proposal - ${id}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
    return new Blob([content],{type:'application/pdf'});
  },
  async tender(id,token){return DEMO?{id,status:demoTenderStates[id]||'UNDER_EVALUATION'}:http(`/tenders/${id}`,{token})},
  async claim(id,token){return DEMO?{}:http(`/auditor/reports/${id}/claim`,{method:'POST',token})},
  async resolve(id,issueConfirmed,resolutionNotes,token){return DEMO?{}:http(`/auditor/reports/${id}/resolve`,{method:'POST',body:{issueConfirmed,resolutionNotes},token})},
  async award(tenderId,winningBidId,remarks,token){return DEMO?{}:http(`/auditor/tenders/${tenderId}/award`,{method:'POST',body:{winningBidId,remarks},token})},
};
