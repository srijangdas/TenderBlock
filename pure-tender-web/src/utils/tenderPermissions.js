// Client-side guard only. The Spring Boot API must also enforce this deadline.
export function canCancelTenderBeforeDeadline(tender, { verified = false, now = Date.now() } = {}) {
  const deadline = Date.parse(tender?.submissionDeadline || '');
  return Boolean(verified && tender?.status === 'PUBLISHED'
    && Number.isFinite(deadline) && now < deadline);
}
