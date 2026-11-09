import { CircleAlert, CheckCircle2, X } from 'lucide-react';

export default function Alert({ children, type = 'error', onClose }) {
  const Icon = type === 'success' ? CheckCircle2 : CircleAlert;
  return <div className={`alert ${type}`} role={type==='error'?'alert':'status'}><Icon size={17}/><span>{children}</span>{onClose&&<button className="alert-close" aria-label="Dismiss" onClick={onClose}><X size={15}/></button>}</div>;
}
