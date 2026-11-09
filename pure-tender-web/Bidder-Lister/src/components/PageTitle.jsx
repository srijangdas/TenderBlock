export default function PageTitle({ title, subtitle, action }) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-slate-100 sm:text-[28px]">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>}</div>{action}</div>;
}
