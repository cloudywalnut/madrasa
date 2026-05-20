"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, STUDENT_ID, getDriveEmbedUrl } from "@/lib/supabase";
import { Class, Subject, Task, Question, AnswerOption, StudentSubmission } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import QuizPlayer from "@/components/student/QuizPlayer";

export default function StudentTaskPage() {
  const { classId, subjectId, taskId } = useParams<{
    classId: string;
    subjectId: string;
    taskId: string;
  }>();

  const [cls, setCls] = useState<Class | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [existingSubmission, setExistingSubmission] = useState<StudentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideCollapsed, setSlideCollapsed] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("tasks").select("*").eq("id", taskId).single(),
      supabase.from("questions").select("*").eq("task_id", taskId).order("order_index"),
      supabase
        .from("student_submissions")
        .select("*")
        .eq("task_id", taskId)
        .eq("student_id", STUDENT_ID)
        .maybeSingle(),
    ]).then(([{ data: c }, { data: s }, { data: t }, { data: q }, { data: sub }]) => {
      setCls(c);
      setSubject(s);
      setTask(t);
      setQuestions(q ?? []);
      setExistingSubmission(sub ?? null);
      setLoading(false);
    });
  }, [classId, subjectId, taskId]);

  async function handleQuizComplete(answers: Record<string, AnswerOption>, score: number) {
    // Upsert submission record
    const { data: sub, error: subErr } = await supabase
      .from("student_submissions")
      .upsert(
        {
          task_id: taskId,
          student_id: STUDENT_ID,
          submitted_at: new Date().toISOString(),
          score,
          total_questions: questions.length,
          completed: true,
        },
        { onConflict: "task_id,student_id" }
      )
      .select()
      .single();

    if (subErr) {
      console.error("Error saving submission:", subErr);
      return;
    }

    // Upsert individual answers
    const answerRows = Object.entries(answers).map(([questionId, selectedOption]) => ({
      submission_id: sub.id,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: questions.find((q) => q.id === questionId)?.correct_option === selectedOption,
    }));

    await supabase
      .from("student_answers")
      .upsert(answerRows, { onConflict: "submission_id,question_id" });

    setExistingSubmission(sub);
  }

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
        Loading task…
      </div>
    );
  }

  if (!task) {
    return <div style={{ padding: "2rem", color: "#B91C1C", fontFamily: "var(--font-body)" }}>Task not found.</div>;
  }

  const overdue = new Date(task.submission_date) < new Date();

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={task.title}
        subtitle={task.description ?? undefined}
        breadcrumbs={[
          { label: "My Classes", href: "/student" },
          { label: cls?.name ?? "Class", href: `/student/classes/${classId}` },
          { label: subject?.name ?? "Subject", href: `/student/classes/${classId}/subjects/${subjectId}` },
          { label: task.title },
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        {existingSubmission?.completed ? (
          <Badge variant="green">✓ Completed — {existingSubmission.score}/{existingSubmission.total_questions}</Badge>
        ) : overdue ? (
          <Badge variant="red">Overdue</Badge>
        ) : (
          <Badge variant="gold">
            Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Badge>
        )}
        <Badge variant="blue">{questions.length} Question{questions.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Presentation section */}
      <div className="madrasa-card mb-6 overflow-hidden">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setSlideCollapsed((v) => !v)}
          className="madrasa-card-header w-full text-left"
          style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
        >
          <div className="relative z-10 flex items-center justify-between" style={{ padding: "0.875rem 1.25rem" }}>
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--color-gold-light)", fontSize: "1rem" }}>▶</span>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "white" }}>
                Lesson Presentation
              </span>
            </div>
            <span style={{ color: "var(--color-gold-light)", fontSize: "0.75rem", fontFamily: "var(--font-heading)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {slideCollapsed ? "Show ▼" : "Hide ▲"}
            </span>
          </div>
        </button>

        {!slideCollapsed && (
          <>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                background: "#0A1628",
              }}
            >
              <iframe
                src={getDriveEmbedUrl(task.drive_link)}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allowFullScreen
                title="Lesson presentation"
              />
            </div>
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)", fontStyle: "italic" }}>
                Review the presentation above before answering the questions below.
              </p>
              <a
                href={task.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-azure)", whiteSpace: "nowrap", marginLeft: "1rem" }}
              >
                Open ↗
              </a>
            </div>
          </>
        )}
      </div>

      {/* Quiz section */}
      <div className="madrasa-card" style={{ padding: "1.75rem" }}>
        <div className="flex items-center gap-3 mb-5">
          <span style={{ color: "var(--color-gold)", fontSize: "1.25rem" }}>✦</span>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-navy)" }}>
            Questions
          </h2>
        </div>

        {questions.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
            No questions for this task.
          </p>
        ) : (
          <QuizPlayer
            key={taskId}
            questions={questions}
            onComplete={handleQuizComplete}
          />
        )}
      </div>

      <div className="mt-6">
        <Link href={`/student/classes/${classId}/subjects/${subjectId}`}>
          <button className="btn-ghost">← Back to Subject</button>
        </Link>
      </div>
    </div>
  );
}
