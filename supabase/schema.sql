-- Madrasa LMS - Database Schema
-- Run this in your Supabase SQL Editor to initialize the database.
-- This script is idempotent (safe to re-run).

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  teacher_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  drive_link      TEXT NOT NULL,
  submission_date DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a      TEXT NOT NULL,
  option_b      TEXT NOT NULL,
  option_c      TEXT NOT NULL,
  option_d      TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  order_index   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS student_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at    TIMESTAMPTZ,
  score           INTEGER,
  total_questions INTEGER,
  completed       BOOLEAN DEFAULT FALSE,
  UNIQUE(task_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES student_submissions(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) NOT NULL CHECK (selected_option IN ('a','b','c','d')),
  is_correct      BOOLEAN NOT NULL,
  UNIQUE(submission_id, question_id)
);

-- class_enrollments: tracks which students are enrolled in which classes.
-- student_email is stored here so the teacher can display it without Auth Admin API access.
CREATE TABLE IF NOT EXISTS class_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- ─────────────────────────────────────────────
-- Row-Level Security (permissive for prototype)
-- ─────────────────────────────────────────────

ALTER TABLE classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='classes' AND policyname='allow_all_classes') THEN
    CREATE POLICY allow_all_classes ON classes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='allow_all_subjects') THEN
    CREATE POLICY allow_all_subjects ON subjects FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='allow_all_tasks') THEN
    CREATE POLICY allow_all_tasks ON tasks FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='allow_all_questions') THEN
    CREATE POLICY allow_all_questions ON questions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_submissions' AND policyname='allow_all_student_submissions') THEN
    CREATE POLICY allow_all_student_submissions ON student_submissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='student_answers' AND policyname='allow_all_student_answers') THEN
    CREATE POLICY allow_all_student_answers ON student_answers FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='allow_all_class_enrollments') THEN
    CREATE POLICY allow_all_class_enrollments ON class_enrollments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- If schema was already run without class_enrollments, run this:
-- (Safe to run even if table already exists due to IF NOT EXISTS above)
-- ─────────────────────────────────────────────
-- CREATE TABLE IF NOT EXISTS class_enrollments ... (already above)
-- ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY; (already above)
