import { useState } from 'react';
import { ArrowLeft, Loader2, UserRoundPlus } from 'lucide-react';
import { registerEvaluator, DEMO } from '../api/authApi';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import Alert from '../components/Alert';

export default function RegisterPage({ navigate }) {
  const [form,setForm]=useState({fullName:'',email:'',password:'',confirmPassword:''});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  function update(event){setForm(old=>({...old,[event.target.name]:event.target.value}));setError('')}
  async function submit(event){event.preventDefault();setError('');if(form.fullName.trim().length<2){setError('Enter your full name.');return}if(form.password.length<8||form.password.length>72){setError('Password must be 8–72 characters.');return}if(form.password!==form.confirmPassword){setError('Passwords do not match.');return}setBusy(true);try{await registerEvaluator(form);navigate('/login',{message:DEMO?'Registration preview complete. No account was created in the backend.':'Your account was created. An Admin must verify it before you can evaluate tenders.'})}catch(err){setError(err?.message||'Registration failed.')}finally{setBusy(false)}}
  return <AuthLayout title="Create an evaluator account" subtitle="Register to be considered for tender evaluation assignments.">
    {DEMO&&<div className="demo-mode-note">Demo mode previews this form only. To create a real account, turn off demo mode; the form will use the Evaluator registration endpoint.</div>}
    {error&&<Alert>{error}</Alert>}
    <form onSubmit={submit} className="auth-form register-form">
      <FormField label="Full name" name="fullName" required><input className="tb-input" id="fullName" name="fullName" required maxLength={100} autoComplete="name" placeholder="Enter your full name" value={form.fullName} onChange={update}/></FormField>
      <FormField label="Email address" name="email" required><input className="tb-input" id="email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@organization.com" value={form.email} onChange={update}/></FormField>
      <FormField label="Password" name="password" required><input className="tb-input" id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={update}/></FormField>
      <FormField label="Confirm password" name="confirmPassword" required><input className="tb-input" id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" placeholder="Enter your password again" value={form.confirmPassword} onChange={update}/></FormField>
      <button className="tb-btn-primary full-width" disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<UserRoundPlus size={16}/>} {busy?'Creating account…':'Create evaluator account'}</button>
    </form>
    <div className="pending-note"><strong>Account review</strong><p>New evaluator accounts start pending. An Admin must verify your account before evaluator actions become available.</p></div>
    <button type="button" className="back-to-login" onClick={()=>navigate('/login')}><ArrowLeft size={15}/> Back to sign in</button>
  </AuthLayout>;
}
