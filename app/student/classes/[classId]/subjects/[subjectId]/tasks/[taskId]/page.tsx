"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, STUDENT_ID, getDriveEmbedUrl } from "@/lib/supabase";
import { Class, Subject, Task, Question, AnswerOption, StudentSubmission, StudentAnswer } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import ArabicText from "@/components/ArabicText";
import QuizPlayer from "@/components/student/QuizPlayer";
import Loader from "@/components/ui/Loader";

const OPT_LABELS: Record<AnswerOption, string> = { a: "١", b: "٢", c: "٣", d: "٤" };
const OPTIONS: AnswerOption[] = ["a", "b", "c", "d"];

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
  const [existingAnswers, setExistingAnswers] = useState<Record<string, AnswerOption>>({});
  const [loading, setLoading] = useState(true);
  const [slideCollapsed, setSlideCollapsed] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }, { data: t }, { data: q }, { data: sub }] =
        await Promise.all([
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
        ]);

      setCls(c);
      setSubject(s);
      setTask(t);
      setQuestions(q ?? []);
      setExistingSubmission(sub ?? null);

      // If already completed, fetch stored answers
      if (sub?.completed) {
        const { data: ansData } = await supabase
          .from("student_answers")
          .select("question_id, selected_option")
          .eq("submission_id", sub.id);
        const map: Record<string, AnswerOption> = {};
        (ansData ?? []).forEach((a: Pick<StudentAnswer, "question_id" | "selected_option">) => {
          map[a.question_id] = a.selected_option;
        });
        setExistingAnswers(map);
      }

      setLoading(false);
    }
    load();
  }, [classId, subjectId, taskId]);

  async function handleQuizComplete(answers: Record<string, AnswerOption>, score: number) {
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

    if (subErr) { console.error("Error saving submission:", subErr); return; }

    const answerRows = Object.entries(answers).map(([questionId, selectedOption]) => ({
      submission_id: sub.id,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: questions.find((q) => q.id === questionId)?.correct_option === selectedOption,
    }));

    await supabase.from("student_answers").upsert(answerRows, { onConflict: "submission_id,question_id" });
    setExistingSubmission(sub);
    setExistingAnswers(answers);
  }

  if (loading) return <Loader />;
  if (!task) return <div style={{ padding: "2rem", color: "#B91C1C", fontFamily: "var(--font-body)" }}>Task not found.</div>;

  const overdue = new Date(task.submission_date) < new Date();
  const completed = existingSubmission?.completed ?? false;

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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "1.5rem" }}>
        {completed ? (
          <Badge variant="green">✓ Completed — {existingSubmission!.score}/{existingSubmission!.total_questions}</Badge>
        ) : overdue ? (
          <Badge variant="red">Overdue</Badge>
        ) : (
          <Badge variant="gold">
            Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Badge>
        )}
        <Badge variant="blue">{questions.length} Question{questions.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Presentation */}
      <div className="madrasa-card mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setSlideCollapsed((v) => !v)}
          className="madrasa-card-header w-full text-left"
          style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
        >
          <div className="relative z-10" style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
            <div style={{ position: "relative", paddingBottom: "56.25%", background: "#0A1628" }}>
              <iframe
                src={getDriveEmbedUrl(task.drive_link)}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
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

      {/* Quiz / Results section */}
      <div className="madrasa-card" style={{ padding: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ color: "var(--color-gold)", fontSize: "1.25rem" }}>✦</span>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-navy)" }}>
            {completed ? "Your Results" : "Questions"}
          </h2>
        </div>

        {questions.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>No questions for this task.</p>
        ) : completed ? (
          <ResultsView
            questions={questions}
            studentAnswers={existingAnswers}
            submission={existingSubmission!}
          />
        ) : (
          <QuizPlayer key={taskId} questions={questions} onComplete={handleQuizComplete} />
        )}
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <Link href={`/student/classes/${classId}/subjects/${subjectId}`}>
          <button className="btn-ghost">← Back to Subject</button>
        </Link>
      </div>
    </div>
  );
}

// ── Read-only results view (pre-selected answers from DB) ─────────────────────
function ResultsView({
  questions,
  studentAnswers,
  submission,
}: {
  questions: Question[];
  studentAnswers: Record<string, AnswerOption>;
  submission: StudentSubmission;
}) {
  const score = submission.score ?? 0;
  const total = submission.total_questions ?? questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="animate-fade-in-up">
      {/* Score banner */}
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1.5rem",
          borderRadius: "1.25rem",
          marginBottom: "1.75rem",
          background:
            pct >= 80
              ? "linear-gradient(135deg, #14532D, #166534)"
              : pct >= 50
              ? "linear-gradient(135deg, var(--color-royal), var(--color-navy))"
              : "linear-gradient(135deg, #7F1D1D, #991B1B)",
          border: "1px solid rgba(200,150,30,0.3)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: "0.375rem" }}>
          {pct >= 80 ? "🏆" : pct >= 50 ? "✦" : "📖"}
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", color: "white", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
          {score} / {total} Correct
        </h2>
        <p style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.7)", fontSize: "1rem", fontStyle: "italic" }}>
          {pct}% — {pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort!" : "Keep studying!"}
        </p>
        {submission.submitted_at && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", marginTop: "0.5rem" }}>
            Submitted {new Date(submission.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Per-question review */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {questions.map((q, i) => {
          const chosen = studentAnswers[q.id];
          const isCorrect = chosen === q.correct_option;

          return (
            <div
              key={q.id}
              className="animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.06}s`,
                borderRadius: "1rem",
                border: `1.5px solid ${isCorrect ? "#BBF7D0" : "#FECDD3"}`,
                background: isCorrect ? "#F0FDF4" : "#FFF1F2",
                overflow: "hidden",
              }}
            >
              {/* Question header */}
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  background: isCorrect
                    ? "linear-gradient(135deg, #14532D, #166534)"
                    : "linear-gradient(135deg, #7F1D1D, #991B1B)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                  Question {i + 1}
                </span>
                <span
                  className={isCorrect ? "badge-green" : "badge-red"}
                  style={{ fontSize: "0.7rem" }}
                >
                  {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                </span>
              </div>

              <div style={{ padding: "1.25rem" }}>
                <ArabicText size="lg" style={{ display: "block", marginBottom: "1.25rem" }}>
                  {q.question_text}
                </ArabicText>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {OPTIONS.map((opt) => {
                    const optField = `option_${opt}` as keyof Question;
                    const text = q[optField] as string;
                    const isChosen = chosen === opt;
                    const isCorrectOpt = q.correct_option === opt;

                    let btnClass = "quiz-option";
                    if (isChosen && isCorrectOpt) btnClass += " selected-correct";
                    else if (isChosen && !isCorrectOpt) btnClass += " selected-wrong";
                    else if (!isChosen && isCorrectOpt) btnClass += " revealed-correct";

                    return (
                      <button key={opt} type="button" className={btnClass} disabled>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
                          <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1.4rem" }}>{text}</span>
                          <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1.1rem", color: "var(--color-gold)", opacity: 0.7, minWidth: "1.5rem", textAlign: "center" }}>
                            {OPT_LABELS[opt]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!isCorrect && (
                  <div
                    style={{
                      marginTop: "0.875rem",
                      padding: "0.625rem 0.875rem",
                      borderRadius: "0.5rem",
                      background: "rgba(21,128,61,0.08)",
                      border: "1px solid #BBF7D0",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.9rem",
                      color: "#15803D",
                    }}
                  >
                    ✓ Correct answer:{" "}
                    <ArabicText size="sm" style={{ display: "inline" }}>
                      {q[`option_${q.correct_option}` as keyof Question] as string}
                    </ArabicText>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
