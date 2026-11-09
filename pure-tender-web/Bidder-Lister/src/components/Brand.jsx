import { Link } from 'react-router-dom';
import { Blocks } from 'lucide-react';

export default function Brand({ to = '/', compact = false }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2.5 text-[#243947] dark:text-slate-100" aria-label="TenderBlock home">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-[#285970] text-white"><Blocks size={19} strokeWidth={2.2} /></span>
      {!compact && <span className="text-xl font-bold tracking-tight">Tender<span className="text-[#4b7582]">Block</span></span>}
    </Link>
  );
}
