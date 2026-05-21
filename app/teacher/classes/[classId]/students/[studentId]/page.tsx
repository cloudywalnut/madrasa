"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, Task, StudentSubmission, ClassEnrollment } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

interface TaskEntry {
  task: Task;
  subject: Subject;
  submission: StudentSubmission | null;
  status: "completed" | "pending" | "missed";
}

export default function StudentProfilePage() {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();

  const [cls, setCls] = useState<Class | null>(null);
  const [enrollment, setEnrollment] = useState<ClassEnrollment | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [taskEntries, setTaskEntries] = useState<TaskEntry[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: clsData }, { data: enrollData }, { data: subData }] = await Promise.all([
        supabase.from("classes").select("*").eq("id", classId).single(),
        supabase.from("class_enrollments").select("*").eq("class_id", classId).eq("student_id", studentId).maybeSingle(),
        supabase.from("subjects").select("*").eq("class_id", classId).order("created_at"),
      ]);

      setCls(clsData);
      setEnrollment(enrollData ?? null);
      const subs: Subject[] = subData ?? [];
      setSubjects(subs);

      if (subs.length === 0) { setLoading(false); return; }

      // Fetch all tasks for this class
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("class_id", classId)
        .order("submission_date");
      const tasks: Task[] = taskData ?? [];

      if (tasks.length === 0) { setLoading(false); return; }

      // Fetch student's submissions for all tasks
      const { data: subsData } = await supabase
        .from("student_submissions")
        .select("*")
        .eq("student_id", studentId)
        .in("task_id", tasks.map((t) => t.id));
      const subsMap = new Map((subsData ?? []).map((s: StudentSubmission) => [s.task_id, s]));

      const subjectMap = new Map(subs.map((s) => [s.id, s]));
      const now = new Date();

      const entries: TaskEntry[] = tasks.map((task) => {
        const submission = subsMap.get(task.id) ?? null;
        let status: TaskEntry["status"];
        if (submission?.completed) status = "completed";
        else if (new Date(task.submission_date) < now) status = "missed";
        else status = "pending";
        return { task, subject: subjectMap.get(task.subject_id) ?? subs[0], submission, status };
      });

      setTaskEntries(entries);
      setLoading(false);
    }
    load();
  }, [classId, studentId]);

  if (loading) return <Loader />;

  if (!enrollment) return (
    <div style={{ padding: "2rem", color: "#B91C1C", fontFamily: "var(--font-body)" }}>
      Student not enrolled in this class.
    </div>
  );

  const filtered = selectedSubjectId === "all"
    ? taskEntries
    : taskEntries.filter((e) => e.task.subject_id === selectedSubjectId);

  const completed = filtered.filter((e) => e.status === "completed");
  const missed    = filtered.filter((e) => e.status === "missed");
  const pending   = filtered.filter((e) => e.status === "pending");

  const validScores = completed.filter((e) => e.submission?.score !== null && e.submission?.total_questions);
  const avgScore = validScores.length > 0
    ? Math.round(
        validScores.reduce((sum, e) => sum + ((e.submission!.score as number) / (e.submission!.total_questions as number)) * 100, 0) /
          validScores.length
      )
    : null;

  const completionPct = filtered.length > 0
    ? Math.round((completed.length / filtered.filter((e) => e.status !== "pending").length || 1) * 100)
    : 0;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Student Profile"
        subtitle={enrollment.student_email}
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls?.name ?? "Class", href: `/teacher/classes/${classId}` },
          { label: "Students", href: `/teacher/classes/${classId}` },
          { label: enrollment.student_email },
        ]}
        action={
          <Link href={`/teacher/classes/${classId}`}>
            <Button variant="ghost">← Back to Class</Button>
          </Link>
        }
      />

      {/* Student info card */}
      <div className="madrasa-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-royal), var(--color-royal-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700,
        }}>
          {enrollment.student_email[0].toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "var(--color-navy)", marginBottom: "0.125rem" }}>
            {enrollment.student_email}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Subject filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <label style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-muted)" }}>
          Subject:
        </label>
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="madrasa-input"
          style={{ minWidth: "180px", padding: "0.4rem 0.875rem" }}
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Tasks", value: filtered.length },
          { label: "Completed", value: completed.length },
          { label: "Missed", value: missed.length },
          { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "—" },
        ].map((stat) => (
          <div key={stat.label} className="madrasa-card" style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: "0.375rem" }}>
              {stat.label}
            </p>
            <p style={{
              fontFamily: "var(--font-heading)", fontSize: "1.75rem", lineHeight: 1,
              color: stat.label === "Missed" && missed.length > 0 ? "#B91C1C" : "var(--color-navy)",
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {filtered.filter((e) => e.status !== "pending").length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              Completion Rate (of due tasks)
            </span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", color: "var(--color-gold)" }}>
              {completionPct}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState title="No tasks" description="No tasks found for the selected subject." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((entry, i) => {
            const { task, subject, submission, status } = entry;
            const pct = submission?.completed && submission.score !== null && submission.total_questions
              ? Math.round((submission.score / submission.total_questions) * 100) : null;

            return (
              <div
                key={task.id}
                className="madrasa-card animate-fade-in-up overflow-hidden"
                style={{ padding: 0, animationDelay: `${i * 0.05}s` }}
              >
                <div style={{ display: "flex" }}>
                  <div style={{
                    width: "4px", flexShrink: 0, alignSelf: "stretch",
                    background: status === "completed" ? "#16A34A" : status === "missed" ? "#DC2626" : "var(--color-gold)",
                  }} />
                  <div style={{ flex: 1, padding: "0.875rem 1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem", color: "var(--color-navy)", marginBottom: "0.25rem" }}>
                          {task.title}
                        </h3>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--color-muted)" }}>
                          {subject.name} · Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                        {status === "completed" ? (
                          <>
                            <Badge variant="green">✓ Done</Badge>
                            {pct !== null && (
                              <span className={pct >= 80 ? "badge-green" : pct >= 50 ? "badge-blue" : "badge-red"}>
                                {submission!.score}/{submission!.total_questions} ({pct}%)
                              </span>
                            )}
                          </>
                        ) : status === "missed" ? (
                          <Badge variant="red">Missed</Badge>
                        ) : (
                          <Badge variant="gold">Pending</Badge>
                        )}
                        <Link href={`/teacher/classes/${classId}/subjects/${task.subject_id}/tasks/${task.id}`}>
                          <button className="btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.775rem" }}>
                            View Task →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
