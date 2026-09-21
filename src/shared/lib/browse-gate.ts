import type { LoadDataResponse } from '@/components/load-data';

/**
 * Every listing table grants SELECT `TO authenticated` only, so a signed-out
 * visitor on a browse page receives zero rows — indistinguishable, from the
 * UI's side, from a section that genuinely has nothing in it.
 *
 * Spread this into a list's LoadData response to say so plainly instead:
 *
 *   ...signedOutState(!user, t, t('roles', 'lowongan'))
 *
 * `isSignedOut` outranks `isEmpty` inside LoadData, so the two can both be
 * true and the sign-in message still wins.
 */
export function signedOutState(
  signedOut: boolean,
  t: (en: string, id: string) => string,
  noun: string
): Pick<
  LoadDataResponse,
  'isSignedOut' | 'signedOutTitle' | 'signedOutSubtitle' | 'signedOutCta' | 'signedOutCtaAlt'
> {
  return {
    isSignedOut: signedOut,
    signedOutTitle: t(`Sign in to browse ${noun}.`, `Masuk untuk melihat ${noun}.`),
    signedOutSubtitle: t(
      'Listings are visible to members. Creating an account takes a minute and is free.',
      'Listing hanya terlihat oleh member. Buat akun cuma sebentar dan gratis.'
    ),
    signedOutCta: t('Get Started', 'Daftar'),
    signedOutCtaAlt: t('Sign in', 'Masuk'),
  };
}
