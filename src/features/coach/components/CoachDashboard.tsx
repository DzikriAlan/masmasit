'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Loader2, Plus, BookOpen, Users, Award, Send,
  ChevronDown, ChevronRight, Trash2, Video, FileText, Type,
  HelpCircle, Check, X, ArrowLeft, Layers
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import type {
  DataCoachMaterial as Material,
  DataCoachQuizQuestion as QuizQuestion,
  DataCoachQuiz as Quiz,
  DataCoachModule as Module,
  DataCoachCourses as CourseWithDetails,
  PayloadPostCoachQuizQuestions,
} from '@/features/coach/types/coachTypes';
import { useCoachControllers } from '@/features/coach/controllers/coachControllers';

export default function CoachDashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ title: '', description: '', level: 'beginner', category: '', price: '0' });

  // Module form
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', is_free: true });

  // Material form
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [materialModuleId, setMaterialModuleId] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState({ title: '', content_type: 'text', content_url: '', text_content: '' });

  // Quiz form
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizModuleId, setQuizModuleId] = useState<string | null>(null);
  const [quizForm, setQuizForm] = useState({ title: '', passing_grade: '70' });

  // Question form
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [questionQuizId, setQuestionQuizId] = useState<string | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const {
    fetchCoachCourses,
    changeCoachApplication,
    storeCoachCourses,
    storeCoachModules,
    removeCoachModules,
    storeCoachMaterials,
    removeCoachMaterials,
    storeCoachQuizzes,
    removeCoachQuizzes,
    storeCoachQuizQuestions,
    removeCoachQuizQuestions,
  } = useCoachControllers(user?.id);

  const sortCourseModules = (list: CourseWithDetails[]) =>
    list.map((c) => ({
      ...c,
      course_modules: c.course_modules
        ? [...c.course_modules].sort((a, b) => a.order_index - b.order_index)
        : c.course_modules,
    }));

  const courses = sortCourseModules(fetchCoachCourses.data ?? []);
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const saving = changeCoachApplication.isPending || storeCoachCourses.isPending;
  const savingModule = storeCoachModules.isPending;
  const savingMaterial = storeCoachMaterials.isPending;
  const savingQuiz = storeCoachQuizzes.isPending;
  const savingQuestion = storeCoachQuizQuestions.isPending;

  const saveCoachApplication = async () => {
    if (!user) return;
    await changeCoachApplication.mutateAsync();
    toast.success(t('Coach application submitted! Awaiting admin approval.', 'Pendaftaran coach terkirim! Menunggu approval admin.'));
    refreshProfile();
  };

  const saveCourse = async () => {
    if (!user) return;
    try {
      await storeCoachCourses.mutateAsync({
        coach_id: user.id,
        title: form.title,
        description: form.description,
        level: form.level,
        category: form.category || null,
        price: parseInt(form.price) || 0,
      });
    } catch {
      toast.error(t('Failed to create course', 'Gagal membuat kursus'));
      return;
    }
    toast.success(t('Course created!', 'Kursus dibuat!'));
    setShowCreate(false);
    setForm({ title: '', description: '', level: 'beginner', category: '', price: '0' });
  };

  const toggleModule = (id: string) => {
    const next = new Set(expandedModules);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedModules(next);
  };

  const saveModule = async () => {
    if (!selectedCourse || !moduleForm.title) return;
    try {
      await storeCoachModules.mutateAsync({
        course_id: selectedCourse.id,
        title: moduleForm.title,
        description: moduleForm.description || null,
        order_index: selectedCourse.course_modules?.length ?? 0,
        is_free: moduleForm.is_free,
      });
    } catch {
      toast.error(t('Failed to create module', 'Gagal membuat modul'));
      return;
    }
    toast.success(t('Module added!', 'Modul ditambahkan!'));
    setShowModuleDialog(false);
    setModuleForm({ title: '', description: '', is_free: true });
  };

  const destroyModule = async (moduleId: string) => {
    try {
      await removeCoachModules.mutateAsync(moduleId);
    } catch {
      toast.error('Failed to delete module');
      return;
    }
    toast.success('Module deleted');
  };

  const saveMaterial = async () => {
    if (!materialModuleId || !materialForm.title) return;
    try {
      await storeCoachMaterials.mutateAsync({
        module_id: materialModuleId,
        title: materialForm.title,
        content_type: materialForm.content_type,
        content_url: materialForm.content_url || null,
        text_content: materialForm.text_content || null,
      });
    } catch {
      toast.error(t('Failed to add material', 'Gagal menambahkan materi'));
      return;
    }
    toast.success(t('Material added!', 'Materi ditambahkan!'));
    setShowMaterialDialog(false);
    setMaterialForm({ title: '', content_type: 'text', content_url: '', text_content: '' });
  };

  const destroyMaterial = async (materialId: string) => {
    try {
      await removeCoachMaterials.mutateAsync(materialId);
    } catch {
      toast.error('Failed to delete material');
      return;
    }
    toast.success('Material deleted');
  };

  const saveQuiz = async () => {
    if (!quizModuleId || !quizForm.title) return;
    try {
      await storeCoachQuizzes.mutateAsync({
        module_id: quizModuleId,
        title: quizForm.title,
        passing_grade: parseInt(quizForm.passing_grade) || 70,
      });
    } catch {
      toast.error(t('Failed to create quiz', 'Gagal membuat kuis'));
      return;
    }
    toast.success(t('Quiz created!', 'Kuis dibuat!'));
    setShowQuizDialog(false);
    setQuizForm({ title: '', passing_grade: '70' });
  };

  const destroyQuiz = async (quizId: string) => {
    try {
      await removeCoachQuizzes.mutateAsync(quizId);
    } catch {
      toast.error('Failed to delete quiz');
      return;
    }
    toast.success('Quiz deleted');
  };

  const saveQuestion = async () => {
    if (!questionQuizId || !questionForm.question || !questionForm.option_a || !questionForm.option_b) return;
    const payload: PayloadPostCoachQuizQuestions = {
      quiz_id: questionQuizId,
      question: questionForm.question,
      option_a: questionForm.option_a,
      option_b: questionForm.option_b,
      correct_answer: questionForm.correct_answer,
    };
    if (questionForm.option_c) payload.option_c = questionForm.option_c;
    if (questionForm.option_d) payload.option_d = questionForm.option_d;
    try {
      await storeCoachQuizQuestions.mutateAsync(payload);
    } catch {
      toast.error('Failed to add question');
      return;
    }
    toast.success('Question added!');
    setShowQuestionDialog(false);
    setQuestionForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a' });
  };

  const destroyQuestion = async (questionId: string) => {
    try {
      await removeCoachQuizQuestions.mutateAsync(questionId);
    } catch {
      toast.error('Failed to delete question');
      return;
    }
    toast.success('Question deleted');
  };

  if (loading) return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;

  const coachApproved = profile?.coach_approved === 'approved';

  // --- Course Management View ---
  if (selectedCourse) {
    return (
      <AppShell>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => setSelectedCourseId(null)} className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" /> {t('Back to Courses', 'Kembali ke Kursus')}
          </Button>

          <Card className="glass mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-xs">{selectedCourse.level}</Badge>
                {selectedCourse.category && <Badge variant="outline" className="text-xs">{selectedCourse.category}</Badge>}
                {selectedCourse.price === 0 ? <Badge variant="default">Free</Badge> : <Badge variant="outline">Rp {(selectedCourse.price / 1000).toFixed(0)}K</Badge>}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold">{selectedCourse.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.enrollments?.length ?? 0} {t('enrolled', 'terdaftar')}</p>
            </CardContent>
          </Card>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> {t('Modules', 'Modul')}
            </h2>
            <Button onClick={() => setShowModuleDialog(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> {t('Add Module', 'Tambah Modul')}
            </Button>
          </div>

          {selectedCourse.course_modules?.length === 0 || !selectedCourse.course_modules ? (
            <Card className="glass"><CardContent className="p-8 text-center text-muted-foreground">
              No modules yet. Add your first module to start building course content.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {selectedCourse.course_modules.map((mod, i) => (
                <Card key={mod.id} className="glass">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <button onClick={() => toggleModule(mod.id)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                          {expandedModules.has(mod.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold">{i + 1}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mod.title}</h3>
                            {mod.is_free ? <Badge variant="secondary" className="text-xs">Free</Badge> : <Badge variant="outline" className="text-xs">Premium</Badge>}
                          </div>
                          {mod.description && <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => destroyModule(mod.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedModules.has(mod.id) && (
                      <div className="mt-4 ml-12 space-y-3 border-l border-border/40 pl-4">
                        {/* Materials */}
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-muted-foreground">{t('Materials', 'Materi')}</h4>
                            <Button size="sm" variant="outline" onClick={() => { setMaterialModuleId(mod.id); setShowMaterialDialog(true); }} className="gap-1 h-7 text-xs">
                              <Plus className="h-3 w-3" /> Add
                            </Button>
                          </div>
                          {mod.course_materials?.length === 0 || !mod.course_materials ? (
                            <p className="text-xs text-muted-foreground">{t('No materials yet.', 'Belum ada materi.')}</p>
                          ) : (
                            <div className="space-y-2">
                              {mod.course_materials.map((mat) => (
                                <div key={mat.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
                                  {mat.content_type === 'video' ? <Video className="h-4 w-4 text-primary" /> : mat.content_type === 'file' ? <FileText className="h-4 w-4 text-primary" /> : <Type className="h-4 w-4 text-primary" />}
                                  <span className="text-sm flex-1">{mat.title}</span>
                                  <Button size="sm" variant="ghost" onClick={() => destroyMaterial(mat.id)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Quizzes */}
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-muted-foreground">{t('Quizzes', 'Kuis')}</h4>
                            <Button size="sm" variant="outline" onClick={() => { setQuizModuleId(mod.id); setShowQuizDialog(true); }} className="gap-1 h-7 text-xs">
                              <Plus className="h-3 w-3" /> Add
                            </Button>
                          </div>
                          {mod.quizzes?.length === 0 || !mod.quizzes ? (
                            <p className="text-xs text-muted-foreground">{t('No quizzes yet.', 'Belum ada kuis.')}</p>
                          ) : (
                            <div className="space-y-2">
                              {mod.quizzes.map((qz) => (
                                <div key={qz.id} className="rounded-lg border border-border/40 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <HelpCircle className="h-4 w-4 text-amber-400" />
                                      <span className="text-sm font-medium">{qz.title}</span>
                                      <Badge variant="outline" className="text-xs">Pass: {qz.passing_grade}%</Badge>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => destroyQuiz(qz.id)} className="text-destructive hover:text-destructive h-7 w-7 p-0">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {qz.quiz_questions?.map((qq, qi) => (
                                      <div key={qq.id} className="flex items-start gap-2 rounded border border-border/30 p-2 text-xs">
                                        <span className="font-mono font-bold">{qi + 1}.</span>
                                        <span className="flex-1">{qq.question}</span>
                                        <Badge variant="secondary" className="text-xs">Ans: {qq.correct_answer.toUpperCase()}</Badge>
                                        <Button size="sm" variant="ghost" onClick={() => destroyQuestion(qq.id)} className="text-destructive hover:text-destructive h-5 w-5 p-0">
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                    {qz.quiz_questions?.length === 0 && <p className="text-xs text-muted-foreground">{t('No questions yet.', 'Belum ada pertanyaan.')}</p>}
                                  </div>
                                  <Button size="sm" variant="outline" onClick={() => { setQuestionQuizId(qz.id); setShowQuestionDialog(true); }} className="mt-2 gap-1 h-7 text-xs">
                                    <Plus className="h-3 w-3" /> Add Question
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Module Dialog */}
        <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Add Module', 'Tambah Modul')}</DialogTitle>
              <DialogDescription>{t('Create a new module for this course.', 'Buat modul baru untuk kursus ini.')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mtitle">{t('Module Title', 'Judul Modul')}</Label>
                <Input id="mtitle" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Introduction to React Hooks" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mdesc">{t('Description (optional)', 'Deskripsi (opsional)')}</Label>
                <Textarea id="mdesc" value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="What will this module cover?" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <span className="text-sm font-medium">{t('Free Preview', 'Preview Gratis')}</span>
                  <p className="text-xs text-muted-foreground">{t('Allow non-enrolled users to access this module', 'Izinkan pengguna yang belum terdaftar mengakses modul ini')}</p>
                </div>
                <Switch checked={moduleForm.is_free} onCheckedChange={(v) => setModuleForm({ ...moduleForm, is_free: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>{t('Cancel', 'Batal')}</Button>
              <Button onClick={saveModule} disabled={savingModule || !moduleForm.title} className="gap-2">
                {savingModule && <Loader2 className="h-4 w-4 animate-spin" />} {t('Add Module', 'Tambah Modul')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Material Dialog */}
        <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Add Material', 'Tambah Materi')}</DialogTitle>
              <DialogDescription>{t('Add learning content to this module.', 'Tambahkan konten pembelajaran ke modul ini.')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matTitle">{t('Title', 'Judul')}</Label>
                <Input id="matTitle" value={materialForm.title} onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })} placeholder="Lesson 1: useState Basics" />
              </div>
              <div className="space-y-2">
                <Label>{t('Content Type', 'Tipe Konten')}</Label>
                <Select value={materialForm.content_type} onValueChange={(v) => setMaterialForm({ ...materialForm, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t('Text', 'Teks')}</SelectItem>
                    <SelectItem value="video">{t('Video URL', 'URL Video')}</SelectItem>
                    <SelectItem value="file">{t('File URL', 'URL File')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {materialForm.content_type === 'text' ? (
                <div className="space-y-2">
                  <Label htmlFor="matText">{t('Text Content', 'Konten Teks')}</Label>
                  <Textarea id="matText" value={materialForm.text_content} onChange={(e) => setMaterialForm({ ...materialForm, text_content: e.target.value })} placeholder="Write your lesson content here..." rows={6} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="matUrl">{t('URL', 'URL')}</Label>
                  <Input id="matUrl" value={materialForm.content_url} onChange={(e) => setMaterialForm({ ...materialForm, content_url: e.target.value })} placeholder="https://..." />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMaterialDialog(false)}>{t('Cancel', 'Batal')}</Button>
              <Button onClick={saveMaterial} disabled={savingMaterial || !materialForm.title} className="gap-2">
                {savingMaterial && <Loader2 className="h-4 w-4 animate-spin" />} {t('Add Material', 'Tambah Materi')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quiz Dialog */}
        <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Create Quiz', 'Buat Kuis')}</DialogTitle>
              <DialogDescription>{t('Add a quiz to test student understanding.', 'Tambahkan kuis untuk menguji pemahaman siswa.')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qtitle">{t('Quiz Title', 'Judul Kuis')}</Label>
                <Input id="qtitle" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Module 1 Quiz" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qpass">{t('Passing Grade (%)', 'Nilai Lulus (%)')}</Label>
                <Input id="qpass" type="number" min="0" max="100" value={quizForm.passing_grade} onChange={(e) => setQuizForm({ ...quizForm, passing_grade: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuizDialog(false)}>{t('Cancel', 'Batal')}</Button>
              <Button onClick={saveQuiz} disabled={savingQuiz || !quizForm.title} className="gap-2">
                {savingQuiz && <Loader2 className="h-4 w-4 animate-spin" />} {t('Create Quiz', 'Buat Kuis')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('Add Question', 'Tambah Pertanyaan')}</DialogTitle>
              <DialogDescription>{t('Add a multiple-choice question to this quiz.', 'Tambahkan pertanyaan pilihan ganda ke kuis ini.')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qq">{t('Question', 'Pertanyaan')}</Label>
                <Textarea id="qq" value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} placeholder="What does useState return?" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="qa">{t('Option A', 'Pilihan A')}</Label>
                  <Input id="qa" value={questionForm.option_a} onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qb">{t('Option B', 'Pilihan B')}</Label>
                  <Input id="qb" value={questionForm.option_b} onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qc">{t('Option C (optional)', 'Pilihan C (opsional)')}</Label>
                  <Input id="qc" value={questionForm.option_c} onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qd">{t('Option D (optional)', 'Pilihan D (opsional)')}</Label>
                  <Input id="qd" value={questionForm.option_d} onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('Correct Answer', 'Jawaban Benar')}</Label>
                <Select value={questionForm.correct_answer} onValueChange={(v) => setQuestionForm({ ...questionForm, correct_answer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a">A</SelectItem>
                    <SelectItem value="b">B</SelectItem>
                    <SelectItem value="c">C</SelectItem>
                    <SelectItem value="d">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>{t('Cancel', 'Batal')}</Button>
              <Button onClick={saveQuestion} disabled={savingQuestion || !questionForm.question || !questionForm.option_a || !questionForm.option_b} className="gap-2">
                {savingQuestion && <Loader2 className="h-4 w-4 animate-spin" />} {t('Add Question', 'Tambah Pertanyaan')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppShell>
    );
  }

  // --- Main Coach Dashboard View ---
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" /> {t('Coach Dashboard', 'Dashboard Coach')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('Create courses, manage modules & quizzes, and track enrollments.', 'Buat kursus, kelola modul & kuis, dan lacak pendaftaran.')}</p>
        </div>

        {!profile?.is_coach ? (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h2 className="font-display text-xl font-bold">{t('Become a Coach', 'Jadilah Coach')}</h2>
              <p className="mt-2 text-muted-foreground">{t('Share your expertise with the community. Apply to become a coach — admin approval required.', 'Bagikan keahlian Anda dengan komunitas. Daftar sebagai coach — approval admin diperlukan.')}</p>
              <Button onClick={saveCoachApplication} disabled={saving} className="mt-4 gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} <Send className="h-4 w-4" /> {t('Apply Now', 'Daftar Sekarang')}
              </Button>
            </CardContent>
          </Card>
        ) : !coachApproved ? (
          <Card className="glass">
            <CardContent className="p-8 text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-400" />
              <h2 className="font-display text-xl font-bold">{t('Application Pending', 'Pendaftaran Menunggu')}</h2>
              <p className="mt-2 text-muted-foreground">{t('Your coach application is awaiting admin approval.', 'Pendaftaran coach Anda menunggu approval admin.')}</p>
              <Badge variant="secondary" className="mt-3">{t('Status: Pending', 'Status: Menunggu')}</Badge>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card className="glass"><CardContent className="p-5 flex items-center gap-4"><BookOpen className="h-8 w-8 text-primary" /><div><div className="text-2xl font-bold">{courses.length}</div><div className="text-xs text-muted-foreground">{t('Courses', 'Kursus')}</div></div></CardContent></Card>
              <Card className="glass"><CardContent className="p-5 flex items-center gap-4"><Users className="h-8 w-8 text-emerald-400" /><div><div className="text-2xl font-bold">{courses.reduce((sum, c) => sum + (c.enrollments?.length ?? 0), 0)}</div><div className="text-xs text-muted-foreground">{t('Total Enrollments', 'Total Pendaftaran')}</div></div></CardContent></Card>
              <Card className="glass"><CardContent className="p-5 flex items-center gap-4"><Award className="h-8 w-8 text-amber-400" /><div><div className="text-2xl font-bold">{t('Approved', 'Disetujui')}</div><div className="text-xs text-muted-foreground">{t('Coach Status', 'Status Coach')}</div></div></CardContent></Card>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">{t('My Courses', 'Kursus Saya')}</h2>
              <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> {t('New Course', 'Kursus Baru')}</Button>
            </div>

            {showCreate && (
              <Card className="glass mb-6">
                <CardHeader><CardTitle>{t('Create New Course', 'Buat Kursus Baru')}</CardTitle><CardDescription>{t('Students can enroll and access free modules immediately.', 'Siswa dapat mendaftar dan mengakses modul gratis segera.')}</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="ctitle">{t('Title', 'Judul')}</Label><Input id="ctitle" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Introduction to React" /></div>
                  <div className="space-y-2"><Label htmlFor="cdesc">{t('Description', 'Deskripsi')}</Label><Textarea id="cdesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will students learn?" /></div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>{t('Level', 'Level')}</Label>
                      <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="beginner">{t('Beginner', 'Pemula')}</SelectItem><SelectItem value="intermediate">{t('Intermediate', 'Menengah')}</SelectItem><SelectItem value="advanced">{t('Advanced', 'Mahir')}</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="ccat">{t('Category', 'Kategori')}</Label><Input id="ccat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Frontend" /></div>
                    <div className="space-y-2"><Label htmlFor="cprice">{t('Price (IDR, 0 = free)', 'Harga (IDR, 0 = gratis)')}</Label><Input id="cprice" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreate(false)}>{t('Cancel', 'Batal')}</Button>
                    <Button onClick={saveCourse} disabled={saving || !form.title || !form.description} className="gap-2">
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t('Create Course', 'Buat Kursus')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {courses.length === 0 ? (
              <Card className="glass"><CardContent className="p-8 text-center text-muted-foreground">{t('No courses yet. Create your first course!', 'Belum ada kursus. Buat kursus pertama Anda!')}</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {courses.map((c) => (
                  <Card key={c.id} className="glass group cursor-pointer transition-all hover:border-primary/40 hover:-translate-y-0.5" onClick={() => setSelectedCourseId(c.id)}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize text-xs">{c.level}</Badge>
                          {c.category && <Badge variant="outline" className="text-xs">{c.category}</Badge>}
                        </div>
                        <h3 className="mt-2 font-semibold">{c.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {c.enrollments?.length ?? 0} {t('enrolled', 'terdaftar')} • {c.course_modules?.length ?? 0} {t('modules', 'modul')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.price === 0 ? <Badge variant="default">{t('Free', 'Gratis')}</Badge> : <Badge variant="outline">Rp {(c.price / 1000).toFixed(0)}K</Badge>}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
