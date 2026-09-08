'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Briefcase, Calendar, Star, Link as LinkIcon, Loader2, MessageCircle, CalendarClock, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useDirectoryDetailControllers } from '@/features/directory/controllers/directoryControllers';

export default function DirectoryDetail() {
  const { user } = useAuth();
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();

  const { fetchDirectoryDetail } = useDirectoryDetailControllers(params.id as string);

  const profile = fetchDirectoryDetail.data ?? null;
  const loading = fetchDirectoryDetail.isPending;

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  }

  if (!profile) {
    return <AppShell><div className="py-20 text-center text-muted-foreground">{t('Profile not found.', 'Profil tidak ditemukan.')}</div></AppShell>;
  }

  const isTalent = profile.is_talent && profile.talent_approved === 'approved';

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Card */}
        <Card className="glass mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-bold">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  profile.full_name?.charAt(0)?.toUpperCase() ?? '?'
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{profile.full_name ?? 'Anonymous'}</h1>
                  {isTalent && <Badge variant="default" className="gap-1"><Star className="h-3 w-3" /> Talent</Badge>}
                  {profile.is_coach && profile.coach_approved === 'approved' && (
                    <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" /> Coach</Badge>
                  )}
                </div>
                {profile.location && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {profile.location}
                  </p>
                )}
                {profile.current_job_status && (
                  <p className="mt-1 text-sm text-muted-foreground">{profile.current_job_status}</p>
                )}
                {profile.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-2"><LinkIcon className="h-3.5 w-3.5" /> LinkedIn</Button>
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-2"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button>
                    </a>
                  )}
                  {isTalent && (
                    <Link href={`/talents/${profile.id}`}>
                      <Button size="sm" className="gap-2"><CalendarClock className="h-3.5 w-3.5" /> {t('Book Session', 'Pesan Sesi')}</Button>
                    </Link>
                  )}
                  {user && user.id !== profile.id && (
                    <Link href={`/pesan?to=${profile.id}`}>
                      <Button variant="outline" size="sm" className="gap-2"><MessageCircle className="h-3.5 w-3.5" /> {t('Chat', 'Chat')}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skills */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">{t('Skills', 'Skill')}</CardTitle></CardHeader>
            <CardContent>
              {profile.user_skills && profile.user_skills.length > 0 ? (
                <div className="space-y-2">
                  {profile.user_skills.map((us, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                      <div>
                        <span className="text-sm font-medium">{us.skills?.name}</span>
                        {us.skills?.category && <span className="ml-2 text-xs text-muted-foreground">{us.skills.category}</span>}
                      </div>
                      <Badge variant="secondary" className="capitalize text-xs">{us.level}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('No skills listed.', 'Tidak ada skill terdaftar.')}</p>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="glass">
            <CardHeader><CardTitle className="text-lg">{t('Experience', 'Pengalaman')}</CardTitle></CardHeader>
            <CardContent>
              {profile.experiences && profile.experiences.length > 0 ? (
                <div className="space-y-4">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-primary/30 pl-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{exp.position}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {exp.start_date} — {exp.end_date ?? t('Present', 'Sekarang')}
                      </p>
                      {exp.description && <p className="mt-2 text-sm text-muted-foreground">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('No experience listed.', 'Tidak ada pengalaman terdaftar.')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
