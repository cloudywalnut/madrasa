"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, STUDENT_ID } from "@/lib/supabase";
import { Class, Subject, Task, StudentSubmission } from "@/lib/types";
import { isArabic } from "@/lib/arabic";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";

export default function StudentSubjectPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [cls, setCls] = useState<Class | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("tasks").select("*").eq("subject_id", subjectId).order("submission_date"),
    ]).then(async ([{ data: c }, { data: s }, { data: t }]) => {
      setCls(c);
      setSubject(s);
      const taskList = t ?? [];
      setTasks(taskList);
      if (taskList.length > 0) {
        const taskIds = taskList.map((task: Task) => task.id);
        const { data: subs } = await supabase
          .from("student_submissions")
          .select("*")
          .eq("student_id", STUDENT_ID)
          .in("task_id", taskIds);
        setSubmissions(subs ?? []);
      }
      setLoading(false);
    });
  }, [classId, subjectId]);

  if (loading) return <Loader />;
  if (!subject) return null;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={subject.name}
        subtitle={subject.description ?? undefined}
        breadcrumbs={[
          { label: "My Classes", href: "/student" },
          { label: cls?.name ?? "Class", href: `/student/classes/${classId}` },
          { label: subject.name },
        ]}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <Badge variant="blue">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</Badge>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Your teacher hasn't created any tasks for this subject yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tasks.map((task, i) => {
            const submission = submissions.find((s) => s.task_id === task.id);
            const completed = submission?.completed ?? false;
            const overdue = new Date(task.submission_date) < new Date() && !completed;
            const arabicTitle = isArabic(task.title);

            return (
              <div
                key={task.id}
                className="madrasa-card animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s`, padding: 0 }}
              >
                <div style={{ display: "flex" }}>
                  {/* Status colour bar */}
                  <div
                    style={{
                      width: "4px",
                      flexShrink: 0,
                      background: completed
                        ? "#16A34A"
                        : overdue
                        ? "#DC2626"
                        : "linear-gradient(180deg, var(--color-gold), var(--color-gold-pale))",
                    }}
                  />

                  {/* Task info */}
                  <div style={{ flex: 1, padding: "1rem 1.25rem", minWidth: 0 }}>
                    <h3
                      style={{
                        fontFamily: arabicTitle ? "var(--font-alkanz)" : "var(--font-heading)",
                        fontSize: arabicTitle ? "1.3rem" : "0.9375rem",
                        color: "var(--color-navy)",
                        direction: arabicTitle ? "rtl" : "ltr",
                        lineHeight: arabicTitle ? 2 : 1.3,
                        marginBottom: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)", fontStyle: "italic", marginTop: "0.125rem" }}>
                        {task.description}
                      </p>
                    )}
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--color-muted)", marginTop: "0.375rem" }}>
                      Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Status badge + action button — stacked in right column */}
                  <div
                    style={{
                      padding: "0.875rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      gap: "0.5rem",
                      flexShrink: 0,
                    }}
                  >
                    {completed ? (
                      <Badge variant="green">✓ {submission!.score}/{submission!.total_questions}</Badge>
                    ) : overdue ? (
                      <Badge variant="red">Overdue</Badge>
                    ) : (
                      <Badge variant="gold">Pending</Badge>
                    )}
                    <Link href={`/student/classes/${classId}/subjects/${subjectId}/tasks/${task.id}`}>
                      <button
                        className={completed ? "btn-ghost" : "btn-primary"}
                        style={{ whiteSpace: "nowrap", padding: "0.4rem 1rem", fontSize: "0.8125rem" }}
                      >
                        {completed ? "Review" : "Open Task"}
                      </button>
                    </Link>
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
