// Spring Boot defaults to 1 MB per file; BidService's 10 MB check is a separate
// upper bound. A deployment can opt in to more after configuring its server.
export function proposalLimitBytes(configuredMb) {
  const mb = Number(configuredMb ?? 1);
  return (Number.isFinite(mb) && mb > 0 && mb <= 10 ? mb : 1) * 1024 * 1024;
}

export async function validateProposal(file, limitBytes) {
  const label = `${limitBytes / (1024 * 1024)} MB`;
  if (!file || file.type.toLowerCase() !== 'application/pdf' || file.size === 0) {
    throw new Error('Select a non-empty PDF proposal.');
  }
  if (file.size > limitBytes) throw new Error(`The proposal must be ${label} or less for this server.`);
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (header.length !== 5 || header.some((byte, i) => byte !== [37, 80, 68, 70, 45][i])) {
    throw new Error('The selected file does not start with a valid PDF header.');
  }
}
