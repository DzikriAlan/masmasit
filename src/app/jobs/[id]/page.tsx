'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, MapPin, Clock, Wallet, Loader2, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string | null;
  job_type: string;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  created_at: string;
  company_id: string;
  companies: { name: string; logo_url: string | null; description: string | null; website: string | null; location: string | null } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const { data } = await supabase
        .from('jobs')
        .select('*, companies(name, logo_url, description, website, location)')
        .eq('id', id)
        .maybeSingle();
      setJob(data as JobDetail | null);
      if (user) {
        const { data: app } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasApplied(!!app);
      }
      setLoading(false);
    })();
  }, [params, user]);

  const handleApply = async () => {
    if (!user) { router.push('/login'); return; }
    setApplying(true);
    const { error } = await supabase.from('job_applications').insert({
      job_id: job!.id,
      user_id: user.id,
      cover_letter: coverLetter || null,
    });
    setApplying(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? t('You already applied to this job', 'Anda sudah melamar pekerjaan ini') : t('Failed to apply', 'Gagal melamar'));
    } else {
      toast.success(t('Application submitted!', 'Lamaran terkirim!'));
      setHasApplied(true);
      setShowApply(false);
    }
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  if (!job) return <AppShell><div className="py-20 text-center text-muted-foreground">{t('Job not found.', 'Lowongan tidak ditemukan.')}</div></AppShell>;

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `Rp ${(min / 1000000).toFixed(0)}-${(max / 1000000).toFixed(0)}M`;
    if (min) return `Rp ${(min / 1000000).toFixed(0)}M+`;
    return `Up to Rp ${(max! / 1000000).toFixed(0)}M`;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}</Button>

        <Card className="glass mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                {job.companies?.logo_url ? (
                  <img src={job.companies.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-bold">{job.title}</h1>
                <p className="text-muted-foreground">{job.companies?.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{job.job_type.replace('-', ' ')}</Badge>
                  {job.location && <Badge variant="outline" className="gap-1"><MapPin className="h-3 w-3" /> {job.location}</Badge>}
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <Badge variant="outline" className="gap-1 text-success"><Wallet className="h-3 w-3" /> {formatSalary(job.salary_min, job.salary_max)}</Badge>
                  )}
                  {job.deadline && <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> {new Date(job.deadline).toLocaleDateString('id-ID')}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass mb-6">
          <CardHeader><CardTitle>{t('Job Description', 'Deskripsi Pekerjaan')}</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p></CardContent>
        </Card>

        {job.companies?.description && (
          <Card className="glass mb-6">
            <CardHeader><CardTitle>{t('About', 'Tentang')} {job.companies.name}</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{job.companies.description}</p></CardContent>
          </Card>
        )}

        {/* Apply section */}
        <Card className="glass">
          <CardContent className="p-6">
            {hasApplied ? (
              <div className="flex items-center gap-3 text-success">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-medium">{t('Application submitted', 'Lamaran terkirim')}</p>
                  <p className="text-sm text-muted-foreground">{t("You'll be notified when the company responds.", 'Anda akan diberi tahu ketika perusahaan merespons.')}</p>
                </div>
              </div>
            ) : showApply ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cover">{t('Cover Letter (optional)', 'Surat Lamaran (opsional)')}</Label>
                  <Textarea id="cover" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder={t('Why are you a good fit?', 'Mengapa Anda cocok?')} className="min-h-[120px]" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowApply(false)}>{t('Cancel', 'Batal')}</Button>
                  <Button onClick={handleApply} disabled={applying} className="gap-2">
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t('Submit Application', 'Kirim Lamaran')}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => user ? setShowApply(true) : router.push('/login')} className="w-full gap-2">
                <Send className="h-4 w-4" /> {t('Apply with One Click', 'Lamar Sekali Klik')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
