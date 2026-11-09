export default function MetricCard({ icon: Icon, name, value, detail }) {
  return <article className="metric-card"><span className="metric-icon"><Icon size={18}/></span><span className="metric-label">{name}</span><strong>{value}</strong><small>{detail}</small></article>;
}
