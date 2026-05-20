"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, Task } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export default function SubjectDetailPage() {
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();
  const [cls, setCls] = useState<Class | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("tasks").select("*").eq("subject_id", subjectId).order("created_at", { ascending: false }),
    ]).then(([{ data: clsData }, { data: subData }, { data: taskData }]) => {
      setCls(clsData);
      setSubject(subData);
      setTasks(taskData ?? []);
      setLoading(false);
    });
  }, [classId, subjectId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
        Loading…
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={subject.name}
        subtitle={subject.description ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls?.name ?? "Class", href: `/teacher/classes/${classId}` },
          { label: subject.name },
        ]}
        action={
          <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/tasks/new`}>
            <Button variant="gold">+ New Task</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <Badge variant="blue">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</Badge>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create a task with a Google Drive presentation and questions for students."
          action={
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/tasks/new`}>
              <Button variant="gold">+ Create First Task</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task, i) => (
            <TaskRow key={task.id} task={task} classId={classId} subjectId={subjectId} delay={i * 0.05} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, classId, subjectId, delay }: { task: Task; classId: string; subjectId: string; delay: number }) {
  const overdue = new Date(task.submission_date) < new Date();

  return (
    <div
      className="madrasa-card animate-fade-in-up"
      style={{ animationDelay: `${delay}s`, padding: 0, overflow: "hidden" }}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Left accent bar */}
        <div
          style={{
            width: "4px",
            background: overdue
              ? "#DC2626"
              : "linear-gradient(180deg, var(--color-gold), var(--color-gold-pale))",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, padding: "1.125rem 1.25rem" }}>
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem", color: "var(--color-navy)", flex: 1 }}>
              {task.title}
            </h3>
            <Badge variant={overdue ? "red" : "gold"}>
              Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Badge>
          </div>
          {task.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)", fontStyle: "italic", marginBottom: "0.75rem" }}>
              {task.description}
            </p>
          )}
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            Created {new Date(task.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div style={{ padding: "1rem", display: "flex", alignItems: "center" }}>
          <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/tasks/${task.id}`}>
            <Button variant="ghost">View Task</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
