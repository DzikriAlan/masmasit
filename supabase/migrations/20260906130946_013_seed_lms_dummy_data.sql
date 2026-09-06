/*
# Seed dummy LMS data: materials, quizzes, questions, enrollments

## Changes
- Inserts course materials (text + video) for the 4 existing modules in "React Fundamentals"
- Inserts quizzes for each module with passing_grade 70
- Inserts quiz questions (multiple choice) for each quiz
- Adds modules to 3 more courses so they have content
- Inserts sample enrollments for existing users across multiple courses
*/

-- Materials for existing modules
INSERT INTO course_materials (module_id, title, content_type, text_content, content_url) VALUES
('4bd17d5d-3b17-4732-8753-406013fa2156', 'What is React?', 'text', 'React is a JavaScript library for building user interfaces. It uses a component-based architecture and a virtual DOM to efficiently update the UI. In this lesson we cover the core concepts: components, JSX, and the rendering lifecycle.', NULL),
('4bd17d5d-3b17-4732-8753-406013fa2156', 'Setting Up Your Environment', 'video', NULL, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
('9c9a84e0-e5df-46db-a5f0-351a8203b667', 'Components and Props Explained', 'text', 'Components are the building blocks of React. Props allow you to pass data from parent to child components. This lesson covers functional components, prop types, and how to compose components together.', NULL),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'Understanding useState', 'text', 'The useState hook lets you add state to functional components. You call it with an initial value and it returns an array with the current state and a setter function. This lesson covers common patterns and pitfalls.', NULL),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'useEffect Deep Dive', 'video', NULL, 'https://www.youtube.com/watch?v=0SJE6b8Z5g0'),
('a143534f-8b3a-4878-8478-11ea73715751', 'Next.js App Router Basics', 'text', 'Next.js provides file-based routing. The App Router uses the app/ directory to define routes. This lesson covers layout.tsx, page.tsx, and nested routing patterns.', NULL)
ON CONFLICT DO NOTHING;

-- Quizzes for each module
INSERT INTO quizzes (module_id, title, passing_grade) VALUES
('4bd17d5d-3b17-4732-8753-406013fa2156', 'React Basics Quiz', 70),
('9c9a84e0-e5df-46db-a5f0-351a8203b667', 'Components Quiz', 70),
('47126e4a-a898-4f9f-8582-982f4b73ec9e', 'Hooks Quiz', 70),
('a143534f-8b3a-4878-8478-11ea73715751', 'Routing Quiz', 70)
ON CONFLICT DO NOTHING;

-- Quiz questions
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

-- Add modules to 3 more courses
INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', 'TypeScript Types', 'Understanding basic and advanced types in TypeScript', 0, true
WHERE NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND title = 'TypeScript Types');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', 'Generics and Utility Types', 'Master generics, conditional types, and built-in utility types', 1, false
WHERE NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND title = 'Generics and Utility Types');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '00ad5f2f-70dc-4e00-9df4-efb144f600d6', 'Express.js Fundamentals', 'Building REST APIs with Express', 0, true
WHERE NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6' AND title = 'Express.js Fundamentals');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '00ad5f2f-70dc-4e00-9df4-efb144f600d6', 'Database Integration', 'Connecting Node.js to PostgreSQL', 1, false
WHERE NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '00ad5f2f-70dc-4e00-9df4-efb144f600d6' AND title = 'Database Integration');

INSERT INTO course_modules (course_id, title, description, order_index, is_free)
SELECT '77d66a04-84b8-41bd-b8ab-24ca3ac9a383', 'Design Thinking', 'The design thinking process and user research', 0, true
WHERE NOT EXISTS (SELECT 1 FROM course_modules WHERE course_id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383' AND title = 'Design Thinking');

-- Enrollments
INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT 'da385774-8ac1-4900-9d41-37c3ee30c3be', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 35, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = 'da385774-8ac1-4900-9d41-37c3ee30c3be' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '84506f17-9da7-4efe-a2c5-1233f7349178', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 10, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '84506f17-9da7-4efe-a2c5-1233f7349178' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '5f0dc79c-ee40-4ad8-ad8a-23d667610b9f', '08d4b0ae-b1f9-456a-8766-244a8dd72c28', 'active', 0, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '5f0dc79c-ee40-4ad8-ad8a-23d667610b9f' AND user_id = '08d4b0ae-b1f9-456a-8766-244a8dd72c28');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '77d66a04-84b8-41bd-b8ab-24ca3ac9a383', 'c905faf5-b324-4b65-b734-3c11323e0e14', 'active', 50, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '77d66a04-84b8-41bd-b8ab-24ca3ac9a383' AND user_id = 'c905faf5-b324-4b65-b734-3c11323e0e14');

INSERT INTO enrollments (course_id, user_id, status, progress, payment_status)
SELECT '3a6775db-2d7d-4343-a852-d4f2e084f9d9', 'c905faf5-b324-4b65-b734-3c11323e0e14', 'active', 0, 'paid'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE course_id = '3a6775db-2d7d-4343-a852-d4f2e084f9d9' AND user_id = 'c905faf5-b324-4b65-b734-3c11323e0e14');
