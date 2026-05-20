"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import QuestionBuilder, { QuestionDraft } from "@/components/teacher/QuestionBuilder";

export default function NewTaskPage() {
  const router = useRouter();
  const { classId, subjectId } = useParams<{ classId: string; subjectId: string }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [submissionDate, setSubmissionDate] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required.");
    if (!driveLink.trim()) return setError("Google Drive link is required.");
    if (!submissionDate) return setError("Submission date is required.");
    if (questions.length === 0) return setError("Add at least one question.");

    for (const q of questions) {
      if (!q.question_text.trim()) return setError("All questions must have text.");
      if (!q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        return setError("All four options are required for every question.");
      }
    }

    setSaving(true);
    setError("");

    // Insert task
    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        subject_id: subjectId,
        class_id: classId,
        title: title.trim(),
        description: description.trim() || null,
        drive_link: driveLink.trim(),
        submission_date: submissionDate,
      })
      .select()
      .single();

    if (taskErr) {
      setError(taskErr.message);
      setSaving(false);
      return;
    }

    // Insert questions
    const { error: qErr } = await supabase.from("questions").insert(
      questions.map((q, i) => ({
        task_id: task.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        order_index: i,
      }))
    );

    if (qErr) {
      setError(qErr.message);
      setSaving(false);
      return;
    }

    router.push(`/teacher/classes/${classId}/subjects/${subjectId}/tasks/${task.id}`);
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Create New Task"
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: "Class", href: `/teacher/classes/${classId}` },
          { label: "Subject", href: `/teacher/classes/${classId}/subjects/${subjectId}` },
          { label: "New Task" },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left — task info */}
          <div className="madrasa-card" style={{ padding: "1.75rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1rem",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--color-navy)",
                marginBottom: "1.25rem",
              }}
            >
              Task Details
            </h2>

            <div className="mb-4">
              <label className="madrasa-label">Task Title *</label>
              <input
                type="text"
                className="madrasa-input"
                placeholder="e.g. Week 3 — Fiqh Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="madrasa-label">Description (optional)</label>
              <textarea
                rows={2}
                className="madrasa-input"
                placeholder="Brief instructions for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="mb-4">
              <label className="madrasa-label">Google Drive Slides Link *</label>
              <input
                type="url"
                className="madrasa-input"
                placeholder="https://docs.google.com/presentation/d/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
              />
              <p style={{ marginTop: "0.35rem", fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "var(--color-muted)", fontStyle: "italic" }}>
                Paste the share link from Google Slides. Make sure sharing is set to "Anyone with the link".
              </p>
            </div>

            <div className="mb-2">
              <label className="madrasa-label">Submission Date *</label>
              <input
                type="date"
                className="madrasa-input"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Right — questions */}
          <div className="madrasa-card" style={{ padding: "1.75rem" }}>
            <QuestionBuilder questions={questions} onChange={setQuestions} />
          </div>
        </div>

        {error && (
          <div
            className="mt-5"
            style={{
              padding: "0.875rem 1.125rem",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "0.625rem",
              color: "#B91C1C",
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button type="submit" variant="gold" loading={saving}>
            Publish Task
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
