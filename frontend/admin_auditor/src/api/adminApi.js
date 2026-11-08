import { DEMO } from './authApi';
import { http,pageItems } from './http';
import { demoTenders,demoUsers } from '../data/demoData';

export const adminApi={
  async users(token,pending=false){return DEMO?(pending?demoUsers.filter(u=>u.status==='PENDING'):demoUsers):pageItems(await http(`/admin/users${pending?'/pending':''}?page=0&size=100`,{token}))},
  async tenders(token){return DEMO?demoTenders:pageItems(await http('/admin/tenders/pending?page=0&size=100',{token}))},
  async verifyUser(id,token){return DEMO?{}:http(`/admin/users/${id}/verify`,{method:'PATCH',token})},
  async rejectUser(id,token){return DEMO?{}:http(`/admin/users/${id}/reject`,{method:'PATCH',token})},
  async approveTender(id,evaluatorId,token){return DEMO?{}:http(`/admin/tenders/${id}/approve`,{method:'PATCH',body:{evaluatorId},token})},
  async rejectTender(id,reason,token){return DEMO?{}:http(`/admin/tenders/${id}/reject`,{method:'PATCH',body:{reason},token})},
  async tenderDocument(id,token){
    if(DEMO) return new Blob([`TenderBlock demo tender document\n\nReference: ${id}\n\nThe live backend document endpoint is not connected yet.`],{type:'text/plain'});
    return http(`/admin/tenders/${id}/document`,{token,responseType:'blob'});
  },
};
