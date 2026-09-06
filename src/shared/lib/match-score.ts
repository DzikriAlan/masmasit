import type { SkillLevel } from './types';

const levelOrder: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/**
 * Calculate a match score percentage between a user's skills and required skills.
 * Returns 0-100 integer.
 */
export function calcMatchScore(
  userSkills: { skill_id: string; level: string }[],
  requiredSkills: { skill_id: string; level: string }[],
): number {
  if (!requiredSkills.length) return 0;
  let totalPoints = 0;
  let maxPoints = 0;

  for (const req of requiredSkills) {
    maxPoints += 100;
    const userSkill = userSkills.find((us) => us.skill_id === req.skill_id);
    if (!userSkill) continue;

    const userLevel = levelOrder[userSkill.level] ?? 0;
    const reqLevel = levelOrder[req.level] ?? 1;

    if (userLevel >= reqLevel) {
      totalPoints += 100;
    } else {
      totalPoints += Math.round((userLevel / reqLevel) * 100);
    }
  }

  return Math.round(totalPoints / maxPoints);
}

export function matchScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-500/10';
  if (score >= 60) return 'text-amber-600 bg-amber-500/10';
  if (score >= 40) return 'text-orange-600 bg-orange-500/10';
  return 'text-muted-foreground bg-muted';
}
