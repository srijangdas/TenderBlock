import { FileText } from 'lucide-react';

export default function EmptyState({ children }) {
  return <div className="empty-state"><span><FileText size={20}/></span><p>{children}</p></div>;
}
