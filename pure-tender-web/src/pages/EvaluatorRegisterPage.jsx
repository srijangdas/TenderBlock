import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { http } from '../api/http';
import { demoRegister } from '../api/demoStore';
import { DEMO_MODE } from '../data/constants';

// The evaluator registration flow from the supplied evaluator app. The Java
// AuthService permits EVALUATOR registration and requires Admin verification.
export default function EvaluatorRegisterPage() {
  const {user}=useAuth();
  const navigate=useNavigate();
  const [form,setForm]=useState({fullName:'',email:'',password:'',confirmPassword:''});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  if(user)return <Navigate to="/workspace" replace/>;
  async function submit(event){
    event.preventDefault();setError('');
    if(busy)return;
    if(!form.fullName.trim()||form.fullName.trim().length>100){setError('Enter a full name of at most 100 characters.');return;}
    if(form.password.length<8||form.password.length>72){setError('Password must be 8–72 characters.');return;}
    if(form.password!==form.confirmPassword){setError('Passwords do not match.');return;}
    setBusy(true);
    const body={fullName:form.fullName.trim(),email:form.email.trim().toLowerCase(),password:form.password};
    try{
      if(DEMO_MODE)await demoRegister({...body,role:'EVALUATOR'});
      else await http('/auth/register/EVALUATOR',{method:'POST',body});
      navigate('/staff/login',{replace:true,state:{message:'Evaluator account created. An Admin must verify it before you can evaluate tenders.'}});
    }catch(err){setError(err.message);}finally{setBusy(false);}
  }
  return <AuthLayout title="Create an evaluator account" subtitle="Apply for tender evaluation assignments." narrow>
    {DEMO_MODE&&<p className="mb-4 text-sm text-amber-800">Demo mode: this account is saved in this browser only.</p>}
    {error&&<p role="alert" className="mb-4 text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      {[['fullName','Full name','text',100],['email','Email address','email',254],['password','Password','password',72],['confirmPassword','Confirm password','password',72]].map(([key,label,type,max])=><FormField key={key} label={label} name={key} required><input id={key} name={key} type={type} maxLength={max} required autoComplete={type==='password'?'new-password':key==='email'?'email':'name'} className="tb-input" value={form[key]} onChange={e=>setForm(old=>({...old,[key]:e.target.value}))}/></FormField>)}
      <p className="text-sm text-slate-600 dark:text-slate-300">New accounts start pending. Admin verification is required before evaluator actions become available.</p>
      <button type="submit" className="tb-btn-primary w-full" disabled={busy}>{busy?'Creating account…':'Create evaluator account'}</button>
    </form>
    <Link to="/staff/login" className="tb-link mt-5 inline-block">Back to staff sign in</Link>
  </AuthLayout>;
}
