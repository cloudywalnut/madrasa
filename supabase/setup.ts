/**
 * Madrasa — One-shot setup script
 * ─────────────────────────────────
 * 1. Runs the full schema SQL against the Supabase project via Management API
 * 2. Creates teacher@gmail.com and student@gmail.com via Auth Admin API
 * 3. Prints the UUIDs to add to .env.local
 *
 * Run with: npx tsx supabase/setup.ts
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  env[key] = val;
}

const supabaseUrl   = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project ref from URL (e.g. "pwlzdvbyygsdjimdcyfa")
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// ── Schema SQL ──────────────────────────────────────────────────
const SCHEMA_SQL = `
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
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  option_a       TEXT NOT NULL,
  option_b       TEXT NOT NULL,
  option_c       TEXT NOT NULL,
  option_d       TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  order_index    INTEGER NOT NULL DEFAULT 0
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

ALTER TABLE classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers     ENABLE ROW LEVEL SECURITY;

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
END $$;
`;

// ── Run schema via Management API ────────────────────────────────
async function runSchema() {
  console.log('📐  Running schema via Management API…');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: SCHEMA_SQL }),
    }
  );

  if (res.ok) {
    console.log('✓  Schema applied successfully.\n');
    return true;
  }

  const body = await res.text();
  console.warn(`⚠   Management API returned ${res.status}: ${body}`);
  console.warn('    The Management API requires a Personal Access Token (PAT), not the service role key.');
  console.warn('    → Please paste the contents of supabase/schema.sql into the Supabase SQL Editor manually.');
  console.warn('    → https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n');
  return false;
}

// ── Create test users ────────────────────────────────────────────
async function createUsers() {
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function upsertUser(email: string, password: string, label: string): Promise<string> {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!error) {
      console.log(`✓  ${label}: ${data.user.id}  (${email})`);
      return data.user.id;
    }

    if (error.message.toLowerCase().includes('already') || error.message.includes('duplicate')) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) {
        console.log(`✓  ${label} (already exists): ${existing.id}  (${email})`);
        return existing.id;
      }
    }

    throw new Error(`Failed to create ${label}: ${error.message}`);
  }

  console.log('👤  Creating test users…');
  const teacherId = await upsertUser('teacher@gmail.com', 'Madrasa@Teacher1', 'Teacher');
  const studentId = await upsertUser('student@gmail.com', 'Madrasa@Student1', 'Student');
  return { teacherId, studentId };
}

// ── Update .env.local with user IDs ──────────────────────────────
function updateEnv(teacherId: string, studentId: string) {
  let content = fs.readFileSync(envPath, 'utf-8');
  content = content.replace(/NEXT_PUBLIC_TEACHER_ID=.*/,  `NEXT_PUBLIC_TEACHER_ID=${teacherId}`);
  content = content.replace(/NEXT_PUBLIC_STUDENT_ID=.*/,  `NEXT_PUBLIC_STUDENT_ID=${studentId}`);
  fs.writeFileSync(envPath, content, 'utf-8');
  console.log('\n✅  .env.local updated with user IDs.');
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n── Madrasa Setup ─────────────────────────────────────\n');
  console.log(`   Project: ${projectRef}`);
  console.log(`   URL:     ${supabaseUrl}\n`);

  await runSchema();
  const { teacherId, studentId } = await createUsers();
  updateEnv(teacherId, studentId);

  console.log('\n── Complete ──────────────────────────────────────────');
  console.log(`   NEXT_PUBLIC_TEACHER_ID = ${teacherId}`);
  console.log(`   NEXT_PUBLIC_STUDENT_ID = ${studentId}`);
  console.log('\n   Run: npm run dev\n');
}

main().catch((err) => {
  console.error('\n❌ ', err.message ?? err);
  process.exit(1);
});
