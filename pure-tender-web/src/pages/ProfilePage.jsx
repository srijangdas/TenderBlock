import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companyProfileApi } from '../api/services';
import { BACKEND_CONTRACT, DEMO_MODE } from '../data/constants';
import PageTitle from '../components/PageTitle';
import FormField from '../components/FormField';

const blank = { organizationName:'', registrationId:'', gstin:'', pan:'', address:'', phoneNumber:'', website:'' };
function fromProfile(profile) {
  return {
    organizationName: profile.companyName ?? '', registrationId: profile.registrationNumber ?? '',
    gstin: profile.gstin ?? '', pan: profile.pan ?? '', address: profile.address ?? '',
    phoneNumber: profile.contactNumber ?? '', website: profile.website ?? '',
  };
}
function validate(form) {
  const errors = [];
  if (!form.organizationName.trim() || form.organizationName.trim().length > 200) errors.push('Organization name must contain 1–200 characters.');
  if (!form.address.trim() || form.address.trim().length > 500) errors.push('Organization address must contain 1–500 characters.');
  if (!/^[0-9+() -]{7,20}$/.test(form.phoneNumber.trim())) errors.push('Contact number must have 7–20 allowed characters.');
  if (form.registrationId.trim().length > 100) errors.push('Registration ID must be 100 characters or fewer (or left blank).');
  if (form.gstin.trim() && !/^[0-9A-Z]{15}$/.test(form.gstin.trim().toUpperCase())) errors.push('GSTIN must contain exactly 15 uppercase alphanumeric characters.');
  if (form.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan.trim().toUpperCase())) errors.push('Invalid PAN format.');
  if (form.website.trim().length > 255) errors.push('Website must be 255 characters or fewer.');
  return errors;
}

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const ownRole = ['BIDDER','LISTER'].includes(user?.role);
  const teamLive = !DEMO_MODE && BACKEND_CONTRACT === 'team' && ownRole;
  const [profile, setProfile] = useState(user?.companyProfile ?? null);
  const [profileState, setProfileState] = useState(user?.companyProfile ? 'existing' : user?.profileMissing === true ? 'missing' : 'unknown');
  const [createRecovery, setCreateRecovery] = useState(false);
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState(user?.companyProfile ? fromProfile(user.companyProfile) : {
    ...blank, organizationName: user?.organizationName ?? '', phoneNumber: user?.phoneNumber ?? '',
  });
  const [loading, setLoading] = useState(teamLive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const verified = user?.accountStatus === 'VERIFIED';
  // The Java API accepts creation of a missing profile; editing an existing
  // profile is permitted only while the account status is PENDING.
  const creating = profileState === 'missing' || (profileState === 'unknown' && createRecovery);
  const canEdit = teamLive && (creating || (profileState === 'existing' && user?.accountStatus === 'PENDING'));

  useEffect(() => {
    if (!teamLive || !token) return;
    let active = true;
    setLoading(true);
    companyProfileApi.mine(token).then(result => {
      if (!active) return;
      setProfile(result); setProfileState('existing'); setCreateRecovery(false); setForm(fromProfile(result)); setError('');
      updateUser({ companyProfile:result, profileMissing:false, organizationName:result.companyName,
        phoneNumber:result.contactNumber, profileLoadError:null });
    }).catch(err => {
      if (!active) return;
      if (err.status === 404) { setProfileState('missing'); setProfile(null); setError(''); }
      else { setProfileState('unknown'); setCreateRecovery(false); setError(`Could not load company profile: ${err.message}`); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // Deliberately reload only when token/mode change; updateUser updates context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamLive, token, reload]);

  async function save(event) {
    event.preventDefault(); setError(''); setMessage('');
    const problems = validate(form);
    if (problems.length) { setError(problems.join(' ')); return; }
    setSaving(true);
    try {
      const result = creating ? await companyProfileApi.create(form, token)
        : await companyProfileApi.update(form, token);
      setProfile(result); setProfileState('existing'); setCreateRecovery(false); setForm(fromProfile(result));
      updateUser({ companyProfile:result, profileMissing:false,
        organizationName:result.companyName, phoneNumber:result.contactNumber });
      setMessage(creating ? 'Company profile saved.' : 'Company profile updated successfully.');
    } catch (err) {
      if (err.status === 409) setError('A company profile already exists. Refresh the page before updating it.');
      else setError((err.message || 'Could not save company profile.') + (creating ? ' Creation was not confirmed. Try loading the profile again; this server may hide conflicts or authentication errors behind HTTP 403.' : ''));
    } finally { setSaving(false); }
  }

  const details = [
    { label:'Full name', value:user?.fullName, icon:UserRound },
    { label:'Email address', value:user?.email, icon:Mail },
    { label:'Assigned role', value:user?.role, icon:UserRound },
    { label:'Account status', value:user?.accountStatus || 'Not available', icon:UserRound },
  ];
  const organization = profile || user?.companyProfile || null;
  return <>
    <PageTitle title="My Profile" subtitle="Your assigned role is fixed to your account. Company profile details are stored separately from login details." />
    <section className="tb-card max-w-4xl p-6">
      <h2 className="mb-5 text-lg font-bold">Account details</h2>
      <div className="grid gap-5 sm:grid-cols-2">{details.map(({ label, value, icon: Icon }) => <div key={label}>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Icon size={15}/>{label}</div>
        <p className="break-words text-sm font-semibold text-ink dark:text-slate-100">{value || 'Not provided'}</p>
      </div>)}</div>
    </section>
    <section className="tb-card mt-5 max-w-4xl p-6">
      <div className="mb-4 flex items-center gap-2"><Building2 size={18}/><h2 className="text-lg font-bold">Organization profile</h2></div>
      {loading && <p role="status" className="text-sm">Loading company profile from Spring Boot…</p>}
      {error && <p role="alert" className="tb-error mb-4">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {teamLive && profileState === 'unknown' && !loading && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p>The profile could not be checked. An access error does not confirm whether a company profile exists. Sign in again if your session has expired.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="tb-btn-outline" disabled={saving} onClick={() => setReload(value => value + 1)}>Retry loading profile</button>
          {!createRecovery && <button type="button" className="tb-btn-outline" onClick={() => { setCreateRecovery(true); setMessage(''); }}>Create missing company profile</button>}
        </div>
        {createRecovery && <p className="mt-2">Use this form only if your organization profile was never saved. This creates a profile; it cannot overwrite an existing one.</p>}
      </div>}
      {teamLive && profileState === 'missing' && !loading && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        No company profile was found for this account. Complete the form below; you do not need to register again.
      </p>}
      {!loading && canEdit ? <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
        {[
          { key:'organizationName', label:'Organization name', required:true, max:200 },
          { key:'address', label:'Organization address', required:true, max:500 },
          { key:'phoneNumber', label:'Phone number', required:true, max:20 },
          { key:'registrationId', label:'Registration ID (optional)', max:100 },
          { key:'gstin', label:'GSTIN (optional)', max:15 },
          { key:'pan', label:'PAN (optional)', max:10 },
          { key:'website', label:'Website (optional)', max:255 },
        ].map(({key,label,required,max}) => <FormField key={key} name={key} label={label} required={required}>
          <input id={key} value={form[key]} required={required} maxLength={max} className="tb-input"
            onChange={event=>setForm(old=>({...old,[key]:event.target.value}))} />
        </FormField>)}
        <div className="sm:col-span-2"><button type="submit" disabled={saving} className="tb-btn-primary"><Save size={16}/>{saving?'Saving…':creating?'Create company profile':'Save profile changes'}</button></div>
        <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">Company details can only be updated while Admin verification is pending. Registration ID is optional. Line of work, age, designation and experience are not stored by the current backend.</p>
      </form> : !loading && <div className="grid gap-5 sm:grid-cols-2">
        {[
          ['Organization',organization?.companyName || user?.organizationName,Building2],
          ['Phone number',organization?.contactNumber || user?.phoneNumber,Phone],
          ['Address',organization?.address,null],['Registration ID',organization?.registrationNumber,null],
          ['GSTIN',organization?.gstin,null],['PAN',organization?.pan,null],['Website',organization?.website,null],
        ].map(([label,value,Icon])=><div key={label}>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{Icon && <Icon size={15}/>} {label}</div>
          <p className="break-words text-sm font-semibold text-ink dark:text-slate-100">{value || 'Not provided'}</p>
        </div>)}
        {verified && <p className="sm:col-span-2 text-xs text-slate-500 dark:text-slate-400">Verified profiles cannot be edited through the current Spring Boot API.</p>}
      </div>}
    </section>
    <div className="mt-5 flex flex-wrap gap-3">{user?.role === 'BIDDER' && <><Link className="tb-btn-primary" to="/bidder/tenders">Browse published tenders</Link><Link className="tb-btn-outline" to="/bidder/my-bids">My bids</Link></>}
      {user?.role === 'LISTER' && <><Link className="tb-btn-primary" to="/lister/create">Create tender</Link><Link className="tb-btn-outline" to="/lister/my-tenders">My tenders</Link></>}
    </div>
  </>;
}
