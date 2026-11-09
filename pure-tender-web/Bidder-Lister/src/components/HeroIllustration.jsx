import { ArrowDown, Check, FileText, LockKeyhole } from 'lucide-react';

// A small, labelled process preview—no fake "live" counts or blockchain claims.
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[490px]" aria-label="Illustrative tender workflow">
      <div className="absolute -left-4 -top-4 h-full w-full rounded-lg border border-[#d9d8cc] dark:border-slate-700" />
      <div className="relative overflow-hidden rounded-lg border border-[#d4d9da] bg-white shadow-[0_20px_55px_rgba(34,53,58,.10)] dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#36536a] dark:text-slate-200"><FileText size={16} /> Tender record</div>
          <span className="rounded-sm border border-[#dec9a8] bg-[#faf4e9] px-2 py-1 text-[10px] font-semibold text-[#785a32] dark:border-amber-900 dark:bg-slate-800 dark:text-amber-200">EXAMPLE</span>
        </div>
        <div className="px-6 py-6">
          <p className="text-[11px] uppercase tracking-[.15em] text-slate-500 dark:text-slate-400">Tender / TB-001</p>
          <h3 className="mt-2 text-xl font-semibold leading-snug text-[#233b49] dark:text-slate-100">Campus maintenance services</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">Illustrative workflow, not a live tender or verified ledger record.</p>
          <div className="my-6 border-t border-dashed border-[#d8ddd9] dark:border-slate-700" />
          <div className="space-y-0">
            <div className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e7f0ed] text-[#3c6961] dark:bg-slate-700 dark:text-slate-200"><Check size={15}/></span>
              <div className="pb-5"><p className="text-sm font-semibold text-[#293e47] dark:text-slate-100">Tender prepared</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requirements and dates entered</p></div>
            </div>
            <div className="ml-[15px] h-5 w-px -translate-y-2 bg-[#c9d6d1] dark:bg-slate-600" />
            <div className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e7f0ed] text-[#3c6961] dark:bg-slate-700 dark:text-slate-200"><Check size={15}/></span>
              <div className="pb-5"><p className="text-sm font-semibold text-[#293e47] dark:text-slate-100">Submitted for review</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Admin checks tender details</p></div>
            </div>
            <div className="ml-[15px] h-5 w-px -translate-y-2 bg-[#c9d6d1] dark:bg-slate-600" />
            <div className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#cdd8d9] bg-white text-[#45616b] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"><ArrowDown size={14}/></span>
              <div><p className="text-sm font-semibold text-[#293e47] dark:text-slate-100">Publish, bid and evaluate</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Access depends on role and tender status</p></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 bg-[#f8f9f7] px-6 py-3 text-xs text-[#526168] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><LockKeyhole size={14} /> Sensitive bid documents stay access-controlled</div>
      </div>
    </div>
  );
}
