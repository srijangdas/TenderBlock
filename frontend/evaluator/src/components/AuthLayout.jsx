import PortalHeader from './PortalHeader';

export default function AuthLayout({ title, subtitle, children }) {
  return <><PortalHeader/><main className="auth-main"><div className="auth-container"><div className="auth-heading"><h1>{title}</h1><p>{subtitle}</p></div><section className="auth-card">{children}</section></div></main></>;
}
