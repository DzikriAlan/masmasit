/**
 * Destinations outside the platform. Contact Us in the header, the WhatsApp
 * hand-off after a project↔team match, and checkout all leave the site, so
 * the numbers and the provider name live in one place — a rename is one edit
 * here instead of a sweep through pages.
 */

export const WA_NUMBER = '6289614924059';

export const CONTACT_EMAIL = 'hello@masmasit.online';

/** Prefills the chat so the conversation opens with the subject already named. */
export const waLink = (text?: string) =>
  text ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}` : `https://wa.me/${WA_NUMBER}`;

/**
 * Checkout happens on an external storefront. Buyers are told by name before
 * they leave — see `PaymentRedirectNotice`. The `app_settings.lynkid_*_url`
 * columns still hold the links; only the destination was renamed.
 */
export const PAYMENT_PROVIDER = 'GoAkal';
