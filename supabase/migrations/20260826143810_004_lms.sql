/*
# LMS: Courses, Modules, Quizzes, Enrollments, Certificates

1. New Tables
- `courses` — created by approved coaches (title, description, level, price)
- `course_modules` — modules within a course, ordered, with is_free flag
- `course_materials` — materials within modules (video/text/file URLs)
- `quizzes` — quizzes attached to modules with passing grade
- `quiz_questions` — individual questions for quizzes
- `enrollments` — member enrollment in courses with progress tracking
- `certificates` — auto-issued certificates on course completion

2. Security
- courses: any authenticated user can SELECT; coach owner can INSERT/UPDATE/DELETE own courses.
- course_modules: any authenticated user can SELECT; course owner can manage own course's modules.
- course_materials: any authenticated user can SELECT; course owner can manage.
- quizzes: any authenticated user can SELECT; course owner can manage.
- quiz_questions: any authenticated user can SELECT; course owner can manage.
- enrollments: user can SELECT own; user can INSERT own; user can UPDATE own progress.
- certificates: any authenticated user can SELECT (public credentials); user can INSERT own.
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  category text,
  price integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_courses" ON courses;
CREATE POLICY "select_courses" ON courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_courses" ON courses;
CREATE POLICY "insert_own_courses" ON courses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "update_own_courses" ON courses;
CREATE POLICY "update_own_courses" ON courses FOR UPDATE
  TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "delete_own_courses" ON courses;
CREATE POLICY "delete_own_courses" ON courses FOR DELETE
  TO authenticated USING (auth.uid() = coach_id);

-- COURSE MODULES
CREATE TABLE IF NOT EXISTS course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_course_modules" ON course_modules;
CREATE POLICY "select_course_modules" ON course_modules FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_course_modules" ON course_modules;
CREATE POLICY "insert_own_course_modules" ON course_modules FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_course_modules" ON course_modules;
CREATE POLICY "update_own_course_modules" ON course_modules FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND coach_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_course_modules" ON course_modules;
CREATE POLICY "delete_own_course_modules" ON course_modules FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND coach_id = auth.uid())
  );

-- COURSE MATERIALS
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video','text','file')),
  content_url text,
  text_content text
);
ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_course_materials" ON course_materials;
CREATE POLICY "select_course_materials" ON course_materials FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_course_materials" ON course_materials;
CREATE POLICY "insert_own_course_materials" ON course_materials FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_course_materials" ON course_materials;
CREATE POLICY "update_own_course_materials" ON course_materials FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_course_materials" ON course_materials;
CREATE POLICY "delete_own_course_materials" ON course_materials FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  );

-- QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_grade integer NOT NULL DEFAULT 70
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quizzes" ON quizzes;
CREATE POLICY "select_quizzes" ON quizzes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_quizzes" ON quizzes;
CREATE POLICY "insert_own_quizzes" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_quizzes" ON quizzes;
CREATE POLICY "update_own_quizzes" ON quizzes FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_quizzes" ON quizzes;
CREATE POLICY "delete_own_quizzes" ON quizzes FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_id AND c.coach_id = auth.uid()
    )
  );

-- QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text,
  option_d text,
  correct_answer text NOT NULL CHECK (correct_answer IN ('a','b','c','d'))
);
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_quiz_questions" ON quiz_questions;
CREATE POLICY "select_quiz_questions" ON quiz_questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_quiz_questions" ON quiz_questions;
CREATE POLICY "insert_own_quiz_questions" ON quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN course_modules cm ON cm.id = q.module_id
      JOIN courses c ON c.id = cm.course_id
      WHERE q.id = quiz_id AND c.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_quiz_questions" ON quiz_questions;
CREATE POLICY "delete_own_quiz_questions" ON quiz_questions FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN course_modules cm ON cm.id = q.module_id
      JOIN courses c ON c.id = cm.course_id
      WHERE q.id = quiz_id AND c.coach_id = auth.uid()
    )
  );

-- ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  progress integer NOT NULL DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_enrollments" ON enrollments;
CREATE POLICY "select_own_enrollments" ON enrollments FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM courses WHERE id = course_id AND coach_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_enrollments" ON enrollments;
CREATE POLICY "insert_own_enrollments" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_enrollments" ON enrollments;
CREATE POLICY "update_own_enrollments" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_certificates" ON certificates;
CREATE POLICY "select_certificates" ON certificates FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_courses_coach ON courses(coach_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
