import { http, readAllPages } from './http';
import { DEMO } from './authApi';
import { demoStaff } from '../../../api/demoStaff';
const id = encodeURIComponent;
export const evaluatorApi = {
  tenders: async token => DEMO ? Promise.resolve(demoStaff.assignments()) : readAllPages('/evaluator/tenders/my?sort=assignedAt,desc', token),
  openBids: async (tenderId, token) => DEMO ? Promise.resolve(demoStaff.open(tenderId)) : http(`/evaluator/tenders/${id(tenderId)}/open-bids`, {method:'POST',token}),
  bids: async (tenderId, token) => DEMO ? Promise.resolve(demoStaff.bids(tenderId)) : http(`/evaluator/tenders/${id(tenderId)}/bids`, {token}),
  getEvaluation: async (bidId, token) => DEMO ? Promise.resolve(demoStaff.evaluation(bidId)) : http(`/evaluator/bids/${id(bidId)}/evaluation`, {token}),
  saveEvaluation: async (bidId, body, token) => DEMO ? Promise.resolve(demoStaff.saveEvaluation(bidId,body)) : http(`/evaluator/bids/${id(bidId)}/evaluation`, {method:'PUT',body,token}),
  finalizeEvaluation: async (bidId, token) => DEMO ? Promise.resolve(demoStaff.finalize(bidId)) : http(`/evaluator/bids/${id(bidId)}/evaluation/finalize`, {method:'POST',token}),
  downloadProposal: async (bidId, token) => http(`/evaluator/bids/${id(bidId)}/proposal`, {token,binary:true}),
  award: async (tenderId, token) => http(`/evaluator/tenders/${id(tenderId)}/award`, {token}),
};
