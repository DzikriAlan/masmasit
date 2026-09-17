/**
 * The site's colour identity: the same seven `--eco-*` tokens the homepage
 * already uses per ecosystem area (globals.css / tailwind.config.ts), now
 * mapped for every nav destination so a label's colour tells you which
 * part of the ecosystem it belongs to — the same job an icon used to do,
 * without an icon.
 */
export type Tone = 'blue' | 'violet' | 'orange' | 'teal' | 'pink' | 'amber' | 'green';

export const AREA_TONE: Record<string, Tone> = {
  jobs: 'blue',
  'external-jobs': 'blue',
  about: 'blue',
  projects: 'violet',
  'team-collabs': 'violet',
  'team-builder': 'violet',
  talents: 'orange',
  'case-studies': 'orange',
  courses: 'teal',
  discover: 'teal',
  events: 'pink',
  spotlight: 'pink',
  agency: 'amber',
  services: 'amber',
  discussions: 'green',
  directory: 'green',
  builds: 'green',
};

/** `text-eco-<tone>` — full class strings so Tailwind's scanner sees them. */
export const TONE_TEXT: Record<Tone, string> = {
  blue: 'text-eco-blue',
  violet: 'text-eco-violet',
  orange: 'text-eco-orange',
  teal: 'text-eco-teal',
  pink: 'text-eco-pink',
  amber: 'text-eco-amber',
  green: 'text-eco-green',
};

/** Tinted pill background + matching text, for badges/labels. */
export const TONE_CHIP: Record<Tone, string> = {
  blue: 'bg-eco-blue/10 text-eco-blue',
  violet: 'bg-eco-violet/10 text-eco-violet',
  orange: 'bg-eco-orange/10 text-eco-orange',
  teal: 'bg-eco-teal/10 text-eco-teal',
  pink: 'bg-eco-pink/10 text-eco-pink',
  amber: 'bg-eco-amber/10 text-eco-amber',
  green: 'bg-eco-green/10 text-eco-green',
};

/** Looks up a nav area's tone, e.g. `toneOf('jobs')` → `'blue'`. */
export const toneOf = (area: string): Tone => AREA_TONE[area] ?? 'blue';
