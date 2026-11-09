import { CalendarDays, ClipboardCheck, FileText, Building2, Wallet } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, formatCurrency, isPastDeadline } from '../utils/format';
import BidForm from './BidForm';
import { Link } from 'react-router-dom';
import { BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';

export default function TenderDetailsPanel({ tender, onSubmitted, existingBid = null, bidsReady = true }) {
  const teamLive = !DEMO_MODE && BACKEND_CONTRACT === 'team';
  if (!tender) return <div className="tb-card p-8 text-center text-sm text-slate-500 dark:text-slate-400">Select a tender from the table to view its details.</div>;
  return <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
    <section className="tb-card p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold leading-6 text-ink dark:text-slate-100">Tender details</h2><StatusBadge status={tender.status}/></div><h3 className="mt-4 font-semibold text-ink dark:text-slate-100">{tender.title}</h3><div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300"><div className="flex gap-2"><Building2 size={17} className="shrink-0 text-blue-700 dark:text-blue-300"/><span>{tender.department || 'Department not specified'}</span></div><div className="flex gap-2"><CalendarDays size={17} className="shrink-0 text-blue-700 dark:text-blue-300"/><span>Deadline: <strong className="text-slate-800 dark:text-slate-100">{formatDate(tender.submissionDeadline)}</strong></span></div><div className="flex gap-2"><CalendarDays size={17} className="shrink-0 text-blue-700 dark:text-blue-300"/><span>Bid opening: <strong>{formatDate(tender.openingDate)}</strong></span></div><div className="flex gap-2"><Wallet size={17} className="shrink-0 text-blue-700 dark:text-blue-300"/><span>Budget: {formatCurrency(tender.budget)}</span></div></div>
      <h4 className="mt-5 text-sm font-bold text-ink dark:text-slate-100">Description</h4><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{tender.description}</p>
      {!teamLive && <><h4 className="mt-5 flex items-center gap-2 text-sm font-bold text-ink dark:text-slate-100"><ClipboardCheck size={16} className="text-blue-700 dark:text-blue-300"/> Eligibility criteria</h4><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{tender.eligibilityCriteria || 'Not supplied'}</p>
      <h4 className="mt-5 flex items-center gap-2 text-sm font-bold text-ink dark:text-slate-100"><FileText size={16} className="text-blue-700 dark:text-blue-300"/> Required documents</h4><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{tender.requiredDocuments || 'Not supplied'}</p></>}
      {teamLive && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Eligibility requirements and tender-specific document lists are not exposed by the current backend API. Confirm requirements with the issuing authority.</p>}
    </section>
    {tender.status==='PUBLISHED'&&!isPastDeadline(tender.submissionDeadline)
      ? (!bidsReady
        ? <section className="tb-card p-5" role="status"><p className="font-semibold">Bid creation unavailable until existing bids are checked.</p><p className="mt-2 text-sm">Reload your bids to avoid accidentally creating a duplicate.</p></section>
        : existingBid && !DEMO_MODE && BACKEND_CONTRACT==='team' && !['DRAFT','SUBMITTED'].includes(existingBid.status)
        ? <section className="tb-card p-5"><p className="font-semibold">You already submitted a bid for this tender.</p><p className="mt-2 text-sm">Reference: {existingBid.id}. Its status is {existingBid.status}.</p><Link className="tb-link mt-3 inline-block" to="/bidder/my-bids">View My bids</Link></section>
        : existingBid && teamLive && existingBid.status === 'SUBMITTED'
          ? <section className="tb-card p-5"><h3 className="font-semibold text-ink dark:text-slate-100">You already submitted a bid</h3><p className="mt-2 text-sm">You can update your quotation or replace the PDF until the submission deadline. Do not submit the bid twice.</p><Link className="tb-btn-outline mt-4 inline-flex" to={`/bidder/bids/${existingBid.id}/edit`}>Edit submitted bid</Link></section>
          : <BidForm key={`${tender.id}:${existingBid?.id || 'new'}`} tender={tender} initialBid={existingBid} onSubmitted={onSubmitted}/>)
      : <div className="tb-card p-6 text-sm text-slate-600 dark:text-slate-300">This tender is not currently open for bids.</div>}
  </div>;
}
