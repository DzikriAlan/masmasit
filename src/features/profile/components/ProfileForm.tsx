'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Star, GraduationCap, Upload, Plus, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { FileUpload } from '@/features/uploads/components/FileUpload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { ChipGroup } from '@/components/chip-group';
import { SkillTagInput, type SkillTag } from '@/components/skill-tag-input';
import { useProfileControllers } from '@/features/profile/controllers/profileControllers';
import type { PayloadProfileExperience } from '@/features/profile/types/profileTypes';
import {
  ONBOARDING_FIELDS,
  ONBOARDING_GOALS,
  ONBOARDING_LEVELS,
} from '@/features/onboarding/types/onboardingTypes';
import { loginHref, normalizePhone } from '@/shared/lib/utils';

const jobStatuses = ['Employed', 'Freelancing', 'Looking for work', 'Open to opportunities', 'Student'];

export default function ProfileForm() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '', bio: '', location: '', current_job_status: '',
    linkedin_url: '', whatsapp: '', calendly_url: '',
  });
  const [hourlyRate, setHourlyRate] = useState('');
  const [fields, setFields] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [skillTags, setSkillTags] = useState<SkillTag[] | null>(null);
  const [experiences, setExperiences] = useState<PayloadProfileExperience[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push(loginHref());
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '', bio: profile.bio ?? '',
        location: profile.location ?? '', current_job_status: profile.current_job_status ?? '',
        linkedin_url: profile.linkedin_url ?? '', whatsapp: profile.whatsapp ?? '',
        calendly_url: profile.calendly_url ?? '',
      });
      setAvatarUrl(profile.avatar_url ?? null);
      setHourlyRate(profile.hourly_rate != null ? String(profile.hourly_rate) : '');
      setFields(profile.fields ?? []);
      setLevel(profile.experience_level ?? '');
      setGoals(profile.join_goals ?? []);
    }
  }, [profile, loading, user, router]);

  const {
    changeProfile,
    changeProfileTalentApplication,
    fetchProfileSkillOptions,
    fetchProfileSkills,
    modifyProfileSkills,
    fetchProfileExperiences,
    modifyProfileExperiences,
  } = useProfileControllers(user?.id);

  // Same seeding pattern as skills: saved rows until the member edits.
  const experienceValue: PayloadProfileExperience[] =
    experiences ??
    (fetchProfileExperiences.data ?? []).map((e) => ({
      id: e.id,
      company: e.company,
      position: e.position,
      start_date: e.start_date,
      end_date: e.end_date ?? '',
      description: e.description ?? '',
    }));
  const addExperience = () =>
    setExperiences([
      ...experienceValue,
      { id: null, company: '', position: '', start_date: '', end_date: '', description: '' },
    ]);
  const updateExperience = (i: number, key: keyof PayloadProfileExperience, value: string) =>
    setExperiences(experienceValue.map((e, j) => (j === i ? { ...e, [key]: value } : e)));
  const removeExperience = (i: number) => setExperiences(experienceValue.filter((_, j) => j !== i));

  // Seeded once from the member's saved skills, then owned by the input.
  const savedSkills: SkillTag[] = (fetchProfileSkills.data ?? []).map((s) => ({
    id: s.skill_id,
    name: s.skills?.name ?? '',
  }));
  const skillValue = skillTags ?? savedSkills;

  // undefined (not []) means migration 025 is not applied yet: hide the
  // Background card and leave its columns out of the update.
  const hasBackground = profile?.fields !== undefined;

  const saving =
    changeProfile.isPending ||
    changeProfileTalentApplication.isPending ||
    modifyProfileSkills.isPending ||
    modifyProfileExperiences.isPending;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const phoneInvalid = !!form.whatsapp.trim() && !normalizePhone(form.whatsapp);

  const saveProfile = async () => {
    if (!user) return;
    if (phoneInvalid) {
      toast.error(t('Please check the phone number', 'Cek lagi nomor HP-nya'));
      return;
    }
    // Untouched blank rows are dropped; half-filled ones must be finished.
    const filledExperiences = (experiences ?? []).filter(
      (e) => e.company.trim() || e.position.trim() || e.start_date || e.end_date || e.description.trim()
    );
    if (filledExperiences.some((e) => !e.company.trim() || !e.position.trim() || !e.start_date)) {
      toast.error(t('Each experience needs a company, position and start date', 'Setiap pengalaman wajib isi perusahaan, posisi, dan tanggal mulai'));
      return;
    }
    if (filledExperiences.some((e) => e.end_date && e.end_date < e.start_date)) {
      toast.error(t('End date cannot be before the start date', 'Tanggal selesai tidak boleh sebelum tanggal mulai'));
      return;
    }
    try {
      // Answering everything here counts as onboarding, so the popup stops.
      const onboarded =
        !profile?.onboarding_completed_at &&
        fields.length > 0 && !!level && !!form.location.trim() && !!form.current_job_status && goals.length > 0;
      await changeProfile.mutateAsync({
        ...form,
        whatsapp: normalizePhone(form.whatsapp) ?? '',
        avatar_url: avatarUrl,
        hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
        ...(hasBackground ? { fields, experience_level: level || null, join_goals: goals } : {}),
        ...(hasBackground && onboarded ? { onboarding_completed_at: new Date().toISOString() } : {}),
      });
      if (hasBackground && skillTags) await modifyProfileSkills.mutateAsync(skillTags);
      if (experiences) {
        await modifyProfileExperiences.mutateAsync(filledExperiences);
        setExperiences(null);
      }
    } catch {
      toast.error(t('Failed to save', 'Gagal menyimpan'));
      return;
    }
    toast.success(t('Profile updated!', 'Profil diperbarui!'));
    refreshProfile();
  };

  const saveTalentApplication = async () => {
    if (!user) return;
    try {
      await changeProfileTalentApplication.mutateAsync();
    } catch {
      toast.error(t('Failed to submit application', 'Gagal mengirim pendaftaran'));
      return;
    }
    toast.success(t('Talent application submitted!', 'Pendaftaran talent dikirim!'));
    refreshProfile();
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
          {t('Settings', 'Pengaturan')}
        </div>
        <h1 className="mb-8 font-display text-3xl font-semibold animate-fade-up">{t('Edit Profile', 'Edit Profil')}</h1>

        <Card className="glass glass-hover mb-6 animate-fade-up">
          <CardHeader><CardTitle>{t('Profile Information', 'Informasi Profil')}</CardTitle><CardDescription>{t('This information is visible to other members.', 'Informasi ini terlihat oleh member lain.')}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              bucket="avatars"
              existingUrl={avatarUrl}
              onUpload={(url) => setAvatarUrl(url)}
              label={t('Avatar', 'Avatar')}
            />
            <div className="space-y-2"><Label htmlFor="fn">{t('Full Name', 'Nama Lengkap')}</Label><Input id="fn" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" value={form.bio} onChange={(e) => update('bio', e.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="loc">{t('Location', 'Lokasi')}</Label><Input id="loc" value={form.location} onChange={(e) => update('location', e.target.value)} /></div>
              <div className="space-y-2">
                <Label>{t('Job Status', 'Status Pekerjaan')}</Label>
                <Select value={form.current_job_status} onValueChange={(v) => update('current_job_status', v)}>
                  <SelectTrigger><SelectValue placeholder={t('Select', 'Pilih')} /></SelectTrigger>
                  <SelectContent>{jobStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="li">LinkedIn URL</Label><Input id="li" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} /></div>
              <div className="space-y-2">
                <Label htmlFor="wa">{t('Phone / WhatsApp', 'Nomor HP / WhatsApp')}</Label>
                <Input id="wa" type="tel" inputMode="tel" autoComplete="tel" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="0812 3456 7890" aria-invalid={phoneInvalid} />
                {phoneInvalid && (
                  <p className="text-xs text-destructive">
                    {t('Use 9–15 digits, e.g. 081234567890 or +6281234567890', 'Pakai 9–15 digit, mis. 081234567890 atau +6281234567890')}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="cal">Calendly URL</Label><Input id="cal" value={form.calendly_url} onChange={(e) => update('calendly_url', e.target.value)} /></div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('Save Changes', 'Simpan Perubahan')}</Button>
          </CardContent>
        </Card>

        {hasBackground && (
          <Card className="glass glass-hover mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <CardHeader>
              <CardTitle>{t('Background', 'Latar Belakang')}</CardTitle>
              <CardDescription>
                {t(
                  'Your field, level, skills and goals. Used to match you with jobs, teams and people.',
                  'Bidang, level, skill, dan tujuan kamu. Dipakai untuk mencocokkan lowongan, tim, dan orang.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>{t('Field', 'Bidang')}</Label>
              <ChipGroup options={ONBOARDING_FIELDS} selected={fields} onPick={(v) => setFields((f) => toggle(f, v))} />
            </div>
            <div className="space-y-2">
              <Label>{t('Level', 'Level')}</Label>
              <ChipGroup options={ONBOARDING_LEVELS} selected={level ? [level] : []} onPick={(v) => setLevel(v)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-skills">{t('Skills / tech stack', 'Skill / tech stack')}</Label>
              <SkillTagInput
                id="profile-skills"
                options={fetchProfileSkillOptions.data ?? []}
                value={skillValue}
                onChange={setSkillTags}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Why did you join?', 'Tujuan gabung')}</Label>
              <ChipGroup options={ONBOARDING_GOALS} selected={goals} onPick={(v) => setGoals((g) => toggle(g, v))} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('Save Changes', 'Simpan Perubahan')}</Button>
          </CardContent>
        </Card>
        )}

        <Card className="glass glass-hover mb-6 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <CardHeader>
            <CardTitle>{t('Experience', 'Pengalaman')}</CardTitle>
            <CardDescription>
              {t('Your work history, shown on your member page.', 'Riwayat kerja kamu, tampil di halaman member.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {experienceValue.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">{t('No experience added yet.', 'Belum ada pengalaman.')}</p>
            )}
            {experienceValue.map((exp, i) => (
              <div key={exp.id ?? `new-${i}`} className="space-y-3 rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t(`Experience ${i + 1}`, `Pengalaman ${i + 1}`)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperience(i)}
                    className="h-8 w-8"
                    aria-label={t('Remove experience', 'Hapus pengalaman')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-position-${i}`} className="text-xs">{t('Position', 'Posisi')}</Label>
                    <Input id={`exp-position-${i}`} value={exp.position} onChange={(e) => updateExperience(i, 'position', e.target.value)} placeholder={t('e.g. Backend Engineer', 'mis. Backend Engineer')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-company-${i}`} className="text-xs">{t('Company', 'Perusahaan')}</Label>
                    <Input id={`exp-company-${i}`} value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-start-${i}`} className="text-xs">{t('Start date', 'Tanggal mulai')}</Label>
                    <Input id={`exp-start-${i}`} type="date" value={exp.start_date} onChange={(e) => updateExperience(i, 'start_date', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-end-${i}`} className="text-xs">{t('End date (empty if current)', 'Tanggal selesai (kosongkan jika masih)')}</Label>
                    <Input id={`exp-end-${i}`} type="date" value={exp.end_date} onChange={(e) => updateExperience(i, 'end_date', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-desc-${i}`} className="text-xs">{t('Description', 'Deskripsi')}</Label>
                  <Textarea id={`exp-desc-${i}`} value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} placeholder={t('What did you work on?', 'Apa yang kamu kerjakan?')} className="min-h-[60px]" />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addExperience} className="w-full gap-2">
              <Plus className="h-4 w-4" /> {t('Add Experience', 'Tambah Pengalaman')}
            </Button>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('Save Changes', 'Simpan Perubahan')}</Button>
          </CardContent>
        </Card>

        {/* Role status */}
        <Card className="glass glass-hover mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader><CardTitle>{t('Roles & Status', 'Peran & Status')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 transition-all hover:border-primary/30">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('Coach', 'Coach')}</p>
                  <p className="text-sm text-muted-foreground">{profile?.is_coach ? `${t('Status', 'Status')}: ${profile.coach_approved}` : t('Not applied', 'Belum daftar')}</p>
                </div>
              </div>
              {!profile?.is_coach && <Button variant="outline" size="sm" onClick={() => router.push('/coach')}>{t('Apply', 'Daftar')}</Button>}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 p-4 transition-all hover:border-primary/30">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium">{t('Talent', 'Talent')}</p>
                  <p className="text-sm text-muted-foreground">{profile?.is_talent ? `${t('Status', 'Status')}: ${profile.talent_approved}` : t('Not applied', 'Belum daftar')}</p>
                </div>
              </div>
              {!profile?.is_talent && <Button variant="outline" size="sm" onClick={saveTalentApplication} disabled={saving}>{t('Apply', 'Daftar')}</Button>}
            </div>

            {profile?.is_talent && profile.talent_approved === 'approved' && (
              <div className="space-y-2 rounded-lg border border-border/60 p-4">
                <Label htmlFor="rate">{t('Session rate (Rp)', 'Tarif sesi (Rp)')}</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="500000"
                />
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Shown as the default amount when a client books you. Save the profile to apply.',
                    'Dipakai sebagai nominal awal saat klien memesan Anda. Simpan profil untuk menerapkan.'
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
