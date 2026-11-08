import { http } from './http';
import { DEMO } from './authApi';
import { demoBids, demoScores, demoTenders } from '../data/demoData';

const pageItems = value => Array.isArray(value) ? value : value?.content || [];

export const evaluatorApi = {
  async tenders(token) {
    return DEMO ? demoTenders : pageItems(await http('/evaluator/tenders/my?page=0&size=100&sort=assignedAt,desc', { token }));
  },
  async openBids(tenderId, token) {
    return DEMO ? { tenderId, openedCount: demoBids[tenderId]?.length || 0 } : http(`/evaluator/tenders/${tenderId}/open-bids`, { method: 'POST', token });
  },
  async bids(tenderId, token) {
    return DEMO ? demoBids[tenderId] || [] : http(`/evaluator/tenders/${tenderId}/bids`, { token });
  },
  async getEvaluation(bidId, token) {
    return DEMO ? demoScores[bidId] || null : http(`/evaluator/bids/${bidId}/evaluation`, { token });
  },
  async saveEvaluation(bidId, body, token) {
    if (DEMO) { demoScores[bidId] = { ...body, status: 'DRAFT' }; return demoScores[bidId]; }
    return http(`/evaluator/bids/${bidId}/evaluation`, { method: 'PUT', body, token });
  },
  async finalizeEvaluation(bidId, token) {
    if (DEMO) {
      if (!demoScores[bidId]) throw new Error('Save the evaluation before submitting it.');
      demoScores[bidId].status = 'FINALIZED';
      return demoScores[bidId];
    }
    return http(`/evaluator/bids/${bidId}/evaluation/finalize`, { method: 'POST', token });
  },
  async downloadProposal(bidId, token) {
    return DEMO ? null : http(`/evaluator/bids/${bidId}/proposal`, { token, binary: true });
  },
};
