export interface DataCourses {
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

export interface DataCoursesMaterial {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
}

export interface DataCoursesQuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
}

export interface DataCoursesQuiz {
  id: string;
  title: string;
  passing_grade: number;
  quiz_questions: DataCoursesQuizQuestion[];
}

export interface DataCoursesModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
  course_materials?: DataCoursesMaterial[];
  quizzes?: DataCoursesQuiz[];
}

export interface DataCoursesDetail {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  price: number;
  coach_id: string;
  profiles: { full_name: string | null } | null;
}

export interface DataCoursesEnrollment {
  id: string;
  progress: number;
  payment_status: string;
}

export interface PayloadPostCoursesEnrollment {
  course_id: string;
  user_id: string;
}

export interface PayloadPostCoursesCertificate {
  course_id: string;
  user_id: string;
}

export interface Courses {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataCourses[] | null;
}

export interface CoursesDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataCoursesDetail | null;
}

export interface DataCoursesModuleCompletion {
  id: string;
  module_id: string;
}

export interface DataCoursesQuizSubmission {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
}

export interface PayloadPostCoursesModuleCompletion {
  enrollment_id: string;
  module_id: string;
  user_id: string;
}

export interface PayloadPostCoursesQuizSubmission {
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
}

export interface DataCoursesEnrolled {
  id: string;
  progress: number;
  payment_status: string;
  courses: DataCoursesDetail | null;
}
