import { DEMO } from './authApi';
import { http, readAllPages } from './http';
import { demoStaff } from '../../../api/demoStaff';
const id = encodeURIComponent;
export const adminApi = {
  users: async (token,pending=false) => DEMO ? Promise.resolve(demoStaff.users(pending)) : readAllPages(`/admin/users${pending?'/pending':''}`,token),
  tenders: async token => DEMO ? Promise.resolve(demoStaff.pendingTenders()) : readAllPages('/admin/tenders/pending',token),
  verifyUser: async (userId,token) => DEMO ? Promise.resolve(demoStaff.userStatus(userId,'VERIFIED')) : http(`/admin/users/${id(userId)}/verify`,{method:'PATCH',token}),
  rejectUser: async (userId,token) => DEMO ? Promise.resolve(demoStaff.userStatus(userId,'REJECTED')) : http(`/admin/users/${id(userId)}/reject`,{method:'PATCH',token}),
  approveTender: async (tenderId,evaluatorId,token) => DEMO ? Promise.resolve(demoStaff.approve(tenderId,evaluatorId)) : http(`/admin/tenders/${id(tenderId)}/approve`,{method:'PATCH',body:{evaluatorId},token}),
  rejectTender: async (tenderId,reason,token) => DEMO ? Promise.resolve(demoStaff.reject(tenderId,reason)) : http(`/admin/tenders/${id(tenderId)}/reject`,{method:'PATCH',body:{reason},token}),
  async tenderDocument(tenderId,token) {
    if (DEMO) return new Blob(['Demo tender summary: '+demoStaff.tender(tenderId).title],{type:'text/plain'});
    try {return await http(`/admin/tenders/${id(tenderId)}/document`,{token,responseType:'blob'});}
    catch(error) {if([403,404,405,501].includes(error.status))throw new Error('Tender document download is not available yet. The tender details shown above are available for review.');throw error;}
  },
};
