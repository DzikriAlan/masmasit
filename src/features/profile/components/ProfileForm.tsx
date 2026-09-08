'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Star, GraduationCap, Upload } from 'lucide-react';
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

import { useProfileControllers } from '@/features/profile/controllers/profileControllers';

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

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '', bio: profile.bio ?? '',
        location: profile.location ?? '', current_job_status: profile.current_job_status ?? '',
        linkedin_url: profile.linkedin_url ?? '', whatsapp: profile.whatsapp ?? '',
        calendly_url: profile.calendly_url ?? '',
      });
      setAvatarUrl(profile.avatar_url ?? null);
      setHourlyRate(profile.hourly_rate != null ? String(profile.hourly_rate) : '');
    }
  }, [profile, loading, user, router]);

  const { changeProfile, changeProfileTalentApplication } = useProfileControllers(user?.id);

  const saving = changeProfile.isPending || changeProfileTalentApplication.isPending;

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const saveProfile = async () => {
    if (!user) return;
    try {
      await changeProfile.mutateAsync({
        ...form,
        avatar_url: avatarUrl,
        hourly_rate: hourlyRate ? parseInt(hourlyRate) : null,
      });
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
        <h1 className="mb-8 font-display text-3xl font-bold animate-fade-up">{t('Edit Profile', 'Edit Profil')}</h1>

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
              <div className="space-y-2"><Label htmlFor="wa">WhatsApp</Label><Input id="wa" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="cal">Calendly URL</Label><Input id="cal" value={form.calendly_url} onChange={(e) => update('calendly_url', e.target.value)} /></div>
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
