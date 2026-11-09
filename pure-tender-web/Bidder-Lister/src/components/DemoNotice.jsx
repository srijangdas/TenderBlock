import { DEMO_MODE } from '../data/constants';
export default function DemoNotice({ compact = false }) {
  if (!DEMO_MODE) return null;
  return <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-500 dark:text-slate-400`} role="note" title="This preview uses browser-local sample accounts and data. Spring Boot is not connected.">Interactive preview · sample data</p>;
}
