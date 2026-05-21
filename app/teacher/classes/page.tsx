"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, TEACHER_ID } from "@/lib/supabase";
import { Class } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function ClassesPage() {
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
        title="All Classes"
        breadcrumbs={[{ label: "Dashboard", href: "/teacher" }, { label: "Classes" }]}
        action={
          <Link href="/teacher/classes/new">
            <Button variant="gold">+ New Class</Button>
          </Link>
        }
      />

      {loading ? (
        <Loader />
      ) : classes.length === 0 ? (
        <EmptyState
          title="No classes yet"
          description="Create your first class to begin."
          action={
            <Link href="/teacher/classes/new">
              <Button variant="gold">+ Create First Class</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls, i) => (
            <div
              key={cls.id}
              className="madrasa-card animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="madrasa-card-header">
                <div className="relative z-10">
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1rem", color: "white", letterSpacing: "0.05em" }}>
                    {cls.name}
                  </h3>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
                    Created {new Date(cls.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div style={{ padding: "1rem 1.25rem" }}>
                {cls.description && (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.9375rem", color: "var(--color-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
                    {cls.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <Link href={`/teacher/classes/${cls.id}`} style={{ flex: 1 }}>
                    <Button variant="primary" style={{ width: "100%", justifyContent: "center" }}>
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
