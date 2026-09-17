'use client';

import Link from 'next/link';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { TONE_TEXT, toneOf } from '@/shared/lib/tones';
import { LoadData } from '@/components/load-data';
import { useLang } from '@/components/language-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCaseStudiesControllers } from '@/features/case-studies/controllers/caseStudiesControllers';
import { useArticlesControllers } from '@/features/articles/controllers/articlesControllers';
import { useDiscussionsFeaturedControllers } from '@/features/discussions/controllers/discussionsControllers';

/**
 * Discover is one page with three strands of reading — articles, case
 * studies and member writing — instead of three nav items (REST.md Bagian
 * 3/9). Case studies come from the existing admin panel; articles are
 * platform-authored (AdminCatalog.tsx); member writing is a Discussions
 * thread an admin has promoted (`discussions.is_featured`).
 */
export default function DiscoverList() {
  const { t } = useLang();
  const { fetchCaseStudies } = useCaseStudiesControllers();
  const { fetchArticles } = useArticlesControllers();
  const { fetchDiscussionsFeatured } = useDiscussionsFeaturedControllers();

  const studies = fetchCaseStudies.data ?? [];
  const articles = fetchArticles.data ?? [];
  const featured = fetchDiscussionsFeatured.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          tone={toneOf('discover')}
          title={t('Discover', 'Discover')}
          subtitle={t(
            'Articles from the platform, case studies of work that shipped, and writing by members themselves — in one place rather than three menu items.',
            'Artikel dari platform, studi kasus pekerjaan yang benar-benar rilis, dan tulisan member sendiri — dalam satu tempat, bukan tiga item menu.'
          )}
        />

          <Tabs defaultValue="case-study">
            <TabsList>
              <TabsTrigger value="article">{t('Article', 'Artikel')}</TabsTrigger>
              <TabsTrigger value="case-study">{t('Case Study', 'Studi Kasus')}</TabsTrigger>
              <TabsTrigger value="member">{t('Member writing', 'Tulisan Member')}</TabsTrigger>
            </TabsList>

            <TabsContent value="article" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchArticles.isPending,
                  isEmpty: articles.length === 0,
                  emptyTitle: t('No articles published yet.', 'Belum ada artikel yang dipublikasikan.'),
                  emptySubtitle: t(
                    'Platform articles will appear here once the first ones are published.',
                    'Artikel dari platform akan muncul di sini setelah yang pertama dipublikasikan.'
                  ),
                }}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((a) => (
                    <Card key={a.id} className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                      {a.cover_image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={a.cover_image_url} alt={a.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                      <CardContent className="p-6">
                        <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{a.excerpt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </LoadData>
            </TabsContent>

            <TabsContent value="case-study" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchCaseStudies.isPending,
                  isEmpty: studies.length === 0,
                  emptyTitle: t('No case studies published yet.', 'Belum ada studi kasus yang dipublikasikan.'),
                  emptySubtitle: t(
                    'Real projects with a stated challenge, solution and result will be collected here.',
                    'Proyek nyata dengan tantangan, solusi dan hasil yang jelas akan dikumpulkan di sini.'
                  ),
                }}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {studies.map((cs) => (
                    <Card key={cs.id} className="glass group h-full overflow-hidden transition-all hover:border-primary/40 hover:-translate-y-0.5">
                      {cs.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img src={cs.image_url} alt={cs.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                          {cs.category && <Badge variant="secondary" className="absolute left-3 top-3 backdrop-blur-md">{cs.category}</Badge>}
                        </div>
                      )}
                      <CardContent className="p-6">
                        {!cs.image_url && cs.category && <Badge variant="secondary" className="mb-3">{cs.category}</Badge>}
                        <h3 className="font-display text-lg font-semibold">{cs.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('Client', 'Klien')}: {cs.client_name}</p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-destructive">{t('Challenge', 'Tantangan')}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{cs.challenge}</p>
                          </div>
                          <div>
                            <div className={`text-xs font-semibold ${TONE_TEXT[toneOf('discover')]}`}>{t('Solution', 'Solusi')}</div>
                            <p className="mt-1 text-sm text-muted-foreground">{cs.solution}</p>
                          </div>
                          <div className="rounded-lg bg-success/10 p-3">
                            <div className="text-xs font-semibold text-success">{t('Result', 'Hasil')}</div>
                            <p className="mt-1 text-sm font-medium text-success">{cs.result}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </LoadData>
            </TabsContent>

            <TabsContent value="member" className="mt-8">
              <LoadData
                hideIcon
                response={{
                  isLoading: fetchDiscussionsFeatured.isPending,
                  isEmpty: featured.length === 0,
                  emptyTitle: t('No member writing yet.', 'Belum ada tulisan member.'),
                  emptySubtitle: t(
                    'Threads worth keeping from Discussions, written up by the members who started them.',
                    'Utas yang layak disimpan dari Discussions, ditulis ulang oleh member yang memulainya.'
                  ),
                }}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {featured.map((d) => (
                    <Link key={d.id} href={`/discussions/${d.id}`}>
                      <Card className="glass group h-full transition-all hover:border-primary/40 hover:-translate-y-0.5">
                        <CardContent className="p-6">
                          <div className={`text-xs font-semibold ${TONE_TEXT[toneOf('discover')]}`}>
                            {t('Member writing', 'Tulisan Member')}
                          </div>
                          <h3 className="mt-2 font-display text-lg font-semibold">{d.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{d.profiles?.full_name ?? t('Anonymous', 'Anonim')}</p>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground text-pretty">{d.body}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </LoadData>
            </TabsContent>
          </Tabs>
      </div>
    </AppShell>
  );
}
