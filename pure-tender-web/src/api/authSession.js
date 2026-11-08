import { toCurrentUser } from './dtos.js';

// Spring Boot returns an accessToken and accountStatus immediately after POST
// /api/v1/auth/register/{role}. No second password login is necessary.
// Only the backend response is trusted for role and status (not form.role).
export function sessionFromRegistration(created) {
  if (!created?.accessToken) {
    throw new Error('Registration succeeded without an access token. Sign in to continue.');
  }
  const user = toCurrentUser(created);
  if (!['BIDDER', 'LISTER'].includes(user.role)) {
    throw new Error('Registration returned an unexpected role. Contact your backend teammate.');
  }
  const profile = created.companyProfile || null;
  return {
    token: created.accessToken,
    user: {
      ...user,
      ...(profile ? {
        companyProfile: profile,
        organizationName: profile.companyName ?? '',
        phoneNumber: profile.contactNumber ?? '',
      } : {}),
      profileMissing: created.profileSaved === false,
      profileLoadError: created.profileSaved === false ? created.profileWarning : null,
    },
  };
}
