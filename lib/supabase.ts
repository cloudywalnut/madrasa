import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const TEACHER_ID = process.env.NEXT_PUBLIC_TEACHER_ID!;
export const STUDENT_ID = process.env.NEXT_PUBLIC_STUDENT_ID!;

export function getDriveEmbedUrl(driveLink: string): string {
  // Convert Google Drive share/edit URL to embed URL
  const match = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return driveLink;
  const docId = match[1];
  return `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`;
}
