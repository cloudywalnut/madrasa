/**
 * Seed script: creates the two test users (teacher + student) via Supabase Admin API.
 *
 * Run with: npx tsx supabase/seed.ts
 *
 * Requires the following env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * After running, copy the printed UUIDs into .env.local as:
 *   NEXT_PUBLIC_TEACHER_ID
 *   NEXT_PUBLIC_STUDENT_ID
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'fs';

const envContent = dotenv.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
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

async function createUser(email: string, password: string, label: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`${label} already exists — fetching existing user...`);
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) {
        console.log(`✓ ${label}: ${existing.id}  (${email})`);
        return existing.id;
      }
    }
    throw new Error(`Failed to create ${label}: ${error.message}`);
  }
  console.log(`✓ ${label}: ${data.user.id}  (${email})`);
  return data.user.id;
}

async function main() {
  console.log('\n── Madrasa Seed ──────────────────────────────\n');

  const teacherId = await createUser('teacher@gmail.com', 'Madrasa@Teacher1', 'Teacher');
  const studentId = await createUser('student@gmail.com', 'Madrasa@Student1', 'Student');

  console.log('\n── Add these to your .env.local ──────────────\n');
  console.log(`NEXT_PUBLIC_TEACHER_ID=${teacherId}`);
  console.log(`NEXT_PUBLIC_STUDENT_ID=${studentId}`);
  console.log('\n──────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
