import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, Loader2, UserRound, ClipboardPenLine } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { ROLES, DEMO_MODE, BACKEND_CONTRACT } from '../data/constants';
import { useAuth } from '../context/AuthContext';

// Fields shown here are supported either by RegisterRequest or CompanyProfileRequest.
// confirmPassword is checked in the browser and never sent to Spring Boot.
const initial = {
  fullName: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  address: '',
  phoneNumber: '',
  registrationId: '',
};

function validate(form) {
  const errors = {};
  if (!form.fullName.trim() || form.fullName.trim().length > 100) {
    errors.fullName = 'Enter your full name (maximum 100 characters).';
  }
  if (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address (maximum 254 characters).';
  }
  if (![ROLES.BIDDER, ROLES.LISTER].includes(form.role)) {
    errors.role = 'Choose Bidder or Lister.';
  }
  if (form.password.length < 8 || form.password.length > 72) {
    errors.password = 'Password must contain 8–72 characters.';
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (!form.organizationName.trim() || form.organizationName.trim().length > 200) {
    errors.organizationName = 'Enter an organization name (maximum 200 characters).';
  }
  if (!form.address.trim() || form.address.trim().length > 500) {
    errors.address = 'Enter an organization address (maximum 500 characters).';
  }
  if (!/^[0-9+() -]{7,20}$/.test(form.phoneNumber.trim())) {
    errors.phoneNumber = 'Contact number must have 7–20 allowed characters.';
  }
  if (form.registrationId.trim().length > 100) {
    errors.registrationId = 'Registration number cannot exceed 100 characters.';
  }
  return errors;
}

export default function RegisterPage() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const teamLive = !DEMO_MODE && BACKEND_CONTRACT === 'team';

  function update(event) {
    const { name, value } = event.target;
    setForm(old => ({ ...old, [name]: value }));
    setErrors(old => ({ ...old, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice('');
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setBusy(true);
    try {
      const created = await register(form);
      const successMessage = created?.profileWarning || (teamLive
        ? 'Account created successfully. Admin verification is pending; you can browse and complete your profile now.'
        : 'Account created successfully. Admin verification may be required before tender actions.');
      if (created?.signedIn) {
        // Spring Boot returns a token immediately with the PENDING account.
        // Use it to enter the correct workspace without a redundant login.
        navigate(form.role === ROLES.BIDDER ? '/bidder' : '/lister', {
          replace: true, state: { registrationNotice: successMessage },
        });
      } else {
        navigate('/login', { replace: true, state: { message: successMessage } });
      }
    } catch (error) {
      setNotice(error?.status === 502
        ? `${error.message} No registration success was confirmed. Once the backend is running, try signing in with this email before registering again.`
        : error?.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as a Bidder or Lister to use TenderBlock."
    >
      {teamLive && (
        <div role="note" className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-100">
          Account details are saved through registration. Organization details are saved through the separate company-profile API. Only supported fields are collected.
        </div>
      )}
      {!DEMO_MODE && !teamLive && (
        <div role="note" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          This mode uses a different backend integration. Confirm its DTO contract before use.
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        {notice && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{notice}</div>}
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
          <FormField label="Full name" name="fullName" required error={errors.fullName}>
            <input id="fullName" name="fullName" value={form.fullName} onChange={update} maxLength={100} autoComplete="name" placeholder="Your full name" className="tb-input" />
          </FormField>
          <FormField label="Email address" name="email" required error={errors.email}>
            <input id="email" name="email" type="email" value={form.email} onChange={update} maxLength={254} autoComplete="email" placeholder="you@organization.com" className="tb-input" />
          </FormField>
          <fieldset>
            <legend className="tb-label">Your role <span className="text-red-600">*</span></legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                { value: ROLES.BIDDER, label: 'Bidder', note: 'Submit bids', Icon: UserRound },
                { value: ROLES.LISTER, label: 'Lister', note: 'Create tenders', Icon: ClipboardPenLine },
              ].map(({ value, label, note, Icon }) => (
                <label key={value} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition ${form.role === value ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-400 dark:bg-slate-800' : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900'}`}>
                  <input type="radio" name="role" value={value} checked={form.role === value} onChange={update} className="mt-1 accent-blue-700" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-bold text-ink dark:text-slate-100"><Icon size={15} />{label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{note}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.role && <p className="tb-error">{errors.role}</p>}
          </fieldset>
          <FormField label="Organization name" name="organizationName" required error={errors.organizationName}>
            <input id="organizationName" name="organizationName" value={form.organizationName} onChange={update} maxLength={200} placeholder="Organization or institute" className="tb-input" />
          </FormField>
          <FormField label="Organization address" name="address" required error={errors.address}>
            <input id="address" name="address" value={form.address} onChange={update} maxLength={500} placeholder="Complete office address" className="tb-input" />
          </FormField>
          <FormField label="Contact number" name="phoneNumber" required error={errors.phoneNumber}>
            <input id="phoneNumber" name="phoneNumber" type="tel" value={form.phoneNumber} onChange={update} maxLength={20} autoComplete="tel" placeholder="+91 9876543210" className="tb-input" />
          </FormField>
          <FormField label="Organization registration number (optional)" name="registrationId" error={errors.registrationId}>
            <input id="registrationId" name="registrationId" value={form.registrationId} onChange={update} maxLength={100} placeholder="If your organization has one" className="tb-input" />
          </FormField>
          <FormField label="Password" name="password" required error={errors.password}>
            <div className="relative">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} autoComplete="new-password" placeholder="8–72 characters" className="tb-input pr-11" />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-[17px] text-slate-500 dark:text-slate-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </FormField>
          <FormField label="Confirm password" name="confirmPassword" required error={errors.confirmPassword}>
            <input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Re-enter password" className="tb-input" />
          </FormField>
        </div>
        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
          <Info size={17} className="mt-0.5 shrink-0" />
          <span><strong>Account approval:</strong> An Admin must verify your Bidder or Lister account before tender actions can be performed.</span>
        </div>
        <button type="submit" disabled={busy} className="tb-btn-primary mt-6 w-full">
          {busy ? <Loader2 size={17} className="animate-spin" /> : null}
          {busy ? 'Creating your account...' : 'Create account'}
        </button>
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account? <Link to="/login" className="tb-link">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
