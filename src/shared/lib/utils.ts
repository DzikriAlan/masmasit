import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Login URL that brings the user back to the current page after signing in. */
export function loginHref() {
  if (typeof window === 'undefined') return '/login';
  const back = window.location.pathname + window.location.search;
  return back === '/' ? '/login' : `/login?redirect=${encodeURIComponent(back)}`;
}

/** "PT Kirana Teknologi" → "pt-kirana-teknologi". Used for agency URLs. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-');
}

/**
 * Phone / WhatsApp number as stored on profiles.whatsapp: digits with an
 * optional leading +, spaces, dashes, dots and brackets removed. Returns
 * null when the input is not a plausible number (9-15 digits).
 */
export const normalizePhone = (input: string): string | null => {
  const compact = input.trim().replace(/[\s\-().]/g, '');
  return /^\+?\d{9,15}$/.test(compact) ? compact : null;
};
