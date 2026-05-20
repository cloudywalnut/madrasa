"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

export default function NewSubjectPage() {
  const router = useRouter();
  const { classId } = useParams<{ classId: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Subject name is required.");
    setSaving(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("subjects")
      .insert({ name: name.trim(), description: description.trim() || null, class_id: classId })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push(`/teacher/classes/${classId}/subjects/${data.id}`);
  }

  return (
    <div className="animate-fade-in-up max-w-xl">
      <PageHeader
        title="Add Subject"
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: "Class", href: `/teacher/classes/${classId}` },
          { label: "New Subject" },
        ]}
      />

      <div className="madrasa-card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="madrasa-label">Subject Name *</label>
            <input
              type="text"
              className="madrasa-input"
              placeholder="e.g. Fiqh al-Ibadaat, Quran Tafsir..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="madrasa-label">Description (optional)</label>
            <textarea
              rows={3}
              className="madrasa-input"
              placeholder="Brief description of this subject..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <p className="mb-4" style={{ color: "#B91C1C", fontFamily: "var(--font-body)", fontSize: "0.9375rem" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="gold" loading={saving}>
              Create Subject
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
