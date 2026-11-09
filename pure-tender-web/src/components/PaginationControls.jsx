export default function PaginationControls({ page, totalPages, totalElements, onPageChange, loading = false }) {
  if (totalPages <= 1 && totalElements <= 0) return null;
  return <nav aria-label="Results pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
    <p className="text-slate-600 dark:text-slate-300">{totalElements} total records · Page {page + 1} of {Math.max(1,totalPages)}</p>
    <div className="flex gap-2">
      <button type="button" className="tb-btn-outline" disabled={loading || page <= 0} onClick={() => onPageChange(page - 1)}>Previous</button>
      <button type="button" className="tb-btn-outline" disabled={loading || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  </nav>;
}
