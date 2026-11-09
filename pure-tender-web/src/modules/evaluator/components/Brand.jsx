import { Blocks } from 'lucide-react';

export default function Brand() {
  return <a href="/" className="brand" aria-label="TenderBlock home">
    <span className="brand-mark"><Blocks size={19} strokeWidth={2.2}/></span>
    <span className="brand-word">Tender<span>Block</span></span>
  </a>;
}
