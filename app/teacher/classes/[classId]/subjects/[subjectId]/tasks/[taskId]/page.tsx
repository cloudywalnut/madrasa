"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject, Task, Question } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ArabicText from "@/components/ArabicText";
import { getDriveEmbedUrl } from "@/lib/supabase";

const OPT_LABELS: Record<string, string> = { a: "١", b: "٢", c: "٣", d: "٤" };

export default function TaskDetailPage() {
  const { classId, subjectId, taskId } = useParams<{ classId: string; subjectId: string; taskId: string }>();
  const [cls, setCls] = useState<Class | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Loading…</div>;
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
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <Badge variant={overdue ? "red" : "gold"}>
          Due {new Date(task.submission_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </Badge>
        <Badge variant="blue">{questions.length} Question{questions.length !== 1 ? "s" : ""}</Badge>
        <Badge variant="green">Created {new Date(task.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</Badge>
      </div>

      {/* Slide preview */}
      <div className="madrasa-card mb-6 overflow-hidden">
        <div className="madrasa-card-header">
          <div className="relative z-10 flex items-center gap-2">
            <span style={{ color: "var(--color-gold-light)", fontSize: "1rem" }}>▶</span>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "0.875rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "white" }}>
              Presentation
            </h3>
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
          <a
            href={task.drive_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.8125rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--color-azure)",
            }}
          >
            Open in Google Slides ↗
          </a>
        </div>
      </div>

      {/* Questions */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-navy)",
            marginBottom: "1.25rem",
          }}
        >
          Questions ({questions.length})
        </h2>

        {questions.length === 0 ? (
          <p style={{ fontFamily: "var(--font-body)", color: "var(--color-muted)", fontStyle: "italic" }}>
            No questions added to this task.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((q, i) => (
              <div key={q.id} className="madrasa-card animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s`, padding: "1.25rem" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-blue">Q{i + 1}</span>
                </div>
                <ArabicText size="lg" style={{ display: "block", marginBottom: "1rem" }}>
                  {q.question_text}
                </ArabicText>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["a", "b", "c", "d"] as const).map((opt) => {
                    const field = `option_${opt}` as keyof Question;
                    const isCorrect = q.correct_option === opt;
                    return (
                      <div
                        key={opt}
                        style={{
                          padding: "0.625rem 1rem",
                          borderRadius: "0.5rem",
                          border: isCorrect ? "2px solid var(--color-gold)" : "1px solid var(--color-border)",
                          background: isCorrect ? "var(--color-gold-mist)" : "white",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.625rem",
                          justifyContent: "flex-end",
                          flexDirection: "row-reverse",
                        }}
                      >
                        {isCorrect && <span className="badge-gold" style={{ fontSize: "0.65rem" }}>✓</span>}
                        <ArabicText size="sm">{q[field] as string}</ArabicText>
                        <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1rem", color: "var(--color-gold)", opacity: 0.7 }}>
                          {OPT_LABELS[opt]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href={`/teacher/classes/${classId}/subjects/${subjectId}`}>
            <Button variant="ghost">← Back to Subject</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
