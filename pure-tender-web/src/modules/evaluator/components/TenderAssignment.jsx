import { ChevronRight, FileText } from 'lucide-react';

const prettyDate = value => value ? new Date(value).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—';
const titleCase = value => String(value||'').replaceAll('_',' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());

export default function TenderAssignment({ tender, onOpen }) {
  const completed = ['COMPLETED','AWARDED','FINALIZED'].includes(tender.status);
  return <article className="assignment-row"><span className="assignment-icon"><FileText size={19}/></span><div className="assignment-copy"><div className="assignment-title"><h3>{tender.title}</h3><span className={`status ${completed?'approved':'review'}`}>{titleCase(tender.status)}</span></div><div className="assignment-meta"><span>Deadline {prettyDate(tender.submissionDeadline)}</span><span>•</span><span>Opens {prettyDate(tender.openingDate)}</span><span>•</span><span>{tender.submittedBidCount??0} submitted bids</span></div></div><button className="open-tender" onClick={()=>onOpen(tender)}>Open assignment <ChevronRight size={16}/></button></article>;
}
