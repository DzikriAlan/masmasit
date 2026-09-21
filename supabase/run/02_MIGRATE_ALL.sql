-- =========================================================================
-- SCRIPT 2 dari 2 - MIGRATE PENUH 001 sampai 023
-- =========================================================================
-- Jalankan SETELAH 01_DELETE_ALL.sql.
--
-- Dibuat otomatis dari supabase/migrations/ dengan SEMUA komentar dibuang
-- dan tanpa karakter non-ASCII. Parser SQL editor Supabase tidak membuang
-- komentar sebelum melacak string, jadi apostrof di dalam komentar membalik
-- paritas kutip dan merusak sisa skrip. Jangan tambahkan komentar berisi
-- apostrof ke file ini, dan jangan pakai tombol Format.
--
-- Hasil: 40 tabel terisi semua, 30 akun demo dengan data merata,
-- tidak ada entitas tanpa anak, tidak ada nilai filter tanpa hasil,
-- foreign key ke profiles supaya embed PostgREST jalan, dan RPC
-- admin_user_activity() untuk tab User Activity.
--
-- Login demo, semua password Demo1234!
--   admin@demo.masmasit.online   super admin
--   rizky@demo.masmasit.online   member biasa
-- =========================================================================


-- [01/23] 20260826143705_001_core_profiles_skills.sql

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  location text,
  current_job_status text,
  linkedin_url text,
  whatsapp text,
  calendly_url text,
  is_coach boolean NOT NULL DEFAULT false,
  is_talent boolean NOT NULL DEFAULT false,
  coach_approved text NOT NULL DEFAULT 'pending',
  talent_approved text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('member','company','client','coach','talent','regional_admin','super_admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND role IN ('member','company','client','coach','talent'));

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_skills" ON skills;
CREATE POLICY "select_skills" ON skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_skills_admin" ON skills;
CREATE POLICY "insert_skills_admin" ON skills FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'intermediate' CHECK (level IN ('beginner','intermediate','advanced','expert')),
  UNIQUE (user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_user_skills" ON user_skills;
CREATE POLICY "select_user_skills" ON user_skills FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_user_skills" ON user_skills;
CREATE POLICY "insert_own_user_skills" ON user_skills FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_skills" ON user_skills;
CREATE POLICY "update_own_user_skills" ON user_skills FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_skills" ON user_skills;
CREATE POLICY "delete_own_user_skills" ON user_skills FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  description text
);
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_experiences" ON experiences;
CREATE POLICY "select_experiences" ON experiences FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_experiences" ON experiences;
CREATE POLICY "insert_own_experiences" ON experiences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_experiences" ON experiences;
CREATE POLICY "update_own_experiences" ON experiences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_experiences" ON experiences;
CREATE POLICY "delete_own_experiences" ON experiences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user ON experiences(user_id);

-- [02/23] 20260826143726_002_jobs_portal.sql

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  logo_url text,
  website text,
  location text,
  industry text,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_companies" ON companies;
CREATE POLICY "select_companies" ON companies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_company" ON companies;
CREATE POLICY "insert_own_company" ON companies FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_company" ON companies;
CREATE POLICY "update_own_company" ON companies FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_company_admin" ON companies;
CREATE POLICY "update_company_admin" ON companies FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  job_type text NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('full-time','part-time','contract','internship','remote')),
  salary_min integer,
  salary_max integer,
  deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jobs" ON jobs;
CREATE POLICY "select_jobs" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_jobs" ON jobs;
CREATE POLICY "insert_own_jobs" ON jobs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_jobs" ON jobs;
CREATE POLICY "update_own_jobs" ON jobs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_jobs" ON jobs;
CREATE POLICY "delete_own_jobs" ON jobs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM companies WHERE id = company_id AND user_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','accepted','rejected')),
  cover_letter text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, user_id)
);
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_job_applications" ON job_applications;
CREATE POLICY "select_job_applications" ON job_applications FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = job_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_application" ON job_applications;
CREATE POLICY "insert_own_application" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_application_status" ON job_applications;
CREATE POLICY "update_application_status" ON job_applications FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE j.id = job_id AND c.user_id = auth.uid()
    )
  ) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON job_applications(user_id);

-- [03/23] 20260826143746_003_projects_portal.sql

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  budget_min integer,
  budget_max integer,
  deadline date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_projects" ON projects;
CREATE POLICY "select_projects" ON projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  proposal text NOT NULL,
  eta_days integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE project_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_bids" ON project_bids;
CREATE POLICY "select_project_bids" ON project_bids FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_bid" ON project_bids;
CREATE POLICY "insert_own_bid" ON project_bids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_bid_owner" ON project_bids;
CREATE POLICY "update_bid_owner" ON project_bids FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_bid" ON project_bids;
CREATE POLICY "update_own_bid" ON project_bids FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, reviewer_id)
);
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_reviews" ON project_reviews;
CREATE POLICY "select_project_reviews" ON project_reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_review" ON project_reviews;
CREATE POLICY "insert_own_review" ON project_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "delete_own_review" ON project_reviews;
CREATE POLICY "delete_own_review" ON project_reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_bids_project ON project_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_project ON project_reviews(project_id);

-- [04/23] 20260826143810_004_lms.sql

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

-- [05/23] 20260826143827_005_events.sql

CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_regions" ON regions;
CREATE POLICY "select_regions" ON regions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_regions_admin" ON regions;
CREATE POLICY "insert_regions_admin" ON regions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_regions_admin" ON regions;
CREATE POLICY "update_regions_admin" ON regions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  event_type text NOT NULL DEFAULT 'meetup' CHECK (event_type IN ('meetup','workshop','conference','hackathon','webinar')),
  location text NOT NULL,
  event_date timestamptz NOT NULL,
  max_capacity integer NOT NULL DEFAULT 50,
  is_paid boolean NOT NULL DEFAULT false,
  price integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_events_admin" ON events;
CREATE POLICY "insert_events_admin" ON events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  );

DROP POLICY IF EXISTS "update_events_admin" ON events;
CREATE POLICY "update_events_admin" ON events FOR UPDATE
  TO authenticated USING (
    auth.uid() = (SELECT admin_user_id FROM regions WHERE id = region_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_events_admin" ON events;
CREATE POLICY "delete_events_admin" ON events FOR DELETE
  TO authenticated USING (
    auth.uid() = (SELECT admin_user_id FROM regions WHERE id = region_id)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','checked_in','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rsvps" ON event_rsvps;
CREATE POLICY "select_own_rsvps" ON event_rsvps FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  );

DROP POLICY IF EXISTS "insert_own_rsvp" ON event_rsvps;
CREATE POLICY "insert_own_rsvp" ON event_rsvps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_rsvp" ON event_rsvps;
CREATE POLICY "update_own_rsvp" ON event_rsvps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_rsvp_admin" ON event_rsvps;
CREATE POLICY "update_rsvp_admin" ON event_rsvps FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('regional_admin','super_admin'))
  ) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_events_region ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);

-- [06/23] 20260826143847_006_talent_agency.sql

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('consultation','mentoring')),
  scheduled_at timestamptz NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  amount integer NOT NULL DEFAULT 0,
  admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 15.00,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_bookings" ON bookings;
CREATE POLICY "select_bookings" ON bookings FOR SELECT
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "insert_own_booking" ON bookings;
CREATE POLICY "insert_own_booking" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "update_booking_talent" ON bookings;
CREATE POLICY "update_booking_talent" ON bookings FOR UPDATE
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS agency_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('SaaS','AI Solutions','Creative Services','HR Solutions')),
  title text NOT NULL,
  description text NOT NULL,
  base_price integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agency_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agency_services" ON agency_services;
CREATE POLICY "select_agency_services" ON agency_services FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_services_admin" ON agency_services;
CREATE POLICY "insert_services_admin" ON agency_services FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_services_admin" ON agency_services;
CREATE POLICY "update_services_admin" ON agency_services FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_services_admin" ON agency_services;
CREATE POLICY "delete_services_admin" ON agency_services FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS agency_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_company text,
  service_id uuid NOT NULL REFERENCES agency_services(id) ON DELETE RESTRICT,
  scope text NOT NULL,
  budget integer,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','in_review','approved','in_progress','completed','cancelled')),
  dp_amount integer,
  admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  revenue_share_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agency_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agency_projects" ON agency_projects;
CREATE POLICY "select_agency_projects" ON agency_projects FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_agency_projects" ON agency_projects;
CREATE POLICY "insert_agency_projects" ON agency_projects FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_agency_projects_admin" ON agency_projects;
CREATE POLICY "update_agency_projects_admin" ON agency_projects FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_name text NOT NULL,
  challenge text NOT NULL,
  solution text NOT NULL,
  result text NOT NULL,
  image_url text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_case_studies" ON case_studies;
CREATE POLICY "select_case_studies" ON case_studies FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_case_studies_admin" ON case_studies;
CREATE POLICY "insert_case_studies_admin" ON case_studies FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "update_case_studies_admin" ON case_studies;
CREATE POLICY "update_case_studies_admin" ON case_studies FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_case_studies_admin" ON case_studies;
CREATE POLICY "delete_case_studies_admin" ON case_studies FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 15.00,
  agency_admin_fee_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  agency_revenue_share_percentage numeric(5,2) NOT NULL DEFAULT 10.00,
  job_fee_active boolean NOT NULL DEFAULT false,
  project_fee_active boolean NOT NULL DEFAULT false,
  lms_fee_active boolean NOT NULL DEFAULT false,
  event_fee_active boolean NOT NULL DEFAULT false
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_app_settings" ON app_settings;
CREATE POLICY "select_app_settings" ON app_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_app_settings_admin" ON app_settings;
CREATE POLICY "update_app_settings_admin" ON app_settings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

INSERT INTO app_settings (id, talent_admin_fee_percentage, agency_admin_fee_percentage, agency_revenue_share_percentage)
SELECT gen_random_uuid(), 15.00, 10.00, 10.00
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

CREATE INDEX IF NOT EXISTS idx_bookings_talent ON bookings(talent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_agency_services_category ON agency_services(category);

-- [07/23] 20260828100507_007_messaging_and_skill_enhancements.sql.sql

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(sender_id, recipient_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_skills' AND column_name = 'years_experience') THEN
    ALTER TABLE user_skills ADD COLUMN years_experience integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_skills' AND column_name = 'verification_status') THEN
    ALTER TABLE user_skills ADD COLUMN verification_status text NOT NULL DEFAULT 'self_declared'
      CHECK (verification_status IN ('self_declared', 'peer_endorsed', 'coach_certified'));
  END IF;
END $$;

-- [08/23] 20260829112651_008_bookings_external_clients.sql.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_name') THEN
    ALTER TABLE bookings ADD COLUMN client_name text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_email') THEN
    ALTER TABLE bookings ADD COLUMN client_email text;
  END IF;
END $$;

ALTER TABLE bookings ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN client_id DROP DEFAULT;

DROP POLICY IF EXISTS "insert_own_booking" ON bookings;
CREATE POLICY "insert_own_booking" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (
    (auth.uid() = client_id) OR
    (client_id IS NULL AND client_name IS NOT NULL AND client_email IS NOT NULL)
  );

-- [09/23] 20260829122417_009_module_completions_quiz_submissions.sql

CREATE TABLE IF NOT EXISTS module_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(enrollment_id, module_id)
);

ALTER TABLE module_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_module_completions" ON module_completions;
CREATE POLICY "select_own_module_completions" ON module_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_module_completions" ON module_completions;
CREATE POLICY "insert_own_module_completions" ON module_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_module_completions" ON module_completions;
CREATE POLICY "update_own_module_completions" ON module_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_module_completions" ON module_completions;
CREATE POLICY "delete_own_module_completions" ON module_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "select_own_quiz_submissions" ON quiz_submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "insert_own_quiz_submissions" ON quiz_submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "update_own_quiz_submissions" ON quiz_submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quiz_submissions" ON quiz_submissions;
CREATE POLICY "delete_own_quiz_submissions" ON quiz_submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_module_completions_enrollment ON module_completions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id);

-- [10/23] 20260831032232_010_payment_redirect_storage.sql

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_bookings_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_bookings_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_agency_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_agency_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_courses_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_courses_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'lynkid_events_url') THEN
    ALTER TABLE app_settings ADD COLUMN lynkid_events_url text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_status') THEN
    ALTER TABLE bookings ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_link_url') THEN
    ALTER TABLE bookings ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_note') THEN
    ALTER TABLE bookings ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE bookings ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE bookings ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DROP POLICY IF EXISTS "update_booking_talent" ON bookings;
CREATE POLICY "update_booking_talent" ON bookings FOR UPDATE
  TO authenticated USING (
    auth.uid() = talent_id OR auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
  ) WITH CHECK (true);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_status') THEN
    ALTER TABLE enrollments ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_link_url') THEN
    ALTER TABLE enrollments ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_note') THEN
    ALTER TABLE enrollments ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE enrollments ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE enrollments ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_status') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_link_url') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_note') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_confirmed_at') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_rsvps' AND column_name = 'payment_confirmed_by') THEN
    ALTER TABLE event_rsvps ADD COLUMN payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_status') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_status text NOT NULL DEFAULT 'unpaid' CHECK (dp_payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_link_url') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_note') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_confirmed_at') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'dp_payment_confirmed_by') THEN
    ALTER TABLE agency_projects ADD COLUMN dp_payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_status') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_status text NOT NULL DEFAULT 'unpaid' CHECK (final_payment_status IN ('unpaid','awaiting_confirmation','paid'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_link_url') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_link_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_note') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_note text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_confirmed_at') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_confirmed_at timestamptz;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agency_projects' AND column_name = 'final_payment_confirmed_by') THEN
    ALTER TABLE agency_projects ADD COLUMN final_payment_confirmed_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('company-logos', 'company-logos', true),
  ('portfolios', 'portfolios', true),
  ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "company_logos_select_public" ON storage.objects;
CREATE POLICY "company_logos_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "company_logos_insert_own" ON storage.objects;
CREATE POLICY "company_logos_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "company_logos_update_own" ON storage.objects;
CREATE POLICY "company_logos_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolios_select_public" ON storage.objects;
CREATE POLICY "portfolios_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'portfolios');

DROP POLICY IF EXISTS "portfolios_insert_own" ON storage.objects;
CREATE POLICY "portfolios_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "portfolios_update_own" ON storage.objects;
CREATE POLICY "portfolios_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'portfolios' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "certificates_select_public" ON storage.objects;
CREATE POLICY "certificates_select_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "certificates_insert_own" ON storage.objects;
CREATE POLICY "certificates_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- [11/23] 20260831032723_011_notifications_triggers.sql

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION notify_user(target_uid uuid, n_type text, n_title text, n_body text, n_link text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (target_uid, n_type, n_title, n_body, n_link);
END;
$$;

CREATE OR REPLACE FUNCTION trg_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    PERFORM notify_user(NEW.receiver_id, 'message', 'New message', 'You have a new message', '/pesan');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_notify_message();

CREATE OR REPLACE FUNCTION trg_notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM notify_user(NEW.user_id, 'job_application', 'Application update', 'Your job application status: ' || NEW.status, '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_job_application_update ON job_applications;
CREATE TRIGGER on_job_application_update AFTER UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION trg_notify_job_application();

CREATE OR REPLACE FUNCTION trg_notify_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user(NEW.client_id, 'booking', 'Booking update', 'Your booking status: ' || NEW.status, '/dashboard');
    END IF;
    PERFORM notify_user(NEW.talent_id, 'booking', 'Booking update', 'Booking status: ' || NEW.status, '/dashboard');
  END IF;
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status AND NEW.payment_status = 'paid' THEN
    IF NEW.client_id IS NOT NULL THEN
      PERFORM notify_user(NEW.client_id, 'payment', 'Payment confirmed', 'Your payment has been confirmed', '/dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_update ON bookings;
CREATE TRIGGER on_booking_update AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trg_notify_booking();

-- [12/23] 20260831044155_012_allow_authenticated_insert_events.sql

DROP POLICY IF EXISTS "insert_events_admin" ON events;
DROP POLICY IF EXISTS "insert_events_authenticated" ON events;

CREATE POLICY "insert_events_authenticated"
ON events FOR INSERT
TO authenticated
WITH CHECK (true);

-- [13/23] 20260906130946_013_seed_lms_dummy_data.sql

INSERT INTO course_materials (module_id, title, content_type, text_content, content_url)
SELECT v.module_id, v.title, v.content_type, v.text_content, v.content_url
FROM (VALUES
('4bd17d5d-3b17-4732-8753-406013fa2156'::uuid, 'What is React?'::text, 'text'::text, 'React is a JavaScript library for building user interfaces. It uses a component-based architecture and a virtual DOM to efficiently update the UI. In this lesson we cover the core concepts: components, JSX, and the rendering lifecycle.', NULL),
('4bd17d5d-3b17-4732-8753-406013fa2156', 'Setting Up Your Environment', 'video', NULL, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
('9c9a84e0-e5df-46db-a5f0-351a8203b667', 'Components and Props Explained', 'text', 'Components are the building blocks of React. Props allow you to pass data from parent to child components. This lesson covers functional components, prop types, and how to compose components together.', NULL),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'Understanding useState', 'text', 'The useState hook lets you add state to functional components. You call it with an initial value and it returns an array with the current state and a setter function. This lesson covers common patterns and pitfalls.', NULL),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'useEffect Deep Dive', 'video', NULL, 'https://www.youtube.com/watch?v=0SJE6b8Z5g0'),
('a143534f-8b3a-4878-8478-11ea73715751', 'Next.js App Router Basics', 'text', 'Next.js provides file-based routing. The App Router uses the app/ directory to define routes. This lesson covers layout.tsx, page.tsx, and nested routing patterns.', NULL)
) AS v(module_id, title, content_type, text_content, content_url)
JOIN course_modules cm ON cm.id = v.module_id
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (module_id, title, passing_grade)
SELECT v.module_id, v.title, v.passing_grade
FROM (VALUES
('4bd17d5d-3b17-4732-8753-406013fa2156'::uuid, 'React Basics Quiz'::text, 70::integer),
('9c9a84e0-e5df-46db-a5f0-351a8203b667', 'Components Quiz', 70),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'Hooks Quiz', 70),
('a143534f-8b3a-4878-8478-11ea73715751', 'Routing Quiz', 70)
) AS v(module_id, title, passing_grade)
JOIN course_modules cm ON cm.id = v.module_id
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'What is React primarily used for?', 'Building user interfaces', 'Database management', 'Server configuration', 'File system operations', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'React Basics Quiz' AND cm.title = 'Introduction to React'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'What does JSX stand for?', 'JavaScript XML', 'Java Syntax Extension', 'JSON Extended', 'Just Standard XML', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'React Basics Quiz' AND cm.title = 'Introduction to React'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'How do you pass data from parent to child?', 'Via props', 'Via state', 'Via context only', 'Via localStorage', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'Components Quiz' AND cm.title = 'Components and Props'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'What does useState return?', 'An array with state and setter', 'A single value', 'A promise', 'An object only', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'Hooks Quiz' AND cm.title = 'State and Hooks'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'Which hook handles side effects?', 'useEffect', 'useState', 'useRef', 'useMemo', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'Hooks Quiz' AND cm.title = 'State and Hooks'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT q.id, 'Where does the App Router define routes?', 'In the app/ directory', 'In the pages/ directory', 'In the src/ directory', 'In the public/ directory', 'a'
FROM quizzes q JOIN course_modules cm ON q.module_id = cm.id
WHERE q.title = 'Routing Quiz' AND cm.title = 'Routing with Next.js'
ON CONFLICT DO NOTHING;

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', 'TypeScript Types', 'Understanding basic and advanced types in TypeScript', 0, true
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '84506f17-9da7-4efe-a2c5-1233f7349178')
  AND NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND title = 'TypeScript Types');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', 'Generics and Utility Types', 'Master generics, conditional types, and built-in utility types', 1, false
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '84506f17-9da7-4efe-a2c5-1233f7349178')
  AND NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND title = 'Generics and Utility Types');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '00ad5f2f-70dc-4e00-9df4-efb144f600d6', 'Express.js Fundamentals', 'Building REST APIs with Express', 0, true
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6')
  AND NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6' AND title = 'Express.js Fundamentals');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '00ad5f2f-70dc-4e00-9df4-efb144f600d6', 'Database Integration', 'Connecting Node.js to PostgreSQL', 1, false
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6')
  AND NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6' AND title = 'Database Integration');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '77d66a04-84b8-41bd-b8ab-24ca3ac9a383', 'Design Thinking', 'The design thinking process and user research', 0, true
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383')
  AND NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383' AND title = 'Design Thinking');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT 'da385774-8ac1-4900-9d41-37c3ee30c3be', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 35, 'paid'
WHERE EXISTS (SELECT 1 FROM courses WHERE id = 'da385774-8ac1-4900-9d41-37c3ee30c3be')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28')
  AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = 'da385774-8ac1-4900-9d41-37c3ee30c3be' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 10, 'paid'
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '84506f17-9da7-4efe-a2c5-1233f7349178')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28')
  AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '5f0dc79c-ee40-4ad8-ad8a-23d667610b9f', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 0, 'paid'
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '5f0dc79c-ee40-4ad8-ad8a-23d667610b9f')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28')
  AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '5f0dc79c-ee40-4ad8-ad8a-23d667610b9f' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '77d66a04-84b8-41bd-b8ab-24ca3ac9a383', 'c905faf5-b324-4b65-b734-3c11323e0e14', 'active', 50, 'paid'
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = 'c905faf5-b324-4b65-b734-3c11323e0e14')
  AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383' AND user_id = 'c905faf5-b324-4b65-b734-3c11323e0e14');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '3a6775db-2d7d-4343-a852-d4f2e084f9d9', 'c905faf5-b324-4b65-b734-3c11323e0e14', 'active', 0, 'paid'
WHERE EXISTS (SELECT 1 FROM courses WHERE id = '3a6775db-2d7d-4343-a852-d4f2e084f9d9')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = 'c905faf5-b324-4b65-b734-3c11323e0e14')
  AND NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '3a6775db-2d7d-4343-a852-d4f2e084f9d9' AND user_id = 'c905faf5-b324-4b65-b734-3c11323e0e14');

-- [14/23] 20260909000000_014_platform_hardening.sql

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES regions(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'regional_admin')
  );
$$;

CREATE OR REPLACE FUNCTION current_admin_region()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT region_id FROM user_roles
  WHERE user_id = auth.uid() AND role = 'regional_admin'
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "select_own_roles" ON user_roles;
CREATE POLICY "select_own_roles" ON user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin());

DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (
    (auth.uid() = user_id AND role IN ('member','company','client','coach','talent'))
    OR is_super_admin()
  );

DROP POLICY IF EXISTS "update_roles_super_admin" ON user_roles;
CREATE POLICY "update_roles_super_admin" ON user_roles FOR UPDATE
  TO authenticated USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "delete_roles_super_admin" ON user_roles;
CREATE POLICY "delete_roles_super_admin" ON user_roles FOR DELETE
  TO authenticated USING (is_super_admin());

ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_approval_status_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_approval_status_check
      CHECK (approval_status IN ('pending','approved','rejected'));
  END IF;
END $$;

UPDATE events SET approval_status = 'approved' WHERE approval_status = 'pending';

ALTER TABLE events ALTER COLUMN created_by SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT
  TO authenticated USING (
    approval_status = 'approved' OR created_by = auth.uid() OR is_admin()
  );

DROP POLICY IF EXISTS "insert_events_authenticated" ON events;
DROP POLICY IF EXISTS "allow_authenticated_insert_events" ON events;
DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND (is_admin() OR approval_status = 'pending')
  );

DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE
  TO authenticated USING (created_by = auth.uid() OR is_admin())
  WITH CHECK (created_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE
  TO authenticated USING (created_by = auth.uid() OR is_admin());

CREATE OR REPLACE FUNCTION create_event_rsvp(p_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacity integer;
  v_taken integer;
  v_approved text;
  v_rsvp_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to RSVP.' USING ERRCODE = '42501';
  END IF;

  SELECT max_capacity, approval_status INTO v_capacity, v_approved
  FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_approved <> 'approved' THEN
    RAISE EXCEPTION 'This event is not open for registration.' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_taken FROM event_rsvps WHERE event_id = p_event_id;

  IF v_taken >= v_capacity THEN
    RAISE EXCEPTION 'This event is full.' USING ERRCODE = '23514';
  END IF;

  INSERT INTO event_rsvps (event_id, user_id)
  VALUES (p_event_id, auth.uid())
  RETURNING id INTO v_rsvp_id;

  RETURN v_rsvp_id;
END;
$$;

CREATE OR REPLACE FUNCTION accept_project_bid(p_bid_id uuid, p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM projects WHERE id = p_project_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Only the project owner can accept a bid.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM project_bids WHERE id = p_bid_id AND project_id = p_project_id) THEN
    RAISE EXCEPTION 'Bid does not belong to this project.' USING ERRCODE = '23514';
  END IF;

  UPDATE project_bids SET status = 'accepted' WHERE id = p_bid_id;
  UPDATE project_bids SET status = 'rejected' WHERE project_id = p_project_id AND id <> p_bid_id;
  UPDATE projects SET status = 'in_progress' WHERE id = p_project_id;
END;
$$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate integer;

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);

DROP POLICY IF EXISTS "select_audit_logs_admin" ON audit_logs;
CREATE POLICY "select_audit_logs_admin" ON audit_logs FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_audit_logs_admin" ON audit_logs;
CREATE POLICY "insert_audit_logs_admin" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (is_admin() AND actor_id = auth.uid());

-- [15/23] 20260917000000_015_prd_v4_agencies_community_teams.sql

ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('member','company','client','coach','talent','agency_owner','regional_admin','super_admin'));

DROP POLICY IF EXISTS "insert_own_roles" ON user_roles;
CREATE POLICY "insert_own_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (
    (auth.uid() = user_id AND role IN ('member','company','client','coach','talent','agency_owner'))
    OR is_super_admin()
  );

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text NOT NULL,
  is_in_house boolean NOT NULL DEFAULT false,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_agencies" ON agencies;
CREATE POLICY "select_agencies" ON agencies FOR SELECT
  TO authenticated USING (approval_status = 'approved' OR owner_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_agency" ON agencies;
CREATE POLICY "insert_own_agency" ON agencies FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid() AND is_in_house = false);

DROP POLICY IF EXISTS "update_own_agency" ON agencies;
CREATE POLICY "update_own_agency" ON agencies FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND approval_status = 'pending');

DROP POLICY IF EXISTS "update_agency_admin" ON agencies;
CREATE POLICY "update_agency_admin" ON agencies FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (true);

CREATE OR REPLACE FUNCTION guard_agency_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    NEW.approval_status := OLD.approval_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_agencies_approval ON agencies;
CREATE TRIGGER guard_agencies_approval BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION guard_agency_approval();

ALTER TABLE agency_services ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE;

INSERT INTO agencies (id, owner_id, name, slug, description, is_in_house, approval_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'MasmasIT',
  'masmasit',
  'Agency in-house MasmasIT - tim produk, AI, kreatif dan HR yang membangun bersama klien.',
  true,
  'approved'
)
ON CONFLICT (id) DO NOTHING;

UPDATE agency_services SET agency_id = '00000000-0000-0000-0000-000000000001' WHERE agency_id IS NULL;

DROP POLICY IF EXISTS "select_agency_services" ON agency_services;
CREATE POLICY "select_agency_services" ON agency_services FOR SELECT
  TO authenticated USING (
    is_active = true
    AND agency_id IN (SELECT id FROM agencies WHERE approval_status = 'approved')
  );

DROP POLICY IF EXISTS "manage_own_agency_services" ON agency_services;
CREATE POLICY "manage_own_agency_services" ON agency_services FOR ALL
  TO authenticated USING (
    is_admin() OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  ) WITH CHECK (
    is_admin() OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND user_id = p_user_id);
$$;

GRANT EXECUTE ON FUNCTION is_team_member(uuid, uuid) TO authenticated;

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_teams" ON teams;
CREATE POLICY "select_teams" ON teams FOR SELECT
  TO authenticated USING (
    owner_id = auth.uid()
    OR is_admin()
    OR is_team_member(id)
  );

DROP POLICY IF EXISTS "insert_own_team" ON teams;
CREATE POLICY "insert_own_team" ON teams FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_team" ON teams;
CREATE POLICY "update_own_team" ON teams FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_team" ON teams;
CREATE POLICY "delete_own_team" ON teams FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_team_members" ON team_members;
CREATE POLICY "select_team_members" ON team_members FOR SELECT
  TO authenticated USING (
    is_admin()
    OR user_id = auth.uid()
    OR team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_team_members_owner" ON team_members;
CREATE POLICY "insert_team_members_owner" ON team_members FOR INSERT
  TO authenticated WITH CHECK (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_team_members_owner" ON team_members;
CREATE POLICY "delete_team_members_owner" ON team_members FOR DELETE
  TO authenticated USING (team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION compute_member_grade(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_years numeric;
  v_skill_score numeric;
  v_cert_count int;
  v_score numeric;
BEGIN
  SELECT COALESCE(SUM((COALESCE(end_date, CURRENT_DATE) - start_date) / 365.25), 0)
    INTO v_years FROM experiences WHERE user_id = p_user_id;

  SELECT COALESCE(SUM(CASE level
      WHEN 'expert' THEN 3 WHEN 'advanced' THEN 2 WHEN 'intermediate' THEN 1 ELSE 0.5 END), 0)
    INTO v_skill_score FROM user_skills WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_cert_count FROM certificates WHERE user_id = p_user_id;

  v_score := (v_years * 2) + (v_skill_score * 0.5) + (v_cert_count * 1);

  IF v_score >= 10 THEN RETURN 'senior';
  ELSIF v_score >= 4 THEN RETURN 'mid';
  ELSE RETURN 'junior';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION compute_member_grade(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION get_team_roster(p_team_id uuid)
RETURNS TABLE (
  member_id uuid,
  user_id uuid,
  role_title text,
  grade text,
  full_name text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    tm.id,
    tm.user_id,
    tm.role_title,
    compute_member_grade(tm.user_id),
    p.full_name,
    p.avatar_url
  FROM team_members tm
  JOIN profiles p ON p.id = tm.user_id
  WHERE tm.team_id = p_team_id
  ORDER BY tm.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_team_roster(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS team_collabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  focus text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','matched','closed')),
  matched_with text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_collabs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_team_collabs" ON team_collabs;
CREATE POLICY "select_team_collabs" ON team_collabs FOR SELECT
  TO authenticated USING (status = 'open' OR created_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_team_collabs" ON team_collabs;
CREATE POLICY "insert_own_team_collabs" ON team_collabs FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid()
    AND team_id IN (SELECT id FROM teams WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_team_collabs" ON team_collabs;
CREATE POLICY "update_own_team_collabs" ON team_collabs FOR UPDATE
  TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_team_collabs_admin" ON team_collabs;
CREATE POLICY "update_team_collabs_admin" ON team_collabs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (true);

CREATE OR REPLACE FUNCTION guard_team_collabs_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND (NEW.status = 'matched' OR NEW.matched_with IS DISTINCT FROM OLD.matched_with) THEN
    NEW.status := OLD.status;
    NEW.matched_with := OLD.matched_with;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_collabs_match ON team_collabs;
CREATE TRIGGER guard_team_collabs_match BEFORE UPDATE ON team_collabs
  FOR EACH ROW EXECUTE FUNCTION guard_team_collabs_match();

CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussions" ON discussions;
CREATE POLICY "select_discussions" ON discussions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_discussions" ON discussions;
CREATE POLICY "insert_own_discussions" ON discussions FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_discussions" ON discussions;
CREATE POLICY "update_own_discussions" ON discussions FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin()) WITH CHECK (true);

CREATE OR REPLACE FUNCTION guard_discussion_featured()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() AND NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
    NEW.is_featured := OLD.is_featured;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_discussions_featured ON discussions;
CREATE TRIGGER guard_discussions_featured BEFORE UPDATE ON discussions
  FOR EACH ROW EXECUTE FUNCTION guard_discussion_featured();

DROP POLICY IF EXISTS "delete_own_discussions" ON discussions;
CREATE POLICY "delete_own_discussions" ON discussions FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_discussion_comments" ON discussion_comments;
CREATE POLICY "select_discussion_comments" ON discussion_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_discussion_comments" ON discussion_comments;
CREATE POLICY "insert_own_discussion_comments" ON discussion_comments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_discussion_comments" ON discussion_comments;
CREATE POLICY "delete_own_discussion_comments" ON discussion_comments FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion ON discussion_comments(discussion_id);

CREATE TABLE IF NOT EXISTS builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  link_url text,
  image_url text,
  source_type text NOT NULL DEFAULT 'build' CHECK (source_type IN ('build','solo_builder','agency')),
  promoted_to_spotlight boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_builds" ON builds;
CREATE POLICY "select_builds" ON builds FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_builds" ON builds;
CREATE POLICY "insert_own_builds" ON builds FOR INSERT
  TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND (
      source_type <> 'agency'
      OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "update_own_builds" ON builds;
CREATE POLICY "update_own_builds" ON builds FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (
    is_admin()
    OR (
      user_id = auth.uid()
      AND (source_type <> 'agency' OR agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "delete_own_builds" ON builds;
CREATE POLICY "delete_own_builds" ON builds FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

CREATE TABLE IF NOT EXISTS build_likes (
  build_id uuid NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (build_id, user_id)
);

ALTER TABLE build_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_build_likes" ON build_likes;
CREATE POLICY "select_build_likes" ON build_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_build_likes" ON build_likes;
CREATE POLICY "insert_own_build_likes" ON build_likes FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_build_likes" ON build_likes;
CREATE POLICY "delete_own_build_likes" ON build_likes FOR DELETE
  TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION trg_build_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE builds SET likes_count = likes_count + 1 WHERE id = NEW.build_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE builds SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.build_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_build_like_insert ON build_likes;
CREATE TRIGGER on_build_like_insert AFTER INSERT ON build_likes
  FOR EACH ROW EXECUTE FUNCTION trg_build_likes_count();

DROP TRIGGER IF EXISTS on_build_like_delete ON build_likes;
CREATE TRIGGER on_build_like_delete AFTER DELETE ON build_likes
  FOR EACH ROW EXECUTE FUNCTION trg_build_likes_count();

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_articles" ON articles;
CREATE POLICY "select_articles" ON articles FOR SELECT
  TO authenticated USING (is_published = true OR is_admin());

DROP POLICY IF EXISTS "manage_articles_admin" ON articles;
CREATE POLICY "manage_articles_admin" ON articles FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_agency_services_agency ON agency_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_builds_spotlight ON builds(promoted_to_spotlight, likes_count DESC);

-- [16/23] 20260920000000_016_fix_message_notification_trigger.sql

CREATE OR REPLACE FUNCTION trg_notify_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.recipient_id IS NOT NULL THEN
    PERFORM notify_user(NEW.recipient_id, 'message', 'New message', 'You have a new message', '/pesan');
  END IF;
  RETURN NEW;
END;
$$;

-- [17/23] 20260920000100_017_seed_demo_content.sql

DO $$
DECLARE
  demo record;
  demo_password text := 'Demo1234!';
BEGIN
  FOR demo IN
    SELECT * FROM (VALUES
      ('d0000000-0000-4000-a000-000000000001'::uuid, 'rizky@demo.masmasit.online',  'Rizky Pratama'),
      ('d0000000-0000-4000-a000-000000000002'::uuid, 'sarah@demo.masmasit.online',  'Sarah Widodo'),
      ('d0000000-0000-4000-a000-000000000003'::uuid, 'andi@demo.masmasit.online',   'Andi Nugroho'),
      ('d0000000-0000-4000-a000-000000000004'::uuid, 'maya@demo.masmasit.online',   'Maya Kusuma'),
      ('d0000000-0000-4000-a000-000000000005'::uuid, 'bagus@demo.masmasit.online',  'Bagus Saputra'),
      ('d0000000-0000-4000-a000-000000000006'::uuid, 'nadia@demo.masmasit.online',  'Nadia Rahmawati'),
      ('d0000000-0000-4000-a000-000000000007'::uuid, 'fajar@demo.masmasit.online',  'Fajar Hidayat'),
      ('d0000000-0000-4000-a000-000000000008'::uuid, 'intan@demo.masmasit.online',  'Intan Permata'),
      ('d0000000-0000-4000-a000-000000000009'::uuid, 'yusuf@demo.masmasit.online',  'Yusuf Alamsyah'),
      ('d0000000-0000-4000-a000-000000000010'::uuid, 'dewi@demo.masmasit.online',   'Dewi Anggraini'),
      ('d0000000-0000-4000-a000-000000000011'::uuid, 'hendra@demo.masmasit.online', 'Hendra Wijaya'),
      ('d0000000-0000-4000-a000-000000000012'::uuid, 'admin@demo.masmasit.online',  'Admin MasmasIT')
    ) AS v(id, email, full_name)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', demo.id, 'authenticated', 'authenticated',
      demo.email, extensions.crypt(demo_password, extensions.gen_salt('bf')),
      now(), now() - interval '90 days', now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', demo.full_name),
      '', '', '', ''
    )
    -- email carries its own unique index in GoTrue, so an address already
    -- taken by a real account must not abort the whole seed.
    ON CONFLICT DO NOTHING;

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), demo.id, demo.id::text,
      jsonb_build_object('sub', demo.id::text, 'email', demo.email, 'email_verified', true),
      'email', now(), now() - interval '90 days', now()
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

INSERT INTO profiles (id, email, full_name, bio, avatar_url, location, current_job_status,
                      linkedin_url, whatsapp, is_coach, is_talent, coach_approved, talent_approved,
                      hourly_rate, created_at)
VALUES
  ('d0000000-0000-4000-a000-000000000001', 'rizky@demo.masmasit.online', 'Rizky Pratama',
   'Backend engineer, 7 years on payments and high-traffic APIs. Go and Postgres most days. I like boring infrastructure that never pages anyone.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Rizky%20Pratama&backgroundColor=1e3a8a', 'Jakarta', 'open_to_work',
   'https://linkedin.com/in/demo-rizky', '+6281100000001', true, true, 'approved', 'approved', 450000, now() - interval '88 days'),

  ('d0000000-0000-4000-a000-000000000002', 'sarah@demo.masmasit.online', 'Sarah Widodo',
   'Product designer. Design systems, research, and arguing politely about spacing. Previously at two fintechs and one very chaotic marketplace.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Widodo&backgroundColor=7c3aed', 'Bandung', 'employed',
   'https://linkedin.com/in/demo-sarah', '+6281100000002', false, true, 'pending', 'approved', 400000, now() - interval '85 days'),

  ('d0000000-0000-4000-a000-000000000003', 'andi@demo.masmasit.online', 'Andi Nugroho',
   'DevOps / platform. Kubernetes, Terraform, and getting deploy times under two minutes. Runs the Surabaya meetup.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Andi%20Nugroho&backgroundColor=0f766e', 'Surabaya', 'employed',
   'https://linkedin.com/in/demo-andi', '+6281100000003', false, false, 'pending', 'pending', NULL, now() - interval '80 days'),

  ('d0000000-0000-4000-a000-000000000004', 'maya@demo.masmasit.online', 'Maya Kusuma',
   'Data engineer turned teacher. I build pipelines by day and explain them badly-then-well on weekends.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Maya%20Kusuma&backgroundColor=b45309', 'Yogyakarta', 'freelance',
   'https://linkedin.com/in/demo-maya', '+6281100000004', true, true, 'approved', 'approved', 350000, now() - interval '76 days'),

  ('d0000000-0000-4000-a000-000000000005', 'bagus@demo.masmasit.online', 'Bagus Saputra',
   'Mobile developer. Flutter and native Android. Shipped four apps that are still in the store, two that are not.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Bagus%20Saputra&backgroundColor=be123c', 'Semarang', 'open_to_work',
   'https://linkedin.com/in/demo-bagus', '+6281100000005', false, true, 'pending', 'approved', 300000, now() - interval '70 days'),

  ('d0000000-0000-4000-a000-000000000006', 'nadia@demo.masmasit.online', 'Nadia Rahmawati',
   'QA engineer. Automation, load testing, and a long memory for bugs that "cannot happen".',
   'https://api.dicebear.com/7.x/initials/svg?seed=Nadia%20Rahmawati&backgroundColor=4338ca', 'Malang', 'employed',
   'https://linkedin.com/in/demo-nadia', '+6281100000006', false, false, 'pending', 'pending', NULL, now() - interval '64 days'),

  ('d0000000-0000-4000-a000-000000000007', 'fajar@demo.masmasit.online', 'Fajar Hidayat',
   'Application security. Pentesting, threat modelling, and teaching teams to stop pasting secrets into Slack.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Fajar%20Hidayat&backgroundColor=166534', 'Jakarta', 'freelance',
   'https://linkedin.com/in/demo-fajar', '+6281100000007', true, true, 'approved', 'approved', 600000, now() - interval '58 days'),

  ('d0000000-0000-4000-a000-000000000008', 'intan@demo.masmasit.online', 'Intan Permata',
   'Frontend engineer. React, TypeScript, and a slightly unhealthy interest in render performance.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Intan%20Permata&backgroundColor=9d174d', 'Denpasar', 'open_to_work',
   'https://linkedin.com/in/demo-intan', '+6281100000008', false, true, 'pending', 'approved', 320000, now() - interval '50 days'),

  ('d0000000-0000-4000-a000-000000000009', 'yusuf@demo.masmasit.online', 'Yusuf Alamsyah',
   'ML engineer. Recommenders and search relevance. Currently obsessed with making evaluation honest.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Yusuf%20Alamsyah&backgroundColor=115e59', 'Bandung', 'employed',
   'https://linkedin.com/in/demo-yusuf', '+6281100000009', true, true, 'approved', 'approved', 550000, now() - interval '44 days'),

  ('d0000000-0000-4000-a000-000000000010', 'dewi@demo.masmasit.online', 'Dewi Anggraini',
   'Product manager at a logistics startup. I bring briefs here when I need a team rather than one hire.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Dewi%20Anggraini&backgroundColor=7e22ce', 'Jakarta', 'employed',
   'https://linkedin.com/in/demo-dewi', '+6281100000010', false, false, 'pending', 'pending', NULL, now() - interval '38 days'),

  ('d0000000-0000-4000-a000-000000000011', 'hendra@demo.masmasit.online', 'Hendra Wijaya',
   'CTO at Sinar Digital. Hiring backend and mobile through this platform instead of five job boards.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Hendra%20Wijaya&backgroundColor=1d4ed8', 'Jakarta', 'employed',
   'https://linkedin.com/in/demo-hendra', '+6281100000011', false, false, 'pending', 'pending', NULL, now() - interval '30 days'),

  ('d0000000-0000-4000-a000-000000000012', 'admin@demo.masmasit.online', 'Admin MasmasIT',
   'Platform operations account.',
   'https://api.dicebear.com/7.x/initials/svg?seed=MasmasIT&backgroundColor=0f172a', 'Jakarta', 'employed',
   NULL, NULL, false, false, 'pending', 'pending', NULL, now() - interval '95 days')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
SELECT u.id, r.role
FROM (VALUES
  ('d0000000-0000-4000-a000-000000000001'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000001'::uuid, 'talent'), ('d0000000-0000-4000-a000-000000000001'::uuid, 'coach'),
  ('d0000000-0000-4000-a000-000000000002'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000002'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000003'::uuid, 'member'),
  ('d0000000-0000-4000-a000-000000000004'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000004'::uuid, 'coach'), ('d0000000-0000-4000-a000-000000000004'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000005'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000005'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000006'::uuid, 'member'),
  ('d0000000-0000-4000-a000-000000000007'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000007'::uuid, 'coach'), ('d0000000-0000-4000-a000-000000000007'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000008'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000008'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000009'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000009'::uuid, 'coach'), ('d0000000-0000-4000-a000-000000000009'::uuid, 'talent'),
  ('d0000000-0000-4000-a000-000000000010'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000010'::uuid, 'client'),
  ('d0000000-0000-4000-a000-000000000011'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000011'::uuid, 'company'),
  ('d0000000-0000-4000-a000-000000000012'::uuid, 'member'), ('d0000000-0000-4000-a000-000000000012'::uuid, 'super_admin')
) AS r(user_id, role)
JOIN auth.users u ON u.id = r.user_id
ON CONFLICT DO NOTHING;

INSERT INTO skills (name, category) VALUES
  ('Go', 'Backend'), ('Node.js', 'Backend'), ('PostgreSQL', 'Database'), ('Python', 'Backend'),
  ('React', 'Frontend'), ('TypeScript', 'Frontend'), ('Next.js', 'Frontend'), ('Tailwind CSS', 'Frontend'),
  ('Flutter', 'Mobile'), ('Kotlin', 'Mobile'), ('Swift', 'Mobile'),
  ('Kubernetes', 'DevOps'), ('Terraform', 'DevOps'), ('Docker', 'DevOps'), ('AWS', 'Cloud'), ('GCP', 'Cloud'),
  ('Figma', 'Design'), ('Design System', 'Design'), ('User Research', 'Design'),
  ('Airflow', 'Data'), ('dbt', 'Data'), ('Spark', 'Data'),
  ('PyTorch', 'AI/ML'), ('LLM Engineering', 'AI/ML'), ('Recommender Systems', 'AI/ML'),
  ('Penetration Testing', 'Security'), ('Threat Modelling', 'Security'),
  ('Playwright', 'QA'), ('k6', 'QA'), ('Product Management', 'Product')
ON CONFLICT DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level, years_experience, verification_status)
SELECT us.user_id, s.id, us.level, us.years, 'self_declared'
FROM (VALUES
  ('d0000000-0000-4000-a000-000000000001'::uuid, 'Go', 'expert', 7),
  ('d0000000-0000-4000-a000-000000000001'::uuid, 'PostgreSQL', 'expert', 7),
  ('d0000000-0000-4000-a000-000000000001'::uuid, 'Docker', 'advanced', 5),
  ('d0000000-0000-4000-a000-000000000002'::uuid, 'Figma', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000002'::uuid, 'Design System', 'expert', 5),
  ('d0000000-0000-4000-a000-000000000002'::uuid, 'User Research', 'advanced', 4),
  ('d0000000-0000-4000-a000-000000000003'::uuid, 'Kubernetes', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000003'::uuid, 'Terraform', 'advanced', 5),
  ('d0000000-0000-4000-a000-000000000003'::uuid, 'AWS', 'advanced', 6),
  ('d0000000-0000-4000-a000-000000000004'::uuid, 'Airflow', 'expert', 5),
  ('d0000000-0000-4000-a000-000000000004'::uuid, 'dbt', 'advanced', 4),
  ('d0000000-0000-4000-a000-000000000004'::uuid, 'Python', 'expert', 8),
  ('d0000000-0000-4000-a000-000000000005'::uuid, 'Flutter', 'expert', 5),
  ('d0000000-0000-4000-a000-000000000005'::uuid, 'Kotlin', 'advanced', 4),
  ('d0000000-0000-4000-a000-000000000006'::uuid, 'Playwright', 'expert', 4),
  ('d0000000-0000-4000-a000-000000000006'::uuid, 'k6', 'advanced', 3),
  ('d0000000-0000-4000-a000-000000000007'::uuid, 'Penetration Testing', 'expert', 8),
  ('d0000000-0000-4000-a000-000000000007'::uuid, 'Threat Modelling', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000008'::uuid, 'React', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000008'::uuid, 'TypeScript', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000008'::uuid, 'Next.js', 'advanced', 4),
  ('d0000000-0000-4000-a000-000000000009'::uuid, 'PyTorch', 'expert', 5),
  ('d0000000-0000-4000-a000-000000000009'::uuid, 'Recommender Systems', 'expert', 5),
  ('d0000000-0000-4000-a000-000000000009'::uuid, 'LLM Engineering', 'advanced', 2),
  ('d0000000-0000-4000-a000-000000000010'::uuid, 'Product Management', 'expert', 8)
) AS us(user_id, skill_name, level, years)
JOIN skills s ON s.name = us.skill_name
ON CONFLICT DO NOTHING;

INSERT INTO experiences (id, user_id, company, position, start_date, end_date, description) VALUES
  ('e0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'Bayarin', 'Senior Backend Engineer', '2021-03-01', NULL, 'Payments core: ledger, settlement and reconciliation services in Go.'),
  ('e0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 'Tokomaju', 'Backend Engineer', '2018-06-01', '2021-02-28', 'Order and inventory services during a 10x traffic year.'),
  ('e0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002', 'Danain', 'Product Designer', '2020-01-01', NULL, 'Owns the design system and the onboarding flow.'),
  ('e0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000003', 'Sinar Digital', 'Platform Engineer', '2019-09-01', NULL, 'Runs the Kubernetes platform and the CI/CD pipeline for 40 services.'),
  ('e0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000009', 'Rekomendo', 'ML Engineer', '2021-08-01', NULL, 'Search relevance and the homepage recommender.')
ON CONFLICT DO NOTHING;

INSERT INTO companies (id, user_id, name, description, logo_url, website, location, industry, approval_status, created_at) VALUES
  ('c0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000011', 'Sinar Digital',
   'Digital product studio building logistics and retail software for Indonesian mid-market companies.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Sinar%20Digital&backgroundColor=1d4ed8', 'https://example.com/sinar', 'Jakarta', 'Software', 'approved', now() - interval '29 days'),
  ('c0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000011', 'Bayarin',
   'Payments infrastructure for marketplaces. Small team, large volumes.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Bayarin&backgroundColor=0f766e', 'https://example.com/bayarin', 'Jakarta', 'Fintech', 'approved', now() - interval '26 days'),
  ('c0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000010', 'Logika Kirim',
   'Last-mile logistics for D2C brands across Java and Bali.',
   'https://api.dicebear.com/7.x/initials/svg?seed=Logika%20Kirim&backgroundColor=b45309', 'https://example.com/logika', 'Surabaya', 'Logistics', 'approved', now() - interval '20 days')
ON CONFLICT DO NOTHING;

INSERT INTO jobs (id, company_id, title, description, location, job_type, salary_min, salary_max, deadline, status, created_at) VALUES
  ('10000000-0000-4000-a000-000000000001', 'c0000000-0000-4000-a000-000000000002', 'Senior Backend Engineer (Go)',
   E'You will own the settlement service end to end: the ledger, the reconciliation jobs and the reporting API on top of them.\n\nWhat we look for: strong Go, real Postgres experience (not just an ORM), and the judgement to keep a financial system boring. You will be the third engineer on a team of six.\n\nStack: Go, Postgres, Kafka, Kubernetes on GCP.',
   'Jakarta', 'full-time', 25000000, 40000000, CURRENT_DATE + 30, 'open', now() - interval '12 days'),

  ('10000000-0000-4000-a000-000000000002', 'c0000000-0000-4000-a000-000000000001', 'Frontend Engineer - React / Next.js',
   E'We are rebuilding the dashboard three of our clients use daily. Roughly 60% product work, 40% design-system work alongside our designer.\n\nWhat we look for: TypeScript you are fluent in, React you have debugged under pressure, and an eye for the difference between "works" and "feels right".\n\nStack: Next.js, TypeScript, Tailwind, Supabase.',
   'Remote (Indonesia)', 'remote', 15000000, 25000000, CURRENT_DATE + 21, 'open', now() - interval '9 days'),

  ('10000000-0000-4000-a000-000000000003', 'c0000000-0000-4000-a000-000000000001', 'Mobile Engineer (Flutter)',
   E'Driver-facing Android app: offline-first, GPS-heavy, used eight hours a day in bad network conditions. That constraint shapes every decision.\n\nWhat we look for: shipped Flutter apps, comfort with platform channels, and patience for real-world device testing.',
   'Jakarta / Hybrid', 'full-time', 18000000, 28000000, CURRENT_DATE + 25, 'open', now() - interval '7 days'),

  ('10000000-0000-4000-a000-000000000004', 'c0000000-0000-4000-a000-000000000003', 'DevOps Engineer',
   E'40 services, one platform team, and a deploy pipeline that needs to stop being the bottleneck. You will own it.\n\nWhat we look for: Kubernetes in production (not just a course), Terraform, and a bias toward deleting things.',
   'Surabaya', 'full-time', 20000000, 32000000, CURRENT_DATE + 40, 'open', now() - interval '5 days'),

  ('10000000-0000-4000-a000-000000000005', 'c0000000-0000-4000-a000-000000000003', 'Product Designer (Contract, 6 months)',
   E'One designer, one product, six months: the merchant portal needs a proper information architecture before it grows again.\n\nWhat we look for: someone who starts with research, not with Figma.',
   'Remote (Indonesia)', 'contract', 12000000, 20000000, CURRENT_DATE + 18, 'open', now() - interval '4 days'),

  ('10000000-0000-4000-a000-000000000006', 'c0000000-0000-4000-a000-000000000002', 'Security Engineer',
   E'First security hire. You will set the baseline: threat modelling for new services, a pentest cadence, and secrets hygiene that survives contact with a growing team.',
   'Jakarta', 'full-time', 28000000, 45000000, CURRENT_DATE + 35, 'open', now() - interval '3 days'),

  ('10000000-0000-4000-a000-000000000007', 'c0000000-0000-4000-a000-000000000001', 'QA Automation Engineer (Part-time)',
   E'Two days a week, building the end-to-end suite we keep saying we will build. Playwright, CI, and honest flakiness budgets.',
   'Remote (Indonesia)', 'part-time', 8000000, 14000000, CURRENT_DATE + 14, 'open', now() - interval '2 days'),

  ('10000000-0000-4000-a000-000000000008', 'c0000000-0000-4000-a000-000000000002', 'Data Engineer',
   E'Our analytics currently runs on a nightly script and hope. You will replace it with something we can trust: Airflow, dbt, and a warehouse people actually query.',
   'Jakarta / Hybrid', 'full-time', 20000000, 33000000, CURRENT_DATE + 28, 'open', now() - interval '1 day'),

  ('10000000-0000-4000-a000-000000000009', 'c0000000-0000-4000-a000-000000000003', 'Backend Intern',
   E'Six months, paid, with a real service to own by month three. We have run this programme twice and hired from it both times.',
   'Surabaya', 'internship', 4000000, 6000000, CURRENT_DATE + 45, 'open', now() - interval '16 days'),

  ('10000000-0000-4000-a000-000000000010', 'c0000000-0000-4000-a000-000000000001', 'Engineering Manager',
   E'Two squads, nine engineers. Half the role is hiring, half is making sure the people already here stop being blocked.',
   'Jakarta', 'full-time', 35000000, 55000000, CURRENT_DATE - 2, 'closed', now() - interval '50 days')
ON CONFLICT DO NOTHING;

INSERT INTO job_applications (id, job_id, user_id, status, cover_letter, created_at) VALUES
  ('1a000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'reviewing',
   'Seven years on payments, four of them in Go. I have built the reconciliation side of exactly this system before and would like to do it better the second time.', now() - interval '10 days'),
  ('1a000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000008', 'pending',
   'I have spent the last two years on a design system in Next.js and TypeScript. Happy to walk through the render-performance work in a call.', now() - interval '6 days'),
  ('1a000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000005', 'accepted',
   'Offline-first Flutter is most of what I have done for three years. Portfolio has two driver apps with similar constraints.', now() - interval '5 days'),
  ('1a000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000003', 'reviewing',
   'I run a 40-service Kubernetes platform today and cut our deploy time from 14 minutes to 100 seconds. Same problem, different logo.', now() - interval '4 days'),
  ('1a000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000002', 'pending',
   'Research-first is how I work anyway. I would want two weeks of merchant interviews before touching Figma.', now() - interval '3 days'),
  ('1a000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000007', 'reviewing',
   'I have been the first security hire twice. The first 90 days matter more than the tooling, and I am happy to share the plan I use.', now() - interval '2 days'),
  ('1a000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000006', 'pending',
   'Playwright suite, honest flakiness budget, two days a week - this is precisely the shape of work I am looking for.', now() - interval '1 day'),
  ('1a000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000004', 'pending',
   'Airflow and dbt are my daily tools. I have replaced a nightly-script setup with a proper warehouse once and would do it the same way again.', now() - interval '12 hours'),
  ('1a000000-0000-4000-a000-000000000009', '10000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'rejected',
   'Mostly platform rather than application Go, but I would like to make the case.', now() - interval '9 days')
ON CONFLICT DO NOTHING;

INSERT INTO projects (id, user_id, title, description, budget_min, budget_max, deadline, status, created_at) VALUES
  ('20000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000010', 'Merchant dashboard rebuild',
   E'Our merchant portal has grown by accretion for three years and now takes new merchants 40 minutes to understand. We want it rebuilt around three tasks they actually do: check today''s orders, resolve a failed delivery, and reconcile a payout.\n\nScope: research, IA, UI, and the frontend build against our existing API. Backend stays as is.',
   45000000, 70000000, CURRENT_DATE + 60, 'open', now() - interval '14 days'),

  ('20000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000010', 'WhatsApp order-tracking bot',
   E'80% of our customer-support volume is "where is my package". We want that answered by a WhatsApp bot wired to our tracking API, with a clean handoff to a human when it cannot answer.\n\nScope: bot, API integration, handoff flow, and a simple admin view of conversations.',
   25000000, 40000000, CURRENT_DATE + 45, 'open', now() - interval '11 days'),

  ('20000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000011', 'Security audit before Series A',
   E'Full application pentest plus a written report we can hand to a diligence team. Node/Postgres API, React frontend, AWS. Roughly 60k lines.\n\nDeliverable: findings with severity, reproduction steps, and a remediation plan we can actually schedule.',
   30000000, 50000000, CURRENT_DATE + 30, 'in_progress', now() - interval '25 days'),

  ('20000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000011', 'Data warehouse + exec dashboard',
   E'Move reporting off the nightly script. Build the warehouse, the dbt models, and one dashboard the leadership team will actually open on Monday mornings.',
   35000000, 60000000, CURRENT_DATE + 75, 'open', now() - interval '8 days'),

  ('20000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000010', 'Internal design system',
   E'Four products, four different button components. We want one library in Figma and code, documented well enough that a new engineer uses it without asking.',
   20000000, 35000000, CURRENT_DATE + 50, 'open', now() - interval '6 days'),

  ('20000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000010', 'Warehouse stock-count mobile app',
   E'Barcode scanning, offline queue, sync on reconnect. Six warehouses, Android devices we already own.',
   28000000, 45000000, CURRENT_DATE - 10, 'completed', now() - interval '90 days')
ON CONFLICT DO NOTHING;

INSERT INTO project_bids (id, project_id, user_id, amount, proposal, eta_days, status, created_at) VALUES
  ('2b000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', 62000000,
   'Two weeks of merchant interviews and task analysis first, then IA, then UI. I would rather find out in week two that "reconcile a payout" is really three tasks than in week eight.', 55, 'pending', now() - interval '12 days'),
  ('2b000000-0000-4000-a000-000000000002', '20000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 58000000,
   'I would pair with a designer on the research and own the whole frontend build. Next.js against your existing API, with the component library as a by-product rather than an afterthought.', 50, 'pending', now() - interval '11 days'),
  ('2b000000-0000-4000-a000-000000000003', '20000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 34000000,
   'The tracking integration is the easy half. The handoff flow is where these projects fail, so I would build that first and demo it in week one.', 30, 'pending', now() - interval '9 days'),
  ('2b000000-0000-4000-a000-000000000004', '20000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000007', 42000000,
   'Two-week engagement: one week testing, one week writing. The report is the deliverable diligence teams read, so I write it to be read by them, not by me.', 14, 'accepted', now() - interval '24 days'),
  ('2b000000-0000-4000-a000-000000000005', '20000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004', 52000000,
   'Airflow + dbt + Metabase. I would start from the three questions leadership asks most and model backwards from those rather than lifting every table.', 60, 'pending', now() - interval '7 days'),
  ('2b000000-0000-4000-a000-000000000006', '20000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000002', 31000000,
   'Figma library and a React package published to your private registry, with a migration guide per product. Documented as I go, not at the end.', 45, 'pending', now() - interval '5 days'),
  ('2b000000-0000-4000-a000-000000000007', '20000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005', 38000000,
   'Offline-first is the whole project. Local queue, conflict rules agreed up front, sync that is boring to watch.', 40, 'accepted', now() - interval '88 days')
ON CONFLICT DO NOTHING;

INSERT INTO project_reviews (id, project_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
  ('2c000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000005', 5,
   'Shipped on time, and the offline sync has not lost a single count in three months of daily use across six warehouses. Asked the right questions before writing code.', now() - interval '8 days')
ON CONFLICT DO NOTHING;

INSERT INTO courses (id, coach_id, title, description, level, category, price, created_at) VALUES
  ('30000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'Production Go for Web Services',
   'Building services in Go that survive real traffic: project layout, database access without an ORM, graceful shutdown, and the observability you need before the first incident.',
   'intermediate', 'Backend', 450000, now() - interval '60 days'),
  ('30000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000004', 'Data Pipelines with Airflow and dbt',
   'From a nightly cron script to a warehouse a company can trust. Orchestration, modelling, testing and the operational habits that keep it healthy.',
   'intermediate', 'Data', 500000, now() - interval '52 days'),
  ('30000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000007', 'Application Security for Developers',
   'Threat modelling, the OWASP Top 10 as it actually appears in code review, secrets management, and how to argue for security work without being the person who says no.',
   'beginner', 'Security', 400000, now() - interval '40 days'),
  ('30000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000009', 'Recommender Systems, End to End',
   'Candidate generation, ranking, and the evaluation setup that stops you shipping a model that only looks good offline.',
   'advanced', 'AI/ML', 650000, now() - interval '30 days'),
  ('30000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000004', 'SQL for People Who Already Know Some SQL',
   'Window functions, CTEs, query plans, and the handful of habits that separate a query that runs from a query that scales.',
   'beginner', 'Data', 0, now() - interval '20 days')
ON CONFLICT DO NOTHING;

INSERT INTO course_modules (id, course_id, title, description, order_index, is_free, created_at) VALUES
  ('31000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000001', 'Project layout and configuration', 'Where code goes, and why the answer matters more at 20 files than at 200.', 1, true, now() - interval '60 days'),
  ('31000000-0000-4000-a000-000000000002', '30000000-0000-4000-a000-000000000001', 'Talking to Postgres without an ORM', 'sqlc, transactions, connection pools, and migrations you can roll back.', 2, false, now() - interval '60 days'),
  ('31000000-0000-4000-a000-000000000003', '30000000-0000-4000-a000-000000000001', 'Observability before the first incident', 'Structured logs, metrics that answer questions, and traces that survive a refactor.', 3, false, now() - interval '60 days'),
  ('31000000-0000-4000-a000-000000000004', '30000000-0000-4000-a000-000000000002', 'Orchestration basics', 'DAGs, scheduling, retries, and backfills that do not ruin a weekend.', 1, true, now() - interval '52 days'),
  ('31000000-0000-4000-a000-000000000005', '30000000-0000-4000-a000-000000000002', 'Modelling with dbt', 'Staging, marts, tests, and documentation that stays true.', 2, false, now() - interval '52 days'),
  ('31000000-0000-4000-a000-000000000006', '30000000-0000-4000-a000-000000000003', 'Thinking like an attacker', 'Threat modelling a real feature in 45 minutes.', 1, true, now() - interval '40 days'),
  ('31000000-0000-4000-a000-000000000007', '30000000-0000-4000-a000-000000000003', 'The Top 10 in code review', 'What each vulnerability class looks like in a pull request.', 2, false, now() - interval '40 days'),
  ('31000000-0000-4000-a000-000000000008', '30000000-0000-4000-a000-000000000004', 'Candidate generation', 'Retrieval, embeddings, and why the first stage decides the ceiling.', 1, true, now() - interval '30 days'),
  ('31000000-0000-4000-a000-000000000009', '30000000-0000-4000-a000-000000000004', 'Honest evaluation', 'Offline metrics, online tests, and the gap between them.', 2, false, now() - interval '30 days'),
  ('31000000-0000-4000-a000-000000000010', '30000000-0000-4000-a000-000000000005', 'Window functions', 'Running totals, rankings, and the frame clause nobody reads.', 1, true, now() - interval '20 days'),
  ('31000000-0000-4000-a000-000000000011', '30000000-0000-4000-a000-000000000005', 'Reading a query plan', 'Seq scan, index scan, nested loop - and what to do about each.', 2, true, now() - interval '20 days')
ON CONFLICT DO NOTHING;

INSERT INTO course_materials (id, module_id, title, content_type, content_url, text_content) VALUES
  ('32000000-0000-4000-a000-000000000001', '31000000-0000-4000-a000-000000000001', 'Why cmd/ and internal/', 'text', NULL,
   'Go has no enforced project structure, which means the structure you choose is a communication device rather than a rule. cmd/ holds entry points, internal/ holds everything the compiler should stop other modules importing, and pkg/ is usually a mistake for an application. This lesson walks through a service at three sizes and shows what changes.'),
  ('32000000-0000-4000-a000-000000000002', '31000000-0000-4000-a000-000000000001', 'Configuration walkthrough', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL),
  ('32000000-0000-4000-a000-000000000003', '31000000-0000-4000-a000-000000000002', 'Transactions in practice', 'text', NULL,
   'The hard part of transactions is not BEGIN and COMMIT, it is deciding what belongs inside one. We look at a payment flow and move the boundary three times, watching what breaks each way.'),
  ('32000000-0000-4000-a000-000000000004', '31000000-0000-4000-a000-000000000004', 'Your first DAG', 'text', NULL,
   'A DAG is a schedule plus a dependency graph plus a retry policy. We build one that ingests a CSV, and then we deliberately break it four different ways to see what each failure looks like in the UI.'),
  ('32000000-0000-4000-a000-000000000005', '31000000-0000-4000-a000-000000000006', 'Threat modelling a login form', 'text', NULL,
   'We take a plain email-and-password login and enumerate what an attacker would try, in order of effort. By the end you have a one-page model and three concrete tickets.'),
  ('32000000-0000-4000-a000-000000000006', '31000000-0000-4000-a000-000000000010', 'ROW_NUMBER, RANK, DENSE_RANK', 'text', NULL,
   'Three functions that look interchangeable until there is a tie. We run all three over the same table and read the difference off the output.')
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, module_id, title, passing_grade) VALUES
  ('33000000-0000-4000-a000-000000000001', '31000000-0000-4000-a000-000000000001', 'Project layout check', 70),
  ('33000000-0000-4000-a000-000000000002', '31000000-0000-4000-a000-000000000004', 'Orchestration basics quiz', 70),
  ('33000000-0000-4000-a000-000000000003', '31000000-0000-4000-a000-000000000006', 'Threat modelling quiz', 70),
  ('33000000-0000-4000-a000-000000000004', '31000000-0000-4000-a000-000000000010', 'Window functions quiz', 70)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
  ('34000000-0000-4000-a000-000000000001', '33000000-0000-4000-a000-000000000001', 'What does Go''s internal/ directory actually enforce?', 'Nothing - it is a convention', 'That other modules cannot import the package', 'That the package is compiled last', 'That the package has no tests', 'b'),
  ('34000000-0000-4000-a000-000000000002', '33000000-0000-4000-a000-000000000001', 'Where does a service''s main() belong?', 'internal/', 'pkg/', 'cmd/', 'The repository root', 'c'),
  ('34000000-0000-4000-a000-000000000003', '33000000-0000-4000-a000-000000000002', 'What does a DAG describe in Airflow?', 'A database schema', 'Tasks and the order they depend on', 'A deployment target', 'A dashboard layout', 'b'),
  ('34000000-0000-4000-a000-000000000004', '33000000-0000-4000-a000-000000000002', 'What is a backfill?', 'Re-running a DAG over past intervals', 'Deleting old task logs', 'Adding a column to a table', 'Restarting the scheduler', 'a'),
  ('34000000-0000-4000-a000-000000000005', '33000000-0000-4000-a000-000000000003', 'What is the first step of threat modelling a feature?', 'Run a scanner', 'Describe what the system does and what it protects', 'Write the remediation plan', 'File a CVE', 'b'),
  ('34000000-0000-4000-a000-000000000006', '33000000-0000-4000-a000-000000000004', 'Which function skips numbers after a tie?', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'b')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (id, course_id, user_id, status, progress, enrolled_at, payment_status) VALUES
  ('35000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'active',    66, now() - interval '40 days', 'paid'),
  ('35000000-0000-4000-a000-000000000002', '30000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 'active',    33, now() - interval '30 days', 'paid'),
  ('35000000-0000-4000-a000-000000000003', '30000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 'active',     0, now() - interval '25 days', 'paid'),
  ('35000000-0000-4000-a000-000000000004', '30000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', 'completed',100, now() - interval '18 days', 'paid'),
  ('35000000-0000-4000-a000-000000000005', '30000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000008', 'active',     0, now() - interval '15 days', 'awaiting_confirmation'),
  ('35000000-0000-4000-a000-000000000006', '30000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000005', 'active',    50, now() - interval '10 days', 'paid'),
  ('35000000-0000-4000-a000-000000000007', '30000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000006', 'active',     0, now() - interval '8 days', 'paid'),
  ('35000000-0000-4000-a000-000000000008', '30000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004', 'active',     0, now() - interval '5 days', 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO module_completions (id, enrollment_id, module_id, user_id, completed_at) VALUES
  ('36000000-0000-4000-a000-000000000001', '35000000-0000-4000-a000-000000000001', '31000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', now() - interval '38 days'),
  ('36000000-0000-4000-a000-000000000002', '35000000-0000-4000-a000-000000000001', '31000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000003', now() - interval '35 days'),
  ('36000000-0000-4000-a000-000000000003', '35000000-0000-4000-a000-000000000002', '31000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', now() - interval '28 days'),
  ('36000000-0000-4000-a000-000000000004', '35000000-0000-4000-a000-000000000006', '31000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000005', now() - interval '9 days'),
  ('36000000-0000-4000-a000-000000000005', '35000000-0000-4000-a000-000000000004', '31000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000006', now() - interval '17 days'),
  ('36000000-0000-4000-a000-000000000006', '35000000-0000-4000-a000-000000000004', '31000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000006', now() - interval '16 days')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_submissions (id, quiz_id, user_id, score, passed, answers, created_at) VALUES
  ('37000000-0000-4000-a000-000000000001', '33000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 100, true,  '{"1":"b","2":"c"}'::jsonb, now() - interval '38 days'),
  ('37000000-0000-4000-a000-000000000002', '33000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 50,  false, '{"1":"a","2":"c"}'::jsonb, now() - interval '28 days'),
  ('37000000-0000-4000-a000-000000000003', '33000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', 100, true,  '{"1":"b"}'::jsonb,        now() - interval '17 days'),
  ('37000000-0000-4000-a000-000000000004', '33000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000005', 100, true,  '{"1":"b"}'::jsonb,        now() - interval '9 days')
ON CONFLICT DO NOTHING;

INSERT INTO certificates (id, course_id, user_id, issued_at) VALUES
  ('38000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', now() - interval '15 days')
ON CONFLICT DO NOTHING;

INSERT INTO regions (id, name, description, admin_user_id) VALUES
  (gen_random_uuid(), 'Jakarta',    'Jabodetabek chapter.',                  'd0000000-0000-4000-a000-000000000012'),
  (gen_random_uuid(), 'Bandung',    'West Java chapter.',                    NULL),
  (gen_random_uuid(), 'Surabaya',   'East Java chapter.',                    'd0000000-0000-4000-a000-000000000003'),
  (gen_random_uuid(), 'Yogyakarta', 'DIY chapter.',                          NULL),
  (gen_random_uuid(), 'Bali',       'Denpasar and remote-worker chapter.',   NULL),
  (gen_random_uuid(), 'Online',     'Region-independent, streamed events.',  NULL)
ON CONFLICT DO NOTHING;

INSERT INTO events (id, region_id, title, description, event_type, location, event_date, max_capacity, is_paid, price, created_by, approval_status, created_at)
SELECT e.id, r.id, e.title, e.description, e.event_type, e.location, e.event_date, e.max_capacity, e.is_paid, e.price, e.created_by, e.approval_status, e.created_at
FROM (VALUES
  ('41000000-0000-4000-a000-000000000001'::uuid, 'Jakarta'::text, 'MasmasIT Jakarta Meetup #12'::text,
   'Two talks and an hour of nobody talking about work. This month: running Postgres at scale, and what a year of on-call taught one team about alert design.'::text,
   'meetup'::text, 'Kuningan, Jakarta Selatan'::text, (now() + interval '12 days')::timestamptz, 80::integer, false, NULL::integer, 'd0000000-0000-4000-a000-000000000012'::uuid, 'approved'::text, (now() - interval '20 days')::timestamptz),

  ('41000000-0000-4000-a000-000000000002', 'Surabaya', 'Kubernetes Workshop: Zero to Deploy',
   'A full Saturday, hands on. Bring a laptop. You leave with a service running on a cluster you built yourself and an honest sense of what it costs to keep it there.',
   'workshop', 'Coworking Tunjungan, Surabaya', now() + interval '20 days', 30, true, 250000, 'd0000000-0000-4000-a000-000000000003', 'approved', now() - interval '18 days'),

  ('41000000-0000-4000-a000-000000000003', 'Online', 'Webinar: Breaking Into Security From Dev',
   'For developers who keep being told they would be good at security. What the first year actually looks like, what to study, and what to ignore.',
   'webinar', 'Online (Zoom)', now() + interval '6 days', 300, false, NULL, 'd0000000-0000-4000-a000-000000000007', 'approved', now() - interval '10 days'),

  ('41000000-0000-4000-a000-000000000004', 'Bandung', 'Bandung Hack Weekend',
   '48 hours, teams of four, one theme announced on the morning. Mentors from the community, and demos to a room that will ask real questions.',
   'hackathon', 'Dago, Bandung', now() + interval '34 days', 60, true, 150000, 'd0000000-0000-4000-a000-000000000002', 'approved', now() - interval '15 days'),

  ('41000000-0000-4000-a000-000000000005', 'Yogyakarta', 'Yogyakarta Data Night',
   'Short talks on pipelines, warehouses and the analytics nobody reads. Followed by angkringan.',
   'meetup', 'Sleman, Yogyakarta', now() + interval '27 days', 50, false, NULL, 'd0000000-0000-4000-a000-000000000004', 'approved', now() - interval '9 days'),

  ('41000000-0000-4000-a000-000000000006', 'Bali', 'Bali Remote Workers Coffee',
   'Informal, monthly, no talks. Just people who work remotely and would like to see other humans on a Thursday.',
   'meetup', 'Canggu, Bali', now() + interval '9 days', 25, false, NULL, 'd0000000-0000-4000-a000-000000000008', 'approved', now() - interval '7 days'),

  ('41000000-0000-4000-a000-000000000007', 'Jakarta', 'MasmasIT Jakarta Meetup #11',
   'Last month: Go at scale, and a post-mortem walkthrough of a four-hour outage told honestly.',
   'meetup', 'SCBD, Jakarta Selatan', now() - interval '18 days', 80, false, NULL, 'd0000000-0000-4000-a000-000000000012', 'approved', now() - interval '50 days'),

  ('41000000-0000-4000-a000-000000000008', 'Online', 'Conference: IndoDev Summit 2026',
   'Three tracks over two days - engineering, product and AI. Community members get a discounted rate.',
   'conference', 'Online + Jakarta Convention Center', now() + interval '75 days', 500, true, 750000, 'd0000000-0000-4000-a000-000000000012', 'approved', now() - interval '5 days')
) AS e(id, region_name, title, description, event_type, location, event_date, max_capacity, is_paid, price, created_by, approval_status, created_at)
JOIN regions r ON r.name = e.region_name
ON CONFLICT DO NOTHING;

INSERT INTO event_rsvps (id, event_id, user_id, status, created_at, payment_status) VALUES
  ('42000000-0000-4000-a000-000000000001', '41000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'registered', now() - interval '15 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000002', '41000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000007', 'registered', now() - interval '14 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000003', '41000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000010', 'registered', now() - interval '12 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000004', '41000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000005', 'registered', now() - interval '10 days', 'paid'),
  ('42000000-0000-4000-a000-000000000005', '41000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000006', 'registered', now() - interval '9 days', 'awaiting_confirmation'),
  ('42000000-0000-4000-a000-000000000006', '41000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000008', 'registered', now() - interval '6 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000007', '41000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', 'registered', now() - interval '5 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000008', '41000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000009', 'registered', now() - interval '4 days', 'paid'),
  ('42000000-0000-4000-a000-000000000009', '41000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000001', 'checked_in', now() - interval '40 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000010', '41000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000003', 'checked_in', now() - interval '38 days', 'unpaid')
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, talent_id, client_id, booking_type, scheduled_at, notes, status, amount, created_at, payment_status) VALUES
  ('43000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000011', 'consultation',
   now() + interval '3 days', 'Pre-audit scoping call. We want to agree the boundary before the engagement starts.', 'confirmed', 600000, now() - interval '5 days', 'paid'),
  ('43000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 'mentoring',
   now() + interval '5 days', 'Career: moving from frontend into backend without starting over. Second session.', 'confirmed', 450000, now() - interval '4 days', 'paid'),
  ('43000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000010', 'consultation',
   now() + interval '8 days', 'Sanity check on our recommender plan before we commit a quarter to it.', 'pending', 550000, now() - interval '2 days', 'awaiting_confirmation'),
  ('43000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000006', 'mentoring',
   now() - interval '10 days', 'Airflow architecture review. Went long, in a good way.', 'completed', 350000, now() - interval '20 days', 'paid'),
  ('43000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000005', 'consultation',
   now() + interval '12 days', 'Portfolio review before I start applying for design-adjacent roles.', 'pending', 400000, now() - interval '1 day', 'unpaid')
ON CONFLICT DO NOTHING;

INSERT INTO agencies (id, owner_id, name, slug, logo_url, description, is_in_house, approval_status, created_at) VALUES
  ('50000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000011', 'Sinar Digital', 'sinar-digital',
   'https://api.dicebear.com/7.x/initials/svg?seed=Sinar%20Digital&backgroundColor=1d4ed8',
   'Product studio for logistics and retail. Eighteen people, mostly Jakarta, shipping since 2019.',
   false, 'approved', now() - interval '60 days'),
  ('50000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000007', 'Benteng Security', 'benteng-security',
   'https://api.dicebear.com/7.x/initials/svg?seed=Benteng&backgroundColor=166534',
   'Application security specialists. Pentests, threat modelling and security training for engineering teams.',
   false, 'approved', now() - interval '45 days'),
  ('50000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000002', 'Ruang Rupa Digital', 'ruang-rupa-digital',
   'https://api.dicebear.com/7.x/initials/svg?seed=Ruang%20Rupa&backgroundColor=7c3aed',
   'Design-led studio: brand, product design and design systems. Small by choice.',
   false, 'pending', now() - interval '12 days')

ON CONFLICT DO NOTHING;

UPDATE agencies
   SET logo_url = 'https://api.dicebear.com/7.x/initials/svg?seed=MasmasIT&backgroundColor=0f172a'
 WHERE id = '00000000-0000-0000-0000-000000000001' AND logo_url IS NULL;

INSERT INTO agency_services (id, agency_id, category, title, description, base_price, is_active, created_at)
SELECT v.id, a.id, v.category, v.title, v.description, v.base_price, v.is_active, v.created_at
FROM (VALUES
  ('51000000-0000-4000-a000-000000000001'::uuid, 'masmasit'::text, 'SaaS', 'MVP Build - 8 weeks',
   'A working product in eight weeks, not a prototype: auth, the core loop, payments if you need them, deployed and instrumented. Fixed scope, fixed price, weekly demos.',
   85000000, true, now() - interval '90 days'),
  ('51000000-0000-4000-a000-000000000002', 'masmasit', 'AI Solutions', 'RAG Assistant for Internal Docs',
   'A question-answering assistant over your own documents, with retrieval you can inspect and an evaluation set so you know when it gets worse.',
   65000000, true, now() - interval '88 days'),
  ('51000000-0000-4000-a000-000000000003', 'masmasit', 'HR Solutions', 'Team Augmentation',
   'Two to six practitioners from the community, assembled around your brief, contracted through us and graded before they start.',
   45000000, true, now() - interval '85 days'),
  ('51000000-0000-4000-a000-000000000004', 'sinar-digital', 'SaaS', 'Logistics Dashboard Implementation',
   'Order tracking, driver assignment and merchant reporting, built on your existing operations rather than replacing them.',
   120000000, true, now() - interval '58 days'),
  ('51000000-0000-4000-a000-000000000005', 'benteng-security', 'AI Solutions', 'LLM Application Security Review',
   'Prompt injection, data exfiltration paths, tool-use boundaries and output handling, reviewed against a written threat model.',
   55000000, true, now() - interval '40 days'),
  ('51000000-0000-4000-a000-000000000006', 'benteng-security', 'Creative Services', 'Security Training for Engineering Teams',
   'Two days, hands on, using your own codebase as the material. Teams leave with a backlog rather than a certificate.',
   35000000, true, now() - interval '38 days'),
  ('51000000-0000-4000-a000-000000000007', 'ruang-rupa-digital', 'Creative Services', 'Brand and Product Identity',
   'Naming, visual identity and a product design language that survives contact with engineering.',
   40000000, true, now() - interval '10 days')
) AS v(id, agency_slug, category, title, description, base_price, is_active, created_at)

LEFT JOIN agencies a ON a.slug = v.agency_slug
ON CONFLICT DO NOTHING;

INSERT INTO agency_projects (id, client_name, client_email, client_company, service_id, scope, budget, status,
                             dp_amount, created_at, dp_payment_status, final_payment_status) VALUES
  ('52000000-0000-4000-a000-000000000001', 'Putri Handayani', 'putri@example.com', 'Kopi Kenangan Baru',
   '51000000-0000-4000-a000-000000000001',
   'Loyalty app MVP: membership, points, and a redemption flow across 40 outlets. Eight weeks.',
   90000000, 'in_progress', 27000000, now() - interval '30 days', 'paid', 'unpaid'),
  ('52000000-0000-4000-a000-000000000002', 'Rangga Mahendra', 'rangga@example.com', 'Nusantara Logistics',
   '51000000-0000-4000-a000-000000000004',
   'Driver assignment and merchant reporting on top of the existing WMS.',
   135000000, 'approved', 40000000, now() - interval '18 days', 'awaiting_confirmation', 'unpaid'),
  ('52000000-0000-4000-a000-000000000003', 'Anisa Fitriani', 'anisa@example.com', 'Sehat Bersama',
   '51000000-0000-4000-a000-000000000002',
   'RAG assistant over clinical SOP documents for a 200-clinic network, with an evaluation set built from real support questions.',
   70000000, 'in_review', NULL, now() - interval '7 days', 'unpaid', 'unpaid'),
  ('52000000-0000-4000-a000-000000000004', 'Bayu Setiawan', 'bayu@example.com', 'Fintek Maju',
   '51000000-0000-4000-a000-000000000005',
   'Security review of an LLM-based customer support agent before public launch.',
   58000000, 'requested', NULL, now() - interval '2 days', 'unpaid', 'unpaid'),
  ('52000000-0000-4000-a000-000000000005', 'Sri Wahyuni', 'sri@example.com', 'Griya Furnitur',
   '51000000-0000-4000-a000-000000000001',
   'Catalogue and quotation MVP for a furniture manufacturer selling B2B.',
   80000000, 'completed', 24000000, now() - interval '120 days', 'paid', 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO case_studies (id, title, client_name, challenge, solution, result, image_url, category, created_at) VALUES
  ('a0000000-0000-4000-a000-000000000001', 'From spreadsheet to loyalty app in eight weeks', 'Griya Furnitur',
   'B2B quotations lived in a shared spreadsheet that three people edited at once. Nobody trusted the price a customer had been quoted the week before.',
   'A catalogue and quotation MVP with a single source of truth, built in eight weeks by a team of four assembled from the community.',
   'Quote turnaround went from two days to under an hour, and the spreadsheet was archived in month two.',
   'https://picsum.photos/seed/masmasit-case-1/960/600', 'SaaS', now() - interval '80 days'),
  ('a0000000-0000-4000-a000-000000000002', 'Cutting support volume by answering the obvious question', 'Nusantara Logistics',
   'Four in five support conversations were "where is my package", handled by humans, seven days a week.',
   'A WhatsApp bot wired to the tracking API, with a deliberate handoff to a human the moment it could not answer confidently.',
   'Support volume fell 62% in the first month, and average first-response time for the remaining tickets halved.',
   'https://picsum.photos/seed/masmasit-case-2/960/600', 'AI Solutions', now() - interval '55 days'),
  ('a0000000-0000-4000-a000-000000000003', 'A security baseline before diligence, not after', 'Fintek Maju',
   'A Series A process was starting and the engineering team had never had an external review.',
   'A two-week pentest plus a written report structured for a diligence team, followed by a remediation plan scheduled across three sprints.',
   'All high-severity findings closed before diligence opened, and the report went into the data room unchanged.',
   'https://picsum.photos/seed/masmasit-case-3/960/600', 'Security', now() - interval '30 days')
ON CONFLICT DO NOTHING;

INSERT INTO teams (id, owner_id, name, description, created_at) VALUES
  ('60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'Warung Stack',
   'Four people building point-of-sale tooling for small food businesses. We meet on Tuesdays and ship on Fridays.', now() - interval '70 days'),
  ('60000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009', 'Sinyal Labs',
   'An R&D group working on Indonesian-language retrieval. Half research, half product.', now() - interval '55 days'),
  ('60000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002', 'Rupa Collective',
   'Designers and one frontend engineer, taking on brand-plus-product work that is too big for one freelancer.', now() - interval '35 days')
ON CONFLICT DO NOTHING;

INSERT INTO team_members (id, team_id, user_id, role_title, created_at) VALUES
  ('62000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'Backend Lead', now() - interval '70 days'),
  ('62000000-0000-4000-a000-000000000002', '60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', 'Frontend Engineer', now() - interval '68 days'),
  ('62000000-0000-4000-a000-000000000003', '60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000005', 'Mobile Engineer', now() - interval '66 days'),
  ('62000000-0000-4000-a000-000000000004', '60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', 'Product Designer', now() - interval '60 days'),
  ('62000000-0000-4000-a000-000000000005', '60000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009', 'ML Lead', now() - interval '55 days'),
  ('62000000-0000-4000-a000-000000000006', '60000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000004', 'Data Engineer', now() - interval '52 days'),
  ('62000000-0000-4000-a000-000000000007', '60000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000003', 'Platform Engineer', now() - interval '50 days'),
  ('62000000-0000-4000-a000-000000000008', '60000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002', 'Design Lead', now() - interval '35 days'),
  ('62000000-0000-4000-a000-000000000009', '60000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000008', 'Frontend Engineer', now() - interval '33 days')
ON CONFLICT DO NOTHING;

INSERT INTO team_collabs (id, team_id, created_by, focus, description, status, matched_with, created_at) VALUES
  ('61000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001',
   'Offline-first POS for warungs',
   E'We have a working POS that runs without a network for up to three days and syncs when it reconnects. It is used by eleven warungs in Jakarta Timur today.\n\nWe are looking for a team with hardware or payments experience to work on the receipt-printer and QRIS side with us. Shared IP, split revenue, agreed before we start.',
   'open', NULL, now() - interval '30 days'),

  ('61000000-0000-4000-a000-000000000002', '60000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009',
   'Indonesian-language retrieval benchmark',
   E'Most retrieval benchmarks are English, and the ones that are not are translated rather than written. We are building an evaluation set from real Indonesian support and government documents.\n\nWe want a second team to help with annotation and to keep us honest about what "correct" means.',
   'matched', 'Rupa Collective', now() - interval '24 days'),

  ('61000000-0000-4000-a000-000000000003', '60000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002',
   'Design system as a shared product',
   E'We keep rebuilding the same components for different clients. We would like to build one open library properly, with a team that cares about the engineering side as much as we care about the design side.',
   'open', NULL, now() - interval '14 days')
ON CONFLICT DO NOTHING;

INSERT INTO discussions (id, user_id, title, body, is_featured, created_at) VALUES
  ('70000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001',
   'What is a fair freelance rate for backend work in Indonesia in 2026?',
   E'Rates here are opaque in a way that mostly hurts people early in their careers. I will start: I charge Rp450k/hour for consulting and Rp25-40jt for a two-week fixed-scope engagement, with seven years of experience and a payments specialisation.\n\nPost yours with years and speciality. Nobody has to use their real name, but the numbers should be real.',
   true, now() - interval '21 days'),

  ('70000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000003',
   'Is Kubernetes overkill for a team of five?',
   E'Genuine question, not bait. We run eleven services on three EC2 instances with systemd and a deploy script. It works. Every few months someone suggests we move to EKS and I cannot tell whether I am being prudent or just tired.\n\nWhat actually changed for you after the migration, and how long did it take to stop hurting?',
   false, now() - interval '16 days'),

  ('70000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000008',
   'How do you handle a client who keeps changing scope after signing?',
   E'Third time this year. Fixed-scope contract, and by week four there are six "small" additions that add up to another two weeks of work.\n\nI know the answer is "write a better contract", but I would like to hear how people actually have this conversation without losing the relationship.',
   false, now() - interval '12 days'),

  ('70000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000009',
   'Stop evaluating your RAG system on questions you wrote yourself',
   E'Every RAG demo I have reviewed this year was evaluated on questions the team invented while looking at the documents. Of course it scores well.\n\nBuild the eval set from real questions people asked before the system existed - support tickets, Slack, anything. The scores will be worse and the system will be better.',
   true, now() - interval '9 days'),

  ('70000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000006',
   'Anyone else find the "senior" title has stopped meaning anything?',
   E'Two years of experience and a senior title in one company, nine years and a mid title in another. I am not bitter about it, but it makes hiring conversations strange on both sides.\n\nHow are you all calibrating when you interview?',
   false, now() - interval '6 days'),

  ('70000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005',
   'Flutter or native in 2026, for a small team?',
   E'One app, two platforms, two mobile engineers. I have shipped both ways and I still do not have a rule I trust. Curious what people are choosing now and, more usefully, what made them regret it.',
   false, now() - interval '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO discussion_comments (id, discussion_id, user_id, body, created_at) VALUES
  ('71000000-0000-4000-a000-000000000001', '70000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000007',
   'Rp600k/hour, eight years, application security. Security rates run higher partly because the work is short and lumpy - I am not billing 40 hours a week and nobody should price as if they are.', now() - interval '20 days'),
  ('71000000-0000-4000-a000-000000000002', '70000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008',
   'Rp320k/hour, six years frontend. I undercharged for the first three of those and the only thing that fixed it was seeing threads exactly like this one.', now() - interval '19 days'),
  ('71000000-0000-4000-a000-000000000003', '70000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000004',
   'Rp350k/hour, data. One thing to add: quote the project, not the hour, once you can estimate reliably. Clients argue about rates and accept prices.', now() - interval '18 days'),
  ('71000000-0000-4000-a000-000000000004', '70000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001',
   'Eleven services on three boxes with a deploy script is a perfectly good architecture. The question is not Kubernetes, it is whether anything actually hurts right now. If nothing does, you have your answer.', now() - interval '15 days'),
  ('71000000-0000-4000-a000-000000000005', '70000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009',
   'We migrated at seven people. It took four months to stop hurting and the honest payoff was not scaling - it was that onboarding a new engineer went from two days to two hours.', now() - interval '14 days'),
  ('71000000-0000-4000-a000-000000000006', '70000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002',
   'I price a "change window" into every fixed-scope contract: one round of changes up to X hours included, anything beyond it quoted separately. It turns an argument into a menu.', now() - interval '11 days'),
  ('71000000-0000-4000-a000-000000000007', '70000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000010',
   'From the client side: usually we do not know we are changing scope. Say "that is a change, here is what it costs and what it moves" the first time it happens, not the sixth.', now() - interval '10 days'),
  ('71000000-0000-4000-a000-000000000008', '70000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000004',
   'This applies to dashboards too. Every metric anyone ever asked for in Slack is a better spec than the one written in the planning doc.', now() - interval '8 days'),
  ('71000000-0000-4000-a000-000000000009', '70000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000008',
   'Not mobile, but the team-size argument usually wins for me: two engineers maintaining two native codebases is really one engineer per platform, and one engineer per platform is a bus factor of one.', now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO builds (id, user_id, agency_id, title, description, link_url, image_url, source_type, promoted_to_spotlight, created_at)
SELECT v.id, v.user_id, a.id, v.title, v.description, v.link_url, v.image_url, v.source_type, v.promoted_to_spotlight, v.created_at
FROM (VALUES
  ('80000000-0000-4000-a000-000000000001'::uuid, 'd0000000-0000-4000-a000-000000000001'::uuid, NULL::text,
   'Warung POS', E'An offline-first point-of-sale for small food businesses. Runs for three days without a network and syncs when it reconnects, because that is what the reality of a warung in Jakarta Timur actually is.\n\nEleven shops using it daily. Built with four people on Tuesday evenings.',
   'https://example.com/warung-pos', 'https://picsum.photos/seed/masmasit-build-1/800/500', 'build', true, now() - interval '42 days'),

  ('80000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000009', NULL,
   'CariDoc', E'Indonesian-language document search that does not fall apart on informal writing or mixed English. Currently indexing public regulation documents as a proof of concept.\n\nThe interesting part is the evaluation set, not the model.',
   'https://example.com/caridoc', 'https://picsum.photos/seed/masmasit-build-2/800/500', 'solo_builder', true, now() - interval '33 days'),

  ('80000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000008', NULL,
   'Komponen', E'An open React component library with Indonesian-market defaults built in: rupiah formatting, NIK and NPWP inputs, Indonesian address forms, and date handling that assumes WIB rather than UTC.',
   'https://example.com/komponen', 'https://picsum.photos/seed/masmasit-build-3/800/500', 'build', false, now() - interval '25 days'),

  ('80000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000005', NULL,
   'Stok', E'Warehouse stock counting on Android. Barcode scanning, an offline queue, and sync that is deliberately boring to watch. Six warehouses, three months, zero lost counts.',
   'https://example.com/stok', 'https://picsum.photos/seed/masmasit-build-4/800/500', 'solo_builder', false, now() - interval '19 days'),

  ('80000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000003', NULL,
   'Deploy Kilat', E'A deploy pipeline template for small teams: GitHub Actions, a container build, and a Kubernetes rollout that finishes in under 100 seconds. Extracted from the one I run at work.',
   'https://example.com/deploy-kilat', 'https://picsum.photos/seed/masmasit-build-5/800/500', 'build', false, now() - interval '14 days'),

  ('80000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000007', 'benteng-security',
   'Periksa', E'A self-serve security checklist generator for Indonesian startups preparing for diligence. Answer 30 questions, get a prioritised backlog rather than a score.',
   'https://example.com/periksa', 'https://picsum.photos/seed/masmasit-build-6/800/500', 'agency', true, now() - interval '10 days'),

  ('80000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000002', 'ruang-rupa-digital',
   'Rupa UI Kit', E'A Figma design system with Indonesian typography and form patterns, released free. The paid part is the implementation, and we are fine saying that out loud.',
   'https://example.com/rupa-ui', 'https://picsum.photos/seed/masmasit-build-7/800/500', 'agency', false, now() - interval '6 days'),

  ('80000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000004', NULL,
   'Pipa', E'A minimal Airflow alternative for teams with fewer than twenty DAGs. Python, SQLite, and a UI that fits on one screen.',
   'https://example.com/pipa', 'https://picsum.photos/seed/masmasit-build-8/800/500', 'build', false, now() - interval '3 days')
) AS v(id, user_id, agency_slug, title, description, link_url, image_url, source_type, promoted_to_spotlight, created_at)
LEFT JOIN agencies a ON a.slug = v.agency_slug
ON CONFLICT DO NOTHING;

INSERT INTO build_likes (build_id, user_id, created_at) VALUES
  ('80000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', now() - interval '41 days'),
  ('80000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', now() - interval '40 days'),
  ('80000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000005', now() - interval '39 days'),
  ('80000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000008', now() - interval '38 days'),
  ('80000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000010', now() - interval '37 days'),
  ('80000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', now() - interval '32 days'),
  ('80000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000004', now() - interval '31 days'),
  ('80000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000006', now() - interval '30 days'),
  ('80000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000007', now() - interval '29 days'),
  ('80000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000002', now() - interval '24 days'),
  ('80000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000005', now() - interval '23 days'),
  ('80000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000010', now() - interval '18 days'),
  ('80000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000001', now() - interval '17 days'),
  ('80000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000001', now() - interval '13 days'),
  ('80000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000009', now() - interval '12 days'),
  ('80000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000011', now() - interval '9 days'),
  ('80000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000003', now() - interval '8 days'),
  ('80000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000008', now() - interval '5 days'),
  ('80000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000009', now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO articles (id, author_id, title, excerpt, body, cover_image_url, is_published, created_at) VALUES
  ('90000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000012',
   'Why MasmasIT is a community and a marketplace at the same time',
   'Most platforms pick one. Splitting them is what makes both worse.',
   E'A community without an economy loses its best people to the places that pay them. A marketplace without a community is a list of strangers bidding each other down.\n\nWe run both in one account on purpose. The discussion you join on Tuesday, the team you assemble on Wednesday and the invoice you send on Friday are the same career, so they should be the same product.\n\nThis post walks through the four routes a service reaches a buyer here, and why they all end at the same hiring step.',
   'https://picsum.photos/seed/masmasit-article-1/1200/630', true, now() - interval '30 days'),

  ('90000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000007',
   'The first 90 days as a company''s first security hire',
   'You will not fix everything. Here is the order that has worked for me twice.',
   E'Month one is listening. Read the incident history, sit in on code review, and find out who already knows where the problems are - there is always someone.\n\nMonth two is the baseline: a threat model for the two services that touch money or personal data, secrets out of chat, and a dependency policy somebody will actually follow.\n\nMonth three is the cadence. A pentest schedule, a security review step in the design process, and the beginnings of a culture where "I think this is a problem" is a normal thing to say in standup.',
   'https://picsum.photos/seed/masmasit-article-2/1200/630', true, now() - interval '18 days'),

  ('90000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000004',
   'Your analytics does not need a warehouse yet',
   'Three questions to ask before you spend a quarter on data infrastructure.',
   E'The nightly script is embarrassing and it is also, quite often, fine.\n\nAsk three questions first. Does anyone read the current numbers? Would a warehouse change a decision that is currently being made badly? And is the problem the infrastructure, or is it that nobody agrees what "active user" means?\n\nThe third one is the answer more often than anyone admits, and no amount of dbt fixes it.',
   'https://picsum.photos/seed/masmasit-article-3/1200/630', true, now() - interval '8 days'),

  ('90000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000002',
   'Design systems fail for organisational reasons, not technical ones',
   'The library is the easy part. Draft.',
   E'Draft - not published yet.',
   NULL, false, now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO messages (id, sender_id, recipient_id, body, read, created_at) VALUES
  ('b0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000001',
   'Hi Rizky - read your application for the Go role. Free for 30 minutes on Thursday?', true, now() - interval '8 days'),
  ('b0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000011',
   'Thursday works. Morning is better for me if you have a slot.', true, now() - interval '8 days'),
  ('b0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000001',
   '10:00 then. I will send a link.', false, now() - interval '7 days'),
  ('b0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002',
   'Your bid on the merchant dashboard is the one I keep coming back to. Can you talk through the research phase?', false, now() - interval '5 days'),
  ('b0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000001',
   'Thanks for the session yesterday - the note about learning Postgres before learning Go was the useful part.', true, now() - interval '3 days'),
  ('b0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000002',
   'Saw the Rupa collab post. We are looking for annotation help on the retrieval benchmark - worth a call?', false, now() - interval '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, body, link, is_read, created_at) VALUES
  ('b1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'application_status',
   'Your application is being reviewed', 'Bayarin moved your application for Senior Backend Engineer (Go) to reviewing.', '/jobs', false, now() - interval '9 days'),
  ('b1000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 'message',
   'New message from Hendra Wijaya', 'Hi Rizky - read your application for the Go role.', '/pesan', false, now() - interval '8 days'),
  ('b1000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000005', 'application_status',
   'You got the role', 'Sinar Digital accepted your application for Mobile Engineer (Flutter).', '/jobs', false, now() - interval '4 days'),
  ('b1000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000007', 'booking',
   'Booking confirmed', 'Hendra Wijaya confirmed a consultation with you.', '/dashboard', true, now() - interval '5 days'),
  ('b1000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000002', 'message',
   'New message from Dewi Anggraini', 'Your bid on the merchant dashboard is the one I keep coming back to.', '/pesan', false, now() - interval '5 days'),
  ('b1000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000002', 'agency',
   'Agency submitted for review', 'Ruang Rupa Digital is pending admin approval.', '/agency', false, now() - interval '12 days')
ON CONFLICT DO NOTHING;

INSERT INTO app_settings (id, talent_admin_fee_percentage, agency_admin_fee_percentage, agency_revenue_share_percentage,
                          job_fee_active, project_fee_active, lms_fee_active, event_fee_active)
SELECT 'f0000000-0000-4000-a000-000000000001', 15.00, 10.00, 10.00, false, false, true, true
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- [18/23] 20260921000000_018_seed_depth.sql

INSERT INTO course_materials (id, module_id, title, content_type, content_url, text_content) VALUES
  ('32000000-0000-4000-a000-000000000010', '31000000-0000-4000-a000-000000000003', 'Structured logs that survive a refactor', 'text', NULL,
   'A log line is an API. If you log a sentence, the only consumer is a human reading one line at a time. If you log fields, every consumer works: grep, a dashboard, an alert. We take a noisy service and convert its logging in one pass, then show what each change bought.'),
  ('32000000-0000-4000-a000-000000000011', '31000000-0000-4000-a000-000000000003', 'Metrics that answer a question', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL),
  ('32000000-0000-4000-a000-000000000012', '31000000-0000-4000-a000-000000000005', 'Staging, marts, and why the split matters', 'text', NULL,
   'Staging models rename and cast. Marts answer questions. Teams that skip the split end up with business logic scattered across forty files, and nobody can say which number is the real one. We build both layers for a small warehouse and then deliberately break the boundary to see the cost.'),
  ('32000000-0000-4000-a000-000000000013', '31000000-0000-4000-a000-000000000005', 'Tests that catch real breakage', 'text', NULL,
   'not_null and unique catch typos. The tests that save you are the ones encoding a business rule: every order has a customer, revenue never goes negative, yesterday never changes. We write six of those and watch one fail for a good reason.'),
  ('32000000-0000-4000-a000-000000000014', '31000000-0000-4000-a000-000000000007', 'Injection, as it appears in a pull request', 'text', NULL,
   'Nobody writes string concatenation into SQL on purpose. It arrives through a helper that took a table name, or a search filter that needed to be dynamic. We read four real-looking diffs and find the one that is exploitable.'),
  ('32000000-0000-4000-a000-000000000015', '31000000-0000-4000-a000-000000000007', 'Broken access control in review', 'video', 'https://www.youtube.com/watch?v=0SJE6b8Z5g0', NULL),
  ('32000000-0000-4000-a000-000000000016', '31000000-0000-4000-a000-000000000008', 'Retrieval before ranking', 'text', NULL,
   'The first stage decides the ceiling: a document that is never retrieved can never be ranked. We build a two-stage system, then measure how much recall the cheap first stage is quietly throwing away.'),
  ('32000000-0000-4000-a000-000000000017', '31000000-0000-4000-a000-000000000009', 'Offline metrics and what they hide', 'text', NULL,
   'Your offline metric improved by four points and the online test was flat. This lesson is about the four usual reasons, and how to tell which one you are looking at before you spend a quarter on it.'),
  ('32000000-0000-4000-a000-000000000018', '31000000-0000-4000-a000-000000000009', 'Building an honest evaluation set', 'text', NULL,
   'Questions written by the team that built the system are the wrong questions. We take a support inbox, sample it properly, and end up with an evaluation set that scores worse and predicts better.'),
  ('32000000-0000-4000-a000-000000000019', '31000000-0000-4000-a000-000000000011', 'Seq scan is not always the enemy', 'text', NULL,
   'On a small table a sequential scan is the right plan, and forcing an index makes it slower. We read six plans side by side and build the habit of asking what the planner knows that you do not.'),
  ('32000000-0000-4000-a000-000000000020', '31000000-0000-4000-a000-000000000011', 'Reading a nested loop', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, module_id, title, passing_grade) VALUES
  ('33000000-0000-4000-a000-000000000005', '31000000-0000-4000-a000-000000000002', 'Postgres access quiz', 70),
  ('33000000-0000-4000-a000-000000000006', '31000000-0000-4000-a000-000000000003', 'Observability quiz', 70),
  ('33000000-0000-4000-a000-000000000007', '31000000-0000-4000-a000-000000000005', 'dbt modelling quiz', 70),
  ('33000000-0000-4000-a000-000000000008', '31000000-0000-4000-a000-000000000007', 'Code review quiz', 70),
  ('33000000-0000-4000-a000-000000000009', '31000000-0000-4000-a000-000000000008', 'Candidate generation quiz', 70),
  ('33000000-0000-4000-a000-000000000010', '31000000-0000-4000-a000-000000000009', 'Evaluation quiz', 75),
  ('33000000-0000-4000-a000-000000000011', '31000000-0000-4000-a000-000000000011', 'Query plan quiz', 70)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
  ('34000000-0000-4000-a000-000000000010', '33000000-0000-4000-a000-000000000002', 'What does a DAG schedule interval control?', 'How often the DAG is parsed', 'How often a run is triggered', 'How many workers run it', 'How long a task may take', 'b'),
  ('34000000-0000-4000-a000-000000000011', '33000000-0000-4000-a000-000000000003', 'Who should own a threat model?', 'The security team alone', 'Nobody, it is a one-off document', 'The team that owns the service', 'An external auditor', 'c'),
  ('34000000-0000-4000-a000-000000000012', '33000000-0000-4000-a000-000000000003', 'Which finding is usually highest priority?', 'A missing security header', 'An outdated dependency with no known exploit', 'Broken access control on a money endpoint', 'A verbose error message', 'c'),
  ('34000000-0000-4000-a000-000000000013', '33000000-0000-4000-a000-000000000004', 'What does an empty OVER () clause mean?', 'The whole result set is one window', 'The window is a single row', 'The query is invalid', 'Rows are grouped by the first column', 'a'),
  ('34000000-0000-4000-a000-000000000014', '33000000-0000-4000-a000-000000000004', 'Which clause defines the rows inside a window?', 'PARTITION BY', 'FRAME', 'GROUP BY', 'HAVING', 'b'),
  ('34000000-0000-4000-a000-000000000015', '33000000-0000-4000-a000-000000000001', 'Where do shared helper packages usually belong?', 'cmd/', 'internal/', 'The repository root', 'A separate repository', 'b'),
  ('34000000-0000-4000-a000-000000000016', '33000000-0000-4000-a000-000000000002', 'What is the point of an idempotent task?', 'It runs faster', 'Re-running it is safe', 'It needs no scheduler', 'It cannot fail', 'b'),
  ('34000000-0000-4000-a000-000000000017', '33000000-0000-4000-a000-000000000005', 'When should a transaction wrap several writes?', 'Always, for performance', 'When the writes must all succeed or all fail', 'Only for reads', 'Never in Go', 'b'),
  ('34000000-0000-4000-a000-000000000018', '33000000-0000-4000-a000-000000000005', 'What does a connection pool limit protect?', 'Disk space', 'The database from too many concurrent connections', 'The Go garbage collector', 'TLS handshakes', 'b'),
  ('34000000-0000-4000-a000-000000000019', '33000000-0000-4000-a000-000000000005', 'Why prefer generated query code over reflection?', 'It is shorter', 'Errors surface at compile time', 'It avoids SQL entirely', 'It removes the need for indexes', 'b'),
  ('34000000-0000-4000-a000-000000000020', '33000000-0000-4000-a000-000000000006', 'What makes a log line useful to a dashboard?', 'Full sentences', 'Structured fields', 'Colour codes', 'Stack traces on every line', 'b'),
  ('34000000-0000-4000-a000-000000000021', '33000000-0000-4000-a000-000000000006', 'What should an alert correspond to?', 'Any error in the logs', 'A symptom a user would notice', 'Every deploy', 'CPU above 50 percent', 'b'),
  ('34000000-0000-4000-a000-000000000022', '33000000-0000-4000-a000-000000000006', 'What is a trace most useful for?', 'Counting requests', 'Seeing where latency is spent across services', 'Storing business data', 'Replacing logs', 'b'),
  ('34000000-0000-4000-a000-000000000023', '33000000-0000-4000-a000-000000000007', 'What belongs in a staging model?', 'Business logic', 'Renaming and casting', 'Executive metrics', 'Access control', 'b'),
  ('34000000-0000-4000-a000-000000000024', '33000000-0000-4000-a000-000000000007', 'Which dbt test is most likely to catch real breakage?', 'not_null on a surrogate key', 'A business rule such as revenue never negative', 'unique on an auto id', 'A row count above zero', 'b'),
  ('34000000-0000-4000-a000-000000000025', '33000000-0000-4000-a000-000000000007', 'Why document models as you build them?', 'It is required by dbt', 'Documentation written later describes what you wish you built', 'It speeds up compilation', 'It replaces tests', 'b'),
  ('34000000-0000-4000-a000-000000000026', '33000000-0000-4000-a000-000000000008', 'Which pattern most often hides an injection?', 'A parameterised query', 'A helper that accepts a table or column name', 'An ORM relation', 'A prepared statement', 'b'),
  ('34000000-0000-4000-a000-000000000027', '33000000-0000-4000-a000-000000000008', 'What is the reviewer looking for in an authorisation check?', 'That it exists somewhere', 'That it runs on the server for every path', 'That the UI hides the button', 'That the route is undocumented', 'b'),
  ('34000000-0000-4000-a000-000000000028', '33000000-0000-4000-a000-000000000008', 'Where do secrets belong?', 'In the repository, encrypted at rest', 'In a secret manager, injected at runtime', 'In a pinned chat message', 'In the CI log', 'b'),
  ('34000000-0000-4000-a000-000000000029', '33000000-0000-4000-a000-000000000009', 'Why does the first retrieval stage set the ceiling?', 'It is the slowest', 'A document never retrieved can never be ranked', 'It uses the largest model', 'It decides the response format', 'b'),
  ('34000000-0000-4000-a000-000000000030', '33000000-0000-4000-a000-000000000009', 'What does recall at k measure?', 'How many results are shown', 'How many relevant documents appear in the top k', 'How fast retrieval runs', 'How large the index is', 'b'),
  ('34000000-0000-4000-a000-000000000031', '33000000-0000-4000-a000-000000000009', 'When is a cheap first stage a problem?', 'Always', 'When it drops documents the ranker would have surfaced', 'When it is faster than the ranker', 'When the index is small', 'b'),
  ('34000000-0000-4000-a000-000000000032', '33000000-0000-4000-a000-000000000010', 'Where should evaluation questions come from?', 'The team that built the system', 'Real questions asked before the system existed', 'The model itself', 'The documentation headings', 'b'),
  ('34000000-0000-4000-a000-000000000033', '33000000-0000-4000-a000-000000000010', 'Offline metric up, online test flat. What is the usual cause?', 'The online test is broken', 'The offline set does not represent real traffic', 'The model is too small', 'Latency', 'b'),
  ('34000000-0000-4000-a000-000000000034', '33000000-0000-4000-a000-000000000010', 'Why freeze an evaluation set?', 'To save storage', 'So scores stay comparable over time', 'To speed up training', 'It is required by the library', 'b'),
  ('34000000-0000-4000-a000-000000000035', '33000000-0000-4000-a000-000000000011', 'What does a nested loop join do badly?', 'Small inputs', 'Large unindexed inner relations', 'Sorted inputs', 'Single row lookups', 'b'),
  ('34000000-0000-4000-a000-000000000036', '33000000-0000-4000-a000-000000000011', 'Estimated rows differ wildly from actual. What next?', 'Add an index', 'Check whether statistics are stale', 'Rewrite in a different language', 'Increase work_mem', 'b'),
  ('34000000-0000-4000-a000-000000000037', '33000000-0000-4000-a000-000000000011', 'When is a sequential scan the right plan?', 'Never', 'When the table is small or most rows are needed', 'Only on primary keys', 'Only inside transactions', 'b')
ON CONFLICT DO NOTHING;

INSERT INTO experiences (id, user_id, company, position, start_date, end_date, description) VALUES
  ('e0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000002', 'Tokomaju', 'UI Designer', '2017-02-01', '2019-12-31', 'Marketplace app, from a two-person design team to six.'),
  ('e0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000003', 'Logika Kirim', 'DevOps Engineer', '2017-01-01', '2019-08-31', 'Built the first CI pipeline and moved deploys off a shared laptop.'),
  ('e0000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000000004', 'Freelance', 'Data Engineer', '2022-04-01', NULL, 'Warehouse and pipeline work for three logistics and retail clients.'),
  ('e0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000004', 'Bayarin', 'Analytics Engineer', '2019-05-01', '2022-03-31', 'Owned the reporting stack through a 10x growth year.'),
  ('e0000000-0000-4000-a000-000000000014', 'd0000000-0000-4000-a000-000000000005', 'Griya Furnitur', 'Mobile Developer', '2021-06-01', NULL, 'Android and Flutter apps for field and warehouse teams.'),
  ('e0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000005', 'Tokomaju', 'Android Developer', '2019-01-01', '2021-05-31', 'Shopper app, offline cart and checkout.'),
  ('e0000000-0000-4000-a000-000000000016', 'd0000000-0000-4000-a000-000000000006', 'Sinar Digital', 'QA Engineer', '2021-02-01', NULL, 'End to end suites and load testing across four client products.'),
  ('e0000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000007', 'Benteng Security', 'Principal Consultant', '2020-03-01', NULL, 'Pentests and threat modelling for fintech and health clients.'),
  ('e0000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000007', 'Danain', 'Security Engineer', '2016-07-01', '2020-02-29', 'First security hire, built the baseline from nothing.'),
  ('e0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000008', 'Danain', 'Frontend Engineer', '2020-04-01', NULL, 'Design system and the merchant dashboard rebuild.'),
  ('e0000000-0000-4000-a000-000000000020', 'd0000000-0000-4000-a000-000000000008', 'Kreatif Studio', 'Web Developer', '2018-01-01', '2020-03-31', 'Client sites and a long tail of CMS work.'),
  ('e0000000-0000-4000-a000-000000000021', 'd0000000-0000-4000-a000-000000000010', 'Logika Kirim', 'Product Manager', '2021-01-01', NULL, 'Merchant and driver products, from brief to launch.'),
  ('e0000000-0000-4000-a000-000000000022', 'd0000000-0000-4000-a000-000000000010', 'Tokomaju', 'Associate PM', '2018-03-01', '2020-12-31', 'Checkout and payments squad.'),
  ('e0000000-0000-4000-a000-000000000023', 'd0000000-0000-4000-a000-000000000011', 'Sinar Digital', 'Chief Technology Officer', '2019-04-01', NULL, 'Eighteen people across three squads.'),
  ('e0000000-0000-4000-a000-000000000024', 'd0000000-0000-4000-a000-000000000011', 'Bayarin', 'Engineering Manager', '2016-01-01', '2019-03-31', 'Grew the payments team from four to fourteen.'),
  ('e0000000-0000-4000-a000-000000000025', 'd0000000-0000-4000-a000-000000000009', 'Danain', 'Machine Learning Engineer', '2019-02-01', '2021-07-31', 'Fraud scoring and the first recommender.'),
  ('e0000000-0000-4000-a000-000000000026', 'd0000000-0000-4000-a000-000000000012', 'MasmasIT', 'Platform Operations', '2025-01-01', NULL, 'Runs approvals, payments and community moderation.')
ON CONFLICT DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level, years_experience, verification_status)
SELECT us.user_id, s.id, us.level, us.years, 'self_declared'
FROM (VALUES
  ('d0000000-0000-4000-a000-000000000011'::uuid, 'Product Management'::text, 'expert'::text, 10),
  ('d0000000-0000-4000-a000-000000000011', 'AWS', 'advanced', 8),
  ('d0000000-0000-4000-a000-000000000011', 'PostgreSQL', 'advanced', 9),
  ('d0000000-0000-4000-a000-000000000012', 'Product Management', 'intermediate', 3),
  ('d0000000-0000-4000-a000-000000000010', 'Figma', 'intermediate', 4),
  ('d0000000-0000-4000-a000-000000000006', 'TypeScript', 'intermediate', 3),
  ('d0000000-0000-4000-a000-000000000003', 'Docker', 'expert', 6),
  ('d0000000-0000-4000-a000-000000000008', 'Tailwind CSS', 'advanced', 4),
  ('d0000000-0000-4000-a000-000000000009', 'Python', 'expert', 7),
  ('d0000000-0000-4000-a000-000000000002', 'Next.js', 'beginner', 1)
) AS us(user_id, skill_name, level, years)
JOIN skills s ON s.name = us.skill_name
ON CONFLICT DO NOTHING;

INSERT INTO discussion_comments (id, discussion_id, user_id, body, created_at) VALUES
  ('71000000-0000-4000-a000-000000000010', '70000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000011',
   'From the hiring side: I stopped reading the title years ago and started asking what the person owned and what broke. Two questions, and the calibration problem mostly disappears.', now() - interval '5 days'),
  ('71000000-0000-4000-a000-000000000011', '70000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000001',
   'Titles are compensation in disguise at small companies. Cheaper to give than a raise, and it costs the next employer nothing to ignore.', now() - interval '4 days'),
  ('71000000-0000-4000-a000-000000000012', '70000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000004',
   'What helped me was writing down what I actually want to be doing in two years. The title stopped mattering once the list existed.', now() - interval '3 days'),
  ('71000000-0000-4000-a000-000000000013', '70000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005',
   'I picked Flutter and the regret is not the framework, it is that platform channels became a third codebase nobody wanted to own.', now() - interval '2 days'),
  ('71000000-0000-4000-a000-000000000014', '70000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000003',
   'Ask what your CI looks like in each case. That answer moved us more than any feature comparison did.', now() - interval '1 day'),
  ('71000000-0000-4000-a000-000000000015', '70000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000009',
   'Adding one thing: keep the evaluation set frozen. The moment you edit it to make a number look better, it stops being a measurement.', now() - interval '7 days'),
  ('71000000-0000-4000-a000-000000000016', '70000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000006',
   'Same in QA. The test suite written by the person who wrote the feature passes for reasons that have nothing to do with the feature working.', now() - interval '6 days'),
  ('71000000-0000-4000-a000-000000000017', '70000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000011',
   'We stayed on systemd for two more years after asking this and never regretted it. The migration finally happened when onboarding, not scale, became the pain.', now() - interval '13 days'),
  ('71000000-0000-4000-a000-000000000018', '70000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000005',
   'Rp300k/hour, five years mobile. Add travel and device testing time to your quote, it is real work and it is always forgotten.', now() - interval '17 days'),
  ('71000000-0000-4000-a000-000000000019', '70000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000001',
   'The sentence that works for me: happy to do it, here is the new date. Nobody argues with a date the way they argue with an invoice.', now() - interval '9 days')
ON CONFLICT DO NOTHING;

INSERT INTO job_applications (id, job_id, user_id, status, cover_letter, created_at) VALUES
  ('1a000000-0000-4000-a000-000000000010', '10000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000008', 'pending',
   'I know this is aimed at students, but I am switching from frontend to backend and would rather start from the bottom with a service to own than fake seniority.', now() - interval '11 days'),
  ('1a000000-0000-4000-a000-000000000011', '10000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000006', 'reviewing',
   'Four years in QA, and the part I keep enjoying most is writing the harness rather than the tests. Six months to find out if that instinct is right.', now() - interval '9 days'),
  ('1a000000-0000-4000-a000-000000000012', '10000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000011', 'rejected',
   'Applied before the role closed. Nine engineers is the size I have run twice.', now() - interval '45 days'),
  ('1a000000-0000-4000-a000-000000000013', '10000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000002', 'pending',
   'Designer applying to a frontend role on purpose: I want the implementation half of the design system, not the handoff.', now() - interval '5 days'),
  ('1a000000-0000-4000-a000-000000000014', '10000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000009', 'pending',
   'ML side rather than pure data, but the warehouse is where my models keep getting blocked. Happy to own both.', now() - interval '8 hours')
ON CONFLICT DO NOTHING;

INSERT INTO event_rsvps (id, event_id, user_id, status, created_at, payment_status) VALUES
  ('42000000-0000-4000-a000-000000000011', '41000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000004', 'registered', now() - interval '8 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000012', '41000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000001', 'registered', now() - interval '7 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000013', '41000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000009', 'registered', now() - interval '6 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000014', '41000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000008', 'registered', now() - interval '6 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000015', '41000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000002', 'registered', now() - interval '5 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000016', '41000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000011', 'registered', now() - interval '4 days', 'paid'),
  ('42000000-0000-4000-a000-000000000017', '41000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000010', 'registered', now() - interval '3 days', 'awaiting_confirmation'),
  ('42000000-0000-4000-a000-000000000018', '41000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000007', 'registered', now() - interval '2 days', 'paid'),
  ('42000000-0000-4000-a000-000000000019', '41000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000005', 'registered', now() - interval '4 days', 'unpaid'),
  ('42000000-0000-4000-a000-000000000020', '41000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000008', 'registered', now() - interval '3 days', 'awaiting_confirmation')
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, talent_id, client_id, booking_type, scheduled_at, notes, status, amount, created_at, payment_status) VALUES
  ('43000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000010', 'consultation',
   now() + interval '6 days', 'Scoping the stock-count app before we write the brief properly.', 'confirmed', 300000, now() - interval '3 days', 'paid'),
  ('43000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000006', 'mentoring',
   now() + interval '9 days', 'Frontend architecture review, second of four sessions.', 'confirmed', 320000, now() - interval '2 days', 'paid'),
  ('43000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'consultation',
   now() - interval '6 days', 'Ledger design review. Notes shared afterwards.', 'completed', 450000, now() - interval '20 days', 'paid'),
  ('43000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000010', 'mentoring',
   now() + interval '14 days', 'Threat modelling walkthrough for the logistics team.', 'pending', 600000, now() - interval '1 day', 'unpaid'),
  ('43000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000011', 'consultation',
   now() - interval '15 days', 'Search relevance audit. Follow-up booked separately.', 'completed', 550000, now() - interval '30 days', 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO messages (id, sender_id, recipient_id, body, read, created_at) VALUES
  ('b0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000001', 'Ledger review was useful, thanks. Sending the revised schema tomorrow.', true, now() - interval '6 days'),
  ('b0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', 'Take your time. The part I would revisit first is the settlement boundary.', true, now() - interval '6 days'),
  ('b0000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000004', 'Booked the Airflow session. Anything I should read first?', true, now() - interval '22 days'),
  ('b0000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000006', 'Just bring your current DAG. We will read it together, that is more useful than prep.', false, now() - interval '21 days'),
  ('b0000000-0000-4000-a000-000000000014', 'd0000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000005', 'Saw the Stok build. We have six warehouses with the same problem, worth a call?', false, now() - interval '4 days'),
  ('b0000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000010', 'Yes. Thursday afternoon works, I will send times.', false, now() - interval '4 days'),
  ('b0000000-0000-4000-a000-000000000016', 'd0000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000000002', 'Your agency submission is in the queue. One question about the catalogue before I approve it.', false, now() - interval '10 days'),
  ('b0000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000011', 'Report is ready. Two highs, both fixable this sprint. Sending it through now.', true, now() - interval '3 days'),
  ('b0000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000007', 'Perfect timing. Diligence opens Monday.', false, now() - interval '3 days'),
  ('b0000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000004', 'Annotation guidelines drafted. Want to review before we hand them to the team?', false, now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO project_reviews (id, project_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
  ('2c000000-0000-4000-a000-000000000002', '20000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000007', 5,
   'The report was written for the people who had to read it, not to show off the testing. Every high was closed before diligence opened.', now() - interval '12 days'),
  ('2c000000-0000-4000-a000-000000000003', '20000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000010', 5,
   'Clear brief, fast answers, paid on the day. The kind of client that makes fixed scope actually work.', now() - interval '7 days')
ON CONFLICT DO NOTHING;

INSERT INTO certificates (id, course_id, user_id, issued_at) VALUES
  ('38000000-0000-4000-a000-000000000002', '30000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', now() - interval '20 days'),
  ('38000000-0000-4000-a000-000000000003', '30000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000005', now() - interval '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO module_completions (id, enrollment_id, module_id, user_id, completed_at) VALUES
  ('36000000-0000-4000-a000-000000000010', '35000000-0000-4000-a000-000000000001', '31000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000003', now() - interval '21 days'),
  ('36000000-0000-4000-a000-000000000011', '35000000-0000-4000-a000-000000000006', '31000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000005', now() - interval '7 days'),
  ('36000000-0000-4000-a000-000000000012', '35000000-0000-4000-a000-000000000003', '31000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000001', now() - interval '18 days')
ON CONFLICT DO NOTHING;

INSERT INTO quiz_submissions (id, quiz_id, user_id, score, passed, answers, created_at) VALUES
  ('37000000-0000-4000-a000-000000000005', '33000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000003', 100, true, '{"1":"b","2":"b","3":"b"}'::jsonb, now() - interval '21 days'),
  ('37000000-0000-4000-a000-000000000006', '33000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000003', 67, false, '{"1":"b","2":"b","3":"a"}'::jsonb, now() - interval '34 days'),
  ('37000000-0000-4000-a000-000000000007', '33000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000005', 100, true, '{"1":"b","2":"b","3":"b"}'::jsonb, now() - interval '7 days'),
  ('37000000-0000-4000-a000-000000000008', '33000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000001', 100, true, '{"1":"b","2":"a","3":"b"}'::jsonb, now() - interval '18 days')
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, detail, created_at) VALUES
  ('c1000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000012', 'approve', 'company', 'c0000000-0000-4000-a000-000000000001', '{"from":"pending","to":"approved","name":"Sinar Digital"}'::jsonb, now() - interval '29 days'),
  ('c1000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000012', 'approve', 'company', 'c0000000-0000-4000-a000-000000000002', '{"from":"pending","to":"approved","name":"Bayarin"}'::jsonb, now() - interval '26 days'),
  ('c1000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000012', 'approve', 'agency', '50000000-0000-4000-a000-000000000002', '{"from":"pending","to":"approved","name":"Sinar Digital"}'::jsonb, now() - interval '59 days'),
  ('c1000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000012', 'approve', 'agency', '50000000-0000-4000-a000-000000000003', '{"from":"pending","to":"approved","name":"Benteng Security"}'::jsonb, now() - interval '44 days'),
  ('c1000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000012', 'approve', 'talent', 'd0000000-0000-4000-a000-000000000001', '{"from":"pending","to":"approved"}'::jsonb, now() - interval '80 days'),
  ('c1000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000012', 'approve', 'coach', 'd0000000-0000-4000-a000-000000000004', '{"from":"pending","to":"approved"}'::jsonb, now() - interval '70 days'),
  ('c1000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000012', 'approve', 'event', '41000000-0000-4000-a000-000000000002', '{"from":"pending","to":"approved","title":"Kubernetes Workshop"}'::jsonb, now() - interval '17 days'),
  ('c1000000-0000-4000-a000-000000000008', 'd0000000-0000-4000-a000-000000000012', 'confirm_payment', 'booking', '43000000-0000-4000-a000-000000000001', '{"amount":600000,"method":"lynk.id"}'::jsonb, now() - interval '5 days'),
  ('c1000000-0000-4000-a000-000000000009', 'd0000000-0000-4000-a000-000000000012', 'confirm_payment', 'enrollment', '35000000-0000-4000-a000-000000000001', '{"amount":450000,"method":"lynk.id"}'::jsonb, now() - interval '39 days'),
  ('c1000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000012', 'feature', 'discussion', '70000000-0000-4000-a000-000000000001', '{"is_featured":true}'::jsonb, now() - interval '20 days'),
  ('c1000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000012', 'feature', 'discussion', '70000000-0000-4000-a000-000000000004', '{"is_featured":true}'::jsonb, now() - interval '8 days'),
  ('c1000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000000012', 'promote', 'build', '80000000-0000-4000-a000-000000000001', '{"promoted_to_spotlight":true}'::jsonb, now() - interval '40 days'),
  ('c1000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000012', 'match', 'team_collab', '61000000-0000-4000-a000-000000000002', '{"status":"matched","matched_with":"Rupa Collective"}'::jsonb, now() - interval '22 days'),
  ('c1000000-0000-4000-a000-000000000014', 'd0000000-0000-4000-a000-000000000012', 'publish', 'article', '90000000-0000-4000-a000-000000000002', '{"is_published":true}'::jsonb, now() - interval '18 days')
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, body, link, is_read, created_at) VALUES
  ('b1000000-0000-4000-a000-000000000010', 'd0000000-0000-4000-a000-000000000003', 'booking', 'Session completed', 'Your consultation with Rizky Pratama is marked complete.', '/dashboard', true, now() - interval '6 days'),
  ('b1000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000004', 'course', 'New enrolment', 'Somebody enrolled in Data Pipelines with Airflow and dbt.', '/courses', false, now() - interval '24 days'),
  ('b1000000-0000-4000-a000-000000000012', 'd0000000-0000-4000-a000-000000000006', 'course', 'Certificate issued', 'You completed Application Security for Developers.', '/courses', false, now() - interval '15 days'),
  ('b1000000-0000-4000-a000-000000000013', 'd0000000-0000-4000-a000-000000000008', 'application', 'Application received', 'Sinar Digital received your application for Frontend Engineer.', '/jobs', true, now() - interval '6 days'),
  ('b1000000-0000-4000-a000-000000000014', 'd0000000-0000-4000-a000-000000000009', 'team_collab', 'Collab matched', 'Sinyal Labs was matched with Rupa Collective.', '/team-collabs', false, now() - interval '22 days'),
  ('b1000000-0000-4000-a000-000000000015', 'd0000000-0000-4000-a000-000000000010', 'project', 'New bid', 'Your merchant dashboard brief received a new bid.', '/projects', false, now() - interval '11 days'),
  ('b1000000-0000-4000-a000-000000000016', 'd0000000-0000-4000-a000-000000000011', 'project', 'Bid accepted', 'You accepted a bid on Security audit before Series A.', '/projects', true, now() - interval '24 days'),
  ('b1000000-0000-4000-a000-000000000017', 'd0000000-0000-4000-a000-000000000012', 'admin', 'Approval queue', 'One agency is waiting for review.', '/admin', false, now() - interval '12 days'),
  ('b1000000-0000-4000-a000-000000000018', 'd0000000-0000-4000-a000-000000000005', 'event', 'Event soon', 'Kubernetes Workshop starts in three weeks.', '/events', false, now() - interval '9 days'),
  ('b1000000-0000-4000-a000-000000000019', 'd0000000-0000-4000-a000-000000000002', 'build', 'Your build was liked', 'Rupa UI Kit reached its first likes.', '/builds', false, now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- [19/23] 20260921000100_019_app_settings_singleton.sql

DELETE FROM app_settings a
USING app_settings b
WHERE a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS app_settings_singleton ON app_settings ((true));

-- [20/23] 20260921000200_020_seed_more_users.sql

DO $$
DECLARE
  d record;
  pw text := 'Demo1234!';
BEGIN
  FOR d IN
    SELECT * FROM (VALUES
      (13,'arif@demo.masmasit.online','Arif Rahman','Jakarta','Mobile Engineer'),
      (14,'citra@demo.masmasit.online','Citra Melati','Bandung','Data Engineer'),
      (15,'dimas@demo.masmasit.online','Dimas Prakoso','Surabaya','Site Reliability Engineer'),
      (16,'eka@demo.masmasit.online','Eka Puspita','Yogyakarta','UX Researcher'),
      (17,'faisal@demo.masmasit.online','Faisal Akbar','Jakarta','Backend Engineer'),
      (18,'gita@demo.masmasit.online','Gita Ramadhani','Bandung','Frontend Engineer'),
      (19,'hendro@demo.masmasit.online','Hendro Wibowo','Semarang','Solutions Architect'),
      (20,'indah@demo.masmasit.online','Indah Permatasari','Denpasar','Product Designer'),
      (21,'joko@demo.masmasit.online','Joko Susilo','Malang','Backend Engineer'),
      (22,'kartika@demo.masmasit.online','Kartika Dewi','Jakarta','Data Analyst'),
      (23,'lukman@demo.masmasit.online','Lukman Hakim','Medan','Security Engineer'),
      (24,'mira@demo.masmasit.online','Mira Anggraeni','Makassar','Frontend Engineer'),
      (25,'naufal@demo.masmasit.online','Naufal Ardiansyah','Jakarta','DevOps Engineer'),
      (26,'oka@demo.masmasit.online','Oka Pradipta','Denpasar','Full-stack Engineer'),
      (27,'putra@demo.masmasit.online','Putra Wijaya','Surabaya','Engineering Manager'),
      (28,'ratna@demo.masmasit.online','Ratna Sari','Bandung','QA Engineer'),
      (29,'satria@demo.masmasit.online','Satria Nugroho','Yogyakarta','Machine Learning Engineer'),
      (30,'tiara@demo.masmasit.online','Tiara Ayu','Jakarta','Product Manager')
    ) AS v(n, email, full_name, location, role_title)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      ('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid,
      'authenticated','authenticated', d.email,
      extensions.crypt(pw, extensions.gen_salt('bf')),
      now(), now() - ((100 - d.n) || ' days')::interval, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', d.full_name),
      '','','',''
    ) ON CONFLICT DO NOTHING;

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      ('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid,
      ('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0')),
      jsonb_build_object(
        'sub', ('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0')),
        'email', d.email, 'email_verified', true),
      'email', now(), now() - ((100 - d.n) || ' days')::interval, now()
    ) ON CONFLICT DO NOTHING;

    INSERT INTO profiles (
      id, email, full_name, bio, avatar_url, location, current_job_status,
      linkedin_url, whatsapp, is_coach, is_talent, coach_approved, talent_approved,
      hourly_rate, created_at
    ) VALUES (
      ('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid,
      d.email, d.full_name,
      d.role_title || ' based in ' || d.location || '. Active in the community, open to interesting work.',
      'https://api.dicebear.com/7.x/initials/svg?seed=' || replace(d.full_name, ' ', '%20'),
      d.location,
      (ARRAY['open_to_work','employed','freelance'])[1 + (d.n % 3)],
      'https://linkedin.com/in/demo-' || split_part(d.email, '@', 1),
      '+62811000000' || lpad(d.n::text, 2, '0'),
      (d.n % 5 = 0), (d.n % 3 = 0),
      CASE WHEN d.n % 5 = 0 THEN 'approved' ELSE 'pending' END,
      CASE WHEN d.n % 3 = 0 THEN 'approved' ELSE 'pending' END,
      250000 + (d.n % 8) * 50000,
      now() - ((100 - d.n) || ' days')::interval
    ) ON CONFLICT DO NOTHING;

    INSERT INTO user_roles (user_id, role)
    VALUES (('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid, 'member')
    ON CONFLICT DO NOTHING;

    IF d.n % 3 = 0 THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid, 'talent')
      ON CONFLICT DO NOTHING;
    END IF;
    IF d.n % 5 = 0 THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid, 'coach')
      ON CONFLICT DO NOTHING;
    END IF;
    IF d.n % 7 = 0 THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (('d0000000-0000-4000-a000-0000000000' || lpad(d.n::text, 2, '0'))::uuid, 'client')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE VIEW demo_members AS
SELECT p.id, p.full_name, p.location,
       (row_number() OVER (ORDER BY p.email))::int - 1 AS n
FROM profiles p
WHERE p.email LIKE '%@demo.masmasit.online'
  AND p.email <> 'admin@demo.masmasit.online';

INSERT INTO discussions (id, user_id, title, body, is_featured, created_at)
SELECT md5('demo-disc-' || m.id::text)::uuid, m.id,
  (ARRAY[
    'How do you keep a side project alive past month three?',
    'What is the smallest team you have shipped something real with?',
    'Remote, hybrid or office: what actually changed for you in 2026?',
    'Which part of your stack would you not choose again?',
    'How do you decide what to learn next without chasing hype?',
    'What does a good code review look like on your team?'
  ])[1 + (m.n % 6)],
  'Asking because I keep going back and forth on this. '
  || (ARRAY[
    'Context: small team, limited time, and a backlog that grows faster than it shrinks.',
    'I have tried two approaches and neither felt obviously right, so I want to hear what worked for other people here.',
    'Happy to be told I am overthinking it, that would also be a useful answer.',
    'Specifically interested in what you would do differently rather than what went well.'
  ])[1 + (m.n % 4)],
  false,
  now() - ((5 + m.n) || ' days')::interval
FROM demo_members m
ON CONFLICT DO NOTHING;

INSERT INTO discussion_comments (id, discussion_id, user_id, body, created_at)
SELECT md5('demo-cmt-' || m.id::text || '-' || k)::uuid,
       d.id, m.id,
       (ARRAY[
         'The thing that changed it for me was making the next step smaller than felt reasonable.',
         'We tried this and the honest answer is it depends on how much slack the team has.',
         'Counterpoint: the constraint you are describing is usually a symptom, not the problem.',
         'Same experience here, though it took us about two quarters to admit it.',
         'Worth separating what is genuinely hard from what is just unfamiliar.',
         'I would ask what happens if you do nothing for another month. Often that is the answer.'
       ])[1 + ((m.n + k) % 6)],
       now() - ((3 + m.n) || ' days')::interval + (k || ' hours')::interval
FROM demo_members m
CROSS JOIN generate_series(1, 2) AS k
JOIN LATERAL (
  SELECT x.id FROM discussions x
  WHERE x.user_id <> m.id
  ORDER BY md5(x.id::text || m.id::text || k::text)
  LIMIT 1
) d ON true
ON CONFLICT DO NOTHING;

INSERT INTO builds (id, user_id, agency_id, title, description, link_url, image_url,
                    source_type, promoted_to_spotlight, created_at)
SELECT md5('demo-build-' || m.id::text)::uuid, m.id, NULL,
  (ARRAY['Catatan','Antri','Rekap','Sinyal','Tumpuk','Lacak','Putar','Sedia'])[1 + (m.n % 8)]
    || ' ' || split_part(m.full_name, ' ', 1),
  'A small tool that came out of a problem at work and turned out to be useful to other people too. '
  || (ARRAY[
    'Runs on a single container and needs no database for the first thousand users.',
    'Built over four weekends, and rewritten once when the first data model stopped fitting.',
    'Used daily by a team of six, which is the only benchmark I trust so far.',
    'Open source, because the interesting part is the approach rather than the code.'
  ])[1 + (m.n % 4)],
  'https://example.com/' || lower(split_part(m.full_name, ' ', 1)) || '-build',
  'https://picsum.photos/seed/masmasit-m' || m.n || '/800/500',
  CASE WHEN m.n % 4 = 0 THEN 'solo_builder' ELSE 'build' END,
  (m.n % 9 = 0),
  now() - ((4 + m.n) || ' days')::interval
FROM demo_members m
ON CONFLICT DO NOTHING;

INSERT INTO build_likes (build_id, user_id, created_at)
SELECT b.id, m.id, now() - ((2 + m.n) || ' days')::interval
FROM demo_members m
CROSS JOIN generate_series(1, 3) AS k
JOIN LATERAL (
  SELECT x.id FROM builds x
  WHERE x.user_id <> m.id
  ORDER BY md5(x.id::text || m.id::text || k::text)
  LIMIT 1
) b ON true
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (id, course_id, user_id, status, progress, enrolled_at, payment_status)
SELECT md5('demo-enrol-' || m.id::text)::uuid, c.id, m.id,
       (ARRAY['active','active','completed'])[1 + (m.n % 3)],
       (m.n * 7) % 101,
       now() - ((6 + m.n) || ' days')::interval,
       'paid'
FROM demo_members m
JOIN LATERAL (
  SELECT x.id FROM courses x ORDER BY md5(x.id::text || m.id::text) LIMIT 1
) c ON true
ON CONFLICT DO NOTHING;

INSERT INTO job_applications (id, job_id, user_id, status, cover_letter, created_at)
SELECT md5('demo-app-' || m.id::text)::uuid, j.id, m.id,
       (ARRAY['pending','pending','reviewing','rejected'])[1 + (m.n % 4)],
       'Applying because the scope matches what I have been doing for the last couple of years. '
       || 'Happy to walk through a specific example on a call.',
       now() - ((3 + m.n) || ' days')::interval
FROM demo_members m
JOIN LATERAL (
  SELECT x.id FROM jobs x WHERE x.status = 'open'
  ORDER BY md5(x.id::text || m.id::text) LIMIT 1
) j ON true
ON CONFLICT DO NOTHING;

INSERT INTO project_bids (id, project_id, user_id, amount, proposal, eta_days, status, created_at)
SELECT md5('demo-bid-' || m.id::text)::uuid, p.id, m.id,
       20000000 + (m.n % 10) * 3500000,
       'I would start by agreeing what done looks like for the first milestone, then work backwards from there. '
       || 'Weekly demos, and a written note each Friday so nothing is a surprise.',
       20 + (m.n % 6) * 5,
       (ARRAY['pending','pending','pending','rejected'])[1 + (m.n % 4)],
       now() - ((2 + m.n) || ' days')::interval
FROM demo_members m
JOIN LATERAL (
  SELECT x.id FROM projects x WHERE x.status = 'open'
  ORDER BY md5(x.id::text || m.id::text) LIMIT 1
) p ON true
ON CONFLICT DO NOTHING;

INSERT INTO event_rsvps (id, event_id, user_id, status, created_at, payment_status)
SELECT md5('demo-rsvp-' || m.id::text || '-' || k)::uuid, e.id, m.id,
       'registered', now() - ((4 + m.n) || ' days')::interval,
       CASE WHEN e.is_paid THEN 'paid' ELSE 'unpaid' END
FROM demo_members m
CROSS JOIN generate_series(1, 2) AS k
JOIN LATERAL (
  SELECT x.id, x.is_paid FROM events x
  ORDER BY md5(x.id::text || m.id::text || k::text) LIMIT 1
) e ON true
ON CONFLICT DO NOTHING;

INSERT INTO messages (id, sender_id, recipient_id, body, read, created_at)
SELECT md5('demo-msg-' || m.id::text || '-' || k)::uuid, m.id, r.id,
       (ARRAY[
         'Hi, saw your build and had a question about how you handled the offline case.',
         'Are you going to the meetup this month? Would be good to compare notes.',
         'Thanks for the reply on that thread, it saved me a week of the wrong approach.',
         'Do you have half an hour this week? Want to ask about your setup.'
       ])[1 + ((m.n + k) % 4)],
       (k = 1),
       now() - ((3 + m.n) || ' days')::interval + (k || ' hours')::interval
FROM demo_members m
CROSS JOIN generate_series(1, 2) AS k
JOIN LATERAL (
  SELECT x.id FROM demo_members x WHERE x.id <> m.id
  ORDER BY md5(x.id::text || m.id::text || k::text) LIMIT 1
) r ON true
ON CONFLICT DO NOTHING;

INSERT INTO experiences (id, user_id, company, position, start_date, end_date, description)
SELECT md5('demo-exp-' || m.id::text || '-' || k)::uuid, m.id,
       (ARRAY['Sinar Digital','Bayarin','Logika Kirim','Tokomaju','Danain','Rekomendo','Kreatif Studio','Griya Furnitur'])[1 + ((m.n + k) % 8)],
       (ARRAY['Engineer','Senior Engineer','Lead Engineer','Consultant'])[1 + ((m.n + k) % 4)],
       (date '2016-01-01' + ((m.n + k) * 47 || ' days')::interval)::date,
       CASE WHEN k = 1 THEN NULL
            ELSE (date '2016-01-01' + ((m.n + k) * 47 + 900 || ' days')::interval)::date END,
       'Worked across product and platform, mostly on the parts nobody volunteers for.'
FROM demo_members m
CROSS JOIN generate_series(1, 2) AS k
ON CONFLICT DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level, years_experience, verification_status)
SELECT m.id, s.id,
       (ARRAY['beginner','intermediate','advanced','expert'])[1 + ((m.n + s.rn) % 4)],
       1 + ((m.n + s.rn) % 9),
       'self_declared'
FROM demo_members m
JOIN LATERAL (
  SELECT x.id, row_number() OVER (ORDER BY md5(x.id::text || m.id::text)) AS rn
  FROM skills x
  ORDER BY md5(x.id::text || m.id::text)
  LIMIT 3
) s ON true
ON CONFLICT DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, body, link, is_read, created_at)
SELECT md5('demo-notif-' || m.id::text || '-' || k)::uuid, m.id,
       (ARRAY['message','application','build','event'])[1 + ((m.n + k) % 4)],
       (ARRAY['New message','Application update','Your build was liked','Event reminder'])[1 + ((m.n + k) % 4)],
       (ARRAY['Somebody replied to you.','Your application moved to reviewing.','Your build picked up new likes.','An event you joined starts soon.'])[1 + ((m.n + k) % 4)],
       (ARRAY['/pesan','/jobs','/builds','/events'])[1 + ((m.n + k) % 4)],
       (k = 1),
       now() - ((2 + m.n) || ' days')::interval + (k || ' hours')::interval
FROM demo_members m
CROSS JOIN generate_series(1, 2) AS k
ON CONFLICT DO NOTHING;

INSERT INTO team_members (id, team_id, user_id, role_title, created_at)
SELECT md5('demo-tm-' || m.id::text)::uuid, tm.id, m.id,
       (ARRAY['Engineer','Designer','Data','Platform','Product'])[1 + (m.n % 5)],
       now() - ((10 + m.n) || ' days')::interval
FROM demo_members m
JOIN LATERAL (
  SELECT x.id FROM teams x ORDER BY md5(x.id::text || m.id::text) LIMIT 1
) tm ON true
WHERE m.n % 2 = 0
ON CONFLICT DO NOTHING;

DROP VIEW IF EXISTS demo_members;

-- [21/23] 20260921000300_021_admin_user_activity.sql

CREATE OR REPLACE FUNCTION admin_user_activity()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  location text,
  roles text[],
  joined_at timestamptz,
  last_active_at timestamptz,
  jobs_posted bigint,
  job_applications bigint,
  projects_posted bigint,
  project_bids bigint,
  courses_taught bigint,
  enrollments bigint,
  certificates bigint,
  events_created bigint,
  event_rsvps bigint,
  bookings_as_talent bigint,
  bookings_as_client bigint,
  discussions bigint,
  discussion_comments bigint,
  builds bigint,
  build_likes bigint,
  teams_owned bigint,
  team_memberships bigint,
  team_collabs bigint,
  agencies_owned bigint,
  articles bigint,
  messages_sent bigint,
  experiences bigint,
  skills bigint,
  total_records bigint,
  features_used int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id, p.full_name, p.email, p.avatar_url, p.location, p.created_at,
      COALESCE((SELECT array_agg(r.role ORDER BY r.role) FROM user_roles r WHERE r.user_id = p.id), ARRAY[]::text[]) AS roles,
      (SELECT count(*) FROM jobs j JOIN companies c ON c.id = j.company_id WHERE c.user_id = p.id) AS c_jobs,
      (SELECT count(*) FROM job_applications x WHERE x.user_id = p.id) AS c_apps,
      (SELECT count(*) FROM projects x WHERE x.user_id = p.id) AS c_projects,
      (SELECT count(*) FROM project_bids x WHERE x.user_id = p.id) AS c_bids,
      (SELECT count(*) FROM courses x WHERE x.coach_id = p.id) AS c_courses,
      (SELECT count(*) FROM enrollments x WHERE x.user_id = p.id) AS c_enrol,
      (SELECT count(*) FROM certificates x WHERE x.user_id = p.id) AS c_certs,
      (SELECT count(*) FROM events x WHERE x.created_by = p.id) AS c_events,
      (SELECT count(*) FROM event_rsvps x WHERE x.user_id = p.id) AS c_rsvps,
      (SELECT count(*) FROM bookings x WHERE x.talent_id = p.id) AS c_btal,
      (SELECT count(*) FROM bookings x WHERE x.client_id = p.id) AS c_bcli,
      (SELECT count(*) FROM discussions x WHERE x.user_id = p.id) AS c_disc,
      (SELECT count(*) FROM discussion_comments x WHERE x.user_id = p.id) AS c_cmt,
      (SELECT count(*) FROM builds x WHERE x.user_id = p.id) AS c_builds,
      (SELECT count(*) FROM build_likes x WHERE x.user_id = p.id) AS c_likes,
      (SELECT count(*) FROM teams x WHERE x.owner_id = p.id) AS c_teams,
      (SELECT count(*) FROM team_members x WHERE x.user_id = p.id) AS c_tmem,
      (SELECT count(*) FROM team_collabs x WHERE x.created_by = p.id) AS c_collab,
      (SELECT count(*) FROM agencies x WHERE x.owner_id = p.id) AS c_agency,
      (SELECT count(*) FROM articles x WHERE x.author_id = p.id) AS c_articles,
      (SELECT count(*) FROM messages x WHERE x.sender_id = p.id) AS c_msgs,
      (SELECT count(*) FROM experiences x WHERE x.user_id = p.id) AS c_exp,
      (SELECT count(*) FROM user_skills x WHERE x.user_id = p.id) AS c_skills,
      GREATEST(
        p.created_at,
        COALESCE((SELECT max(x.created_at) FROM discussions x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM discussion_comments x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM builds x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM build_likes x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM messages x WHERE x.sender_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM job_applications x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM project_bids x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.enrolled_at) FROM enrollments x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM event_rsvps x WHERE x.user_id = p.id), p.created_at)
      ) AS last_active
    FROM profiles p
  )
  SELECT
    b.id, b.full_name, b.email, b.avatar_url, b.location, b.roles, b.created_at, b.last_active,
    b.c_jobs, b.c_apps, b.c_projects, b.c_bids, b.c_courses, b.c_enrol, b.c_certs,
    b.c_events, b.c_rsvps, b.c_btal, b.c_bcli, b.c_disc, b.c_cmt, b.c_builds, b.c_likes,
    b.c_teams, b.c_tmem, b.c_collab, b.c_agency, b.c_articles, b.c_msgs, b.c_exp, b.c_skills,
    (b.c_jobs + b.c_apps + b.c_projects + b.c_bids + b.c_courses + b.c_enrol + b.c_certs
     + b.c_events + b.c_rsvps + b.c_btal + b.c_bcli + b.c_disc + b.c_cmt + b.c_builds
     + b.c_likes + b.c_teams + b.c_tmem + b.c_collab + b.c_agency + b.c_articles
     + b.c_msgs + b.c_exp + b.c_skills) AS total_records,
    ( (b.c_jobs>0)::int + (b.c_apps>0)::int + (b.c_projects>0)::int + (b.c_bids>0)::int
    + (b.c_courses>0)::int + (b.c_enrol>0)::int + (b.c_certs>0)::int + (b.c_events>0)::int
    + (b.c_rsvps>0)::int + (b.c_btal>0)::int + (b.c_bcli>0)::int + (b.c_disc>0)::int
    + (b.c_cmt>0)::int + (b.c_builds>0)::int + (b.c_likes>0)::int + (b.c_teams>0)::int
    + (b.c_tmem>0)::int + (b.c_collab>0)::int + (b.c_agency>0)::int + (b.c_articles>0)::int
    + (b.c_msgs>0)::int + (b.c_exp>0)::int + (b.c_skills>0)::int ) AS features_used
  FROM base b
  ORDER BY total_records DESC, b.full_name;
END;
$$;

REVOKE ALL ON FUNCTION admin_user_activity() FROM public;
GRANT EXECUTE ON FUNCTION admin_user_activity() TO authenticated;

-- [22/23] 20260921000400_022_seed_no_empty.sql

INSERT INTO courses (id, coach_id, title, description, level, category, price, created_at)
SELECT md5('demo-course-' || p.id::text)::uuid, p.id,
  (ARRAY[
    'Shipping Your First Production Service',
    'Debugging What You Did Not Write',
    'Working Well in a Small Engineering Team',
    'Reading Code Faster Than You Write It',
    'From Ticket to Deploy, End to End'
  ])[1 + (abs(hashtext(p.id::text)) % 5)],
  'A short practical course built from the work I do every week. Fewer slides than you expect, '
  || 'more walking through real code and real mistakes.',
  (ARRAY['beginner','intermediate','advanced'])[1 + (abs(hashtext(p.id::text)) % 3)],
  (ARRAY['Backend','Frontend','Data','Security','Career'])[1 + (abs(hashtext(p.id::text)) % 5)],
  (ARRAY[0, 250000, 350000, 450000])[1 + (abs(hashtext(p.id::text)) % 4)],
  now() - interval '35 days'
FROM profiles p
WHERE p.coach_approved = 'approved'
  AND NOT EXISTS (SELECT 1 FROM courses c WHERE c.coach_id = p.id)
ON CONFLICT DO NOTHING;

INSERT INTO course_modules (id, course_id, title, description, order_index, is_free, created_at)
SELECT md5('demo-mod-' || c.id::text || '-' || k)::uuid, c.id,
  (ARRAY['Getting oriented','The core loop','When it goes wrong','Putting it together'])[k],
  (ARRAY[
    'What this course assumes you already know, and what it does not.',
    'The part you will use every day.',
    'Failure modes, and how to recognise them early.',
    'A worked example from start to finish.'
  ])[k],
  k, (k = 1), c.created_at
FROM courses c
CROSS JOIN generate_series(1, 4) AS k
WHERE NOT EXISTS (SELECT 1 FROM course_modules m WHERE m.course_id = c.id)
ON CONFLICT DO NOTHING;

INSERT INTO course_materials (id, module_id, title, content_type, content_url, text_content)
SELECT md5('demo-mat-' || m.id::text || '-' || k)::uuid, m.id,
  CASE k WHEN 1 THEN m.title || ': the idea' ELSE m.title || ': walkthrough' END,
  CASE k WHEN 1 THEN 'text' ELSE 'video' END,
  CASE k WHEN 1 THEN NULL ELSE 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' END,
  CASE k WHEN 1 THEN
    'We start from the smallest version of the problem that is still real, then add exactly one '
    || 'complication at a time. By the end of the lesson you should be able to explain the trade-off '
    || 'out loud, which is a better test of understanding than any quiz.'
  ELSE NULL END
FROM course_modules m
CROSS JOIN generate_series(1, 2) AS k
WHERE NOT EXISTS (SELECT 1 FROM course_materials x WHERE x.module_id = m.id)
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (id, module_id, title, passing_grade)
SELECT md5('demo-quiz-' || m.id::text)::uuid, m.id, m.title || ' check', 70
FROM course_modules m
WHERE NOT EXISTS (SELECT 1 FROM quizzes q WHERE q.module_id = m.id)
ON CONFLICT DO NOTHING;

INSERT INTO quiz_questions (id, quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT md5('demo-qq-' || q.id::text || '-' || k)::uuid, q.id,
  (ARRAY[
    'What is the first thing to check when this breaks?',
    'Which trade-off does this approach accept?',
    'When would you deliberately not do this?'
  ])[k],
  (ARRAY['Restart everything','Whether the input is what you assume','Add more logging','Rewrite it'])[k % 4 + 1],
  (ARRAY['Whether the input is what you assume','More memory for less latency','When the team is too small to maintain it','Always do it'])[k],
  (ARRAY['Ask someone else','Nothing, it is free','Never','It depends'])[k],
  (ARRAY['Escalate immediately','Simplicity for speed','On day one','Only in production'])[k],
  'b'
FROM quizzes q
CROSS JOIN generate_series(1, 3) AS k
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions x WHERE x.quiz_id = q.id)
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (id, course_id, user_id, status, progress, enrolled_at, payment_status)
SELECT md5('demo-enrol2-' || c.id::text || '-' || u.id::text)::uuid, c.id, u.id,
       'active', 25 + (abs(hashtext(u.id::text)) % 60), now() - interval '20 days', 'paid'
FROM courses c
JOIN LATERAL (
  SELECT p.id FROM profiles p
  WHERE p.id <> c.coach_id
  ORDER BY md5(p.id::text || c.id::text)
  LIMIT 3
) u ON true
WHERE (SELECT count(*) FROM enrollments e WHERE e.course_id = c.id) < 3
ON CONFLICT DO NOTHING;

INSERT INTO module_completions (id, enrollment_id, module_id, user_id, completed_at)
SELECT md5('demo-mc2-' || e.id::text || '-' || m.id::text)::uuid, e.id, m.id, e.user_id,
       e.enrolled_at + (m.rn || ' days')::interval
FROM enrollments e
JOIN LATERAL (
  SELECT x.id, row_number() OVER (ORDER BY x.order_index, x.id) AS rn,
         count(*) OVER () AS total
  FROM course_modules x WHERE x.course_id = e.course_id
) m ON m.rn <= GREATEST(1, ceil(e.progress::numeric / 100 * m.total))
ON CONFLICT DO NOTHING;

INSERT INTO quiz_submissions (id, quiz_id, user_id, score, passed, answers, created_at)
SELECT md5('demo-qs2-' || q.id::text || '-' || u.id::text)::uuid, q.id, u.id,
       sc.score, sc.score >= q.passing_grade,
       '{"1":"b","2":"b","3":"b"}'::jsonb, now() - interval '9 days'
FROM quizzes q
JOIN course_modules m ON m.id = q.module_id
JOIN LATERAL (
  SELECT e.user_id AS id FROM enrollments e
  WHERE e.course_id = m.course_id
  ORDER BY md5(e.user_id::text || q.id::text)
  LIMIT 2
) u ON true
CROSS JOIN LATERAL (
  SELECT CASE WHEN abs(hashtext(u.id::text || q.id::text)) % 5 = 0 THEN 33 ELSE 100 END AS score
) sc
WHERE NOT EXISTS (SELECT 1 FROM quiz_submissions x WHERE x.quiz_id = q.id)
ON CONFLICT DO NOTHING;

INSERT INTO certificates (id, course_id, user_id, issued_at)
SELECT md5('demo-cert-' || c.id::text)::uuid, c.id, e.user_id, now() - interval '5 days'
FROM courses c
JOIN LATERAL (
  SELECT x.user_id FROM enrollments x WHERE x.course_id = c.id
  ORDER BY x.progress DESC, x.user_id LIMIT 1
) e ON true
WHERE NOT EXISTS (SELECT 1 FROM certificates z WHERE z.course_id = c.id)
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, talent_id, client_id, booking_type, scheduled_at, notes, status, amount, created_at, payment_status)
SELECT md5('demo-book-' || p.id::text)::uuid, p.id, c.id,
       (ARRAY['consultation','mentoring'])[1 + (abs(hashtext(p.id::text)) % 2)],
       now() + ((3 + abs(hashtext(p.id::text)) % 20) || ' days')::interval,
       'Booked through the talent directory. Agenda agreed over chat beforehand.',
       (ARRAY['pending','confirmed','completed'])[1 + (abs(hashtext(p.id::text)) % 3)],
       COALESCE(p.hourly_rate, 300000),
       now() - interval '6 days',
       (ARRAY['unpaid','paid','paid'])[1 + (abs(hashtext(p.id::text)) % 3)]
FROM profiles p
JOIN LATERAL (
  SELECT x.id FROM profiles x WHERE x.id <> p.id
  ORDER BY md5(x.id::text || p.id::text) LIMIT 1
) c ON true
WHERE p.talent_approved = 'approved'
  AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.talent_id = p.id)
ON CONFLICT DO NOTHING;

INSERT INTO agency_projects (id, client_name, client_email, client_company, service_id, scope, budget,
                             status, dp_amount, created_at, dp_payment_status, final_payment_status)
SELECT md5('demo-ap-' || s.id::text)::uuid,
       (ARRAY['Lina Marlina','Agus Riyanto','Dina Kartika','Yoga Permana'])[1 + (abs(hashtext(s.id::text)) % 4)],
       'client' || (abs(hashtext(s.id::text)) % 90 + 10) || '@example.com',
       (ARRAY['Sentra Niaga','Karya Mandiri','Bumi Rasa','Terang Jaya'])[1 + (abs(hashtext(s.id::text)) % 4)],
       s.id,
       'Scoped from the catalogue listing, with a discovery call before the quote was fixed.',
       COALESCE(s.base_price, 40000000) + 5000000,
       (ARRAY['requested','in_review','approved','in_progress'])[1 + (abs(hashtext(s.id::text)) % 4)],
       NULL, now() - interval '9 days', 'unpaid', 'unpaid'
FROM agency_services s
WHERE NOT EXISTS (SELECT 1 FROM agency_projects p WHERE p.service_id = s.id)
ON CONFLICT DO NOTHING;

INSERT INTO builds (id, user_id, agency_id, title, description, link_url, image_url,
                    source_type, promoted_to_spotlight, created_at)
SELECT md5('demo-abuild-' || a.id::text)::uuid,
       COALESCE(a.owner_id, (SELECT id FROM profiles WHERE email = 'admin@demo.masmasit.online')),
       a.id, a.name || ' Toolkit',
       'Something we built for a client, cleaned up and released because the next client will need it too.',
       'https://example.com/' || a.slug || '-toolkit',
       'https://picsum.photos/seed/masmasit-a-' || a.slug || '/800/500',
       'agency', false, now() - interval '13 days'
FROM agencies a
WHERE NOT EXISTS (SELECT 1 FROM builds b WHERE b.agency_id = a.id)
ON CONFLICT DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, level, years_experience, verification_status)
SELECT u.id, s.id, 'intermediate', 2 + (abs(hashtext(s.id::text)) % 6), 'self_declared'
FROM skills s
JOIN LATERAL (
  SELECT p.id FROM profiles p ORDER BY md5(p.id::text || s.id::text) LIMIT 1
) u ON true
WHERE NOT EXISTS (SELECT 1 FROM user_skills x WHERE x.skill_id = s.id)
ON CONFLICT DO NOTHING;

INSERT INTO jobs (id, company_id, title, description, location, job_type, salary_min, salary_max, deadline, status, created_at)
VALUES ('10000000-0000-4000-a000-000000000011', 'c0000000-0000-4000-a000-000000000001',
  'Technical Writer (draft)',
  'Still being written. We know we need documentation help, we have not agreed the shape of the role yet.',
  'Remote (Indonesia)', 'contract', 9000000, 15000000, CURRENT_DATE + 60, 'draft', now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO projects (id, user_id, title, description, budget_min, budget_max, deadline, status, created_at)
VALUES ('20000000-0000-4000-a000-000000000007', 'd0000000-0000-4000-a000-000000000010',
  'Kiosk app for in-store ordering',
  'Cancelled after the retail partner postponed the rollout. Kept here so the history stays honest.',
  30000000, 50000000, CURRENT_DATE + 20, 'cancelled', now() - interval '40 days')
ON CONFLICT DO NOTHING;

INSERT INTO agencies (id, owner_id, name, slug, logo_url, description, is_in_house, approval_status, created_at)
VALUES ('50000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000021',
  'Cepat Digital', 'cepat-digital',
  'https://api.dicebear.com/7.x/initials/svg?seed=Cepat%20Digital',
  'Submitted without a portfolio or a named team, so the listing was declined pending more detail.',
  false, 'rejected', now() - interval '18 days')
ON CONFLICT DO NOTHING;

INSERT INTO team_collabs (id, team_id, created_by, focus, description, status, matched_with, created_at)
SELECT md5('demo-collab-closed')::uuid, t.id, t.owner_id,
  'Shared component library',
  'Closed by the team: the two people driving it moved on to other work, and nobody wanted to carry it alone.',
  'closed', NULL, now() - interval '48 days'
FROM teams t ORDER BY t.created_at LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO bookings (id, talent_id, client_id, booking_type, scheduled_at, notes, status, amount, created_at, payment_status)
VALUES ('43000000-0000-4000-a000-000000000011', 'd0000000-0000-4000-a000-000000000002',
  'd0000000-0000-4000-a000-000000000010', 'consultation',
  now() - interval '2 days', 'Cancelled by the client the day before, rescheduling later this month.',
  'cancelled', 400000, now() - interval '12 days', 'unpaid')
ON CONFLICT DO NOTHING;

INSERT INTO event_rsvps (id, event_id, user_id, status, created_at, payment_status)
VALUES ('42000000-0000-4000-a000-000000000021', '41000000-0000-4000-a000-000000000004',
  'd0000000-0000-4000-a000-000000000006', 'cancelled', now() - interval '6 days', 'unpaid')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (id, course_id, user_id, status, progress, enrolled_at, payment_status)
VALUES ('35000000-0000-4000-a000-000000000020', '30000000-0000-4000-a000-000000000004',
  'd0000000-0000-4000-a000-000000000006', 'dropped', 15, now() - interval '28 days', 'paid')
ON CONFLICT DO NOTHING;

INSERT INTO agency_projects (id, client_name, client_email, client_company, service_id, scope, budget,
                             status, dp_amount, created_at, dp_payment_status, final_payment_status)
SELECT md5('demo-ap-cancelled')::uuid, 'Hari Sutanto', 'hari@example.com', 'Mitra Sejahtera',
  s.id, 'Cancelled before kickoff when the budget moved to the next financial year.',
  45000000, 'cancelled', NULL, now() - interval '55 days', 'unpaid', 'unpaid'
FROM agency_services s ORDER BY s.created_at LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO agency_services (id, agency_id, category, title, description, base_price, is_active, created_at)
SELECT md5('demo-svc-' || a.id::text)::uuid, a.id,
       (ARRAY['SaaS','AI Solutions','Creative Services','HR Solutions'])[1 + (abs(hashtext(a.id::text)) % 4)],
       a.name || ' Starter Engagement',
       'An entry-level package, scoped in a single call and delivered in four weeks.',
       25000000 + (abs(hashtext(a.id::text)) % 5) * 5000000,
       (a.approval_status = 'approved'),
       now() - interval '15 days'
FROM agencies a
WHERE NOT EXISTS (SELECT 1 FROM agency_services s WHERE s.agency_id = a.id)
ON CONFLICT DO NOTHING;

INSERT INTO agency_projects (id, client_name, client_email, client_company, service_id, scope, budget,
                             status, dp_amount, created_at, dp_payment_status, final_payment_status)
SELECT md5('demo-ap2-' || s.id::text)::uuid, 'Rudi Hartono', 'rudi@example.com', 'Andalan Group',
       s.id, 'First engagement from the catalogue, scoped on a discovery call.',
       COALESCE(s.base_price, 30000000), 'requested', NULL, now() - interval '4 days', 'unpaid', 'unpaid'
FROM agency_services s
WHERE NOT EXISTS (SELECT 1 FROM agency_projects p WHERE p.service_id = s.id)
ON CONFLICT DO NOTHING;

INSERT INTO builds (id, user_id, agency_id, title, description, link_url, image_url,
                    source_type, promoted_to_spotlight, created_at)
SELECT md5('demo-abuild2-' || a.id::text)::uuid,
       COALESCE(a.owner_id, (SELECT id FROM profiles WHERE email = 'admin@demo.masmasit.online')),
       a.id, a.name || ' Starter Kit',
       'Released from client work, because the next project always needs the same scaffolding.',
       'https://example.com/' || a.slug || '-kit',
       'https://picsum.photos/seed/masmasit-k-' || a.slug || '/800/500',
       'agency', false, now() - interval '11 days'
FROM agencies a
WHERE NOT EXISTS (SELECT 1 FROM builds b WHERE b.agency_id = a.id)
ON CONFLICT DO NOTHING;

INSERT INTO build_likes (build_id, user_id, created_at)
SELECT b.id, u.id, now() - interval '3 days'
FROM builds b
JOIN LATERAL (
  SELECT p.id FROM profiles p WHERE p.id <> b.user_id
  ORDER BY md5(p.id::text || b.id::text) LIMIT 2
) u ON true
WHERE b.likes_count = 0
ON CONFLICT DO NOTHING;

INSERT INTO discussion_comments (id, discussion_id, user_id, body, created_at)
SELECT md5('demo-cmt2-' || d.id::text || '-' || k)::uuid, d.id, u.id,
       (ARRAY[
         'Following this, we are about to make the same decision.',
         'Short answer from our side: it cost less than we feared and took longer than we planned.'
       ])[k],
       d.created_at + (k || ' days')::interval
FROM discussions d
CROSS JOIN generate_series(1, 2) AS k
JOIN LATERAL (
  SELECT p.id FROM profiles p WHERE p.id <> d.user_id
  ORDER BY md5(p.id::text || d.id::text || k::text) LIMIT 1
) u ON true
WHERE NOT EXISTS (SELECT 1 FROM discussion_comments c WHERE c.discussion_id = d.id)
ON CONFLICT DO NOTHING;

INSERT INTO module_completions (id, enrollment_id, module_id, user_id, completed_at)
SELECT md5('demo-mc3-' || e.id::text)::uuid, e.id, m.id, e.user_id, e.enrolled_at + interval '1 day'
FROM enrollments e
JOIN LATERAL (
  SELECT x.id FROM course_modules x WHERE x.course_id = e.course_id
  ORDER BY x.order_index, x.id LIMIT 1
) m ON true
WHERE NOT EXISTS (SELECT 1 FROM module_completions z WHERE z.enrollment_id = e.id)
ON CONFLICT DO NOTHING;

-- [23/23] 20260921000500_023_profile_foreign_keys.sql

INSERT INTO profiles (id, email, full_name, created_at)
SELECT u.id,
       COALESCE(u.email, u.id::text || '@unknown.local'),
       COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'member'), '@', 1)),
       COALESCE(u.created_at, now())
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  fk record;
  cname text;
BEGIN
  FOR fk IN
    SELECT * FROM (VALUES
      ('user_roles','user_id','CASCADE'),
      ('user_skills','user_id','CASCADE'),
      ('experiences','user_id','CASCADE'),
      ('companies','user_id','CASCADE'),
      ('job_applications','user_id','CASCADE'),
      ('projects','user_id','CASCADE'),
      ('project_bids','user_id','CASCADE'),
      ('project_reviews','reviewer_id','CASCADE'),
      ('project_reviews','reviewee_id','CASCADE'),
      ('courses','coach_id','CASCADE'),
      ('enrollments','user_id','CASCADE'),
      ('certificates','user_id','CASCADE'),
      ('module_completions','user_id','CASCADE'),
      ('quiz_submissions','user_id','CASCADE'),
      ('event_rsvps','user_id','CASCADE'),
      ('bookings','talent_id','CASCADE'),
      ('bookings','client_id','CASCADE'),
      ('messages','sender_id','CASCADE'),
      ('messages','recipient_id','CASCADE'),
      ('notifications','user_id','CASCADE'),
      ('teams','owner_id','CASCADE'),
      ('team_members','user_id','CASCADE'),
      ('team_collabs','created_by','CASCADE'),
      ('discussions','user_id','CASCADE'),
      ('discussion_comments','user_id','CASCADE'),
      ('builds','user_id','CASCADE'),
      ('build_likes','user_id','CASCADE'),
      ('regions','admin_user_id','SET NULL'),
      ('events','created_by','SET NULL'),
      ('audit_logs','actor_id','SET NULL'),
      ('agencies','owner_id','SET NULL'),
      ('articles','author_id','SET NULL')
    ) AS v(tbl, col, on_delete)
  LOOP
    cname := fk.tbl || '_' || fk.col || '_profiles_fkey';

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = cname
    );
    CONTINUE WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = fk.tbl AND column_name = fk.col
    );

    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES profiles(id) ON DELETE %s',
      fk.tbl, cname, fk.col, fk.on_delete
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
