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
