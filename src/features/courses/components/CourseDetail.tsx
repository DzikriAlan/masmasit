'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, GraduationCap, Lock, Play, CheckCircle2,
  FileText, Video, Award, Type, HelpCircle, ChevronDown, ChevronRight,
  ExternalLink, Check, X, Circle
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import type { Material, QuizQuestion, Quiz, Module, CourseDetail } from '@/features/courses/types/coursesTypes';
import {
  getCourseDetail,
  getCourseModules,
  getEnrollment,
  getCertificate,
  getCoursesSettings,
  postEnrollment,
  updateEnrollmentProgress,
  postCertificate,
} from '@/features/courses/services/coursesServices';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PaymentCard } from '@/components/payment-card';

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

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLang();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, { score: number; passed: boolean }>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [lynkidCoursesUrl, setLynkidCoursesUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const id = params.id as string;
      const { data: c } = await getCourseDetail(id);
      setCourse(c as CourseDetail | null);

      const { data: mods } = await getCourseModules(id);
      setModules((mods as Module[]) ?? []);

      if (user) {
        const { data: e } = await getEnrollment(id, user.id);
        if (e) {
          setEnrolled(true);
          setEnrollmentId(e.id);
          setProgress(e.progress);
          setPaymentStatus(e.payment_status);
        }

        const { data: cert } = await getCertificate(id, user.id);
        setHasCertificate(!!cert);
      }
      const { data: settings } = await getCoursesSettings();
      if (settings) setLynkidCoursesUrl(settings.lynkid_courses_url);
      setLoading(false);
    })();
  }, [params, user]);

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const handleEnroll = async () => {
    if (!user) { router.push('/login'); return; }
    setEnrolling(true);
    const { data, error } = await postEnrollment({
      course_id: course!.id,
      user_id: user.id,
    });
    setEnrolling(false);
    if (error) {
      toast.error(error.message.includes('duplicate') ? t('Already enrolled', 'Sudah terdaftar') : t('Failed to enroll', 'Gagal mendaftar'));
    } else {
      toast.success(t('Enrolled! Start learning.', 'Terdaftar! Mulai belajar.'));
      setEnrolled(true);
      setEnrollmentId(data.id);
      if (course!.price > 0) setPaymentStatus('unpaid');
    }
  };

  const markModuleComplete = useCallback(async (moduleId: string) => {
    if (!user || !enrollmentId) return;
    const next = new Set(completedModules);
    next.add(moduleId);
    setCompletedModules(next);

    const totalModules = modules.length || 1;
    const newProgress = Math.round((next.size / totalModules) * 100);
    setProgress(newProgress);
    await updateEnrollmentProgress(enrollmentId, newProgress);

    if (newProgress >= 100 && !hasCertificate) {
      await postCertificate({
        course_id: course!.id,
        user_id: user.id,
      });
      setHasCertificate(true);
      toast.success(t('Course completed! Certificate issued.', 'Kursus selesai! Sertifikat diterbitkan.'));
    }
  }, [user, enrollmentId, completedModules, modules.length, hasCertificate, course]);

  const submitQuiz = async (quiz: Quiz) => {
    setSubmittingQuiz(true);
    const total = quiz.quiz_questions.length;
    let correct = 0;
    quiz.quiz_questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct_answer) correct++;
    });
    const score = Math.round((correct / total) * 100);
    const passed = score >= quiz.passing_grade;
    setQuizResults({ ...quizResults, [quiz.id]: { score, passed } });
    setSubmittingQuiz(false);

    if (passed) {
      toast.success(t('Quiz passed!', 'Kuis lulus!') + ` ${score}%`);
      const moduleId = modules.find((m) => m.quizzes?.some((q) => q.id === quiz.id))?.id;
      if (moduleId) await markModuleComplete(moduleId);
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
                      onStatusChange={setPaymentStatus}
                    />
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" /><span className="font-medium">{t('Enrolled', 'Terdaftar')}</span>
                  </div>
                )
              ) : (
                <Button onClick={handleEnroll} disabled={enrolling} className="mt-4 gap-2">
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
                        <Button size="sm" variant="outline" onClick={handleEnroll}>{t('Enroll to Access', 'Daftar untuk Akses')}</Button>
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
                                          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuizResults((prev) => { const n = { ...prev }; delete n[qz.id]; return n; }); setQuizAnswers((prev) => { const n = { ...prev }; qz.quiz_questions.forEach((q) => delete n[q.id]); return n; }); }}>
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
                                            onClick={() => submitQuiz(qz)}
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
                          <Button variant="outline" size="sm" onClick={() => markModuleComplete(mod.id)} className="gap-2">
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
