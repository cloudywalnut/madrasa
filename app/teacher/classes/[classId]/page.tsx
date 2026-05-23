"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, ClassEnrollment, Task, StudentSubmission } from "@/lib/types";
import { isArabic } from "@/lib/arabic";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

type Tab = "subjects" | "students" | "analytics";

interface TaskStat {
  task: Task;
  enrolled: number;
  submitted: number;
  avgScore: number | null;
}

interface StudentStat {
  enrollment: ClassEnrollment;
  completed: number;
  missed: number;
  avgScore: number | null;
}

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [cls, setCls] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [tab, setTab] = useState<Tab>("subjects");
  const [loading, setLoading] = useState(true);

  // Student management
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Delete class
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Analytics
  const [taskStats, setTaskStats] = useState<TaskStat[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  const load = useCallback(async () => {
    const [{ data: clsData }, { data: subData }, { data: enrollData }] = await Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("class_id", classId).order("created_at"),
      supabase.from("class_enrollments").select("*").eq("class_id", classId).order("enrolled_at"),
    ]);
    setCls(clsData);
    setSubjects(subData ?? []);
    setEnrollments(enrollData ?? []);
    setLoading(false);
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== "analytics" || analyticsLoaded) return;
    loadAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function loadAnalytics() {
    setAnalyticsLoading(true);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("class_id", classId)
      .order("submission_date");

    if (!tasks || tasks.length === 0) {
      setTaskStats([]);
      setStudentStats([]);
      setAnalyticsLoading(false);
      setAnalyticsLoaded(true);
      return;
    }

    const taskIds = tasks.map((t: Task) => t.id);
    const { data: subs } = await supabase
      .from("student_submissions")
      .select("*")
      .in("task_id", taskIds);

    const submissions: StudentSubmission[] = subs ?? [];
    const totalEnrolled = enrollments.length;
    const now = new Date();

    const tStats: TaskStat[] = tasks.map((task: Task) => {
      const taskSubs = submissions.filter((s) => s.task_id === task.id && s.completed);
      const scores = taskSubs
        .filter((s) => s.score !== null && s.total_questions)
        .map((s) => ((s.score as number) / (s.total_questions as number)) * 100);
      return {
        task,
        enrolled: totalEnrolled,
        submitted: taskSubs.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      };
    });
    setTaskStats(tStats);

    const sStats: StudentStat[] = enrollments.map((enrollment) => {
      const studentSubs = submissions.filter((s) => s.student_id === enrollment.student_id && s.completed);
      const completedIds = new Set(studentSubs.map((s) => s.task_id));
      const missed = tasks.filter((t: Task) => new Date(t.submission_date) < now && !completedIds.has(t.id)).length;
      const scores = studentSubs
        .filter((s) => s.score !== null && s.total_questions)
        .map((s) => ((s.score as number) / (s.total_questions as number)) * 100);
      return {
        enrollment,
        completed: studentSubs.length,
        missed,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      };
    });
    setStudentStats(sStats);
    setAnalyticsLoading(false);
    setAnalyticsLoaded(true);
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/find-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Student not found.");
        setAddLoading(false);
        return;
      }
      const { error } = await supabase.from("class_enrollments").insert({
        class_id: classId,
        student_id: data.id,
        student_email: data.email,
      });
      if (error) {
        setAddError(error.code === "23505" ? "This student is already enrolled." : error.message);
        setAddLoading(false);
        return;
      }
      setAddEmail("");
      setAnalyticsLoaded(false);
      await load();
    } catch {
      setAddError("Something went wrong. Please try again.");
    }
    setAddLoading(false);
  }

  async function handleRemoveStudent(enrollmentId: string) {
    await supabase.from("class_enrollments").delete().eq("id", enrollmentId);
    setAnalyticsLoaded(false);
    await load();
  }

  async function handleDeleteClass() {
    setDeleteLoading(true);
    await supabase.from("classes").delete().eq("id", classId);
    router.push("/teacher/classes");
  }

  if (loading) {
    return <Loader />;
  }
  if (!cls) return <div style={{ padding: "2rem", color: "#B91C1C", fontFamily: "var(--font-body)" }}>Class not found.</div>;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={cls.name}
        subtitle={cls.description ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls.name },
        ]}
        action={
          <div className="flex flex-col gap-2 w-full md:flex-row md:w-auto md:flex-wrap md:items-center md:gap-2">
            <div className="flex gap-2 w-full md:w-auto">
              <Link href={`/teacher/classes/${classId}/edit`} className="flex-1 md:flex-none">
                <Button variant="ghost" className="w-full">Edit Class</Button>
              </Link>
              <div className="flex-1 md:flex-none">
                <Button variant="danger" onClick={() => setDeleteConfirm(true)} className="w-full">Delete Class</Button>
              </div>
            </div>
            {tab === "subjects" && (
              <Link href={`/teacher/classes/${classId}/subjects/new`} className="block w-full md:inline md:w-auto">
                <Button variant="gold" className="w-full justify-center md:w-auto">+ New Subject</Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <Badge variant="blue">{subjects.length} Subject{subjects.length !== 1 ? "s" : ""}</Badge>
        <Badge variant="gold">{enrollments.length} Student{enrollments.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-border)", marginBottom: "1.75rem" }}>
        {(["subjects", "students", "analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              padding: "0.625rem 1.25rem",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--color-gold)" : "2px solid transparent",
              marginBottom: "-2px",
              color: tab === t ? "var(--color-navy)" : "var(--color-muted)",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {t === "subjects"
              ? `Subjects (${subjects.length})`
              : t === "students"
              ? `Students (${enrollments.length})`
              : "Analytics"}
          </button>
        ))}
      </div>

      {/* ── Subjects tab ── */}
      {tab === "subjects" && (
        subjects.length === 0 ? (
          <EmptyState
            title="No subjects yet"
            description="Add a subject to this class to organise learning material and tasks."
            action={
              <Link href={`/teacher/classes/${classId}/subjects/new`}>
                <Button variant="gold">+ Add First Subject</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((sub, i) => (
              <SubjectCard key={sub.id} subject={sub} classId={classId} delay={i * 0.06} />
            ))}
          </div>
        )
      )}

      {/* ── Students tab ── */}
      {tab === "students" && (
        <StudentsTab
          classId={classId}
          enrollments={enrollments}
          addEmail={addEmail}
          setAddEmail={setAddEmail}
          addError={addError}
          setAddError={setAddError}
          addLoading={addLoading}
          onAddStudent={handleAddStudent}
          onRemoveStudent={handleRemoveStudent}
        />
      )}

      {/* ── Analytics tab ── */}
      {tab === "analytics" && (
        analyticsLoading ? (
          <Loader />
        ) : (
          <AnalyticsView
            taskStats={taskStats}
            studentStats={studentStats}
            enrolledCount={enrollments.length}
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
              Delete Class
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
              Are you sure you want to delete
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "var(--color-navy)", marginBottom: "1.5rem" }}>
              &ldquo;{cls.name}&rdquo;?
            </p>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "#B91C1C", marginBottom: "1.75rem" }}>
              This will permanently remove the class, all subjects, and student data.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button
                variant="ghost"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteClass}
                disabled={deleteLoading}
                style={{ flex: 1 }}
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Students tab ──────────────────────────────────────────────────────────────
interface AllStudent { id: string; email: string; }

function StudentsTab({
  classId,
  enrollments,
  addEmail,
  setAddEmail,
  addError,
  setAddError,
  addLoading,
  onAddStudent,
  onRemoveStudent,
}: {
  classId: string;
  enrollments: ClassEnrollment[];
  addEmail: string;
  setAddEmail: (v: string) => void;
  addError: string;
  setAddError: (v: string) => void;
  addLoading: boolean;
  onAddStudent: (e: React.FormEvent) => void;
  onRemoveStudent: (id: string) => void;
}) {
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<AllStudent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [displayQuery, setDisplayQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/list-students")
      .then((r) => r.json())
      .then(({ users }) => { setAllStudents(users ?? []); setListLoading(false); })
      .catch(() => setListLoading(false));
  }, []);

  function handleQueryChange(val: string) {
    setDisplayQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val.trim().toLowerCase()), 300);
  }

  const enrolledIds = new Set(enrollments.map((e) => e.student_id));

  const available = allStudents.filter((s) => {
    if (enrolledIds.has(s.id)) return false;
    if (!query) return true;
    return s.email.toLowerCase().includes(query);
  });

  return (
    <div>
      {/* Enrolled list */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.8rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.875rem" }}>
          Enrolled Students ({enrollments.length})
        </h3>
        {enrollments.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic", fontSize: "0.9375rem" }}>
            No students enrolled yet. Add them from the list below.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {enrollments.map((enrollment, i) => (
              <div
                key={enrollment.id}
                className="madrasa-card animate-fade-in-up"
                style={{
                  padding: "0.75rem 1.25rem", animationDelay: `${i * 0.05}s`,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, var(--color-royal), var(--color-royal-light))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontFamily: "var(--font-heading)", fontSize: "0.875rem", fontWeight: 700,
                  }}>
                    {enrollment.student_email[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-navy)", marginBottom: "0.1rem" }}>
                      {enrollment.student_email}
                    </p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <Link href={`/teacher/classes/${classId}/students/${enrollment.student_id}`}>
                    <Button variant="ghost" style={{ padding: "0.35rem 0.875rem", fontSize: "0.78rem" }}>Profile</Button>
                  </Link>
                  <Button variant="danger" onClick={() => setRemoveConfirmId(enrollment.id)} style={{ padding: "0.35rem 0.875rem", fontSize: "0.78rem" }}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add students from list */}
      <div>
        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.8rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-navy)", marginBottom: "0.875rem" }}>
          Add Students
        </h3>

        {/* Search / manual email form */}
        <div className="madrasa-card" style={{ padding: "1.125rem", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <input
              type="text"
              value={displayQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by email…"
              className="madrasa-input"
              style={{ flex: 1, minWidth: "200px" }}
            />
            {/* Fallback manual add by email */}
            <form onSubmit={onAddStudent} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => { setAddEmail(e.target.value); setAddError(""); }}
                placeholder="or type email to add…"
                className="madrasa-input"
                style={{ minWidth: "200px" }}
              />
              <Button type="submit" variant="gold" loading={addLoading} style={{ whiteSpace: "nowrap" }}>
                Add
              </Button>
            </form>
          </div>
          {addError && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#B91C1C", marginTop: "0.625rem" }}>
              {addError}
            </p>
          )}
        </div>

        {/* Available students list */}
        {listLoading ? (
          <Loader />
        ) : available.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic", fontSize: "0.875rem" }}>
            {query ? "No matching students found." : "All registered students are already enrolled."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", maxHeight: "320px", overflowY: "auto", paddingRight: "0.25rem" }}>
            {available.map((student) => (
              <QuickAddRow
                key={student.id}
                student={student}
                classId={classId}
                onAdded={() => {
                  setQuery("");
                  setDisplayQuery("");
                }}
                onError={setAddError}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Remove student confirmation modal ── */}
      {removeConfirmId && (() => {
        const target = enrollments.find((e) => e.id === removeConfirmId);
        return (
          <div
            onClick={() => !removeLoading && setRemoveConfirmId(null)}
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem", color: "var(--color-navy)", marginBottom: "0.5rem", letterSpacing: "0.04em" }}>
                Remove Student
              </h2>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
                Remove from this class:
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-navy)", marginBottom: "1.5rem" }}>
                {target?.student_email}
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "#B91C1C", marginBottom: "1.75rem" }}>
                Their submission history will be preserved, but they will lose access to this class.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button variant="ghost" onClick={() => setRemoveConfirmId(null)} disabled={removeLoading} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={removeLoading}
                  onClick={async () => {
                    setRemoveLoading(true);
                    onRemoveStudent(removeConfirmId);
                    setRemoveConfirmId(null);
                    setRemoveLoading(false);
                  }}
                  style={{ flex: 1 }}
                >
                  {removeLoading ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function QuickAddRow({
  student,
  classId,
  onAdded,
  onError,
}: {
  student: AllStudent;
  classId: string;
  onAdded: () => void;
  onError: (msg: string) => void;
}) {
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    setAdding(true);
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await sb.from("class_enrollments").insert({
      class_id: classId,
      student_id: student.id,
      student_email: student.email,
    });
    if (error) {
      onError(error.code === "23505" ? "Already enrolled." : error.message);
    } else {
      onAdded();
      // Reload page to refresh enrollments
      window.location.reload();
    }
    setAdding(false);
  }

  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
        padding: "0.625rem 1rem", borderRadius: "0.625rem",
        border: "1px solid var(--color-border)", background: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-muted), #3A4A6A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontFamily: "var(--font-heading)", fontSize: "0.8rem",
        }}>
          {student.email[0].toUpperCase()}
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "0.9rem", color: "var(--color-navy)" }}>
          {student.email}
        </span>
      </div>
      <Button variant="gold" onClick={handleAdd} loading={adding} style={{ padding: "0.3rem 0.875rem", fontSize: "0.78rem" }}>
        + Enrol
      </Button>
    </div>
  );
}

// ── Subject card ───────────────────────────────────────────────────────────────
function SubjectCard({ subject, classId, delay }: { subject: Subject; classId: string; delay: number }) {
  const arabicName = isArabic(subject.name);
  const arabicDesc = subject.description ? isArabic(subject.description) : false;
  return (
    <div className="madrasa-card animate-fade-in-up overflow-hidden" style={{ animationDelay: `${delay}s` }}>
      <div className="madrasa-card-header">
        <div className="relative z-10">
          <h3 style={{ fontFamily: arabicName ? "var(--font-alkanz)" : "var(--font-heading)", fontSize: arabicName ? "1.25rem" : "1rem", color: "white", letterSpacing: arabicName ? 0 : "0.05em", direction: arabicName ? "rtl" : "ltr", lineHeight: arabicName ? 1.8 : undefined }}>
            {subject.name}
          </h3>
        </div>
      </div>
      <div style={{ padding: "1rem 1.25rem" }}>
        {subject.description && (
          <p style={{ fontFamily: arabicDesc ? "var(--font-alkanz)" : "var(--font-body)", fontSize: arabicDesc ? "1.1rem" : "0.9375rem", color: "var(--color-muted)", marginBottom: "1rem", lineHeight: arabicDesc ? 1.9 : 1.6, direction: arabicDesc ? "rtl" : "ltr" }}>
            {subject.description}
          </p>
        )}
        <Link href={`/teacher/classes/${classId}/subjects/${subject.id}`}>
          <Button variant="primary" style={{ width: "100%", justifyContent: "center" }}>
            Open Subject
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ── Analytics view ─────────────────────────────────────────────────────────────
function AnalyticsView({
  taskStats,
  studentStats,
  enrolledCount,
}: {
  taskStats: TaskStat[];
  studentStats: StudentStat[];
  enrolledCount: number;
}) {
  if (enrolledCount === 0) {
    return <EmptyState title="No students enrolled" description="Enrol students to see class analytics." />;
  }
  if (taskStats.length === 0) {
    return <EmptyState title="No tasks yet" description="Create tasks to see performance analytics." />;
  }

  const validTaskScores = taskStats.filter((t) => t.avgScore !== null);
  const overallAvgScore =
    validTaskScores.length > 0
      ? Math.round(validTaskScores.reduce((s, t) => s + (t.avgScore as number), 0) / validTaskScores.length)
      : null;

  const submittedCount = taskStats.reduce((s, t) => s + t.submitted, 0);
  const totalPossible = taskStats.length * enrolledCount;
  const completionRate = totalPossible > 0 ? Math.round((submittedCount / totalPossible) * 100) : 0;

  const summaryStats = [
    { label: "Students", value: enrolledCount },
    { label: "Total Tasks", value: taskStats.length },
    { label: "Completion Rate", value: `${completionRate}%` },
    { label: "Avg Score", value: overallAvgScore !== null ? `${overallAvgScore}%` : "—" },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="madrasa-card" style={{ padding: "1.125rem 1.25rem", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                marginBottom: "0.375rem",
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.75rem",
                color: "var(--color-navy)",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Task performance */}
      <div className="madrasa-card mb-6 overflow-hidden">
        <div className="madrasa-card-header">
          <h3
            className="relative z-10"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.8125rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "white",
            }}
          >
            Task Performance
          </h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-gold-mist)" }}>
                {["Task", "Due Date", "Submitted", "Missed", "Avg Score"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.625rem 1rem",
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-navy)",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskStats.map((ts, i) => {
                const overdue = new Date(ts.task.submission_date) < new Date();
                const missed = ts.enrolled - ts.submitted;
                return (
                  <tr
                    key={ts.task.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: i % 2 === 0 ? "white" : "var(--color-parchment)",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-navy)", fontSize: "0.9375rem" }}>
                      {ts.task.title}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
                      <span className={overdue ? "badge-red" : "badge-gold"} style={{ fontSize: "0.7rem" }}>
                        {new Date(ts.task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className="badge-green">{ts.submitted}/{ts.enrolled}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {missed > 0 ? <span className="badge-red">{missed}</span> : <span className="badge-green">0</span>}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {ts.avgScore !== null ? (
                        <span className="badge-blue">{ts.avgScore}%</span>
                      ) : (
                        <span style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student performance */}
      <div className="madrasa-card overflow-hidden">
        <div className="madrasa-card-header">
          <h3
            className="relative z-10"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.8125rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "white",
            }}
          >
            Student Performance
          </h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-gold-mist)" }}>
                {["Student", "Completed", "Missed", "Avg Score", "Progress"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.625rem 1rem",
                      fontFamily: "var(--font-heading)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--color-navy)",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentStats.map((ss, i) => {
                const total = taskStats.length;
                const pct = total > 0 ? Math.round((ss.completed / total) * 100) : 0;
                return (
                  <tr
                    key={ss.enrollment.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: i % 2 === 0 ? "white" : "var(--color-parchment)",
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-navy)", fontSize: "0.875rem" }}>
                      {ss.enrollment.student_email}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span className="badge-green">{ss.completed}/{total}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {ss.missed > 0 ? (
                        <span className="badge-red">{ss.missed}</span>
                      ) : (
                        <span className="badge-green">0</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {ss.avgScore !== null ? (
                        <span className="badge-blue">{ss.avgScore}%</span>
                      ) : (
                        <span style={{ color: "var(--color-muted)", fontSize: "0.875rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", minWidth: "140px" }}>
                      <div className="progress-bar-track" style={{ marginBottom: "0.25rem" }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-muted)" }}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
