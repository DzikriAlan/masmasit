/** The profile fields completeness is scored on; any may be absent. */
export interface CompletenessFields {
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  current_job_status?: string | null;
  linkedin_url?: string | null;
  calendly_url?: string | null;
  /** Skills listed on the profile. */
  skillCount?: number;
}

const filled = (value?: string | null) => Boolean(value?.trim());

/**
 * How complete a member profile is, as a score to sort by: one point per
 * filled field, a photo and a real bio (40+ characters) counting double,
 * and up to two for skills. Higher is more complete.
 */
export function profileCompleteness(p: CompletenessFields): number {
  let score = 0;
  if (filled(p.avatar_url)) score += 2;
  if (filled(p.bio)) score += (p.bio as string).trim().length >= 40 ? 2 : 1;
  if (filled(p.full_name)) score += 1;
  if (filled(p.location)) score += 1;
  if (filled(p.current_job_status)) score += 1;
  if (filled(p.linkedin_url)) score += 1;
  if (filled(p.calendly_url)) score += 1;
  const skills = p.skillCount ?? 0;
  if (skills >= 1) score += 1;
  if (skills >= 3) score += 1;
  return score;
}

/** Most complete profiles first; ties keep their incoming order (newest first). */
export function byCompleteness<T>(items: T[], fields: (item: T) => CompletenessFields): T[] {
  return items
    .map((item, index) => ({ item, index, score: profileCompleteness(fields(item)) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item);
}
