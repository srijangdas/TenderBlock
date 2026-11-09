// Transport-injected adapters keep our React components independent of Spring's DTO names.
// Backend: /api/v1/bids, BidController.java at pinned commit b6f73c88a484.
import { TEAM_ROUTES, toTeamBidRequest } from './contracts.js';
import { normalizeBid, normalizeBidList } from './dtos.js';
import { validateProposal } from './proposalValidation.js';

export async function readTeamPages(path, token, request) {
  const all = [];
  for (let page = 0; page < 100; page += 1) {
    const divider = path.includes('?') ? '&' : '?';
    const result = await request(`${path}${divider}page=${page}&size=100`, { token });
    if (Array.isArray(result)) return result;
    if (!Array.isArray(result?.content)) {
      throw new Error(`Expected a paginated response from ${path}.`);
    }
    all.push(...result.content);
    if (result.last === true || result.content.length === 0 ||
        (Number.isFinite(result.totalPages) && page + 1 >= result.totalPages) ||
        (result.last === undefined && !Number.isFinite(result.totalPages) && result.content.length < 100)) {
      return all;
    }
  }
  throw new Error(`Too many result pages from ${path}; narrow the search.`);
}

export function createTeamBidClient(request, { proposalMaxBytes = 1024 * 1024 } = {}) {
  return {
    async createDraft(tenderId, amount, token) {
      const result = await request(TEAM_ROUTES.createBid(tenderId), {
        method: 'POST', body: toTeamBidRequest(amount), token,
      });
      return normalizeBid(result);
    },
    async updateDraft(bidId, amount, token) {
      const result = await request(TEAM_ROUTES.updateBid(bidId), {
        method: 'PUT', body: toTeamBidRequest(amount), token,
      });
      return normalizeBid(result);
    },
    async uploadProposal(bidId, file, token) {
      await validateProposal(file, proposalMaxBytes);
      const multipart = new FormData();
      multipart.append('file', file, file.name || 'proposal.pdf');
      await request(TEAM_ROUTES.uploadProposal(bidId), {
        method: 'PUT', body: multipart, token,
      });
    },
    async submitDraft(bidId, token) {
      return normalizeBid(await request(TEAM_ROUTES.submitBid(bidId), {
        method: 'POST', token,
      }));
    },
    async mine(token) {
      return normalizeBidList(await readTeamPages(TEAM_ROUTES.myBids, token, request));
    },
    async detail(bidId, token) {
      return normalizeBid(await request(TEAM_ROUTES.bidDetail(bidId), { token }));
    },
  };
}
