/*
# Seed demo content across every surface

Purpose: the ecosystem pages are all list views, and a list view with nothing
in it cannot be judged, demoed or launched. This fills every browse surface
with enough plausible rows that each page shows its real layout - cards,
filters, empty-vs-full states, counts and joins.

## What it creates
- 12 demo auth users (password `Demo1234!`) with profiles, roles and skills
- companies + jobs + applications        -> /jobs
- client projects + bids + reviews       -> /projects
- courses + modules + materials + quizzes + enrollments -> /courses
- regions + events + RSVPs               -> /events
- talent bookings                        -> /talents, /dashboard
- agencies + agency services + projects  -> /agency, /services
- teams + members + collabs              -> /team-builder, /team-collabs
- discussions + comments                 -> /discussions
- builds + likes                         -> /builds, /spotlight
- articles, case studies                 -> /discover, /case-studies
- messages + notifications               -> /pesan, the bell

## Prerequisites
Migration 015 must already be applied - this seeds agencies, teams,
team_collabs, discussions, builds and articles, which 015 creates.

## Safety
- Every insert is ON CONFLICT DO NOTHING against a fixed UUID, so the whole
  file is idempotent and safe to re-run.
- Demo accounts all live on @demo.masmasit.online, so they are trivially
  identifiable and removable:
    DELETE FROM auth.users WHERE email LIKE '%@demo.masmasit.online';
  Every row below cascades from those users except the reference data
  (regions, skills, agency_services, case_studies, app_settings).
*/

-- ---------------------------------------------------------------------------
-- 1. DEMO AUTH USERS
-- ---------------------------------------------------------------------------
-- auth.users is owned by GoTrue, so the columns written here are only the ones
-- a password sign-in actually reads: a bcrypt hash, a confirmed email, and a
-- matching row in auth.identities (without it the email provider finds no
-- identity and the login fails even though the user row exists).

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

-- ---------------------------------------------------------------------------
-- 2. PROFILES
-- ---------------------------------------------------------------------------
-- avatar_url uses DiceBear rather than stock portraits: a demo directory that
-- shows real strangers' faces next to invented bios is the one kind of filler
-- that is awkward to ship. Initials read as placeholder and stay on-brand.

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

-- ---------------------------------------------------------------------------
-- 3. ROLES
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. SKILLS + USER SKILLS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. COMPANIES + JOBS + APPLICATIONS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6. CLIENT PROJECTS + BIDS + REVIEWS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. COURSES + MODULES + MATERIALS + QUIZZES + ENROLLMENTS
-- ---------------------------------------------------------------------------
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

-- The one finished enrolment earns the certificate its course page expects.
INSERT INTO certificates (id, course_id, user_id, issued_at) VALUES
  ('38000000-0000-4000-a000-000000000001', '30000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000006', now() - interval '15 days')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. REGIONS + EVENTS + RSVPS
-- ---------------------------------------------------------------------------
/* regions.name is UNIQUE and no migration seeds this table, so a project
   that created its regions by hand already holds these names under different
   ids. Conflict on the name, let the existing row win, and let the ids fall
   where they may -- events below resolve their region by name rather than by
   a hardcoded uuid, so either set of ids works. */
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

-- ---------------------------------------------------------------------------
-- 9. TALENT BOOKINGS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 10. AGENCIES (migration 015) + SERVICES + AGENCY PROJECTS + CASE STUDIES
-- ---------------------------------------------------------------------------
-- The in-house agency is NOT created here: migration 015 already inserts it
-- (id 00000000-0000-0000-0000-000000000001, slug 'masmasit'). The in-house
-- services further down hang off that row, so /agency shows one in-house
-- entry rather than two competing ones.
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
-- slug is UNIQUE as well as id, and it is the one an existing row would
-- collide on. Everything below resolves its agency by slug, so whichever row
-- wins here is the one the services and builds attach to.
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
-- LEFT JOIN, not JOIN: agency_id is nullable, so a slug that is somehow
-- absent costs the service its agency link rather than aborting the seed.
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

-- ---------------------------------------------------------------------------
-- 11. TEAMS + MEMBERS + COLLABS (migration 015)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 12. DISCUSSIONS + COMMENTS (migration 015)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 13. BUILDS + LIKES (migration 015)
-- ---------------------------------------------------------------------------
-- likes_count is maintained by the trg_build_likes_count trigger, so it is
-- left at its default here and the build_likes inserts below drive it.

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

-- ---------------------------------------------------------------------------
-- 14. ARTICLES (migration 015)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 15. MESSAGES + NOTIFICATIONS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 16. APP SETTINGS - exactly one row
-- ---------------------------------------------------------------------------
INSERT INTO app_settings (id, talent_admin_fee_percentage, agency_admin_fee_percentage, agency_revenue_share_percentage,
                          job_fee_active, project_fee_active, lms_fee_active, event_fee_active)
SELECT 'f0000000-0000-4000-a000-000000000001', 15.00, 10.00, 10.00, false, false, true, true
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
