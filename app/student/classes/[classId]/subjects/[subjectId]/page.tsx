"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase, STUDENT_ID } from "@/lib/supabase";
import { Class, Subject, Task, StudentSubmission } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

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
      supabase.from("tasks").select("*").eq("subject_id", subjectId).order("created_at", { ascending: false }),
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

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Loading…</div>;
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

      <div className="flex items-center gap-2 mb-6">
        <Badge variant="blue">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</Badge>
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Your teacher hasn't created any tasks for this subject yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task, i) => {
            const submission = submissions.find((s) => s.task_id === task.id);
            const completed = submission?.completed ?? false;
            const overdue = new Date(task.submission_date) < new Date() && !completed;

            return (
              <div
                key={task.id}
                className="madrasa-card animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s`, padding: 0 }}
              >
                <div className="flex flex-col sm:flex-row">
                  <div
                    style={{
                      width: "4px",
                      background: completed
                        ? "#16A34A"
                        : overdue
                        ? "#DC2626"
                        : "linear-gradient(180deg, var(--color-gold), var(--color-gold-pale))",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, padding: "1rem 1.25rem" }}>
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem", color: "var(--color-navy)", flex: 1 }}>
                        {task.title}
                      </h3>
                      {completed ? (
                        <Badge variant="green">
                          ✓ Done — {submission!.score}/{submission!.total_questions}
                        </Badge>
                      ) : overdue ? (
                        <Badge variant="red">Overdue</Badge>
                      ) : (
                        <Badge variant="gold">
                          Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)", fontStyle: "italic" }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div style={{ padding: "1rem", display: "flex", alignItems: "center" }}>
                    <Link href={`/student/classes/${classId}/subjects/${subjectId}/tasks/${task.id}`}>
                      <button
                        className={completed ? "btn-ghost" : "btn-primary"}
                        style={{ whiteSpace: "nowrap" }}
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
