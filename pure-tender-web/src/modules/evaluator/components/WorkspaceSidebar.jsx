import { ClipboardList, LogOut } from 'lucide-react';

export default function WorkspaceSidebar({ count, active, onHome, onLogout }) {
  return <aside className="workspace-sidebar"><p className="side-caption">MY WORKSPACE</p><nav><button className={`workspace-nav-item ${active==='overview'?'active':''}`} onClick={onHome}><ClipboardList size={18}/>Assigned tenders<span className="nav-count">{count}</span></button></nav><div className="sidebar-bottom"><p className="version">TenderBlock Evaluator · 1.0</p><button className="sidebar-logout" onClick={onLogout}><LogOut size={18}/> Logout</button></div></aside>;
}
