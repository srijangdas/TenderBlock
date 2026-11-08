// API contracts taken from the backend branch at Git commit 2b13f5d4703c92a4a6dbf7fc59d9704343e98985.
// Public UI names BIDDER and LISTER correspond to CONTRACTOR and AUTHORITY in Java.
import { exactMoney } from '../utils/decimal.js';
import { indianDateTimeToISO } from '../utils/dateTime.js';
const segment = value => encodeURIComponent(String(value));
export const TEAM_ROUTES = Object.freeze({
  register: role => `/auth/register/${segment(role)}`,
  login: '/auth/login',
  companyProfile: '/company/profile',
  ownCompanyProfile: '/company/profile/me',
  publishedTenders: '/tenders/published',
  myTenders: '/tenders/my',
  tenders: '/tenders',
  tenderDetail: id => `/tenders/${segment(id)}`,
  cancelTender: id => `/tenders/${segment(id)}/cancel`,
  myBids: '/bids/my',
  bidDetail: id => `/bids/${segment(id)}`,
  createBid: tenderId => `/bids/tender/${segment(tenderId)}`,
  updateBid: bidId => `/bids/${segment(bidId)}`,
  uploadProposal: bidId => `/bids/${segment(bidId)}/proposal`,
  downloadProposal: bidId => `/bids/${segment(bidId)}/proposal`,
  submitBid: bidId => `/bids/${segment(bidId)}/submit`,
});

export function toTeamRegisterRequest(form) {
  return {
    fullName: String(form.fullName ?? '').trim(),
    email: String(form.email ?? '').trim().toLowerCase(),
    password: form.password,
  };
}

export function toTeamCompanyProfileRequest(form) {
  return {
    companyName: String(form.organizationName ?? form.companyName ?? '').trim(),
    registrationNumber: String(form.registrationId ?? form.registrationNumber ?? '').trim() || null,
    gstin: String(form.gstin ?? '').trim().toUpperCase() || null,
    pan: String(form.pan ?? '').trim().toUpperCase() || null,
    address: String(form.address ?? '').trim(),
    contactNumber: String(form.phoneNumber ?? form.contactNumber ?? '').trim(),
    website: String(form.website ?? '').trim() || null,
  };
}

export function toTeamTenderRequest(form) {
  const submissionDeadline = indianDateTimeToISO(form.submissionDeadline);
  const openingDate = indianDateTimeToISO(form.openingDate);
  if (Date.parse(submissionDeadline) <= Date.now() || Date.parse(openingDate) <= Date.parse(submissionDeadline)) {
    throw new Error('Set a future submission deadline and an opening date after the deadline.');
  }
  const title = String(form.title ?? '').trim();
  const description = String(form.description ?? '').trim();
  if (!title || title.length > 200 || !description) throw new Error('Tender title (1–200 characters) and description are required.');
  return {
    title,
    description,
    estimatedValue: exactMoney(form.budget, 'Estimated value'),
    submissionDeadline,
    openingDate,
  };
}

export function toTeamBidRequest(amount) {
  return { quotedAmount: exactMoney(amount, 'Quoted amount') };
}
