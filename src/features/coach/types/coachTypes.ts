export interface DataCoachMaterial {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
}

export interface DataCoachQuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
}

export interface DataCoachQuiz {
  id: string;
  title: string;
  passing_grade: number;
  quiz_questions: DataCoachQuizQuestion[];
}

export interface DataCoachModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
  course_materials?: DataCoachMaterial[];
  quizzes?: DataCoachQuiz[];
}

export interface DataCoachCourses {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  price: number;
  enrollments?: { id: string }[];
  course_modules?: DataCoachModule[];
}

export interface PayloadPostCoachCourses {
  coach_id: string;
  title: string;
  description: string;
  level: string;
  category: string | null;
  price: number;
}

export interface PayloadPostCoachModules {
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
}

export interface PayloadPostCoachMaterials {
  module_id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  text_content: string | null;
}

export interface PayloadPostCoachQuizzes {
  module_id: string;
  title: string;
  passing_grade: number;
}

export interface PayloadPostCoachQuizQuestions {
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
}

export interface Coach {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataCoachCourses[] | null;
}
