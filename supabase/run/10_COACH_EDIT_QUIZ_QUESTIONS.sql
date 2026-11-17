-- =========================================================================
-- 038 - Coach bisa mengubah pertanyaan kuis
-- =========================================================================
-- Sebelumnya quiz_questions hanya punya policy SELECT, INSERT dan DELETE,
-- jadi tombol "Ubah pertanyaan" di Dashboard Coach tidak bisa menyimpan.
-- Hanya coach pemilik kursus yang boleh mengubah, dan pertanyaan tidak boleh
-- dipindah ke kuis milik coach lain.
--
-- Aman dijalankan ulang. Jalankan di Supabase > SQL Editor.
-- =========================================================================

DROP POLICY IF EXISTS "update_own_quiz_questions" ON quiz_questions;
CREATE POLICY "update_own_quiz_questions" ON quiz_questions FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN course_modules cm ON cm.id = q.module_id
      JOIN courses c ON c.id = cm.course_id
      WHERE q.id = quiz_id AND c.coach_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN course_modules cm ON cm.id = q.module_id
      JOIN courses c ON c.id = cm.course_id
      WHERE q.id = quiz_id AND c.coach_id = auth.uid()
    )
  );
