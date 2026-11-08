import { FlaskConical } from 'lucide-react';
import { DEMO_MODE } from '../data/constants';
export default function DemoNotice({ compact = false }) {
  if (!DEMO_MODE) return null;
  return <div className={`${compact ? 'text-xs' : 'text-sm'} flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-900`}><FlaskConical size={16} className="mt-0.5 shrink-0"/><span><strong>Demo mode:</strong> accounts, tender drafts and bids are stored only in this browser. No real authentication, file upload, admin approval or blockchain transaction occurs.</span></div>;
}
