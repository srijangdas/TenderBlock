export default function FormField({ label, name, children, required = false, error, hint }) {
  return <div>
    <label className="tb-label" htmlFor={name}>{label} {required && <span className="text-red-600">*</span>}</label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    {error && <p className="tb-error" role="alert">{error}</p>}
  </div>;
}
