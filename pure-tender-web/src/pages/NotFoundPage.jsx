import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { Home } from 'lucide-react';
export default function NotFoundPage() { return <><PublicHeader/><div className="tb-container py-24 text-center"><p className="text-6xl font-extrabold text-blue-700 dark:text-blue-300">404</p><h1 className="mt-4 text-2xl font-bold text-ink dark:text-slate-100">Page not found</h1><p className="mt-2 text-slate-600 dark:text-slate-300">The URL does not match a page in this frontend prototype.</p><Link to="/" className="tb-btn-primary mt-6"><Home size={16}/> Return home</Link></div></>; }
