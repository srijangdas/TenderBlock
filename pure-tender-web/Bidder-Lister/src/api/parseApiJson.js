// Preserve Java BigDecimal fields before JSON.parse can round them to Number.
// Consume complete JSON strings so text inside descriptions is never rewritten.
const moneyFields = new Set(['estimatedValue', 'quotedAmount', 'budget', 'amount']);
export function parseApiJson(raw) {
  const strings = /"(?:\\[\s\S]|[^"\\])*"/g;
  const numberAfterKey = /^(\s*:\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)(?=\s*[,}])/;
  let result = '', copied = 0, match;
  while ((match = strings.exec(raw))) {
    if (!moneyFields.has(JSON.parse(match[0]))) continue;
    const value = numberAfterKey.exec(raw.slice(strings.lastIndex));
    if (!value) continue;
    const start = strings.lastIndex + value[1].length;
    const end = start + value[2].length;
    result += raw.slice(copied, start) + JSON.stringify(value[2]);
    copied = end;
    strings.lastIndex = end;
  }
  return JSON.parse(result + raw.slice(copied));
}
