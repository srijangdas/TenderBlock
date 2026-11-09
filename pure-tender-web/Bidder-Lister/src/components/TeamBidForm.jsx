import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileUp, Save, Send } from 'lucide-react';
import { bidApi, PROPOSAL_MAX_BYTES } from '../api/services';
import { validateProposal } from '../api/proposalValidation.js';
import { useAuth } from '../context/AuthContext';
import { isPastDeadline } from '../utils/format';
import FormField from './FormField';
import { exactMoney } from '../utils/decimal.js';

export default function TeamBidForm({ tender, initialBid = null, onSubmitted }) {
  const { user, token } = useAuth();
  const [amount, setAmount] = useState(String(initialBid?.quotedAmount ?? initialBid?.amount ?? ''));
  const [proposal, setProposal] = useState(null);
  const [draftId, setDraftId] = useState(initialBid?.id ?? null);
  const [hasProposal, setHasProposal] = useState(Boolean(initialBid?.proposalUploaded));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const isClosed = tender?.status !== 'PUBLISHED' || isPastDeadline(tender?.submissionDeadline);
  const submittedEdit = initialBid?.status === 'SUBMITTED';

  async function handleSave(event, finish) {
    event.preventDefault();
    if (busy || isClosed || (submittedEdit && finish)) return;
    setError('');
    setNotice('');

    let value;
    try { value = exactMoney(amount, 'Quoted amount'); }
    catch (validationError) { setError(validationError.message); return; }
    setBusy(true);
    if (proposal) {
      try { await validateProposal(proposal, PROPOSAL_MAX_BYTES); }
      catch (validationError) { setError(validationError.message); setBusy(false); return; }
    }
    if (finish && !hasProposal && !proposal) {
      setError('Upload your proposal PDF before submitting the bid.');
      setBusy(false);
      return;
    }

    let currentId = draftId;
    try {
      const saved = currentId
        ? await bidApi.updateDraft(user, currentId, value, token)
        : await bidApi.createDraft(user, tender.id, value, token);
      currentId = saved.id;
      if (!currentId) throw new Error('The server returned a draft without a bid reference.');
      setDraftId(currentId);

      if (proposal) {
        await bidApi.uploadProposal(user, currentId, proposal, token);
        setHasProposal(true);
        setProposal(null);
      }

      if (finish) {
        const completed = await bidApi.finalizeDraft(user, currentId, token);
        setSubmitted(completed);
        onSubmitted?.(completed);
      } else {
        setNotice(submittedEdit ? `Changes saved to submitted bid ${currentId}. It remains submitted; no second submission was made.` : `Draft ${currentId} saved. You can return to it from My bids before the deadline.`);
        // Keep the form mounted to show the draft reference and support immediate submission.
      }
    } catch (err) {
      // A successful draft remains stored even if the PDF upload or final submit fails.
      // Reusing its reference prevents a second POST /bids/tender/{tenderId} and 409 conflict.
      const reference = currentId ? ` Draft reference: ${currentId}.` : '';
      setError((err?.message || 'Could not save your bid.') + reference);
    } finally {
      setBusy(false);
    }
  }

  if (user?.verified !== true) {
    return <section className="tb-card p-5" role="status">
      <h3 className="font-semibold text-ink dark:text-slate-100">Account verification required</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your account must be verified by an Admin before you can create or submit a bid.</p>
      <Link className="tb-link mt-3 inline-block" to="/profile">View account status</Link>
    </section>;
  }
  if (submitted) {
    return <section className="tb-card p-5" role="status">
      <h3 className="font-semibold text-emerald-700">Bid submitted</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Bid reference: {submitted.id}. Your quotation and proposal were submitted to Spring Boot. This message does not imply a Fabric transaction.</p>
      <Link to="/bidder/my-bids" className="tb-btn-outline mt-4 inline-flex">View My bids</Link>
    </section>;
  }
  return <form className="tb-card p-5" onSubmit={event => handleSave(event, !submittedEdit)}>
    <h3 className="text-lg font-semibold text-ink dark:text-slate-100">{submittedEdit ? 'Edit submitted bid' : draftId ? 'Edit draft bid' : 'Prepare your bid'}</h3>
    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Enter a quotation and optionally replace the proposal PDF. Drafts can be submitted once; submitted bids can be saved again before the deadline without re-submitting.</p>
    {draftId && <p className="mt-2 break-all text-xs text-slate-500">Draft reference: {draftId}</p>}
    <div className="mt-5 grid gap-4">
      <FormField label="Quoted amount (INR)" name="amount" required>
        <input className="tb-input" id="team-bid-amount" name="amount" type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" value={amount} onChange={event => setAmount(event.target.value)} required />
      </FormField>
      <FormField label={`Proposal (PDF, maximum ${PROPOSAL_MAX_BYTES / (1024 * 1024)} MB)`} name="proposal" required={!hasProposal}>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-3 text-sm text-slate-700 dark:text-slate-200">
          <FileUp size={18} /> {proposal?.name || (hasProposal ? 'Proposal already uploaded — choose a replacement (optional)' : 'Choose a proposal PDF')}
          <input aria-label="Proposal PDF" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={event => setProposal(event.target.files?.[0] || null)} />
        </label>
      </FormField>
    </div>
    {notice && <p role="status" className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {isClosed && <p role="status" className="mt-4 text-sm text-amber-800">The tender is not accepting bids.</p>}
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="tb-btn-outline" disabled={busy || isClosed} type="button" onClick={event => handleSave(event, false)}><Save size={16} /> {busy ? 'Saving…' : submittedEdit ? 'Save changes' : 'Save draft'}</button>
      {!submittedEdit && <button className="tb-btn-primary" disabled={busy || isClosed} type="submit"><Send size={16} /> {busy ? 'Submitting…' : 'Submit bid'}</button>}
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">The server checks your role, account verification, tender status, deadline and PDF format. The current Java DTO does not accept a separate eligibility-proof file or proposal-summary field.</p>
  </form>;
}
