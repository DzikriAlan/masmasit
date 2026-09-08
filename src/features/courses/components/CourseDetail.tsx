'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, GraduationCap, Lock, Play, CheckCircle2,
  FileText, Video, Award, Type, HelpCircle, ChevronDown, ChevronRight,
  ExternalLink, Check, X, Circle
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { API_ERROR_CODE } from '@/shared/lib/apiResponse';
import type {
  DataCoursesMaterial as Material,
  DataCoursesQuizQuestion as QuizQuestion,
  DataCoursesQuiz as Quiz,
  DataCoursesModule as Module,
} from '@/features/courses/types/coursesTypes';
import { useCoursesDetailControllers } from '@/features/courses/controllers/coursesControllers';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PaymentCard } from '@/features/payments/components/PaymentCard';

const courseCoverImages: Record<string, string> = {
  'Software Engineering': 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  'Data & AI': 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  'Product Management': 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  'UI/UX & Creative': 'https://images.pexels.com/photos/1966452/pexels-photo-1966452.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  'DevOps & Infrastructure': 'https://images.pexels.com/photos/10727821/pexels-photo-10727821.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  'Cybersecurity': 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
  default: 'https://images.pexels.com/photos/5905717/pexels-photo-5905717.jpeg?auto=compress&cs=tinysrgb&h=300&w=800',
};
const getCourseCoverImage = (cat: string) => courseCoverImages[cat] ?? courseCoverImages.default;

export default function CourseDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [localQuizResults, setLocalQuizResults] = useState<Record<string, { score: number; passed: boolean }>>({});
  const [retakingQuizIds, setRetakingQuizIds] = useState<Set<string>>(new Set());

  const {
    fetchCoursesDetail,
    fetchCoursesModules,
    fetchCoursesEnrollment,
    fetchCoursesCertificate,
    fetchCoursesSettings,
    storeCoursesEnrollment,
    changeCoursesEnrollmentProgress,
    storeCoursesCertificate,
    fetchCoursesModuleCompletions,
    fetchCoursesQuizSubmissions,
    storeCoursesModuleCompletion,
    storeCoursesQuizSubmission,
  } = useCoursesDetailControllers(params.id as string, user?.id);

  const course = fetchCoursesDetail.data ?? null;
  const modules: Module[] = fetchCoursesModules.data ?? [];
  const loading = fetchCoursesDetail.isPending;
  const enrolling = storeCoursesEnrollment.isPending;
  const enrollment = fetchCoursesEnrollment.data ?? null;
  const enrolled = Boolean(enrollment) || storeCoursesEnrollment.isSuccess;
  const enrollmentId = enrollment?.id ?? storeCoursesEnrollment.data?.id ?? null;
  const progress = enrollment?.progress ?? 0;
  const paymentStatus = enrollment?.payment_status ?? 'unpaid';
  const hasCertificate = Boolean(fetchCoursesCertificate.data) || storeCoursesCertificate.isSuccess;
  const lynkidCoursesUrl = fetchCoursesSettings.data ?? null;
  const submittingQuiz = storeCoursesQuizSubmission.isPending;

  // Completions and quiz scores are persisted, so a refresh keeps them.
  const completedModules = new Set((fetchCoursesModuleCompletions.data ?? []).map((c) => c.module_id));

  const buildQuizResults = () => {
    const stored: Record<string, { score: number; passed: boolean }> = {};
    (fetchCoursesQuizSubmissions.data ?? []).forEach((sub) => {
      const current = stored[sub.quiz_id];
      if (!current || sub.score > current.score) {
        stored[sub.quiz_id] = { score: sub.score, passed: sub.passed };
      }
    });
    return { ...stored, ...localQuizResults };
  };

  const storedQuizResults = buildQuizResults();

  // A quiz being retaken hides its previous score until the new one is in.
  const quizResults = Object.fromEntries(
    Object.entries(storedQuizResults).filter(([quizId]) => !retakingQuizIds.has(quizId))
  );

  // A certificate is only earned once every quiz in the course has been passed.
  const allQuizIds = modules.flatMap((m) => (m.quizzes ?? []).map((q) => q.id));
  const hasPassedEveryQuiz = allQuizIds.every((id) => quizResults[id]?.passed);

  const modifyPaymentStatus = () => {
    fetchCoursesEnrollment.refetch();
  };

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const saveEnrollment = async () => {
    if (!user || !course) { router.push('/login'); return; }
    try {
      await storeCoursesEnrollment.mutateAsync({ course_id: course.id, user_id: user.id });
    } catch (error) {
      const code = error instanceof Error ? error.name : '';
      toast.error(
        code === API_ERROR_CODE.CONFLICT
          ? t('Already enrolled', 'Sudah terdaftar')
          : t('Failed to enroll', 'Gagal mendaftar')
      );
      return;
    }
    toast.success(t('Enrolled! Start learning.', 'Terdaftar! Mulai belajar.'));
  };

  const saveModuleComplete = async (moduleId: string) => {
    if (!user || !enrollmentId || !course) return;
    if (completedModules.has(moduleId)) return;

    try {
      await storeCoursesModuleCompletion.mutateAsync({
        enrollment_id: enrollmentId,
        module_id: moduleId,
        user_id: user.id,
      });
    } catch (error) {
      // A repeat completion is harmless; anything else is worth surfacing.
      const code = error instanceof Error ? error.name : '';
      if (code !== API_ERROR_CODE.CONFLICT) {
        toast.error(t('Failed to save progress', 'Gagal menyimpan progres'));
        return;
      }
    }

    const totalModules = modules.length || 1;
    const newProgress = Math.round(((completedModules.size + 1) / totalModules) * 100);
    await changeCoursesEnrollmentProgress.mutateAsync({ enrollmentId, progress: newProgress });

    if (newProgress >= 100 && hasPassedEveryQuiz && !hasCertificate) {
      await storeCoursesCertificate.mutateAsync({ course_id: course.id, user_id: user.id });
      toast.success(t('Course completed! Certificate issued.', 'Kursus selesai! Sertifikat diterbitkan.'));
    }
  };

  const modifyQuizRetake = (quiz: Quiz) => {
    setRetakingQuizIds((prev) => new Set(prev).add(quiz.id));
    setLocalQuizResults((prev) => {
      const next = { ...prev };
      delete next[quiz.id];
      return next;
    });
    setQuizAnswers((prev) => {
      const next = { ...prev };
      quiz.quiz_questions.forEach((q) => delete next[q.id]);
      return next;
    });
  };

  const saveQuiz = async (quiz: Quiz) => {
    if (!user) { router.push('/login'); return; }

    const total = quiz.quiz_questions.length || 1;
    const correct = quiz.quiz_questions.filter((q) => quizAnswers[q.id] === q.correct_answer).length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= quiz.passing_grade;

    const answers: Record<string, string> = {};
    quiz.quiz_questions.forEach((q) => {
      if (quizAnswers[q.id]) answers[q.id] = quizAnswers[q.id];
    });

    try {
      await storeCoursesQuizSubmission.mutateAsync({
        quiz_id: quiz.id,
        user_id: user.id,
        score,
        passed,
        answers,
      });
    } catch {
      toast.error(t('Failed to submit quiz', 'Gagal mengirim kuis'));
      return;
    }

    setLocalQuizResults({ ...localQuizResults, [quiz.id]: { score, passed } });
    setRetakingQuizIds((prev) => {
      const next = new Set(prev);
      next.delete(quiz.id);
      return next;
    });

    if (passed) {
      toast.success(t('Quiz passed!', 'Kuis lulus!') + ` ${score}%`);
      const moduleId = modules.find((m) => m.quizzes?.some((q) => q.id === quiz.id))?.id;
      if (moduleId) await saveModuleComplete(moduleId);
    } else {
      toast.error(t('Quiz not passed.', 'Kuis tidak lulus.') + ` ${score}% (need ${quiz.passing_grade}%)`);
    }
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  if (!course) return <AppShell><div className="py-20 text-center text-muted-foreground">{t('Course not found.', 'Kursus tidak ditemukan.')}</div></AppShell>;

  const isCoach = user?.id === course.coach_id;
  const canAccess = (enrolled && (course.price === 0 || paymentStatus === 'paid')) || isCoach;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 gap-2"><ArrowLeft className="h-4 w-4" /> {t('Back', 'Kembali')}</Button>

        <Card className="glass mb-6 overflow-hidden">
          {course.category && (
            <div className="relative h-40 overflow-hidden">
              <img src={getCourseCoverImage(course.category)} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            </div>
          )}
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{course.level}</Badge>
              {course.category && <Badge variant="outline">{course.category}</Badge>}
              {course.price === 0 ? <Badge variant="default" className="gap-1"><GraduationCap className="h-3 w-3" /> {t('Free', 'Gratis')}</Badge> : <Badge variant="outline">Rp {(course.price / 1000).toFixed(0)}K</Badge>}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold">{course.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('by', 'oleh')} {course.profiles?.full_name ?? t('Coach', 'Pelatih')}</p>
            <p className="mt-4 text-sm leading-relaxed">{course.description}</p>

            {enrolled && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('Progress', 'Progres')}: {progress}%</span>
                  {hasCertificate && <Badge variant="default" className="gap-1"><Award className="h-3 w-3" /> {t('Certified', 'Tersertifikasi')}</Badge>}
                </div>
                <Progress value={progress} className="mt-2" />
              </div>
            )}

            {!isCoach && (
              enrolled ? (
                course.price > 0 && paymentStatus !== 'paid' ? (
                  <div className="mt-4">
                    <PaymentCard
                      table="enrollments"
                      recordId={enrollmentId!}
                      itemName={t('Course Enrollment', 'Pendaftaran Kursus')}
                      amount={course.price}
                      paymentStatus={paymentStatus}
                      paymentLinkUrl={null}
                      paymentNote={null}
                      fallbackUrl={lynkidCoursesUrl}
                      onStatusChange={modifyPaymentStatus}
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" /><span className="font-medium">{t('Enrolled', 'Terdaftar')}</span>
                  </div>
                )
              ) : (
                <Button onClick={saveEnrollment} disabled={enrolling} className="mt-4 gap-2">
                  {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {course.price === 0 ? t('Enroll for Free', 'Daftar Gratis') : `${t('Enroll', 'Daftar')} — Rp ${(course.price / 1000).toFixed(0)}K`}
                </Button>
              )
            )}
          </CardContent>
        </Card>

        <h2 className="mb-4 font-display text-xl font-semibold">{t('Course Modules', 'Modul Kursus')}</h2>
        {modules.length === 0 ? (
          <Card className="glass"><CardContent className="p-8 text-center text-muted-foreground">{t('No modules yet.', 'Belum ada modul.')}</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {modules.map((mod, i) => {
              const moduleAccess = canAccess || mod.is_free;
              const isExpanded = expandedModules.has(mod.id);
              const isComplete = completedModules.has(mod.id);
              return (
                <Card key={mod.id} className="glass">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button onClick={() => toggleModule(mod.id)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                          {isComplete ? <CheckCircle2 className="h-5 w-5 text-success" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mod.title}</h3>
                            {mod.is_free ? <Badge variant="secondary" className="text-xs">{t('Free', 'Gratis')}</Badge> : <Badge variant="outline" className="gap-1 text-xs"><Lock className="h-3 w-3" /> {t('Premium', 'Premium')}</Badge>}
                          </div>
                          {mod.description && <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>}
                        </div>
                      </div>
                      {!canAccess && !enrolled && !mod.is_free && (
                        <Button size="sm" variant="outline" onClick={saveEnrollment}>{t('Enroll to Access', 'Daftar untuk Akses')}</Button>
                      )}
                    </div>

                    {isExpanded && moduleAccess && (
                      <div className="mt-4 ml-12 space-y-4 border-l border-border/40 pl-4">
                        {/* Materials */}
                        {mod.course_materials && mod.course_materials.length > 0 && (
                          <div className="space-y-2">
                            {mod.course_materials.map((mat) => {
                              const isActive = activeMaterial === mat.id;
                              return (
                                <div key={mat.id} className="rounded-lg border border-border/40">
                                  <button
                                    onClick={() => setActiveMaterial(isActive ? null : mat.id)}
                                    className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
                                  >
                                    {mat.content_type === 'video' ? <Video className="h-4 w-4 text-primary" /> : mat.content_type === 'file' ? <FileText className="h-4 w-4 text-primary" /> : <Type className="h-4 w-4 text-primary" />}
                                    <span className="text-sm font-medium flex-1">{mat.title}</span>
                                    {isActive ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  </button>
                                  {isActive && (
                                    <div className="border-t border-border/40 p-4">
                                      {mat.content_type === 'video' && mat.content_url ? (
                                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                                          {mat.content_url.includes('youtube.com') || mat.content_url.includes('youtu.be') ? (
                                            <iframe
                                              src={mat.content_url.includes('youtu.be')
                                                ? mat.content_url.replace('youtu.be/', 'youtube.com/embed/')
                                                : mat.content_url.replace('watch?v=', 'embed/')}
                                              className="h-full w-full"
                                              allowFullScreen
                                              title={mat.title}
                                            />
                                          ) : (
                                            <video src={mat.content_url} controls className="h-full w-full">
                                              <source src={mat.content_url} />
                                            </video>
                                          )}
                                        </div>
                                      ) : mat.content_type === 'file' && mat.content_url ? (
                                        <a href={mat.content_url} target="_blank" rel="noreferrer">
                                          <Button variant="outline" size="sm" className="gap-2">
                                            <ExternalLink className="h-3.5 w-3.5" /> {t('Open File', 'Buka File')}
                                          </Button>
                                        </a>
                                      ) : mat.content_type === 'text' ? (
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                          {mat.text_content || t('No content available.', 'Tidak ada konten.')}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">{t('No content available.', 'Tidak ada konten.')}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Quizzes */}
                        {mod.quizzes && mod.quizzes.length > 0 && (
                          <div className="space-y-2">
                            {mod.quizzes.map((qz) => {
                              const isActive = activeQuiz === qz.id;
                              const result = quizResults[qz.id];
                              return (
                                <div key={qz.id} className="rounded-lg border border-border/40">
                                  <button
                                    onClick={() => setActiveQuiz(isActive ? null : qz.id)}
                                    className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/30 transition-colors"
                                  >
                                    <HelpCircle className="h-4 w-4 text-amber-400" />
                                    <span className="text-sm font-medium flex-1">{qz.title}</span>
                                    <Badge variant="outline" className="text-xs">{t('Pass', 'Lulus')}: {qz.passing_grade}%</Badge>
                                    {result && (
                                      <Badge variant={result.passed ? 'default' : 'secondary'} className="text-xs gap-1">
                                        {result.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                        {result.score}%
                                      </Badge>
                                    )}
                                    {isActive ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                  </button>
                                  {isActive && (
                                    <div className="border-t border-border/40 p-4 space-y-4">
                                      {result ? (
                                        <div className="text-center py-4">
                                          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${result.passed ? 'bg-success/10' : 'bg-destructive/10'}`}>
                                            {result.passed ? <CheckCircle2 className="h-6 w-6 text-success" /> : <X className="h-6 w-6 text-destructive" />}
                                          </div>
                                          <p className="font-semibold">{t('Score', 'Nilai')}: {result.score}%</p>
                                          <p className="text-sm text-muted-foreground">{result.passed ? t('Passed!', 'Lulus!') : `${t('Need', 'Butuh')} ${qz.passing_grade}% ${t('to pass', 'untuk lulus')}`}</p>
                                          <Button variant="outline" size="sm" className="mt-3" onClick={() => modifyQuizRetake(qz)}>
                                            {t('Retake Quiz', 'Ulangi Kuis')}
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          {qz.quiz_questions.map((qq, qi) => (
                                            <div key={qq.id} className="space-y-2">
                                              <p className="text-sm font-medium">{qi + 1}. {qq.question}</p>
                                              <RadioGroup
                                                value={quizAnswers[qq.id] ?? ''}
                                                onValueChange={(v) => setQuizAnswers({ ...quizAnswers, [qq.id]: v })}
                                              >
                                                {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                                                  const val = qq[`option_${opt}` as keyof QuizQuestion];
                                                  if (!val) return null;
                                                  return (
                                                    <div key={opt} className="flex items-center gap-2 rounded-lg border border-border/40 p-2 hover:bg-muted/30 transition-colors">
                                                      <RadioGroupItem id={`${qq.id}-${opt}`} value={opt} />
                                                      <Label htmlFor={`${qq.id}-${opt}`} className="text-sm font-normal cursor-pointer">{val}</Label>
                                                    </div>
                                                  );
                                                })}
                                              </RadioGroup>
                                            </div>
                                          ))}
                                          <Button
                                            onClick={() => saveQuiz(qz)}
                                            disabled={submittingQuiz || qz.quiz_questions.some((q) => !quizAnswers[q.id])}
                                            className="w-full gap-2"
                                          >
                                            {submittingQuiz && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {t('Submit Quiz', 'Kirim Kuis')}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Mark complete button */}
                        {enrolled && !isComplete && (
                          <Button variant="outline" size="sm" onClick={() => saveModuleComplete(mod.id)} className="gap-2">
                            <Circle className="h-3.5 w-3.5" /> {t('Mark as Complete', 'Tandai Selesai')}
                          </Button>
                        )}
                        {isComplete && (
                          <div className="flex items-center gap-2 text-sm text-success">
                            <CheckCircle2 className="h-4 w-4" /> {t('Module completed', 'Modul selesai')}
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && !moduleAccess && (
                      <div className="mt-4 ml-12 flex items-center gap-2 border-l border-border/40 pl-4 text-sm text-muted-foreground">
                        <Lock className="h-4 w-4" /> {t('Enroll to access this module\'s content.', 'Daftar untuk mengakses konten modul ini.')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {enrolled && progress >= 100 && (
          <Card className="glass mt-6">
            <CardContent className="p-6 text-center">
              <Award className="mx-auto mb-3 h-10 w-10 text-amber-400" />
              <h3 className="font-display text-lg font-bold">{t('Course Completed!', 'Kursus Selesai!')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('Your certificate has been issued automatically.', 'Sertifikat Anda telah diterbitkan otomatis.')}</p>
            </CardContent>
          </Card>
        )}

        {enrolled && progress < 100 && (
          <Card className="glass mt-6">
            <CardContent className="p-6 text-center">
              <Award className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <p className="text-sm text-muted-foreground">{t('Complete all modules to earn your certificate automatically.', 'Selesaikan semua modul untuk mendapatkan sertifikat otomatis.')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
