/**
 * Destinations outside the platform. Contact Us in the header, the WhatsApp
 * hand-off after a project↔team match, and checkout all leave the site, so
 * the numbers and the provider name live in one place — a rename is one edit
 * here instead of a sweep through pages.
 */

export const WA_NUMBER = '6289614924059';

export const CONTACT_EMAIL = 'hello@masmasit.online';

/**
 * Prefills the chat so the conversation opens with the subject already named.
 * `number` defaults to MasmasIT's own line; pass a member agency's own
 * WhatsApp (digits only, country code first) to route the chat there.
 */
export const waLink = (text?: string, number: string = WA_NUMBER) =>
  text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;

/**
 * Normalises a typed phone number into wa.me's format: digits only, with an
 * Indonesian leading 0 turned into the 62 country code ("0812-…" → "62812…").
 */
export const toWaNumber = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
};

/**
 * Checkout happens on an external storefront. Buyers are told by name before
 * they leave — see `PaymentRedirectNotice`. The `app_settings.goakal_*_url`
 * columns still hold the links; only the destination was renamed.
 */
export const PAYMENT_PROVIDER = 'GoAkal';
