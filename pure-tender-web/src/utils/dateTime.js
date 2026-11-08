// TenderBlock targets India Standard Time. datetime-local itself has no timezone.
// Interpret input clock time explicitly as IST, not the user's device timezone.
export function indianDateTimeToISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(value ?? ''))) {
    throw new Error('Enter a valid date and time in IST.');
  }
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime())) throw new Error('Enter a valid date and time in IST.');
  if (isoToIndiaDateTimeInput(date.toISOString()) !== value) {
    throw new Error('Enter a valid calendar date and time in IST.');
  }
  return date.toISOString();
}
export function isoToIndiaDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  // Make fixed-offset IST local clock values via UTC formatting of offset date.
  return new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 16);
}
