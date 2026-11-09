import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STAFF_ROLES = ['ADMIN', 'EVALUATOR', 'AUDITOR'];
function homeFor(role) {
  if (role === 'LISTER') return '/lister';
  if (role === 'BIDDER') return '/bidder';
  if (STAFF_ROLES.includes(role)) return '/staff/workspace';
  return '/login';
}

export default function RequireRole({ role, roles }) {
  const { user, sessionExpired } = useAuth();
  const staffOnly = roles?.every(value => STAFF_ROLES.includes(value));
  if (!user) return <Navigate to={`${staffOnly ? '/staff/login' : '/login'}${sessionExpired ? '?expired=1' : ''}`} replace />;
  const allowed = roles ? roles.includes(user.role) : (!role || user.role === role);
  if (!allowed) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
