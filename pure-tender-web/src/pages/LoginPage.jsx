import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { DEMO_MODE } from '../data/constants';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const success = location.state?.message;
  const expired = new URLSearchParams(location.search).has('expired');

  async function handleLogin(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const user = await login(form);
      navigate(user?.role === 'LISTER' ? '/lister' : '/bidder', { replace: true });
    } catch (err) { setError(err?.message || 'Sign in failed.'); }
    finally { setBusy(false); }
  }

  return <AuthLayout title="Sign in to TenderBlock" subtitle="Enter your credentials to access your account." narrow>
    {expired && <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">Your session expired or your sign-in token is no longer valid. Please sign in again.</div>}
    {success && <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{success}</div>}
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
    <form onSubmit={handleLogin} className="space-y-5">
      <FormField label="Email address" name="email" required><input className="tb-input" id="email" type="email" autoComplete="username" required placeholder="you@organization.com" value={form.email} onChange={event=>setForm(old=>({...old,email:event.target.value}))}/></FormField>
      <FormField label="Password" name="password" required><div className="relative"><input className="tb-input pr-11" id="password" type={visible?'text':'password'} autoComplete="current-password" required placeholder="Enter your password" value={form.password} onChange={event=>setForm(old=>({...old,password:event.target.value}))}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'} className="absolute right-3 top-[17px] text-slate-500 dark:text-slate-400">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></FormField>
      <button type="submit" disabled={busy} className="tb-btn-primary w-full">{busy?<Loader2 size={16} className="animate-spin"/>:<LockKeyhole size={16}/>} {busy?'Signing in...':'Sign in'}</button>
    </form>
    {DEMO_MODE && <div className="mt-6 rounded-lg border border-blue-100 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 p-4"><h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">Try the demo accounts</h3><p className="mt-1 text-xs text-blue-800 dark:text-blue-300">Use either example login, with password <strong>Demo@12345</strong>.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">
      <button type="button" className="rounded-md border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-left text-xs text-blue-900 dark:text-blue-200 hover:bg-blue-100" onClick={()=>setForm({email:'bidder@demo.test',password:'Demo@12345'})}><strong>Bidder demo</strong><br/>bidder@demo.test</button>
      <button type="button" className="rounded-md border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-left text-xs text-blue-900 dark:text-blue-200 hover:bg-blue-100" onClick={()=>setForm({email:'lister@demo.test',password:'Demo@12345'})}><strong>Lister demo</strong><br/>lister@demo.test</button>
    </div></div>}
    <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">New to TenderBlock? <Link className="tb-link" to="/register">Create account</Link></p>
  </AuthLayout>;
}
