import { LockKeyhole } from 'lucide-react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';

export default function AppHeader({ user }) {
  const initials = user.fullName.split(' ').map(x=>x[0]).slice(0,2).join('');
  return <header className="workspace-header"><Brand/><div className="workspace-header-right"><span className="secure-label"><LockKeyhole size={13}/> CONFIDENTIAL WORKSPACE</span><ThemeToggle/><div className="user-chip"><span className="avatar">{initials}</span><span className="user-text"><b>{user.fullName}</b><small>Domain Evaluator</small></span></div></div></header>;
}
