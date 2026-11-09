import AuthLayout from '../components/AuthLayout';
import PublicLoginForm from '../components/PublicLoginForm';

// A dedicated login page, reached directly from the public header and signup footer.
export default function LoginPage() {
  return <AuthLayout title="Sign in to TenderBlock" subtitle="Bidder and Lister sign-in. Staff use the separate staff portal." narrow>
    <PublicLoginForm />
  </AuthLayout>;
}
