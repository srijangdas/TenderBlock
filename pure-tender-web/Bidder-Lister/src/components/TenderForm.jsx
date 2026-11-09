import { useState } from 'react';
import { Save, Send, Loader2, Info } from 'lucide-react';
import { SECTORS, BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';
import FormField from './FormField';
import { tenderApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { isoToIndiaDateTimeInput, indianDateTimeToISO } from '../utils/dateTime.js';
import { exactMoney } from '../utils/decimal.js';

const EMPTY = {
  title:'', description:'', department:'', budget:'', sector:'', openingDate:'',
  eligibilityCriteria:'', requiredDocuments:'', submissionDeadline:'',
};

export default function TenderForm({ onCreated, initialTender = null }) {
  const { user, token } = useAuth();
  const [form, setForm] = useState(initialTender ? Object.fromEntries(Object.keys(EMPTY).map(k => [k, (k === "submissionDeadline" || k === "openingDate") ? isoToIndiaDateTimeInput(initialTender[k]) : initialTender[k] ?? ""])) : EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [approvalPending, setApprovalPending] = useState(false);
  const update = (event) => setForm(old=>({...old,[event.target.name]:event.target.value}));
  const teamLive = !DEMO_MODE && BACKEND_CONTRACT === 'team';
  let isValid = false;
  try {
    exactMoney(form.budget, 'Estimated value');
    const deadline = indianDateTimeToISO(form.submissionDeadline);
    const opening = teamLive ? indianDateTimeToISO(form.openingDate) : null;
    isValid = Boolean(form.title.trim() && form.title.trim().length <= 200 && form.description.trim() &&
      Date.parse(deadline) > Date.now() &&
      (teamLive ? Date.parse(opening) > Date.parse(deadline) :
        (form.department.trim() && form.sector && form.eligibilityCriteria.trim() && form.requiredDocuments.trim())));
  } catch { isValid = false; }

  async function save(event) {
    event.preventDefault();setError('');
    if (!isValid) { setError(teamLive ? 'Provide title, description, positive value, future closing date, and opening date after closing.' : 'Complete every required field, enter a positive budget and choose a future deadline.'); return; }
    setBusy(true);
    try { const result = initialTender ? await tenderApi.update(user, initialTender.id, form, token) : await tenderApi.create(user, form, token); setCreated(result); onCreated?.(result); }
    catch (err) { setError(err?.message || 'Could not save tender draft.'); }
    finally { setBusy(false); }
  }
  async function requestApproval() {
    if (!created?.id) return;
    setBusy(true);setError('');
    try { await tenderApi.requestApproval(user, created.id, token); setApprovalPending(true); onCreated?.(); }
    catch (err) { setError(err?.message || 'Could not request approval.'); }
    finally { setBusy(false); }
  }
  if (teamLive && user?.verified !== true) return <section className="tb-card p-6" role="status"><h3 className="font-semibold">Admin verification required</h3><p className="mt-2 text-sm">Your Lister account must be verified before the backend permits tender creation or editing. You can check your account status under Profile.</p></section>;
  if (created) return <div className="tb-card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink dark:text-slate-100">{teamLive ? "Tender" : "Tender draft"} {initialTender ? "updated" : "saved"}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Reference: {created.id}</p></div><StatusBadge status={approvalPending?'PENDING_APPROVAL':created.status||'DRAFT'}/></div><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{teamLive?'Awaiting Admin approval: tender status is SUBMITTED. It is not visible to Bidders until an Admin publishes it. No Fabric confirmation is implied.':approvalPending?'Your tender has been queued for Admin review. It is not visible to bidders until approval.':'Review the tender details before requesting Admin approval.'}</p><div className="mt-5 flex flex-wrap gap-2">{!teamLive && !approvalPending && <button disabled={busy} onClick={requestApproval} type="button" className="tb-btn-primary"><Send size={16}/> {busy?'Submitting...':'Submit for admin approval'}</button>}{!initialTender && <button type="button" className="tb-btn-outline" onClick={()=>{setForm(EMPTY);setCreated(null);setApprovalPending(false);setError('');}}>Create another tender</button>}</div>{error&&<p className="tb-error mt-3">{error}</p>}</div>;

  return <form onSubmit={save} className="tb-card p-5 sm:p-7" noValidate>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-ink dark:text-slate-100">{initialTender ? "Edit Tender" : "Create New Tender"}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{teamLive ? "Create a tender request. The backend saves it as SUBMITTED." : "Fill in the details to create a draft tender."}</p></div><StatusBadge status={teamLive?'SUBMITTED':'DRAFT'}/></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="lg:col-span-2"><FormField label="Tender title" name="title" required><input id="title" name="title" className="tb-input" value={form.title} onChange={update} maxLength={200} placeholder="Example: Construction of municipal access road"/></FormField></div>
      <div className="lg:col-span-2"><FormField label="Description" name="description" required><textarea id="description" name="description" className="tb-input min-h-24 resize-y" value={form.description} onChange={update} placeholder="Provide a clear description, scope and expected deliverables"/></FormField></div>
      {!teamLive && <FormField label="Issuing department / organization" name="department" required><input id="department" name="department" className="tb-input" value={form.department} onChange={update} placeholder="Issuing authority or department"/></FormField>}
      <FormField label="Estimated budget (INR)" name="budget" required><input id="budget" name="budget" type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" className="tb-input" value={form.budget} onChange={update} placeholder="5000000"/></FormField>
      {!teamLive && <FormField label="Eligibility criteria" name="eligibilityCriteria" required><textarea id="eligibilityCriteria" name="eligibilityCriteria" className="tb-input min-h-28 resize-y" value={form.eligibilityCriteria} onChange={update} placeholder="Required years of experience, registrations, certificates, etc."/></FormField>}
      {!teamLive && <FormField label="Required documents" name="requiredDocuments" required><textarea id="requiredDocuments" name="requiredDocuments" className="tb-input min-h-28 resize-y" value={form.requiredDocuments} onChange={update} placeholder="List all supporting documents required from bidders"/></FormField>}
      <FormField label="Submission deadline" name="submissionDeadline (IST)" required><input id="submissionDeadline" name="submissionDeadline" type="datetime-local" className="tb-input" value={form.submissionDeadline} onChange={update}/></FormField>
      {!teamLive && <FormField label="Line of work / sector" name="sector" required><select id="sector" name="sector" className="tb-input" value={form.sector} onChange={update}><option value="">Select a sector</option>{SECTORS.map(s=><option key={s}>{s}</option>)}</select></FormField>}
      {teamLive && <FormField label="Opening date (after deadline)" name="openingDate (IST)" required><input id="openingDate" name="openingDate" type="datetime-local" className="tb-input" value={form.openingDate} onChange={update}/></FormField>}
    </div>
    {teamLive && <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">The team tender backend stores only title, description, estimated value, closing and opening dates. Sector, eligibility and document requirements are not supported by that DTO yet.</p>}
    <div className="mt-5 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-slate-800 p-3 text-xs leading-5 text-blue-900 dark:text-blue-200"><Info size={17} className="mt-0.5 shrink-0"/><p>{teamLive ? "The team backend creates a SUBMITTED tender; publication is a separate backend action. No blockchain confirmation is claimed." : "A Lister creates a draft. The Admin must verify and approve it before publication. No blockchain confirmation is claimed by this page."}</p></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3"><button type="submit" disabled={busy} className="tb-btn-primary">{busy?<Loader2 size={17} className="animate-spin"/>:<Save size={17}/>} {teamLive?"Submit for Admin approval":"Save Draft"}</button></div>
  </form>;
}
