import { useState } from 'react';
import { Send, UploadCloud } from 'lucide-react';
import { bidApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import FormField from './FormField';
import { DEMO_MODE } from '../data/constants';
import { isPastDeadline } from '../utils/format';

export default function DemoBidForm({ tender, onSubmitted, initialBid = null }) {
  const { user, token } = useAuth();
  const [form, setForm] = useState({ amount:initialBid?.amount||'',proposalSummary:initialBid?.proposalSummary||'',remarks:initialBid?.remarks||'',evidence:null,proposal:null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  function update(event) { const { name, value, files } = event.target; setForm(old=>({...old,[name]:files?files[0]:value})); }
  async function handleSubmit(event) {
    event.preventDefault();setError('');
    if (Number(form.amount)<=0 || !form.proposalSummary.trim() || (!initialBid && (!form.evidence || !form.proposal))) { setError('Complete the bid amount, proposal summary and both PDF attachments.');return; }
    for (const file of [form.evidence, form.proposal].filter(Boolean)) {
      if (file.type !== 'application/pdf') {setError('Only PDF files are accepted in this demo.');return;}
      if (file.size>10*1024*1024) {setError('Each file must be 10 MB or smaller.');return;}
    }
    if (isPastDeadline(tender.submissionDeadline)) {setError('This tender has passed its submission deadline.');return;}
    setBusy(true);
    try {const response= initialBid ? await bidApi.update(user,initialBid.id,form,token) : await bidApi.submit(user,tender.id,form,token);setResult(response);onSubmitted?.(response);}
    catch (err) {setError(err?.message||'Bid submission failed.');}
    finally {setBusy(false);}
  }
  if (result) return <section className="tb-card p-5"><h3 className="text-lg font-bold text-ink dark:text-slate-100">{initialBid ? "Bid updated" : "Bid submitted"}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Reference: <strong>{result.id||'Pending response'}</strong>. {DEMO_MODE?'This is a browser-only demo record; no files were uploaded or hashes verified.':'Check the backend for the actual submission and blockchain confirmation status.'}</p><button type="button" className="tb-btn-outline mt-4" onClick={()=>{setResult(null);setForm({amount:'',proposalSummary:'',remarks:'',evidence:null,proposal:null});}}>Back to bid form</button></section>;
  return <form onSubmit={handleSubmit} className="tb-card p-5" noValidate><h3 className="mb-4 text-lg font-bold text-ink dark:text-slate-100">{initialBid ? "Edit Your Bid" : "Place Your Bid"}</h3><div className="grid gap-4 sm:grid-cols-2">
    <FormField label="Bid amount (INR)" name="amount" required><input id="amount" type="number" name="amount" min="1" value={form.amount} onChange={update} placeholder="Enter quoted amount" className="tb-input"/></FormField>
    <FormField label="Proposal summary" name="proposalSummary" required><textarea id="proposalSummary" name="proposalSummary" value={form.proposalSummary} onChange={update} placeholder="Brief summary of your offer" className="tb-input min-h-20 resize-y"/></FormField>
    <FormField label="Eligibility proof (PDF)" name="evidence" required={!initialBid} hint={initialBid ? "Optional replacement PDF, max 10 MB" : "PDF, max 10 MB"}><label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-3 text-sm text-slate-600 dark:text-slate-300 hover:border-blue-400"><UploadCloud size={17} className="shrink-0"/><span className="truncate">{form.evidence?.name||'Choose eligibility document'}</span><input id="evidence" name="evidence" type="file" accept=".pdf,application/pdf" className="sr-only" onChange={update}/></label></FormField>
    <FormField label="Supporting proposal (PDF)" name="proposal" required={!initialBid} hint={initialBid ? "Optional replacement PDF, max 10 MB" : "PDF, max 10 MB"}><label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-3 text-sm text-slate-600 dark:text-slate-300 hover:border-blue-400"><UploadCloud size={17} className="shrink-0"/><span className="truncate">{form.proposal?.name||'Choose proposal document'}</span><input id="proposal" name="proposal" type="file" accept=".pdf,application/pdf" className="sr-only" onChange={update}/></label></FormField>
    <div className="sm:col-span-2"><FormField label="Remarks (optional)" name="remarks"><textarea id="remarks" name="remarks" className="tb-input min-h-18 resize-y" value={form.remarks} onChange={update} placeholder="Additional remarks"/></FormField></div>
  </div>
    {error&&<p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy||isPastDeadline(tender.submissionDeadline)} type="submit" className="tb-btn-primary mt-5 w-full"><Send size={17}/> {busy?'Saving...':initialBid?'Save Bid Changes':'Submit Bid'}</button>
    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{DEMO_MODE?'Demo mode records form details and filenames only.':'Server must check deadlines, role, eligibility and file safety before accepting this request.'}</p>
  </form>;
}
