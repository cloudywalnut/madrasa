/**
 * Seed script: creates the three test users (teacher + 2 students) via Supabase Admin API.
 * student2@gmail.com is intentionally NOT enrolled in any class — used to test enrollment gates.
 *
 * Run with: npx tsx supabase/seed.ts
 *
 * Requires the following env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * After running, copy the printed UUIDs into .env.local.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 0) continue;
  env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

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
    console.log(`✓ ${label}: ${data.user.id}  (${email})`);
    return data.user.id;
  }

  if (error.message.toLowerCase().includes('already') || error.message.includes('duplicate')) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);
    if (existing) {
      console.log(`✓ ${label} (already exists): ${existing.id}  (${email})`);
      return existing.id;
    }
  }

  throw new Error(`Failed to create ${label}: ${error.message}`);
}

function updateEnvLocal(updates: Record<string, string>) {
  let content = fs.readFileSync(envPath, 'utf-8');
  for (const [key, value] of Object.entries(updates)) {
    if (content.includes(`${key}=`)) {
      content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envPath, content, 'utf-8');
}

async function main() {
  console.log('\n── Madrasa Seed ──────────────────────────────\n');

  const teacherId  = await upsertUser('teacher@gmail.com',  'Madrasa@Teacher1', 'Teacher');
  const studentId  = await upsertUser('student@gmail.com',  'Madrasa@Student1', 'Student 1');
  const student2Id = await upsertUser('student2@gmail.com', 'Madrasa@Student2', 'Student 2 (unenrolled)');

  updateEnvLocal({
    NEXT_PUBLIC_TEACHER_ID:  teacherId,
    NEXT_PUBLIC_STUDENT_ID:  studentId,
    NEXT_PUBLIC_STUDENT2_ID: student2Id,
  });

  console.log('\n✅  .env.local updated with all user IDs.\n');
  console.log('── User IDs ──────────────────────────────────');
  console.log(`NEXT_PUBLIC_TEACHER_ID=${teacherId}`);
  console.log(`NEXT_PUBLIC_STUDENT_ID=${studentId}`);
  console.log(`NEXT_PUBLIC_STUDENT2_ID=${student2Id}`);
  console.log('\n──────────────────────────────────────────────\n');
  console.log('Note: student2@gmail.com is NOT enrolled in any class by design.');
  console.log('      Use the teacher portal to enroll students.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
