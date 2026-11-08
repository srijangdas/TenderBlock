// Spring DTO: @DecimalMin(0.01), @Digits(integer=17, fraction=2), BigDecimal.
// JSON string values retain every digit. Jackson's default BigDecimal deserializer
// accepts numeric strings; backend should verify coercion remains enabled.
export function exactMoney(value, label = 'Amount') {
  const raw = String(value ?? '').trim();
  if (!/^\d{1,17}(?:\.\d{1,2})?$/.test(raw) || !/[1-9]/.test(raw)) {
    throw new Error(`${label} must be greater than zero, with up to 17 digits before the decimal and at most two decimal places.`);
  }
  return raw;
}
