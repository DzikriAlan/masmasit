/*
# Seed 18 more demo members, and spread activity evenly across all of them

017 and 018 built a deep but narrow dataset: twelve accounts, and the
interesting rows concentrated on four or five of them. An admin looking at
the platform could not tell what a normal member looks like, because no two
members looked alike.

This brings the roster to 30 and gives every non-admin account the same
baseline footprint, generated rather than hand-written so the distribution is
actually even:

  per member: 1 discussion, 2 replies, 1 build, 3 likes given,
              1 course enrolment, 1 job application, 1 project bid,
              2 event RSVPs, 2 messages, 2 work history entries,
              3 skills, 2 notifications

Ids are derived with md5(...)::uuid from a stable seed string, so re-running
produces the same rows and ON CONFLICT DO NOTHING makes the file idempotent.

Requires 017 and 018.
*/

-- ---------------------------------------------------------------------------
-- 1. EIGHTEEN MORE AUTH USERS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. EVEN ACTIVITY FOR EVERY MEMBER
-- ---------------------------------------------------------------------------
-- `m` is every demo member except the operations account, numbered so the
-- generators below can fan content out deterministically.

CREATE OR REPLACE VIEW demo_members AS
SELECT p.id, p.full_name, p.location,
       (row_number() OVER (ORDER BY p.email))::int - 1 AS n
FROM profiles p
WHERE p.email LIKE '%@demo.masmasit.online'
  AND p.email <> 'admin@demo.masmasit.online';

-- 2a. One discussion each -----------------------------------------------------
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

-- 2b. Two replies each, on other members discussions --------------------------
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

-- 2c. One build each ----------------------------------------------------------
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

-- 2d. Three likes each, never on your own build -------------------------------
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

-- 2e. One course enrolment each -----------------------------------------------
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

-- 2f. One job application each -------------------------------------------------
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

-- 2g. One project bid each -----------------------------------------------------
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

-- 2h. Two event RSVPs each ------------------------------------------------------
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

-- 2i. Two messages each ----------------------------------------------------------
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

-- 2j. Two work history entries each ------------------------------------------------
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

-- 2k. Three skills each --------------------------------------------------------------
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

-- 2l. Two notifications each ----------------------------------------------------------
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

-- 2m. Spread team membership across the roster -------------------------------------
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
