"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, TEACHER_ID } from "@/lib/supabase";
import { Class } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", TEACHER_ID)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setClasses(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Bismillah — welcome back"
        action={
          <Link href="/teacher/classes/new">
            <Button variant="gold">+ New Class</Button>
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Classes", value: classes.length },
          { label: "Active Portal", value: "Teacher" },
          { label: "Status", value: "Active" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="madrasa-card"
            style={{ padding: "1.25rem 1.5rem" }}
          >
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-muted)",
                marginBottom: "0.375rem",
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.75rem",
                color: "var(--color-navy)",
                lineHeight: 1,
              }}
            >
              {loading && stat.label === "Total Classes" ? "—" : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Classes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-navy)",
            }}
          >
            Your Classes
          </h2>
          <Link href="/teacher/classes">
            <button
              className="btn-ghost"
              style={{ padding: "0.3rem 0.875rem", fontSize: "0.75rem" }}
            >
              View All
            </button>
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : classes.length === 0 ? (
          <EmptyState
            title="No classes yet"
            description="Create your first class to get started."
            action={
              <Link href="/teacher/classes/new">
                <Button variant="gold">+ Create First Class</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls, i) => (
              <ClassCard key={cls.id} cls={cls} delay={i * 0.05} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ClassCard({ cls, delay }: { cls: Class; delay: number }) {
  return (
    <div
      className="madrasa-card animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="madrasa-card-header">
        <div className="relative z-10">
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1rem",
              letterSpacing: "0.05em",
              color: "white",
              marginBottom: "0.25rem",
            }}
          >
            {cls.name}
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
            }}
          >
            {new Date(cls.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <div style={{ padding: "1rem 1.25rem" }}>
        {cls.description && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              color: "var(--color-muted)",
              marginBottom: "1rem",
              lineHeight: 1.6,
            }}
          >
            {cls.description}
          </p>
        )}
        <Link href={`/teacher/classes/${cls.id}`}>
          <Button variant="primary" style={{ width: "100%", justifyContent: "center" }}>
            Open Class
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="madrasa-card overflow-hidden"
          style={{ opacity: 0.5 }}
        >
          <div
            style={{
              height: "72px",
              background: "linear-gradient(135deg, var(--color-royal), var(--color-royal-light))",
            }}
          />
          <div style={{ padding: "1rem 1.25rem" }}>
            <div
              style={{
                height: "12px",
                background: "var(--color-border)",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              }}
            />
            <div
              style={{
                height: "36px",
                background: "var(--color-border)",
                borderRadius: "6px",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
