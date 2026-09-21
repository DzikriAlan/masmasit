/*
# Leave nothing empty

A table with rows in it is not the same as a feature with data in it. This
closes the last gaps found by auditing three things separately:

  1. every parent has children      - courses have modules, modules have
                                      lessons and a quiz, quizzes have
                                      submissions, agencies have work
  2. every profile claim is backed  - an approved coach has a course, an
                                      approved talent has bookings
  3. every filter value returns rows - the negative states (draft, cancelled,
                                      rejected, dropped, closed) each need at
                                      least one example, or the filter looks
                                      broken rather than empty

Sections 1 to 4 are written as self-healing: they fill whatever currently
lacks children rather than naming specific ids, so a course added later gets
modules the next time this runs. Requires 017 to 021.
*/

-- ---------------------------------------------------------------------------
-- 1. A COURSE FOR EVERY APPROVED COACH
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. MODULES, LESSONS AND A QUIZ FOR EVERY COURSE THAT LACKS THEM
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 3. LEARNERS, PROGRESS, SUBMISSIONS AND CERTIFICATES
-- ---------------------------------------------------------------------------
-- Every course needs learners before progress can exist.
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

-- Progress: complete as many modules as the percentage implies, minimum one.
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

-- Every quiz gets attempts, including one honest failure.
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

-- A course with no graduate looks like a course nobody finished.
INSERT INTO certificates (id, course_id, user_id, issued_at)
SELECT md5('demo-cert-' || c.id::text)::uuid, c.id, e.user_id, now() - interval '5 days'
FROM courses c
JOIN LATERAL (
  SELECT x.user_id FROM enrollments x WHERE x.course_id = c.id
  ORDER BY x.progress DESC, x.user_id LIMIT 1
) e ON true
WHERE NOT EXISTS (SELECT 1 FROM certificates z WHERE z.course_id = c.id)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. BOOKINGS, AGENCY WORK AND SKILL COVERAGE
-- ---------------------------------------------------------------------------
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

-- A skill nobody claims never appears in a filter, so it may as well not exist.
INSERT INTO user_skills (user_id, skill_id, level, years_experience, verification_status)
SELECT u.id, s.id, 'intermediate', 2 + (abs(hashtext(s.id::text)) % 6), 'self_declared'
FROM skills s
JOIN LATERAL (
  SELECT p.id FROM profiles p ORDER BY md5(p.id::text || s.id::text) LIMIT 1
) u ON true
WHERE NOT EXISTS (SELECT 1 FROM user_skills x WHERE x.skill_id = s.id)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. ONE EXAMPLE OF EVERY NEGATIVE STATE
-- ---------------------------------------------------------------------------
-- Filters for draft, cancelled, rejected, dropped and closed returned nothing,
-- which reads as a broken filter rather than an empty one.

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

-- ---------------------------------------------------------------------------
-- 6. FINAL PASS
-- ---------------------------------------------------------------------------
-- Section 5 creates rows after the self-healing passes above have already run,
-- so the same heals are repeated here. Ordering a seed so every pass runs
-- exactly once is fragile; running the idempotent ones twice is not.

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

-- likes_count is maintained by a trigger, so inserting the likes fixes the count.
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
