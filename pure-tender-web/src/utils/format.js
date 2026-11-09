export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'Not specified';
  const text = String(value).trim();
  const match = text.match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);
  if (match) {
    // BigInt avoids precision loss when the API returns a decimal string.
    const base = new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(BigInt(match[2]));
    return `${match[1]}${base}.${(match[3] || '').padEnd(2, '0')}`;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not specified';
  return new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', minimumFractionDigits:2, maximumFractionDigits:2}).format(number);
}
export function formatDate(value) {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not specified' :
    new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour:'2-digit', minute:'2-digit', hour12:true, timeZone: 'Asia/Kolkata', timeZoneName: 'short' }).format(date);
}
export const formatDeadline = formatDate;
export function isPastDeadline(value) { return Boolean(value && new Date(value).getTime() <= Date.now()); }
export function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(piece => piece[0]).join('').toUpperCase() || 'U'; }
