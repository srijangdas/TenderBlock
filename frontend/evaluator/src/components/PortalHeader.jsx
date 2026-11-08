import Brand from './Brand';
import ThemeToggle from './ThemeToggle';

export default function PortalHeader() {
  return <header className="portal-header"><Brand/><div className="portal-header-right"><span>Evaluator Portal</span><ThemeToggle/></div></header>;
}
