"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, STUDENT_ID } from "@/lib/supabase";
import { Class, ClassEnrollment, Task, StudentSubmission } from "@/lib/types";
import { isArabic } from "@/lib/arabic";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

type Tab = "classes" | "tasks";
type TaskStatus = "pending" | "missed" | "completed";

interface EnrichedTask {
  task: Task;
  cls: Class;
  subjectName: string;
  status: TaskStatus;
  submission?: StudentSubmission;
}

export default function StudentDashboard() {
  const [tab, setTab] = useState<Tab>("classes");
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrichedTasks, setEnrichedTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get enrollments for this student
      const { data: enrollData } = await supabase
        .from("class_enrollments")
        .select("*")
        .eq("student_id", STUDENT_ID);

      const myEnrollments: ClassEnrollment[] = enrollData ?? [];
      setEnrollments(myEnrollments);

      if (myEnrollments.length === 0) {
        setClasses([]);
        setEnrichedTasks([]);
        setLoading(false);
        return;
      }

      const classIds = myEnrollments.map((e) => e.class_id);

      // Fetch enrolled classes
      const { data: classData } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds)
        .order("created_at", { ascending: false });
      setClasses(classData ?? []);

      // Fetch all tasks across enrolled classes
      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .in("class_id", classIds)
        .order("submission_date");

      const tasks: Task[] = taskData ?? [];
      if (tasks.length === 0) {
        setEnrichedTasks([]);
        setLoading(false);
        return;
      }

      // Fetch subjects to get names
      const subjectIds = [...new Set(tasks.map((t) => t.subject_id))];
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id, name")
        .in("id", subjectIds);
      const subjectMap: Record<string, string> = {};
      (subjectData ?? []).forEach((s: { id: string; name: string }) => { subjectMap[s.id] = s.name; });

      // Fetch this student's submissions
      const taskIds = tasks.map((t) => t.id);
      const { data: subsData } = await supabase
        .from("student_submissions")
        .select("*")
        .eq("student_id", STUDENT_ID)
        .in("task_id", taskIds);
      const submissionsMap: Record<string, StudentSubmission> = {};
      (subsData ?? []).forEach((s: StudentSubmission) => { submissionsMap[s.task_id] = s; });

      const classMap: Record<string, Class> = {};
      (classData ?? []).forEach((c: Class) => { classMap[c.id] = c; });

      const now = new Date();
      const enriched: EnrichedTask[] = tasks.map((task) => {
        const submission = submissionsMap[task.id];
        let status: TaskStatus;
        if (submission?.completed) {
          status = "completed";
        } else if (new Date(task.submission_date) < now) {
          status = "missed";
        } else {
          status = "pending";
        }
        return {
          task,
          cls: classMap[task.class_id],
          subjectName: subjectMap[task.subject_id] ?? "—",
          status,
          submission,
        };
      });

      setEnrichedTasks(enriched);
      setLoading(false);
    }
    load();
  }, []);

  const pendingTasks = enrichedTasks.filter((t) => t.status === "pending");
  const missedTasks  = enrichedTasks.filter((t) => t.status === "missed");

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="My Learning"
        subtitle="Bismillah — continue your studies"
      />

      {/* Quick pending tasks callout */}
      {!loading && pendingTasks.length > 0 && (
        <div
          className="madrasa-card animate-fade-in-up"
          style={{
            marginBottom: "1.5rem",
            padding: "1rem 1.25rem",
            borderLeft: "4px solid var(--color-gold)",
            background: "var(--color-gold-mist)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
              marginBottom: "0.75rem",
            }}
          >
            ✦ Pending Tasks — {pendingTasks.length} due soon
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {pendingTasks.slice(0, 4).map((et) => (
              <Link
                key={et.task.id}
                href={`/student/classes/${et.task.class_id}/subjects/${et.task.subject_id}/tasks/${et.task.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    padding: "0.5rem 0.875rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--color-border)",
                    background: "white",
                    cursor: "pointer",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  {(() => { const arb = isArabic(et.task.title); return (
                  <p style={{ fontFamily: arb ? "var(--font-alkanz)" : "var(--font-heading)", fontSize: arb ? "0.95rem" : "0.8125rem", color: "var(--color-navy)", marginBottom: "0.125rem", direction: arb ? "rtl" : "ltr" }}>
                    {et.task.title}
                  </p>
                  ); })()}
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                    {et.cls?.name} · Due {new Date(et.task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
            {pendingTasks.length > 4 && (
              <button
                onClick={() => setTab("tasks")}
                style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.5rem",
                  border: "1px dashed var(--color-gold)",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8125rem",
                  color: "var(--color-gold)",
                  cursor: "pointer",
                }}
              >
                +{pendingTasks.length - 4} more →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-border)", marginBottom: "1.75rem" }}>
        {([
          { key: "classes" as Tab, label: `My Classes (${classes.length})` },
          { key: "tasks" as Tab, label: `All Tasks (${enrichedTasks.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              padding: "0.625rem 1.25rem",
              background: "transparent",
              border: "none",
              borderBottom: tab === key ? "2px solid var(--color-gold)" : "2px solid transparent",
              marginBottom: "-2px",
              color: tab === key ? "var(--color-navy)" : "var(--color-muted)",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Classes tab ── */}
      {tab === "classes" && (
        loading ? (
          <ClassesSkeleton />
        ) : classes.length === 0 ? (
          <EmptyState
            title="No classes yet"
            description="You haven't been enrolled in any classes. Ask your teacher to add you."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: "2rem" }}>
              {classes.map((cls, i) => (
                <StudentClassCard key={cls.id} cls={cls} delay={i * 0.06} />
              ))}
            </div>
            <RecentTaskActivity enrichedTasks={enrichedTasks} />
          </>
        )
      )}

      {/* ── Tasks tab ── */}
      {tab === "tasks" && (
        loading ? (
          <Loader />
        ) : enrichedTasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Tasks will appear here once your teacher creates them."
          />
        ) : (
          <TasksListView enrichedTasks={enrichedTasks} />
        )
      )}
    </div>
  );
}

// ── Tasks list view ────────────────────────────────────────────────────────────
function TasksListView({ enrichedTasks }: { enrichedTasks: EnrichedTask[] }) {
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");

  const filtered = filter === "all" ? enrichedTasks : enrichedTasks.filter((t) => t.status === filter);
  const counts = {
    all: enrichedTasks.length,
    pending: enrichedTasks.filter((t) => t.status === "pending").length,
    missed: enrichedTasks.filter((t) => t.status === "missed").length,
    completed: enrichedTasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {([
          { key: "all", label: "All", count: counts.all },
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "missed", label: "Missed", count: counts.missed },
          { key: "completed", label: "Completed", count: counts.completed },
        ] as { key: "all" | TaskStatus; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "999px",
              border: filter === key ? "1.5px solid var(--color-gold)" : "1px solid var(--color-border)",
              background: filter === key ? "var(--color-gold-mist)" : "white",
              fontFamily: "var(--font-heading)",
              fontSize: "0.75rem",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: filter === key ? "var(--color-navy)" : "var(--color-muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {label} <span style={{ opacity: 0.6 }}>({count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${filter} tasks`} description="Nothing to show here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((et, i) => (
            <TaskRow key={et.task.id} et={et} delay={i * 0.04} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ et, delay }: { et: EnrichedTask; delay: number }) {
  const arabicTitle = isArabic(et.task.title);
  const statusBadge = {
    completed: <Badge variant="green">Completed</Badge>,
    pending: <Badge variant="gold">Pending</Badge>,
    missed: <Badge variant="red">Missed</Badge>,
  }[et.status];

  const scoreText =
    et.submission?.completed && et.submission.score !== null && et.submission.total_questions
      ? `${et.submission.score}/${et.submission.total_questions}`
      : null;

  return (
    <div
      className="madrasa-card animate-fade-in-up"
      style={{ padding: 0, overflow: "hidden", animationDelay: `${delay}s` }}
    >
      <div style={{ display: "flex" }}>
        <div
          style={{
            width: "4px",
            background:
              et.status === "completed"
                ? "#16A34A"
                : et.status === "missed"
                ? "#DC2626"
                : "linear-gradient(180deg, var(--color-gold), var(--color-gold-pale))",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
              <h3 style={{ fontFamily: arabicTitle ? "var(--font-alkanz)" : "var(--font-heading)", fontSize: arabicTitle ? "1.1rem" : "0.9375rem", color: "var(--color-navy)", direction: arabicTitle ? "rtl" : "ltr", lineHeight: arabicTitle ? 1.8 : undefined }}>
                {et.task.title}
              </h3>
              {statusBadge}
              {scoreText && <span className="badge-blue">{scoreText}</span>}
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
              {et.cls?.name} · {et.subjectName} · Due {new Date(et.task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <Link href={`/student/classes/${et.task.class_id}/subjects/${et.task.subject_id}/tasks/${et.task.id}`}>
            <button
              className="btn-ghost"
              style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem", whiteSpace: "nowrap" }}
            >
              {et.status === "completed" ? "View Results" : "Open Task"} →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Class card ─────────────────────────────────────────────────────────────────
function StudentClassCard({ cls, delay }: { cls: Class; delay: number }) {
  const arabicName = isArabic(cls.name);
  const arabicDesc = cls.description ? isArabic(cls.description) : false;
  return (
    <Link
      href={`/student/classes/${cls.id}`}
      className="block animate-fade-in-up"
      style={{ textDecoration: "none", animationDelay: `${delay}s` }}
    >
      <div className="madrasa-card overflow-hidden h-full">
        <div className="madrasa-card-header">
          <div className="relative z-10">
            <h3 style={{ fontFamily: arabicName ? "var(--font-alkanz)" : "var(--font-heading)", fontSize: arabicName ? "1.25rem" : "1.0625rem", color: "white", letterSpacing: arabicName ? 0 : "0.04em", direction: arabicName ? "rtl" : "ltr", lineHeight: arabicName ? 1.8 : undefined }}>
              {cls.name}
            </h3>
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          {cls.description && (
            <p style={{ fontFamily: arabicDesc ? "var(--font-alkanz)" : "var(--font-body)", fontSize: arabicDesc ? "1.1rem" : "0.9375rem", color: "var(--color-muted)", lineHeight: arabicDesc ? 1.9 : 1.6, marginBottom: "0.75rem", direction: arabicDesc ? "rtl" : "ltr" }}>
              {cls.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-gold)", fontSize: "0.875rem" }}>✦</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              View Subjects →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Recent Task Activity ───────────────────────────────────────────────────────
function RecentTaskActivity({ enrichedTasks }: { enrichedTasks: EnrichedTask[] }) {
  const now = new Date();
  const windowMs = 14 * 24 * 60 * 60 * 1000; // 14 days

  const recent = enrichedTasks
    .filter((et) => {
      const due = new Date(et.task.submission_date).getTime();
      const diff = due - now.getTime();
      // within past 14 days or next 7 days
      return diff > -windowMs && diff < 7 * 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(a.task.submission_date).getTime() - new Date(b.task.submission_date).getTime())
    .slice(0, 8);

  if (recent.length === 0) return null;

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
        <span style={{ color: "var(--color-gold)", fontSize: "1rem" }}>✦</span>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-navy)" }}>
          Recent Task Activity
        </h2>
        <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {recent.map((et, i) => {
          const due = new Date(et.task.submission_date);
          const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const statusBadge =
            et.status === "completed" ? <Badge variant="green">✓ Done</Badge>
            : et.status === "missed"  ? <Badge variant="red">Missed</Badge>
            : daysLeft <= 2           ? <Badge variant="red">Due Soon</Badge>
            :                           <Badge variant="gold">Pending</Badge>;

          return (
            <div
              key={et.task.id}
              className="madrasa-card animate-fade-in-up"
              style={{ padding: 0, overflow: "hidden", animationDelay: `${i * 0.04}s` }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "4px",
                    alignSelf: "stretch",
                    background:
                      et.status === "completed" ? "#16A34A"
                      : et.status === "missed"  ? "#DC2626"
                      : daysLeft <= 2           ? "#EA580C"
                      : "var(--color-gold)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, padding: "0.75rem 1rem", minWidth: 0 }}>
                  {(() => { const arb = isArabic(et.task.title); return (
                  <span style={{ fontFamily: arb ? "var(--font-alkanz)" : "var(--font-heading)", fontSize: arb ? "1rem" : "0.875rem", color: "var(--color-navy)", direction: arb ? "rtl" : "ltr", display: "block" }}>
                    {et.task.title}
                  </span>
                  ); })()}
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.775rem", color: "var(--color-muted)", marginTop: "0.125rem" }}>
                    {et.cls?.name} · {et.subjectName} ·{" "}
                    {et.status !== "completed" && daysLeft > 0
                      ? `Due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
                      : due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div style={{ padding: "0.5rem 0.875rem", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.375rem" }}>
                  <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                    {statusBadge}
                    {et.submission?.score !== null && et.submission?.total_questions && et.status === "completed" && (
                      <span className="badge-blue">{et.submission.score}/{et.submission.total_questions}</span>
                    )}
                  </div>
                  <Link href={`/student/classes/${et.task.class_id}/subjects/${et.task.subject_id}/tasks/${et.task.id}`}>
                    <button className="btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.775rem" }}>
                      {et.status === "completed" ? "Review" : "Open"} →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="madrasa-card overflow-hidden" style={{ opacity: 0.5 }}>
          <div style={{ height: "72px", background: "linear-gradient(135deg, var(--color-royal), var(--color-royal-light))" }} />
          <div style={{ padding: "1rem 1.25rem" }}>
            <div style={{ height: "12px", background: "var(--color-border)", borderRadius: "4px", marginBottom: "0.75rem" }} />
            <div style={{ height: "36px", background: "var(--color-border)", borderRadius: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
