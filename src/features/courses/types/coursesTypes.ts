export interface CourseWithCoach {
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

export interface Material {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
}

export interface Quiz {
  id: string;
  title: string;
  passing_grade: number;
  quiz_questions: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
  course_materials?: Material[];
  quizzes?: Quiz[];
}

export interface CourseDetail {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  price: number;
  coach_id: string;
  profiles: { full_name: string | null } | null;
}
