import { Search, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { DEMO_MODE, BACKEND_CONTRACT } from '../data/constants';
import { formatDate } from '../utils/format';

export default function TenderTable({ tenders, selectedId, onSelect, search, setSearch }) {
  const showSector = DEMO_MODE || BACKEND_CONTRACT !== 'team';
  const filtered = tenders.filter(t => `${t.title} ${t.department || 'Department not specified'} ${t.sector}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="tb-card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 px-5 py-4"><h2 className="font-bold text-ink dark:text-slate-100">Published opportunities</h2><div className="relative w-full sm:w-[250px]"><Search size={16} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500"/><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search this page..." aria-label="Search tenders on the current page" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"/></div></div>
    <div className="overflow-x-auto"><table className="tb-table"><thead><tr><th>Reference</th><th>Tender title</th>{showSector && <th>Sector</th>}<th>Deadline</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(t=><tr key={t.id} className={selectedId===t.id?'bg-blue-50/40':''}><td className="whitespace-nowrap text-xs font-semibold">{t.id}</td><td className="min-w-[220px] font-semibold text-ink dark:text-slate-100">{t.title}<p className="mt-1 text-xs font-normal text-slate-500 dark:text-slate-400">{t.department || 'Department not specified'}</p></td>{showSector && <td className="whitespace-nowrap">{t.sector || "Not specified"}</td>}<td className="whitespace-nowrap">{formatDate(t.submissionDeadline)}</td><td><StatusBadge status={t.status}/></td><td><button type="button" onClick={()=>onSelect(t.id)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50">View <ArrowUpRight size={13}/></button></td></tr>)}</tbody></table>
    {filtered.length===0&&<div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No matching tenders. Try a different title or reference.</div>}</div>
    <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-3 text-xs text-slate-500 dark:text-slate-400">{filtered.length} tender{filtered.length===1?'':'s'} on this page · Search applies to this page only. Estimated budgets are on tender details.</div>
  </div>;
}
