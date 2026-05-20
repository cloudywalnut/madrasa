"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Class } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClasses(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="My Classes"
        subtitle="Bismillah — select a class to begin learning"
      />

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-muted)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>
          Loading classes…
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes available"
          description="Your teacher has not created any classes yet. Please check back later."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <StudentClassCard key={cls.id} cls={cls} delay={i * 0.06} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentClassCard({ cls, delay }: { cls: Class; delay: number }) {
  return (
    <Link
      href={`/student/classes/${cls.id}`}
      className="block animate-fade-in-up"
      style={{ textDecoration: "none", animationDelay: `${delay}s` }}
    >
      <div className="madrasa-card overflow-hidden h-full">
        <div className="madrasa-card-header">
          <div className="relative z-10">
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem", color: "white", letterSpacing: "0.04em" }}>
              {cls.name}
            </h3>
          </div>
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          {cls.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
              {cls.description}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "var(--color-gold)", fontSize: "0.875rem" }}>✦</span>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-azure)" }}>
              View Subjects →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
