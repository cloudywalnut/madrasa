import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const teacherId = process.env.NEXT_PUBLIC_TEACHER_ID ?? '';
  const users = data.users
    .filter((u) => {
      const role = (u.user_metadata as Record<string, unknown>)?.role as string | undefined;
      if (role) return role === 'student';
      return u.id !== teacherId;
    })
    .map((u) => ({ id: u.id, email: u.email ?? '' }));
  return NextResponse.json({ users });
}
