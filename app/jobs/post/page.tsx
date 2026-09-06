'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Briefcase, Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PostJobPage() {
  const { user, loading, roles } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', description: '', website: '', location: '', industry: '' });
  const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', job_type: 'full-time', salary_min: '', salary_max: '', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'company' | 'job'>('company');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCompany(data);
        if (data.approval_status === 'approved') setMode('job');
      }
    })();
  }, [user]);

  const registerCompany = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('companies').insert({
      user_id: user.id,
      ...companyForm,
    });
    setSaving(false);
    if (error) { toast.error(t('Failed to register company', 'Gagal mendaftarkan perusahaan')); return; }

    if (!roles.includes('company')) {
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'company' });
    }
    toast.success(t('Company registered! Waiting for admin approval.', 'Perusahaan terdaftar! Menunggu persetujuan admin.'));
    router.push('/dashboard');
  };

  const postJob = async () => {
    if (!user || !company) return;
    setSaving(true);
    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: jobForm.title,
      description: jobForm.description,
      location: jobForm.location || null,
      job_type: jobForm.job_type,
      salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
      salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      deadline: jobForm.deadline || null,
    });
    setSaving(false);
    if (error) { toast.error(t('Failed to post job', 'Gagal memposting lowongan')); return; }
    toast.success(t('Job posted!', 'Lowangan terposting!'));
    router.push('/jobs');
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {mode === 'company' && !company && (
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary"><Building2 className="h-5 w-5" /></div>
              <CardTitle className="font-display">{t('Register Your Company', 'Daftarkan Perusahaan Anda')}</CardTitle>
              <CardDescription>{t('Companies require admin approval before posting jobs.', 'Perusahaan perlu persetujuan admin sebelum memposting lowongan.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="cname">{t('Company Name', 'Nama Perusahaan')}</Label><Input id="cname" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="PT Tech Nusantara" /></div>
              <div className="space-y-2"><Label htmlFor="cdesc">{t('Description', 'Deskripsi')}</Label><Textarea id="cdesc" value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} placeholder={t('What does your company do?', 'Apa yang dilakukan perusahaan Anda?')} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="cweb">{t('Website', 'Website')}</Label><Input id="cweb" value={companyForm.website} onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })} placeholder="https://..." /></div>
                <div className="space-y-2"><Label htmlFor="cloc">{t('Location', 'Lokasi')}</Label><Input id="cloc" value={companyForm.location} onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })} placeholder="Jakarta" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="cind">{t('Industry', 'Industri')}</Label><Input id="cind" value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} placeholder={t('Fintech, E-commerce, etc.', 'Fintech, E-commerce, dll')} /></div>
              <Button onClick={registerCompany} disabled={saving || !companyForm.name} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('Register Company', 'Daftarkan Perusahaan')}
              </Button>
            </CardContent>
          </Card>
        )}

        {company && company.approval_status === 'pending' && (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-amber-400" />
              <h2 className="font-display text-xl font-bold">{t('Awaiting Approval', 'Menunggu Persetujuan')}</h2>
              <p className="mt-2 text-muted-foreground">{t('Your company', 'Perusahaan Anda')} &ldquo;{company.name}&rdquo; {t('is pending admin approval. You\'ll be able to post jobs once approved.', 'sedang menunggu persetujuan admin. Anda dapat memposting lowongan setelah disetujui.')}</p>
              <Badge variant="secondary" className="mt-4">{t('Status', 'Status')}: {t('Pending', 'Pending')}</Badge>
            </CardContent>
          </Card>
        )}

        {company && company.approval_status === 'approved' && (
          <Card className="glass">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2 text-primary"><Briefcase className="h-5 w-5" /></div>
              <CardTitle className="font-display">{t('Post a Job', 'Posting Lowongan')}</CardTitle>
              <CardDescription>{t('Posting as', 'Posting sebagai')} {company.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="jtitle">{t('Job Title', 'Judul Lowongan')}</Label><Input id="jtitle" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder={t('Senior Frontend Developer', 'Senior Frontend Developer')} /></div>
              <div className="space-y-2"><Label htmlFor="jdesc">{t('Description', 'Deskripsi')}</Label><Textarea id="jdesc" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder={t('Detailed job description...', 'Deskripsi pekerjaan detail...')} className="min-h-[120px]" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="jloc">{t('Location', 'Lokasi')}</Label><Input id="jloc" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder={t('Jakarta or Remote', 'Jakarta atau Remote')} /></div>
                <div className="space-y-2">
                  <Label>{t('Job Type', 'Tipe Pekerjaan')}</Label>
                  <Select value={jobForm.job_type} onValueChange={(v) => setJobForm({ ...jobForm, job_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">{t('Full-time', 'Penuh Waktu')}</SelectItem>
                      <SelectItem value="part-time">{t('Part-time', 'Paruh Waktu')}</SelectItem>
                      <SelectItem value="contract">{t('Contract', 'Kontrak')}</SelectItem>
                      <SelectItem value="internship">{t('Internship', 'Magang')}</SelectItem>
                      <SelectItem value="remote">{t('Remote', 'Remote')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="jsmin">{t('Salary Min (IDR)', 'Gaji Min (IDR)')}</Label><Input id="jsmin" type="number" value={jobForm.salary_min} onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })} placeholder="5000000" /></div>
                <div className="space-y-2"><Label htmlFor="jsmax">{t('Salary Max (IDR)', 'Gaji Max (IDR)')}</Label><Input id="jsmax" type="number" value={jobForm.salary_max} onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })} placeholder="10000000" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="jdead">{t('Deadline', 'Tenggat')}</Label><Input id="jdead" type="date" value={jobForm.deadline} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })} /></div>
              <Button onClick={postJob} disabled={saving || !jobForm.title || !jobForm.description} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('Post Job', 'Posting Lowongan')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
