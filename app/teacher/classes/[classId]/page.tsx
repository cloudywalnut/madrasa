"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class, Subject } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const [cls, setCls] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("*").eq("id", classId).single(),
      supabase.from("subjects").select("*").eq("class_id", classId).order("created_at"),
    ]).then(([{ data: clsData }, { data: subData }]) => {
      setCls(clsData);
      setSubjects(subData ?? []);
      setLoading(false);
    });
  }, [classId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
        Loading…
      </div>
    );
  }

  if (!cls) {
    return <div style={{ padding: "2rem", color: "#B91C1C", fontFamily: "var(--font-body)" }}>Class not found.</div>;
  }

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title={cls.name}
        subtitle={cls.description ?? undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/teacher" },
          { label: "Classes", href: "/teacher/classes" },
          { label: cls.name },
        ]}
        action={
          <Link href={`/teacher/classes/${classId}/subjects/new`}>
            <Button variant="gold">+ New Subject</Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <Badge variant="blue">{subjects.length} Subject{subjects.length !== 1 ? "s" : ""}</Badge>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="Add a subject to this class to organise learning material and tasks."
          action={
            <Link href={`/teacher/classes/${classId}/subjects/new`}>
              <Button variant="gold">+ Add First Subject</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub, i) => (
            <SubjectCard key={sub.id} subject={sub} classId={classId} delay={i * 0.06} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subject, classId, delay }: { subject: Subject; classId: string; delay: number }) {
  return (
    <div
      className="madrasa-card animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="madrasa-card-header">
        <div className="relative z-10">
          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "white", letterSpacing: "0.05em" }}>
            {subject.name}
          </h3>
        </div>
      </div>
      <div style={{ padding: "1rem 1.25rem" }}>
        {subject.description && (
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
            {subject.description}
          </p>
        )}
        <Link href={`/teacher/classes/${classId}/subjects/${subject.id}`}>
          <Button variant="primary" style={{ width: "100%", justifyContent: "center" }}>
            Open Subject
          </Button>
        </Link>
      </div>
    </div>
  );
}
