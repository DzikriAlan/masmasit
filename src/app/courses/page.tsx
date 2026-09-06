'use client';

import { useEffect, useState } from 'react';
import { GraduationCap, Loader2, Star, Users, Wallet, Plus } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useLang } from '@/components/language-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CourseWithCoach {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  price: number;
  created_at: string;
  coach_id: string;
  profiles: { full_name: string | null } | null;
  enrollments?: { id: string }[];
}

const courseImages: Record<string, string> = {
  'Software Engineering': 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  'Data & AI': 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  'Product Management': 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  'UI/UX & Creative': 'https://images.pexels.com/photos/1966452/pexels-photo-1966452.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  'DevOps & Infrastructure': 'https://images.pexels.com/photos/10727821/pexels-photo-10727821.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  'Cybersecurity': 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
  default: 'https://images.pexels.com/photos/5905717/pexels-photo-5905717.jpeg?auto=compress&cs=tinysrgb&h=200&w=400',
};

const getCourseImage = (cat: string | null) => (cat && courseImages[cat]) ? courseImages[cat] : courseImages.default;

export default function CoursesPage() {
  const { t } = useLang();
  const [courses, setCourses] = useState<CourseWithCoach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('courses')
        .select('*, profiles(full_name), enrollments(id)')
        .order('created_at', { ascending: false });
      setCourses((data as CourseWithCoach[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('Learning Management System', 'Sistem Pembelajaran')}</h1>
            <p className="mt-1 text-muted-foreground">{t('Level up your skills with courses from verified Indonesian IT coaches — get certificates upon completion.', 'Tingkatkan skill dengan kursus dari coach IT Indonesia terverifikasi — dapatkan sertifikat setelah selesai.')}</p>
          </div>
          <Link href="/coach">
            <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> {t('Become a Coach', 'Jadilah Coach')}</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <GraduationCap className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No courses available yet.', 'Belum ada kursus tersedia.')}</p>
            <Link href="/coach" className="mt-4 inline-block"><Button variant="outline" size="sm">{t('Create the first course', 'Buat kursus pertama')}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`}>
                <Card className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                  <div className="relative h-32 overflow-hidden">
                    <img src={getCourseImage(c.category)} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge variant="secondary" className="capitalize text-xs backdrop-blur-md">{c.level}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    {c.category && <Badge variant="outline" className="mb-2 text-xs">{c.category}</Badge>}
                    <h3 className="font-semibold leading-tight">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{t('by', 'oleh')} {c.profiles?.full_name ?? t('Coach', 'Coach')}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {c.enrollments?.length ?? 0}</p>
                    </div>
                    <div className="mt-2">
                      {c.price === 0 ? (
                        <Badge variant="default" className="gap-1 text-xs"><Star className="h-3 w-3" /> {t('Free', 'Gratis')}</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs"><Wallet className="h-3 w-3" /> Rp {(c.price / 1000).toFixed(0)}K</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
