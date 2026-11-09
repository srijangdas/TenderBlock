const statusStyles = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
  DEMO_SUBMITTED: 'bg-blue-50 dark:bg-slate-800 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-slate-700',
  CLOSED: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
  VOIDED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  OPENED: 'bg-blue-50 text-blue-800 border-blue-200',
  SELECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  NOT_SELECTED: 'bg-slate-100 text-slate-700 border-slate-200',
  WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-blue-50 dark:bg-slate-800 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-slate-700',
  EVALUATED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  UNDER_EVALUATION: 'bg-purple-50 text-purple-800 border-purple-200',
  ON_HOLD: 'bg-amber-50 text-amber-900 border-amber-300',
  AWARDED: 'bg-green-50 text-green-800 border-green-200',
  FLAGGED: 'bg-red-50 text-red-800 border-red-200',
  DEADLINE_PASSED: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  PENDING_VERIFICATION: 'bg-amber-50 text-amber-800 border-amber-200',
  DEMO_ONLY: 'bg-amber-50 text-amber-800 border-amber-200',
};
export default function StatusBadge({ status }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] || 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200'}`}>{String(status || 'UNKNOWN').replaceAll('_',' ')}</span>;
}
