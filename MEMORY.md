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

**File:** `supabase/schema.sql` — run in Supabase SQL Editor.

Tables:
- `classes` — id, name, description, teacher_id (→ auth.users), created_at
- `subjects` — id, class_id (→ classes), name, description, created_at
- `tasks` — id, subject_id (→ subjects), class_id (→ classes), title, description, drive_link, submission_date, created_at
- `questions` — id, task_id (→ tasks), question_text, option_a/b/c/d, correct_option (a/b/c/d), order_index
- `student_submissions` — id, task_id, student_id (→ auth.users), submitted_at, score, total_questions, completed; UNIQUE(task_id, student_id)
- `student_answers` — id, submission_id, question_id, selected_option, is_correct; UNIQUE(submission_id, question_id)

RLS is enabled on all tables with permissive "allow all" policies (prototype mode).

---

## Authentication

**No login flow** — two test accounts are accessed by hardcoded UUIDs in env vars.

Seed script: `supabase/seed.ts` (or `npm run setup` for all-in-one)
- Creates `teacher@gmail.com` (password: `Madrasa@Teacher1`) and `student@gmail.com` (password: `Madrasa@Student1`) via Supabase Auth Admin API
- **Already run** — UUIDs written to `.env.local`

**Known UUIDs (project `pwlzdvbyygsdjimdcyfa`):**
- Teacher: `cc4d012c-f252-4f04-a5e6-3e552d90d6ff`
- Student: `76b03524-0207-4923-8150-b17faf811126`

**Schema note:** `setup.ts` / `seed.ts` use the service role key which can call the Auth Admin API but **cannot execute DDL** (CREATE TABLE). Schema must be pasted into the Supabase SQL Editor manually:
→ https://supabase.com/dashboard/project/pwlzdvbyygsdjimdcyfa/sql/new

---

## Environment Variables (`.env.local`)

All values are populated. Project ref: `pwlzdvbyygsdjimdcyfa`.

```
NEXT_PUBLIC_SUPABASE_URL=https://pwlzdvbyygsdjimdcyfa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<filled>
SUPABASE_SERVICE_ROLE_KEY=<filled>        # seed/setup scripts only — not exposed to browser
NEXT_PUBLIC_TEACHER_ID=cc4d012c-f252-4f04-a5e6-3e552d90d6ff
NEXT_PUBLIC_STUDENT_ID=76b03524-0207-4923-8150-b17faf811126
```

---

## File Structure

```
madrasa/
├── .env.local                           # env vars (fill in after setup)
├── MEMORY.md                            # this file
├── lib/
│   ├── supabase.ts                      # Supabase client, TEACHER_ID, STUDENT_ID, getDriveEmbedUrl()
│   └── types.ts                         # Class, Subject, Task, Question, StudentSubmission, StudentAnswer
├── supabase/
│   ├── schema.sql                       # Run in Supabase SQL Editor (manual — DDL not executable via service role)
│   ├── seed.ts                          # Creates test users via Supabase Auth Admin API
│   └── setup.ts                         # Convenience wrapper: runs schema (tries Mgmt API) + seed in one command
├── components/
│   ├── ArabicText.tsx                   # ALKANZ font wrapper, RTL, configurable size
│   ├── ui/
│   │   ├── Button.tsx                   # Primary/Gold/Ghost/Danger variants
│   │   ├── Badge.tsx                    # Gold/Blue/Green/Red pill badges
│   │   ├── PageHeader.tsx               # Title + breadcrumbs + gold rule + optional action
│   │   ├── PortalNav.tsx                # Sticky navbar (teacher/student role-aware)
│   │   └── EmptyState.tsx              # Empty placeholder with optional CTA
│   ├── teacher/
│   │   └── QuestionBuilder.tsx          # Dynamic question adder for task creation form
│   └── student/
│       └── QuizPlayer.tsx               # One-at-a-time quiz with feedback + summary
├── app/
│   ├── globals.css                      # Full design system (fonts, tokens, utilities)
│   ├── layout.tsx                       # Root layout (no fonts, just metadata)
│   ├── page.tsx                         # Landing — portal selection (Teacher / Student)
│   ├── teacher/
│   │   ├── layout.tsx                   # Teacher layout wrapping PortalNav + page-container
│   │   ├── page.tsx                     # Teacher dashboard (stats + classes grid)
│   │   └── classes/
│   │       ├── page.tsx                 # All classes list
│   │       ├── new/page.tsx             # Create class form
│   │       └── [classId]/
│   │           ├── page.tsx             # Class detail (subjects grid)
│   │           └── subjects/
│   │               ├── new/page.tsx     # Create subject form
│   │               └── [subjectId]/
│   │                   ├── page.tsx     # Subject detail (tasks list)
│   │                   └── tasks/
│   │                       ├── new/page.tsx    # Create task form (details + question builder)
│   │                       └── [taskId]/page.tsx  # Task detail (slide preview + questions)
│   └── student/
│       ├── layout.tsx                   # Student layout
│       ├── page.tsx                     # Student dashboard (all classes grid)
│       └── classes/
│           └── [classId]/
│               ├── page.tsx             # Class subjects
│               └── subjects/
│                   └── [subjectId]/
│                       ├── page.tsx     # Subject tasks (with submission status badges)
│                       └── tasks/
│                           └── [taskId]/page.tsx  # Task page: slide embed + QuizPlayer
```

---

## Key Implementation Notes

1. **Google Drive embed:** `getDriveEmbedUrl()` in `lib/supabase.ts` extracts the document ID from any Google Slides URL and builds the embed URL (`/embed?start=false&loop=false`). The presentation iframe is collapsible on the student task page.

2. **Quiz flow:** `QuizPlayer` shows questions one-at-a-time. After selecting an answer, immediate color feedback is shown (green correct / red shake incorrect). A "Next" button advances. After the last question, `onComplete` is called → submission saved to Supabase → summary screen rendered inline (no separate route).

3. **Student task page** has a collapsible Google Slides viewer (full 16:9 iframe) at the top and the quiz section below. Students can hide the slides after reviewing.

4. **Submission upsert:** `student_submissions` uses `UNIQUE(task_id, student_id)` so re-visiting a completed task simply shows the existing score without overwriting.

5. **Lisan ud Dawat text:** The `ArabicText` component applies `font-family: ALKANZ`, `direction: rtl`, `text-align: right`, and generous `line-height: 2`. All question text and answer options in both teacher (QuestionBuilder) and student (QuizPlayer) views render with this treatment.

6. **No auth routing:** `/teacher/*` routes assume `NEXT_PUBLIC_TEACHER_ID` is the active user. `/student/*` routes assume `NEXT_PUBLIC_STUDENT_ID`. No session, no middleware.

---

## Setup Status

✅ Supabase project created — `pwlzdvbyygsdjimdcyfa`
✅ `.env.local` fully populated (URL, anon key, service role key, teacher ID, student ID)
✅ Auth users created (`teacher@gmail.com`, `student@gmail.com`)
⏳ **Schema SQL still needs to be run** — paste `supabase/schema.sql` into:
   https://supabase.com/dashboard/project/pwlzdvbyygsdjimdcyfa/sql/new
✅ After schema is run → `npm run dev` → http://localhost:3000

## npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run seed` | Create/re-create test auth users |
| `npm run setup` | All-in-one: attempts schema + creates users |
