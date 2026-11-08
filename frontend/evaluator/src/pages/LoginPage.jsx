import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO } from '../api/authApi';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

export default function LoginPage({ navigate, message }) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [visible,setVisible]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const { login } = useAuth();
  async function submit(event){event.preventDefault();setError('');setBusy(true);try{await login(email,password)}catch(err){setError(err?.message||'Sign in failed.')}finally{setBusy(false)}}
  return <AuthLayout title="Sign in to TenderBlock" subtitle="Enter your evaluator credentials to access assigned tenders.">
    {message&&<Alert type="success">{message}</Alert>}{error&&<Alert>{error}</Alert>}
    <form onSubmit={submit} className="auth-form">
      <FormField label="Email address" name="email" required><input id="email" className="tb-input" type="email" autoComplete="username" required placeholder="you@organization.com" value={email} onChange={e=>setEmail(e.target.value)}/></FormField>
      <FormField label="Password" name="password" required><div className="password-input"><input id="password" className="tb-input" type={visible?'text':'password'} autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" onClick={()=>setVisible(x=>!x)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></FormField>
      <button type="submit" disabled={busy} className="tb-btn-primary full-width">{busy?<Loader2 size={16} className="spin"/>:<LockKeyhole size={16}/>} {busy?'Signing in…':'Sign in'}</button>
    </form>
    {DEMO&&<section className="demo-notice"><h2>Try the evaluator demo</h2><p>Use the example login with password <strong>Demo@12345</strong>.</p><button type="button" className="demo-account" onClick={()=>{setEmail('evaluator.demo@tenderblock.local');setPassword('Demo@12345')}}><span><strong>Evaluator demo</strong><small>evaluator.demo@tenderblock.local</small></span><span>Fill in <span aria-hidden="true">→</span></span></button><p className="demo-footnote">Sample tenders and evaluations are simulated in this browser.</p></section>}
    <p className="auth-switch">New Evaluator? <button type="button" className="text-link" onClick={()=>navigate('/register')}>Create an account</button></p>
  </AuthLayout>;
}
