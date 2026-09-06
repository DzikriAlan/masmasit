'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Loader2, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { supabase } from '@/shared/lib/supabase';
import { useLang } from '@/components/language-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CaseStudy {
  id: string;
  title: string;
  client_name: string;
  challenge: string;
  solution: string;
  result: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

export default function CaseStudiesPage() {
  const { t } = useLang();
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('case_studies')
        .select('*')
        .order('created_at', { ascending: false });
      setStudies((data as CaseStudy[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('Case Studies', 'Studi Kasus')}</h1>
          <p className="mt-1 text-muted-foreground">{t('Real projects, real results. See how we\'ve helped clients build digital solutions.', 'Proyek nyata, hasil nyata. Lihat bagaimana kami membantu klien membangun solusi digital.')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : studies.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>{t('No case studies published yet.', 'Belum ada studi kasus yang dipublikasikan.')}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studies.map((cs) => (
              <Card key={cs.id} className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                {cs.image_url && (
                  <div className="relative h-40 overflow-hidden">
                    <img src={cs.image_url} alt={cs.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    {cs.category && <Badge variant="secondary" className="absolute top-3 left-3 backdrop-blur-md">{cs.category}</Badge>}
                  </div>
                )}
                <CardContent className="p-6">
                  {!cs.image_url && cs.category && <Badge variant="secondary" className="mb-3">{cs.category}</Badge>}
                  <h3 className="font-display text-lg font-bold">{cs.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t('Client', 'Klien')}: {cs.client_name}</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><Target className="h-3.5 w-3.5" /> {t('Challenge', 'Tantangan')}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{cs.challenge}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Lightbulb className="h-3.5 w-3.5" /> {t('Solution', 'Solusi')}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{cs.solution}</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-success"><BarChart3 className="h-3.5 w-3.5" /> {t('Result', 'Hasil')}</div>
                      <p className="mt-1 text-sm font-medium text-success">{cs.result}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
