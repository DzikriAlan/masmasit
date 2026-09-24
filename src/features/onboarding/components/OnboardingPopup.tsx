'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChipGroup } from '@/components/chip-group';
import { SkillTagInput, type SkillTag } from '@/components/skill-tag-input';
import type { Skill, UserProfile } from '@/shared/lib/types';
import { normalizePhone } from '@/shared/lib/utils';

import { useOnboardingControllers } from '@/features/onboarding/controllers/onboardingControllers';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_GOALS,
  ONBOARDING_JOB_STATUSES,
  ONBOARDING_LEVELS,
  ONBOARDING_REFERRALS,
} from '@/features/onboarding/types/onboardingTypes';

// Pages where a modal would be in the way: signing in, and the full
// onboarding page, which asks for the same things and more.
const HIDDEN_ON = ['/login', '/register', '/auth', '/forgot-password', '/reset-password', '/onboarding'];
const SNOOZE_DAYS = 3;
// Admins fill these in from their profile page if they want to; no popup.
const ADMIN_ROLES = ['super_admin', 'regional_admin'];

const needsOnboarding = (profile: UserProfile | null) => {
  // undefined (not null) means migration 025 is not applied yet: stay hidden
  // rather than show a form whose save would fail.
  if (!profile || profile.onboarding_completed_at === undefined) return false;
  if (profile.onboarding_completed_at) return false;
  const snoozed = profile.onboarding_snoozed_until;
  return !snoozed || new Date(snoozed).getTime() < Date.now();
};

/** Mounted once in the root layout; renders nothing until it is needed. */
export default function OnboardingPopup() {
  const { user, profile, roles, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user || !needsOnboarding(profile)) return null;
  if (roles.some((r) => ADMIN_ROLES.includes(r))) return null;
  if (HIDDEN_ON.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return null;

  return <OnboardingPopupForm userId={user.id} profile={profile!} />;
}

function OnboardingPopupForm({ userId, profile }: { userId: string; profile: UserProfile }) {
  const { refreshProfile } = useAuth();
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const [fields, setFields] = useState<string[]>(profile.fields ?? []);
  const [level, setLevel] = useState(profile.experience_level ?? '');
  const [skillTags, setSkillTags] = useState<SkillTag[]>([]);
  const [location, setLocation] = useState(profile.location ?? '');
  const [jobStatus, setJobStatus] = useState(
    ONBOARDING_JOB_STATUSES.some((s) => s.value === profile.current_job_status) ? profile.current_job_status! : ''
  );
  const [goals, setGoals] = useState<string[]>(profile.join_goals ?? []);
  const [phone, setPhone] = useState(profile.whatsapp ?? '');
  const [referral, setReferral] = useState(profile.referral_source ?? '');
  const [referralNote, setReferralNote] = useState(profile.referral_note ?? '');
  const phoneInvalid = !!phone.trim() && !normalizePhone(phone);

  const { fetchOnboardingSkills, modifyOnboardingAnswers, modifyOnboardingSnooze } = useOnboardingControllers(userId);
  const skills: Skill[] = fetchOnboardingSkills.data ?? [];
  const saving = modifyOnboardingAnswers.isPending;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // Skills and phone are optional, so the footer counts the required answers.
  // "Other" only counts once it says what the other source was.
  const required = [
    fields.length > 0,
    !!level,
    !!location.trim(),
    !!jobStatus,
    goals.length > 0,
    !!referral && (referral !== 'other' || !!referralNote.trim()),
  ];
  const answered = required.filter(Boolean).length;
  const complete = answered === required.length;

  const snooze = async () => {
    setOpen(false);
    try {
      await modifyOnboardingSnooze.mutateAsync({
        id: userId,
        until: new Date(Date.now() + SNOOZE_DAYS * 864e5).toISOString(),
      });
    } catch {
      // Closing still works for this visit; it will simply ask again next load.
    }
    refreshProfile();
  };

  const submit = async () => {
    if (!complete) {
      toast.error(t('Please answer every question', 'Lengkapi semua pertanyaan dulu ya'));
      return;
    }
    if (phoneInvalid) {
      toast.error(t('Please check the phone number', 'Cek lagi nomor HP-nya'));
      return;
    }
    try {
      await modifyOnboardingAnswers.mutateAsync({
        id: userId,
        fields,
        experience_level: level,
        location: location.trim(),
        current_job_status: jobStatus,
        join_goals: goals,
        referral_source: referral,
        referral_note: referral === 'other' ? referralNote.trim() : null,
        ...(phone.trim() ? { whatsapp: normalizePhone(phone)! } : {}),
        skills: skillTags,
      });
    } catch {
      toast.error(t('Failed to save, please try again', 'Gagal menyimpan, coba lagi'));
      return;
    }
    toast.success(t('Thanks! Your profile is set up.', 'Makasih! Profil kamu sudah siap.'));
    setOpen(false);
    refreshProfile();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && snooze()}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pt-6 pr-12 text-left">
          <DialogTitle className="font-display">{t('Tell us about yourself', 'Kenalan dulu, yuk')}</DialogTitle>
          <DialogDescription>
            {t(
              'A few quick questions so we can show you the right jobs, teams and people.',
              'Beberapa pertanyaan singkat supaya kami bisa menampilkan lowongan, tim, dan orang yang pas buat kamu.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label>{t('What do you work on?', 'Bidang kamu apa?')}</Label>
            <ChipGroup options={ONBOARDING_FIELDS} selected={fields} onPick={(v) => setFields((f) => toggle(f, v))} />
          </div>

          <div className="space-y-2">
            <Label>{t('Your level', 'Level kamu')}</Label>
            <ChipGroup options={ONBOARDING_LEVELS} selected={level ? [level] : []} onPick={(v) => setLevel(v)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-skills">{t('Skills / tech stack', 'Skill / tech stack')}</Label>
            <SkillTagInput id="onboarding-skills" options={skills} value={skillTags} onChange={setSkillTags} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-location">{t('City', 'Kota')}</Label>
            <Input
              id="onboarding-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('e.g. Jakarta', 'mis. Jakarta')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-phone">
              {t('Phone / WhatsApp', 'Nomor HP / WhatsApp')}{' '}
              <span className="font-normal text-muted-foreground">{t('(optional)', '(opsional)')}</span>
            </Label>
            <Input
              id="onboarding-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812 3456 7890"
              aria-invalid={phoneInvalid}
            />
            {phoneInvalid && (
              <p className="text-xs text-destructive">
                {t('Use 9–15 digits, e.g. 081234567890 or +6281234567890', 'Pakai 9–15 digit, mis. 081234567890 atau +6281234567890')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('Current status', 'Status saat ini')}</Label>
            <ChipGroup options={ONBOARDING_JOB_STATUSES} selected={jobStatus ? [jobStatus] : []} onPick={(v) => setJobStatus(v)} />
          </div>

          <div className="space-y-2">
            <Label>{t('Why did you join?', 'Tujuan gabung?')}</Label>
            <ChipGroup options={ONBOARDING_GOALS} selected={goals} onPick={(v) => setGoals((g) => toggle(g, v))} />
          </div>

          <div className="space-y-2">
            <Label>{t('Where did you hear about MasmasIT?', 'Tahu MasmasIT dari mana?')}</Label>
            <ChipGroup options={ONBOARDING_REFERRALS} selected={referral ? [referral] : []} onPick={(v) => setReferral(v)} />
            {referral === 'other' && (
              <Input
                aria-label={t('Where exactly?', 'Dari mana tepatnya?')}
                value={referralNote}
                onChange={(e) => setReferralNote(e.target.value.slice(0, 100))}
                placeholder={t('e.g. a campus seminar', 'mis. seminar kampus')}
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border/60 px-6 py-4">
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            {t(`${answered}/${required.length} answered`, `${answered}/${required.length} terjawab`)}
          </span>
          <Button variant="ghost" onClick={snooze} disabled={saving}>
            {t('Later', 'Nanti saja')}
          </Button>
          <Button onClick={submit} disabled={saving || !complete || phoneInvalid}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('Save', 'Simpan')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
