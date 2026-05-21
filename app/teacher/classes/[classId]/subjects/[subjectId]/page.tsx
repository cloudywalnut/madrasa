"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, Task } from "@/lib/types";
import { isArabic } from "@/lib/arabic";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

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

  if (loading) return <Loader />;

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
  const arabicTitle = isArabic(task.title);

  return (
    <div
      className="madrasa-card animate-fade-in-up"
      style={{ animationDelay: `${delay}s`, padding: 0, overflow: "hidden" }}
    >
      <div style={{ display: "flex" }}>
        {/* Left accent bar */}
        <div
          style={{
            width: "4px",
            flexShrink: 0,
            alignSelf: "stretch",
            background: overdue
              ? "#DC2626"
              : "linear-gradient(180deg, var(--color-gold), var(--color-gold-pale))",
          }}
        />

        {/* Content + right action — wraps on small screens */}
        <div style={{ flex: 1, display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
          {/* Main content */}
          <div style={{ flex: 1, minWidth: "180px", padding: "1.125rem 1.25rem" }}>
            <h3
              style={{
                fontFamily: arabicTitle ? "var(--font-alkanz)" : "var(--font-heading)",
                fontSize: arabicTitle ? "1.2rem" : "0.9375rem",
                color: "var(--color-navy)",
                direction: arabicTitle ? "rtl" : "ltr",
                lineHeight: arabicTitle ? 1.9 : 1.3,
                marginBottom: "0.25rem",
              }}
            >
              {task.title}
            </h3>
            {task.description && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-muted)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                {task.description}
              </p>
            )}
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
              Created {new Date(task.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Right: badge stacked above button */}
          <div
            style={{
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <Badge variant={overdue ? "red" : "gold"}>
              Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Badge>
            <Link href={`/teacher/classes/${classId}/subjects/${subjectId}/tasks/${task.id}`}>
              <Button variant="ghost">View Task</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
