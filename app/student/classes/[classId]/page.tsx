"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

export default function StudentClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const [cls, setCls] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("class_id", classId).order("created_at"),
    ]).then(([{ data: c }, { data: s }]) => {
      setCls(c);
      setSubjects(s ?? []);
      setLoading(false);
    });
  }, [classId]);

  if (loading) return <div style={{ padding: "4rem", textAlign: "center", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Loading…</div>;
  if (!cls) return null;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={cls.name}
        subtitle={cls.description ?? undefined}
        breadcrumbs={[
          { label: "My Classes", href: "/student" },
          { label: cls.name },
        ]}
      />

      <div className="flex items-center gap-2 mb-6">
        <Badge variant="blue">{subjects.length} Subject{subjects.length !== 1 ? "s" : ""}</Badge>
      </div>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet" description="Your teacher hasn't added any subjects to this class yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((sub, i) => (
            <Link
              key={sub.id}
              href={`/student/classes/${classId}/subjects/${sub.id}`}
              className="block animate-fade-in-up"
              style={{ textDecoration: "none", animationDelay: `${i * 0.07}s` }}
            >
              <div className="madrasa-card overflow-hidden h-full">
                <div className="madrasa-card-header">
                  <div className="relative z-10">
                    <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "white", letterSpacing: "0.04em" }}>
                      {sub.name}
                    </h3>
                  </div>
                </div>
                <div style={{ padding: "0.875rem 1.25rem" }}>
                  {sub.description && (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", lineHeight: 1.6, marginBottom: "0.625rem" }}>
                      {sub.description}
                    </p>
                  )}
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-azure)" }}>
                    View Tasks →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
