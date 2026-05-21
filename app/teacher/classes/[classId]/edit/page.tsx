"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Class } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";

export default function EditClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();

  const [cls, setCls] = useState<Class | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("classes").select("*").eq("id", classId).single().then(({ data }) => {
      if (data) {
        setCls(data);
        setName(data.name);
        setDescription(data.description ?? "");
      }
      setLoading(false);
    });
  }, [classId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Class name is required.");
    setSaving(true);
    setError("");

    const { error: dbError } = await supabase
      .from("classes")
      .update({ name: name.trim(), description: description.trim() || null })
      .eq("id", classId);

    if (dbError) {
      setError(dbError.message);
      setSaving(false);
      return;
    }

    router.push(`/teacher/classes/${classId}`);
  }

  if (loading) return <Loader />;

  if (!cls) return null;

  return (
    <div className="animate-fade-in-up max-w-xl">
      <PageHeader
        title="Edit Class"
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls.name, href: `/teacher/classes/${classId}` },
          { label: "Edit" },
        ]}
      />

      <div className="madrasa-card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="madrasa-label">Class Name *</label>
            <input
              type="text"
              className="madrasa-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="madrasa-label">Description (optional)</label>
            <textarea
              rows={3}
              className="madrasa-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <p style={{ color: "#B91C1C", fontFamily: "var(--font-body)", fontSize: "0.9375rem", marginBottom: "1rem" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button type="submit" variant="gold" loading={saving}>
              Save Changes
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push(`/teacher/classes/${classId}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
