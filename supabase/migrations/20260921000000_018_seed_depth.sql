/*
# Seed depth: fill every gap left by 017

017 gave each page rows to render. This fills the holes that still made the
product read as a demo rather than a working platform: modules with no
lesson, quizzes with a single question, members with an empty work history,
events nobody signed up to, people with no conversations, and an admin audit
trail that had never recorded anything.

Coverage after this migration, verified by query:
  - every course module has materials and a quiz
  - every quiz has at least 3 questions
  - every profile has work history, skills, and at least one conversation
  - every discussion has replies
  - every job has applicants, every event has RSVPs
  - every approved talent has bookings
  - audit_logs carries a plausible admin history

Idempotent, like 017: fixed uuids plus ON CONFLICT DO NOTHING.
Requires 017.
*/

-- ---------------------------------------------------------------------------
-- 1. COURSE MATERIALS for the six modules that had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 2. QUIZZES for the seven modules that had none
-- ---------------------------------------------------------------------------
INSERT INTO quizzes (id, module_id, title, passing_grade) VALUES
  ('33000000-0000-4000-a000-000000000005', '31000000-0000-4000-a000-000000000002', 'Postgres access quiz', 70),
  ('33000000-0000-4000-a000-000000000006', '31000000-0000-4000-a000-000000000003', 'Observability quiz', 70),
  ('33000000-0000-4000-a000-000000000007', '31000000-0000-4000-a000-000000000005', 'dbt modelling quiz', 70),
  ('33000000-0000-4000-a000-000000000008', '31000000-0000-4000-a000-000000000007', 'Code review quiz', 70),
  ('33000000-0000-4000-a000-000000000009', '31000000-0000-4000-a000-000000000008', 'Candidate generation quiz', 70),
  ('33000000-0000-4000-a000-000000000010', '31000000-0000-4000-a000-000000000009', 'Evaluation quiz', 75),
  ('33000000-0000-4000-a000-000000000011', '31000000-0000-4000-a000-000000000011', 'Query plan quiz', 70)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. QUIZ QUESTIONS so every quiz has at least three
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 4. WORK HISTORY for the eight profiles that had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. SKILLS for the two profiles that had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 6. REPLIES for the discussion that had none, plus more on the others
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. APPLICANTS for the two jobs that had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 8. RSVPS for the three events that had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 9. BOOKINGS for the two approved talents who had none
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 10. CONVERSATIONS so every member has an inbox with something in it
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 11. MORE REVIEWS, CERTIFICATES AND PROGRESS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 12. ADMIN AUDIT TRAIL
-- ---------------------------------------------------------------------------
-- The admin audit page had never had a row to render. These are the actions
-- the rest of this seed implies somebody took.
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

-- ---------------------------------------------------------------------------
-- 13. NOTIFICATIONS so the bell is populated for more than two accounts
-- ---------------------------------------------------------------------------
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
