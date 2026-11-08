import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const dashboard = user?.role === 'LISTER' ? '/lister' : user?.role === 'BIDDER' ? '/bidder' : '/staff/workspace';
  const nav = [
    ['Home', '/#home'], ['About', '/#about'], ['For whom', '/#features'],
    ['Process', '/#process'], ['Team', '/#contact'],
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
      <div className="tb-container flex h-[72px] items-center justify-between gap-3">
        <Brand />
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          {nav.map(([name, url]) => <a key={name} href={url} className="text-sm font-medium text-slate-600 transition hover:text-[#285970] dark:text-slate-300 dark:hover:text-blue-300">{name}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <ThemeToggle />
          <Link to={user ? dashboard : '/register'} className="tb-btn-primary hidden sm:inline-flex">
            {user ? 'My workspace' : 'Sign up'}
          </Link>
          <button type="button" className="rounded-md p-2 text-slate-700 sm:hidden dark:text-slate-100" aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </div>
      {mobileOpen && <nav className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-900 sm:hidden" aria-label="Mobile navigation">
        {nav.map(([name, url]) => <a onClick={() => setMobileOpen(false)} key={name} href={url} className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</a>)}
        <Link onClick={() => setMobileOpen(false)} className="tb-btn-primary" to={user ? dashboard : '/register'}>{user ? 'My workspace' : 'Sign up'}</Link>
      </nav>}
    </header>
  );
}
