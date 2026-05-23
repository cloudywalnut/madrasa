"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, Task, Question, StudentSubmission, StudentAnswer, ClassEnrollment } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ArabicText from "@/components/ArabicText";
import { getDriveEmbedUrl } from "@/lib/supabase";
import Loader from "@/components/ui/Loader";

const OPT_LABELS: Record<string, string> = { a: "١", b: "٢", c: "٣", d: "٤" };
const OPTIONS = ["a", "b", "c", "d"] as const;

type MainTab = "questions" | "analytics" | "submissions";

interface QuestionStat {
  question: Question;
  correct: number;
  wrong: number;
  total: number;
}

interface SubmissionEntry {
  enrollment: ClassEnrollment;
  submission: StudentSubmission | null;
}

export default function TaskDetailPage() {
  const { classId, subjectId, taskId } = useParams<{ classId: string; subjectId: string; taskId: string }>();
  const router = useRouter();

  const [cls, setCls] = useState<Class | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>("questions");

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Analytics
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedSubs, setCompletedSubs] = useState<StudentSubmission[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);

  // Submissions
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsLoaded, setSubsLoaded] = useState(false);
  const [submissionEntries, setSubmissionEntries] = useState<SubmissionEntry[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, Record<string, string>>>({}); // submissionId → {questionId: option}

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("tasks").select("*").eq("id", taskId).single(),
      supabase.from("questions").select("*").eq("task_id", taskId).order("order_index"),
    ]).then(([{ data: c }, { data: s }, { data: t }, { data: q }]) => {
      setCls(c);
      setSubject(s);
      setTask(t);
      setQuestions(q ?? []);
      setLoading(false);
    });
  }, [classId, subjectId, taskId]);

  const loadAnalytics = useCallback(async () => {
    if (analyticsLoaded) return;
    setAnalyticsLoading(true);
    const [{ data: enrollData }, { data: subsData }] = await Promise.all([
      supabase.from("class_enrollments").select("id").eq("class_id", classId),
      supabase.from("student_submissions").select("*").eq("task_id", taskId).eq("completed", true),
    ]);
    const subs: StudentSubmission[] = subsData ?? [];
    setEnrolledCount(enrollData?.length ?? 0);
    setCompletedSubs(subs);

    if (subs.length > 0 && questions.length > 0) {
      const { data: answersData } = await supabase
        .from("student_answers")
        .select("question_id, is_correct")
        .in("submission_id", subs.map((s) => s.id));
      const answers: Pick<StudentAnswer, "question_id" | "is_correct">[] = answersData ?? [];
      setQuestionStats(
        questions.map((q) => {
          const qa = answers.filter((a) => a.question_id === q.id);
          const correct = qa.filter((a) => a.is_correct).length;
          return { question: q, correct, wrong: qa.length - correct, total: qa.length };
        })
      );
    }
    setAnalyticsLoading(false);
    setAnalyticsLoaded(true);
  }, [analyticsLoaded, classId, taskId, questions]);

  const loadSubmissions = useCallback(async () => {
    if (subsLoaded) return;
    setSubsLoading(true);
    const [{ data: enrollData }, { data: subsData }] = await Promise.all([
      supabase.from("class_enrollments").select("*").eq("class_id", classId).order("enrolled_at"),
      supabase.from("student_submissions").select("*").eq("task_id", taskId),
    ]);
    const enrollments: ClassEnrollment[] = enrollData ?? [];
    const subs: StudentSubmission[] = subsData ?? [];
    const subsMap = new Map(subs.map((s) => [s.student_id, s]));
    setSubmissionEntries(
      enrollments.map((e) => ({ enrollment: e, submission: subsMap.get(e.student_id) ?? null }))
    );
    setSubsLoading(false);
    setSubsLoaded(true);
  }, [subsLoaded, classId, taskId]);

  useEffect(() => {
    if (activeTab === "analytics" && !analyticsLoaded) loadAnalytics();
    if (activeTab === "submissions" && !subsLoaded) loadSubmissions();
  }, [activeTab, analyticsLoaded, subsLoaded, loadAnalytics, loadSubmissions]);

  async function expandStudent(entry: SubmissionEntry) {
    const sid = entry.enrollment.student_id;
    if (expandedStudentId === sid) { setExpandedStudentId(null); return; }
    setExpandedStudentId(sid);
    if (!entry.submission) return;
    const subId = entry.submission.id;
    if (expandedAnswers[subId]) return; // already loaded
    const { data } = await supabase
      .from("student_answers")
      .select("question_id, selected_option, is_correct")
      .eq("submission_id", subId);
    const map: Record<string, string> = {};
    (data ?? []).forEach((a: { question_id: string; selected_option: string }) => { map[a.question_id] = a.selected_option; });
    setExpandedAnswers((prev) => ({ ...prev, [subId]: map }));
  }

  async function handleDeleteTask() {
    setDeleteLoading(true);
    await supabase.from("tasks").delete().eq("id", taskId);
    router.push(`/teacher/classes/${classId}/subjects/${subjectId}`);
  }

  if (loading) return <Loader />;
  if (!task) return null;

  const overdue = new Date(task.submission_date) < new Date();

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={task.title}
        subtitle={task.description ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls?.name ?? "Class", href: `/teacher/classes/${classId}` },
          { label: subject?.name ?? "Subject", href: `/teacher/classes/${classId}/subjects/${subjectId}` },
          { label: task.title },
        ]}
        action={
          <Button variant="danger" onClick={() => setDeleteConfirm(true)}>Delete Task</Button>
        }
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "1.5rem" }}>
        <Badge variant={overdue ? "red" : "gold"}>
          Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </Badge>
        <Badge variant="blue">{questions.length} Question{questions.length !== 1 ? "s" : ""}</Badge>
        <Badge variant="green">Created {new Date(task.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Badge>
      </div>

      {/* Slide preview */}
      <div className="madrasa-card mb-6 overflow-hidden">
        <div className="madrasa-card-header">
          <div className="relative z-10" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-gold-light)", fontSize: "1rem" }}>▶</span>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "white" }}>Presentation</h3>
          </div>
        </div>
        <div style={{ position: "relative", paddingBottom: "56.25%", background: "#0A1628" }}>
          <iframe
            src={getDriveEmbedUrl(task.drive_link)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allowFullScreen
            title="Task presentation"
          />
        </div>
        <div style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--color-border)" }}>
          <a href={task.drive_link} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-heading)", fontSize: "0.8125rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-azure)" }}>
            Open in Google Slides ↗
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-border)", marginBottom: "1.5rem" }}>
        {([
          { key: "questions" as MainTab, label: `Questions (${questions.length})` },
          { key: "analytics" as MainTab, label: "Analytics" },
          { key: "submissions" as MainTab, label: `Submissions` },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.09em", textTransform: "uppercase",
              padding: "0.625rem 1.25rem", background: "transparent", border: "none",
              borderBottom: activeTab === key ? "2px solid var(--color-gold)" : "2px solid transparent",
              marginBottom: "-2px", color: activeTab === key ? "var(--color-navy)" : "var(--color-muted)",
              cursor: "pointer", transition: "color 0.15s",
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Questions panel ── */}
      {activeTab === "questions" && (
        <div>
          {questions.length === 0 ? (
            <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>No questions added to this task.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {questions.map((q, i) => (
                <div key={q.id} className="madrasa-card animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s`, padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span className="badge-blue">Q{i + 1}</span>
                  </div>
                  <ArabicText size="lg" style={{ display: "block", marginBottom: "1rem" }}>{q.question_text}</ArabicText>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(["a", "b", "c", "d"] as const).map((opt) => {
                      const field = `option_${opt}` as keyof Question;
                      const isCorrect = q.correct_option === opt;
                      return (
                        <div key={opt} style={{
                          padding: "0.625rem 1rem", borderRadius: "0.5rem",
                          border: isCorrect ? "2px solid var(--color-gold)" : "1px solid var(--color-border)",
                          background: isCorrect ? "var(--color-gold-mist)" : "white",
                          display: "flex", alignItems: "center", gap: "0.625rem",
                          justifyContent: "flex-end", flexDirection: "row-reverse",
                        }}>
                          {isCorrect && <span className="badge-gold" style={{ fontSize: "0.65rem" }}>✓</span>}
                          <ArabicText size="sm">{q[field] as string}</ArabicText>
                          <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1rem", color: "var(--color-gold)", opacity: 0.7 }}>{OPT_LABELS[opt]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: "1.5rem" }}>
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}`}>
              <Button variant="ghost">← Back to Subject</Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Analytics panel ── */}
      {activeTab === "analytics" && (
        analyticsLoading ? (
          <Loader />
        ) : (
          <TaskAnalyticsPanel enrolledCount={enrolledCount} submissions={completedSubs} questionStats={questionStats} questions={questions} />
        )
      )}

      {/* ── Submissions panel ── */}
      {activeTab === "submissions" && (
        subsLoading ? (
          <Loader />
        ) : (
          <SubmissionsPanel
            entries={submissionEntries}
            questions={questions}
            expandedStudentId={expandedStudentId}
            expandedAnswers={expandedAnswers}
            onToggle={expandStudent}
          />
        )
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div
          onClick={() => !deleteLoading && setDeleteConfirm(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="madrasa-card animate-fade-in-up"
            style={{ width: "100%", maxWidth: "420px", padding: "2rem", textAlign: "center" }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%", margin: "0 auto 1.25rem",
              background: "rgba(185,28,28,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", color: "var(--color-navy)", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
              Delete Task
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
              Are you sure you want to delete
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-navy)", marginBottom: "1.5rem" }}>
              &ldquo;{task.title}&rdquo;?
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "#B91C1C", marginBottom: "1.75rem" }}>
              This will permanently remove the task and all student submissions.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button variant="ghost" onClick={() => setDeleteConfirm(false)} disabled={deleteLoading} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteTask} disabled={deleteLoading} style={{ flex: 1 }}>
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Submissions panel ──────────────────────────────────────────────────────────
function SubmissionsPanel({
  entries,
  questions,
  expandedStudentId,
  expandedAnswers,
  onToggle,
}: {
  entries: SubmissionEntry[];
  questions: Question[];
  expandedStudentId: string | null;
  expandedAnswers: Record<string, Record<string, string>>;
  onToggle: (entry: SubmissionEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
        No students enrolled in this class yet.
      </div>
    );
  }

  const submitted = entries.filter((e) => e.submission?.completed).length;

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <span className="badge-green">{submitted} submitted</span>
        <span className="badge-red">{entries.length - submitted} not submitted</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {entries.map((entry, i) => {
          const isExpanded = expandedStudentId === entry.enrollment.student_id;
          const sub = entry.submission;
          const hasSubmitted = sub?.completed;
          const answers = sub ? (expandedAnswers[sub.id] ?? null) : null;
          const pct = hasSubmitted && sub.score !== null && sub.total_questions
            ? Math.round((sub.score / sub.total_questions) * 100) : null;

          return (
            <div
              key={entry.enrollment.id}
              className="madrasa-card animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Row */}
              <button
                type="button"
                onClick={() => hasSubmitted && onToggle(entry)}
                style={{
                  width: "100%", padding: "0.875rem 1.25rem", background: "transparent", border: "none",
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  cursor: hasSubmitted ? "pointer" : "default", textAlign: "left",
                }}
              >
                <div style={{
                  width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                  background: hasSubmitted
                    ? "linear-gradient(135deg, #14532D, #166534)"
                    : "linear-gradient(135deg, var(--color-muted), #3A4A6A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontFamily: "var(--font-heading)", fontSize: "0.9rem", fontWeight: 700,
                }}>
                  {entry.enrollment.student_email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-navy)", marginBottom: "0.125rem" }}>
                    {entry.enrollment.student_email}
                  </p>
                  {hasSubmitted && sub.submitted_at && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      Submitted {new Date(sub.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                  {hasSubmitted ? (
                    <>
                      <span className={pct !== null && pct >= 80 ? "badge-green" : pct !== null && pct >= 50 ? "badge-blue" : "badge-red"}>
                        {sub.score}/{sub.total_questions}
                      </span>
                      <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", color: "var(--color-muted)", letterSpacing: "0.05em" }}>
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </>
                  ) : (
                    <span className="badge-red">Not submitted</span>
                  )}
                </div>
              </button>

              {/* Expanded answers */}
              {isExpanded && hasSubmitted && (
                <div style={{ borderTop: "1px solid var(--color-border)", padding: "1.25rem", background: "var(--color-parchment)" }}>
                  {answers === null ? (
                    <Loader />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {questions.map((q, qi) => {
                        const chosen = answers[q.id] as (typeof OPTIONS)[number] | undefined;
                        const isCorrect = chosen === q.correct_option;
                        return (
                          <div key={q.id} style={{
                            borderRadius: "0.75rem",
                            border: `1px solid ${isCorrect ? "#BBF7D0" : "#FECDD3"}`,
                            background: isCorrect ? "#F0FDF4" : "#FFF1F2",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              padding: "0.5rem 1rem",
                              background: isCorrect ? "linear-gradient(135deg,#14532D,#166534)" : "linear-gradient(135deg,#7F1D1D,#991B1B)",
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                              <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                                Q{qi + 1}
                              </span>
                              <span className={isCorrect ? "badge-green" : "badge-red"} style={{ fontSize: "0.65rem" }}>
                                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                              </span>
                            </div>
                            <div style={{ padding: "0.875rem 1rem" }}>
                              <ArabicText size="md" style={{ display: "block", marginBottom: "0.875rem" }}>{q.question_text}</ArabicText>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {OPTIONS.map((opt) => {
                                  const field = `option_${opt}` as keyof Question;
                                  const isChosen = chosen === opt;
                                  const isCorrectOpt = q.correct_option === opt;
                                  let cls = "quiz-option";
                                  if (isChosen && isCorrectOpt) cls += " selected-correct";
                                  else if (isChosen && !isCorrectOpt) cls += " selected-wrong";
                                  else if (!isChosen && isCorrectOpt) cls += " revealed-correct";
                                  return (
                                    <button key={opt} type="button" className={cls} disabled>
                                      <span style={{ display: "flex", alignItems: "center", gap: "0.625rem", justifyContent: "flex-end" }}>
                                        <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1.3rem" }}>{q[field] as string}</span>
                                        <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1rem", color: "var(--color-gold)", opacity: 0.6, minWidth: "1.25rem", textAlign: "center" }}>
                                          {OPT_LABELS[opt]}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Task analytics panel ──────────────────────────────────────────────────────
function TaskAnalyticsPanel({
  enrolledCount, submissions, questionStats, questions,
}: {
  enrolledCount: number; submissions: StudentSubmission[]; questionStats: QuestionStat[]; questions: Question[];
}) {
  const submitted = submissions.length;
  const missed = Math.max(0, enrolledCount - submitted);
  const validScores = submissions.filter((s) => s.score !== null && s.total_questions);
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((sum, s) => sum + ((s.score as number) / (s.total_questions as number)) * 100, 0) / validScores.length)
    : null;

  return (
    <div className="animate-fade-in-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Enrolled", value: enrolledCount },
          { label: "Submitted", value: submitted },
          { label: "Missed", value: missed },
          { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="madrasa-card" style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: "0.375rem" }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", color: stat.label === "Missed" && missed > 0 ? "#B91C1C" : "var(--color-navy)", lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="madrasa-card overflow-hidden">
          <div className="madrasa-card-header">
            <h3 className="relative z-10" style={{ fontFamily: "var(--font-heading)", fontSize: "0.8125rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "white" }}>
              Per-Question Breakdown
            </h3>
          </div>
          {submitted === 0 ? (
            <p style={{ padding: "1.5rem", fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
              No submissions yet.
            </p>
          ) : (
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {questionStats.map((qs, i) => {
                const correctPct = qs.total > 0 ? Math.round((qs.correct / qs.total) * 100) : 0;
                const isProblematic = qs.total > 0 && correctPct < 50;
                return (
                  <div key={qs.question.id} style={{
                    padding: "1rem 1.25rem", borderRadius: "0.625rem",
                    border: isProblematic ? "1.5px solid #FCA5A5" : "1px solid var(--color-border)",
                    background: isProblematic ? "#FFF5F5" : "var(--color-parchment)",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={isProblematic ? "badge-red" : "badge-blue"}>Q{i + 1}</span>
                        {isProblematic && <span className="badge-red" style={{ fontSize: "0.65rem" }}>⚠ Problematic</span>}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <span className="badge-green">{qs.correct} correct</span>
                        <span className="badge-red">{qs.wrong} wrong</span>
                      </div>
                    </div>
                    <ArabicText size="md" style={{ display: "block", marginBottom: "0.75rem" }}>{qs.question.question_text}</ArabicText>
                    {qs.total > 0 && (
                      <div>
                        <div className="progress-bar-track" style={{ marginBottom: "0.25rem" }}>
                          <div className="progress-bar-fill" style={{ width: `${correctPct}%`, background: isProblematic ? "linear-gradient(90deg,#DC2626,#EF4444)" : undefined }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                          {correctPct}% correct ({qs.total} response{qs.total !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
