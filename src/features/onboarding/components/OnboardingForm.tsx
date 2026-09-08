'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Briefcase, GraduationCap, Plus, X, Check } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Skill } from '@/shared/lib/types';

import { useOnboardingControllers } from '@/features/onboarding/controllers/onboardingControllers';

const jobStatuses = ['Employed', 'Freelancing', 'Looking for work', 'Open to opportunities', 'Student'];

export default function OnboardingForm() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<{ skillId: string; level: string }[]>([]);
  const [experiences, setExperiences] = useState<{ company: string; position: string; start_date: string; end_date: string; description: string }[]>([]);

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    current_job_status: '',
    linkedin_url: '',
    whatsapp: '',
    calendly_url: '',
  });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        current_job_status: profile.current_job_status ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        whatsapp: profile.whatsapp ?? '',
        calendly_url: profile.calendly_url ?? '',
      });
    }
  }, [user, profile, loading, router]);

  const {
    fetchOnboardingSkills,
    storeOnboardingProfile,
    storeOnboardingSkills,
    storeOnboardingExperiences,
  } = useOnboardingControllers(user?.id);

  const skills: Skill[] = fetchOnboardingSkills.data ?? [];
  const saving =
    storeOnboardingProfile.isPending ||
    storeOnboardingSkills.isPending ||
    storeOnboardingExperiences.isPending;

  const updateForm = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const addSkill = (skillId: string) => {
    if (selectedSkills.find((s) => s.skillId === skillId)) return;
    setSelectedSkills([...selectedSkills, { skillId, level: 'intermediate' }]);
  };

  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const updateSkillLevel = (skillId: string, level: string) => {
    setSelectedSkills(selectedSkills.map((s) => (s.skillId === skillId ? { ...s, level } : s)));
  };

  const addExperience = () => {
    setExperiences([...experiences, { company: '', position: '', start_date: '', end_date: '', description: '' }]);
  };

  const updateExperience = (index: number, key: string, value: string) => {
    setExperiences(experiences.map((e, i) => (i === index ? { ...e, [key]: value } : e)));
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.error(t('Please enter your name', 'Silakan masukkan nama Anda'));
      return;
    }
    try {
      await storeOnboardingProfile.mutateAsync({ id: user.id, email: user.email, ...form });
    } catch {
      toast.error(t('Failed to save profile', 'Gagal menyimpan profil'));
      return;
    }
    toast.success(t('Profile saved', 'Profil disimpan'));
    setStep(2);
  };

  const saveSkills = async () => {
    if (!user) return;
    try {
      await storeOnboardingSkills.mutateAsync(
        selectedSkills.map((s) => ({ user_id: user.id, skill_id: s.skillId, level: s.level }))
      );
    } catch {
      toast.error(t('Failed to save skills', 'Gagal menyimpan skill'));
      return;
    }
    toast.success(t('Skills saved', 'Skill disimpan'));
    setStep(3);
  };

  const saveExperiences = async () => {
    if (!user) return;
    const valid = experiences.filter((e) => e.company && e.position && e.start_date);
    try {
      await storeOnboardingExperiences.mutateAsync(
        valid.map((e) => ({ user_id: user.id, ...e, end_date: e.end_date || null }))
      );
    } catch {
      toast.error(t('Failed to save experiences', 'Gagal menyimpan pengalaman'));
      return;
    }
    await refreshProfile();
    toast.success(t('Onboarding complete!', 'Onboarding selesai!'));
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-12">
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl px-4">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step >= s ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <CardTitle className="font-display">{t('Profile Information', 'Informasi Profil')}</CardTitle>
              <CardDescription>{t('Tell us about yourself so the community can find you', 'Ceritakan tentang Anda agar komunitas bisa menemukan Anda')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('Full Name', 'Nama Lengkap')}</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} placeholder="Budi Santoso" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" value={form.bio} onChange={(e) => updateForm('bio', e.target.value)} placeholder="Short introduction about yourself..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">{t('Location', 'Lokasi')}</Label>
                  <Input id="location" value={form.location} onChange={(e) => updateForm('location', e.target.value)} placeholder="Jakarta, Indonesia" />
                </div>
                <div className="space-y-2">
                  <Label>Current Job Status</Label>
                  <Select value={form.current_job_status} onValueChange={(v) => updateForm('current_job_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {jobStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input id="linkedin_url" value={form.linkedin_url} onChange={(e) => updateForm('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input id="whatsapp" value={form.whatsapp} onChange={(e) => updateForm('whatsapp', e.target.value)} placeholder="+62..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendly_url">Calendly URL (optional)</Label>
                <Input id="calendly_url" value={form.calendly_url} onChange={(e) => updateForm('calendly_url', e.target.value)} placeholder="https://calendly.com/..." />
              </div>
              <Button onClick={saveProfile} className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('Continue', 'Lanjut')}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <CardTitle className="font-display">{t('Your Skills', 'Skill Anda')}</CardTitle>
              <CardDescription>{t('Add your skills and proficiency level', 'Tambahkan skill dan tingkat kemampuan Anda')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={addSkill}>
                <SelectTrigger><SelectValue placeholder="Add a skill..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {skills.filter((s) => !selectedSkills.find((ss) => ss.skillId === s.id)).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} {s.category ? `(${s.category})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedSkills.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">{t('No skills added yet. Select at least one skill above.', 'Belum ada skill dipilih. Pilih minimal satu skill di atas.')}</p>
              ) : (
                <div className="space-y-2">
                  {selectedSkills.map((s) => {
                    const skill = skills.find((sk) => sk.id === s.skillId);
                    return (
                      <div key={s.skillId} className="flex items-center gap-2 rounded-lg border border-border/60 p-3">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{skill?.name}</span>
                          {skill?.category && <span className="ml-2 text-xs text-muted-foreground">{skill.category}</span>}
                        </div>
                        <Select value={s.level} onValueChange={(v) => updateSkillLevel(s.skillId, v)}>
                          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeSkill(s.skillId)} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t('Back', 'Kembali')}</Button>
                <Button onClick={saveSkills} className="flex-1" disabled={saving || selectedSkills.length === 0}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Continue', 'Lanjut')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <CardTitle className="font-display">{t('Work Experience', 'Pengalaman Kerja')}</CardTitle>
              <CardDescription>{t('Add your work history (optional but recommended)', 'Tambahkan riwayat kerja Anda (opsional tapi disarankan)')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">{t('No experience added yet.', 'Belum ada pengalaman ditambahkan.')}</p>
              )}
              {experiences.map((exp, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-border/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Experience {i + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeExperience(i)} className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company</Label>
                      <Input value={exp.company} onChange={(e) => updateExperience(i, 'company', e.target.value)} placeholder="Company name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Position</Label>
                      <Input value={exp.position} onChange={(e) => updateExperience(i, 'position', e.target.value)} placeholder="Job title" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Date</Label>
                      <Input type="date" value={exp.start_date} onChange={(e) => updateExperience(i, 'start_date', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Date (leave empty if current)</Label>
                      <Input type="date" value={exp.end_date} onChange={(e) => updateExperience(i, 'end_date', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={exp.description} onChange={(e) => updateExperience(i, 'description', e.target.value)} placeholder="What did you do?" className="min-h-[60px]" />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addExperience} className="w-full gap-2">
                <Plus className="h-4 w-4" /> {t('Add Experience', 'Tambah Pengalaman')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{t('Back', 'Kembali')}</Button>
                <Button onClick={saveExperiences} className="flex-1" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Finish', 'Selesai')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
