"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, TEACHER_ID } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Class name is required.");
    setSaving(true);
    setError("");

    const { data, error: dbError } = await supabase
      .from("classes")
      .insert({ name: name.trim(), description: description.trim() || null, teacher_id: TEACHER_ID })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push(`/teacher/classes/${data.id}`);
  }

  return (
    <div className="animate-fade-in-up max-w-xl">
      <PageHeader
        title="Create New Class"
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: "New Class" },
        ]}
      />

      <div className="madrasa-card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="madrasa-label">Class Name *</label>
            <input
              type="text"
              className="madrasa-input"
              placeholder="e.g. Sirah an-Nabawiyyah — Year 5"
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
              placeholder="Brief description of this class..."
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
              Create Class
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
