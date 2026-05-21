# Madrasa LMS — Project Memory

Complete reference for the Dawoodi Bohra Community Madrasa Learning Management System.

---

## Project Overview

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (PostgreSQL)
**Purpose:** LMS for Dawoodi Bohra madrasa — teacher creates classes/subjects/tasks with Lisan ud Dawat quiz questions and Google Drive slide links; students view and complete tasks.

---

## Design System

**Aesthetic:** Islamic Art Deco — royal navy, warm gold, parchment. Cinzel Decorative display font, Crimson Pro body, ALKANZ (local) for Lisan ud Dawat.

**Color tokens (CSS vars in `globals.css`):**
- `--color-navy` #0A1628 — deepest background / text
- `--color-royal` #1B2E6B — nav bar, card headers
- `--color-royal-light` #2A4080
- `--color-gold` #C8961E — primary accent
- `--color-gold-light` #E4B84A
- `--color-gold-pale` #F0D898
- `--color-gold-mist` #FBF3DC
- `--color-parchment` #FBF7EE — main background
- `--color-ivory` #FDFAF4 — card background
- `--color-muted` #5C6B8A — secondary text
- `--color-border` #DDD0A8 — borders

**Fonts:**
- `--font-display`: Cinzel Decorative (Google Fonts, loaded via `<link>` tags in `app/layout.tsx`)
- `--font-heading`: Cinzel (Google Fonts, same `<link>`)
- `--font-body`: Crimson Pro (Google Fonts, same `<link>`)
- `--font-alkanz`: ALKANZ — loaded from `/public/ALKANZ.ttf` via `@font-face` in `globals.css`

> **Note:** Google Fonts must NOT be loaded via `@import url(...)` inside `globals.css` when using Tailwind v4 + PostCSS. Tailwind's `@import "tailwindcss"` expands inline, pushing any subsequent `@import` rules past non-import CSS — a CSS spec violation that crashes the dev server. Solution: `<link rel="stylesheet">` in `layout.tsx` head.

**CSS utility classes (defined in `globals.css`):**
- `.pattern-bg` — dark navy with subtle gold geometric repeat (used on landing)
- `.pattern-bg-light` — ivory with subtle gold geometric repeat (used on portal layouts)
- `.madrasa-nav` — navy gradient navbar with gold bottom border
- `.madrasa-card` — white card with border, hover lift effect
- `.madrasa-card-header` — royal blue card header with embedded geometric pattern
- `.btn-primary` — navy gradient button
- `.btn-gold` — gold gradient button (primary CTAs)
- `.btn-ghost` — transparent, bordered button
- `.btn-danger` — red-tinted outline button
- `.madrasa-input` — styled form input
- `.madrasa-input-arabic` — input with ALKANZ font, RTL, larger size
- `.madrasa-label` — uppercase Cinzel label
- `.badge-gold`, `.badge-blue`, `.badge-green`, `.badge-red` — pill badges
- `.arabic-text` — ALKANZ font, RTL, 2x line-height
- `.quiz-option`, `.selected-correct`, `.selected-wrong`, `.revealed-correct` — quiz answer buttons
- `.progress-bar-track`, `.progress-bar-fill` — gold animated progress bar
- `.animate-fade-in-up`, `.animate-fade-in`, `.animate-scale-in` — entrance animations
- `.ornament-divider` — gold decorative line with center element
- `.page-container` — max-w-1200 padded wrapper

---

## Database Schema

**File:** `supabase/schema.sql` — run in Supabase SQL Editor (idempotent, safe to re-run).

Tables:
- `classes` — id, name, description, teacher_id (→ auth.users), created_at
- `subjects` — id, class_id (→ classes), name, description, created_at
- `tasks` — id, subject_id (→ subjects), class_id (→ classes), title, description, drive_link, submission_date, created_at
- `questions` — id, task_id (→ tasks), question_text, option_a/b/c/d, correct_option (a/b/c/d), order_index
- `student_submissions` — id, task_id, student_id (→ auth.users), submitted_at, score, total_questions, completed; UNIQUE(task_id, student_id)
- `student_answers` — id, submission_id, question_id, selected_option, is_correct; UNIQUE(submission_id, question_id)
- `class_enrollments` — id, class_id (→ classes, CASCADE), student_id (→ auth.users, CASCADE), **student_email** (TEXT, stored denormalized for display), enrolled_at; UNIQUE(class_id, student_id)

RLS is enabled on all tables with permissive "allow all" policies (prototype mode).

**Cascade deletes:** deleting a class cascades → subjects → tasks → questions, student_submissions → student_answers, class_enrollments. Everything is cleaned up automatically.

---

## Authentication

**No login flow** — three test accounts accessed by hardcoded UUIDs in env vars.

Seed script: `supabase/seed.ts` (or `npm run setup` for all-in-one)
- Creates `teacher@gmail.com`, `student@gmail.com`, `student2@gmail.com` via Supabase Auth Admin API
- Writes all UUIDs to `.env.local` automatically on run

**Known UUIDs (project `pwlzdvbyygsdjimdcyfa`):**
- Teacher: `cc4d012c-f252-4f04-a5e6-3e552d90d6ff`
- Student 1: `76b03524-0207-4923-8150-b17faf811126`
- Student 2 (unenrolled): `7409446d-a758-49e5-826c-a7008634977c`

**Passwords:**
- teacher@gmail.com → `Madrasa@Teacher1`
- student@gmail.com → `Madrasa@Student1`
- student2@gmail.com → `Madrasa@Student2`

**student2 is intentionally not enrolled in any class** — used to test that the student portal correctly hides classes until the teacher enrolls them via the Students tab.

**Schema note:** `setup.ts` / `seed.ts` use the service role key which can call the Auth Admin API but **cannot execute DDL** (CREATE TABLE). Schema must be pasted into the Supabase SQL Editor manually:
→ https://supabase.com/dashboard/project/pwlzdvbyygsdjimdcyfa/sql/new

---

## Environment Variables (`.env.local`)

All values are populated. Project ref: `pwlzdvbyygsdjimdcyfa`.

```
NEXT_PUBLIC_SUPABASE_URL=https://pwlzdvbyygsdjimdcyfa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<filled>
SUPABASE_SERVICE_ROLE_KEY=<filled>        # seed/setup scripts + /api/find-student only
NEXT_PUBLIC_TEACHER_ID=cc4d012c-f252-4f04-a5e6-3e552d90d6ff
NEXT_PUBLIC_STUDENT_ID=76b03524-0207-4923-8150-b17faf811126
NEXT_PUBLIC_STUDENT2_ID=7409446d-a758-49e5-826c-a7008634977c
```

---

## File Structure

```
madrasa/
├── .env.local
├── MEMORY.md                              # this file
├── lib/
│   ├── supabase.ts                        # Supabase client, TEACHER_ID, STUDENT_ID, getDriveEmbedUrl()
│   └── types.ts                           # Class, Subject, Task, Question, StudentSubmission, StudentAnswer, ClassEnrollment
├── supabase/
│   ├── schema.sql                         # Idempotent — run in Supabase SQL Editor
│   ├── seed.ts                            # Creates/upserts all 3 test users, writes UUIDs to .env.local
│   └── setup.ts                           # Convenience: tries schema via Mgmt API + runs seed
├── components/
│   ├── ArabicText.tsx                     # ALKANZ font wrapper, RTL
│   ├── ui/
│   │   ├── Button.tsx                     # Primary/Gold/Ghost/Danger variants
│   │   ├── Badge.tsx                      # Gold/Blue/Green/Red pill badges
│   │   ├── PageHeader.tsx                 # Title + breadcrumbs + optional action
│   │   ├── PortalNav.tsx                  # Sticky navbar (teacher/student role-aware)
│   │   └── EmptyState.tsx                 # Empty placeholder with optional CTA
│   ├── teacher/
│   │   └── QuestionBuilder.tsx            # Dynamic question adder for task creation form
│   └── student/
│       └── QuizPlayer.tsx                 # One-at-a-time quiz with feedback + summary
├── app/
│   ├── globals.css                        # Full design system
│   ├── layout.tsx                         # Root layout (Google Fonts via <link>)
│   ├── page.tsx                           # Landing — Teacher / Student portal selector
│   ├── api/
│   │   └── find-student/route.ts          # POST {email} → {id, email} (uses service role key server-side)
│   ├── teacher/
│   │   ├── layout.tsx                     # Teacher layout + PortalNav
│   │   ├── page.tsx                       # Teacher dashboard (stats + classes grid)
│   │   └── classes/
│   │       ├── page.tsx                   # All classes list
│   │       ├── new/page.tsx               # Create class form
│   │       └── [classId]/
│   │           ├── page.tsx               # Class detail — 3 tabs: Subjects / Students / Analytics
│   │           ├── edit/page.tsx          # Edit class name + description
│   │           └── subjects/
│   │               ├── new/page.tsx       # Create subject form
│   │               └── [subjectId]/
│   │                   ├── page.tsx       # Subject detail (tasks list)
│   │                   └── tasks/
│   │                       ├── new/page.tsx       # Create task form (details + QuestionBuilder)
│   │                       └── [taskId]/page.tsx  # Task detail — 2 tabs: Questions / Analytics; Delete button
│   └── student/
│       ├── layout.tsx                     # Student layout
│       ├── page.tsx                       # Student dashboard — 2 tabs: My Classes / All Tasks; pending callout
│       └── classes/
│           └── [classId]/
│               ├── page.tsx               # Class subjects
│               └── subjects/
│                   └── [subjectId]/
│                       ├── page.tsx       # Subject tasks (with submission status badges)
│                       └── tasks/
│                           └── [taskId]/page.tsx  # Task: slide embed + QuizPlayer
```

---

## Key Implementation Notes

1. **Google Drive embed:** `getDriveEmbedUrl()` in `lib/supabase.ts` extracts the document ID from any Google Slides URL and builds the embed URL.

2. **Quiz flow:** `QuizPlayer` shows questions one-at-a-time. Immediate color feedback on answer. After last question → `onComplete(answers, score)` → submission saved → summary screen inline.

3. **Student task page** has collapsible Google Slides viewer + quiz section below. Students can hide the slides after reviewing.

4. **Submission upsert:** `student_submissions` uses `UNIQUE(task_id, student_id)` — re-visiting a completed task shows the existing score without overwriting.

5. **Lisan ud Dawat text:** `ArabicText` applies ALKANZ font, RTL, generous line-height. Used in QuestionBuilder, QuizPlayer, and task detail views.

6. **No auth routing:** `/teacher/*` reads `NEXT_PUBLIC_TEACHER_ID`. `/student/*` reads `NEXT_PUBLIC_STUDENT_ID`. No session/middleware.

7. **Class enrollments:** stored in `class_enrollments`. `student_email` is stored denormalized (populated at enroll time via `/api/find-student`) so the teacher can display student emails without needing Auth Admin API access from the browser. Adding a student: teacher types email → API route looks up user → UUID + email inserted into `class_enrollments`.

8. **Student visibility:** students only see classes they are enrolled in (filtered by `class_enrollments` on student dashboard). Un-enrolled students (like student2) see an empty dashboard.

9. **Teacher class detail tabs:**
   - *Subjects* — grid of subjects with Open Subject links; + New Subject button appears here only
   - *Students* — enrolled list with Remove button; Add Student by email form at top
   - *Analytics* — summary cards (students, tasks, completion rate, avg score); task performance table; student performance table with progress bars

10. **Task detail tabs:**
    - *Questions* — read-only view of all MCQ questions with correct answers highlighted in gold
    - *Analytics* — summary cards (enrolled, submitted, missed, avg score); per-question breakdown with correct/wrong counts and progress bar; questions with <50% correct marked as "Problematic"

11. **Teacher actions:**
    - Edit class → `/teacher/classes/[classId]/edit`
    - Delete class → inline confirm → Supabase delete cascades everything (subjects, tasks, questions, submissions, answers, enrollments)
    - Delete task → inline confirm on task detail page → redirects to subject page

12. **Student dashboard features:**
    - Pending tasks callout at the top — shows up to 4 pending tasks with direct links; "+N more" button switches to Tasks tab
    - Tabs: My Classes (filtered by enrollment) | All Tasks (all tasks across enrolled classes)
    - All Tasks filter pills: All / Pending / Missed / Completed
    - Each task row shows: title, class+subject+due date, status badge, score (if completed), "Open Task" or "View Results" link

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/find-student` | POST `{email}` | Looks up user by email via Auth Admin API (uses SUPABASE_SERVICE_ROLE_KEY server-side). Returns `{id, email}` or 404. Used by teacher's "Add Student" form. |

---

## Setup Status

✅ Supabase project created — `pwlzdvbyygsdjimdcyfa`
✅ `.env.local` fully populated (URL, anon key, service role key, teacher ID, student IDs)
✅ Auth users created (`teacher@gmail.com`, `student@gmail.com`, `student2@gmail.com`)
⏳ **Schema SQL still needs to be run** — paste `supabase/schema.sql` into:
   https://supabase.com/dashboard/project/pwlzdvbyygsdjimdcyfa/sql/new
✅ After schema is run → `npm run dev` → http://localhost:3000

## npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run seed` | Create/re-create all 3 test auth users, write UUIDs to .env.local |
| `npm run setup` | All-in-one: attempts schema via Mgmt API + runs seed |
