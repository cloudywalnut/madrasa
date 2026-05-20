"use client";

import { useState } from "react";
import { Question, AnswerOption } from "@/lib/types";
import ArabicText from "@/components/ArabicText";

interface QuizPlayerProps {
  questions: Question[];
  onComplete: (answers: Record<string, AnswerOption>, score: number) => Promise<void>;
}

const OPT_LABELS: Record<AnswerOption, string> = { a: "١", b: "٢", c: "٣", d: "٤" };
const OPTIONS: AnswerOption[] = ["a", "b", "c", "d"];

export default function QuizPlayer({ questions, onComplete }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerOption>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<"quiz" | "summary">("quiz");
  const [saving, setSaving] = useState(false);

  const total = questions.length;
  const current = questions[currentIndex];
  const alreadyAnswered = current ? !!revealed[current.id] : false;
  const selectedOption = current ? answers[current.id] : undefined;

  function selectAnswer(opt: AnswerOption) {
    if (alreadyAnswered) return;
    setAnswers((prev) => ({ ...prev, [current.id]: opt }));
    setRevealed((prev) => ({ ...prev, [current.id]: true }));
  }

  async function next() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // All done — compute score and call onComplete
      const score = questions.reduce((acc, q) => {
        return answers[q.id] === q.correct_option ? acc + 1 : acc;
      }, 0);
      setSaving(true);
      await onComplete(answers, score);
      setSaving(false);
      setPhase("summary");
    }
  }

  const progressPct = Math.round(((currentIndex + (alreadyAnswered ? 1 : 0)) / total) * 100);

  if (phase === "summary") {
    const score = questions.reduce((acc, q) => {
      return answers[q.id] === q.correct_option ? acc + 1 : acc;
    }, 0);
    const pct = Math.round((score / total) * 100);

    return (
      <div className="animate-scale-in">
        {/* Score banner */}
        <div
          className="text-center py-8 px-6 rounded-2xl mb-6"
          style={{
            background:
              pct >= 80
                ? "linear-gradient(135deg, #14532D 0%, #166534 100%)"
                : pct >= 50
                ? "linear-gradient(135deg, var(--color-royal) 0%, var(--color-navy) 100%)"
                : "linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%)",
            border: "1px solid rgba(200,150,30,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ color: "var(--color-gold-light)", fontSize: "3rem", marginBottom: "0.5rem" }}>
            {pct >= 80 ? "🏆" : pct >= 50 ? "✦" : "📖"}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.5rem",
              color: "white",
              letterSpacing: "0.04em",
              marginBottom: "0.25rem",
            }}
          >
            {score} / {total} Correct
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(255,255,255,0.7)",
              fontSize: "1rem",
              fontStyle: "italic",
            }}
          >
            {pct}% — {pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort!" : "Keep studying!"}
          </p>
        </div>

        {/* Per-question breakdown */}
        <div className="flex flex-col gap-4">
          {questions.map((q, i) => {
            const chosen = answers[q.id];
            const correct = chosen === q.correct_option;
            const optField = `option_${chosen}` as keyof Question;
            const correctField = `option_${q.correct_option}` as keyof Question;
            return (
              <div
                key={q.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  background: correct ? "#F0FDF4" : "#FFF1F2",
                  border: `1px solid ${correct ? "#BBF7D0" : "#FECDD3"}`,
                  borderRadius: "0.875rem",
                  padding: "1rem 1.25rem",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-muted)" }}>
                    Q{i + 1}
                  </span>
                  <span className={correct ? "badge-green" : "badge-red"} style={{ marginLeft: "auto" }}>
                    {correct ? "Correct" : "Incorrect"}
                  </span>
                </div>
                <ArabicText size="md" style={{ display: "block", marginBottom: "0.5rem" }}>
                  {q.question_text}
                </ArabicText>
                {!correct && chosen && (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#B91C1C", marginBottom: "0.25rem" }}>
                    Your answer:{" "}
                    <ArabicText size="sm" style={{ display: "inline" }}>
                      {q[optField] as string}
                    </ArabicText>
                  </p>
                )}
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#15803D" }}>
                  Correct answer:{" "}
                  <ArabicText size="sm" style={{ display: "inline" }}>
                    {q[correctField] as string}
                  </ArabicText>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-5">
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.8125rem",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-muted)",
            whiteSpace: "nowrap",
          }}
        >
          {currentIndex + 1} / {total}
        </span>
        <div className="progress-bar-track flex-1">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span style={{ fontFamily: "var(--font-heading)", fontSize: "0.8125rem", color: "var(--color-gold)", whiteSpace: "nowrap" }}>
          {progressPct}%
        </span>
      </div>

      {/* Question card */}
      <div
        key={current.id}
        className="animate-fade-in-up"
        style={{
          background: "var(--color-ivory)",
          border: "1px solid var(--color-border)",
          borderRadius: "1.25rem",
          padding: "1.75rem",
          marginBottom: "1.25rem",
          boxShadow: "0 4px 20px rgba(10,22,40,0.08)",
        }}
      >
        {/* Question header */}
        <div className="madrasa-card-header rounded-xl mb-4 relative overflow-hidden" style={{ margin: "-1.75rem -1.75rem 1.25rem" }}>
          <div className="relative z-10 flex items-center gap-2" style={{ padding: "0.875rem 1.5rem" }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--color-gold-light)",
              }}
            >
              Question {currentIndex + 1}
            </span>
          </div>
        </div>

        <ArabicText size="lg" style={{ display: "block", marginBottom: "1.5rem" }}>
          {current.question_text}
        </ArabicText>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => {
            const optField = `option_${opt}` as keyof Question;
            const text = current[optField] as string;
            const isChosen = selectedOption === opt;
            const isCorrect = opt === current.correct_option;

            let cls = "quiz-option";
            if (alreadyAnswered) {
              if (isChosen && isCorrect) cls += " selected-correct";
              else if (isChosen && !isCorrect) cls += " selected-wrong";
              else if (!isChosen && isCorrect) cls += " revealed-correct";
            }

            return (
              <button
                key={opt}
                type="button"
                disabled={alreadyAnswered}
                className={cls}
                onClick={() => selectAnswer(opt)}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "var(--font-alkanz)", fontSize: "1.4rem" }}>{text}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-alkanz)",
                      fontSize: "1.1rem",
                      color: "var(--color-gold)",
                      opacity: 0.7,
                      minWidth: "1.5rem",
                      textAlign: "center",
                    }}
                  >
                    {OPT_LABELS[opt]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {alreadyAnswered && (
          <div
            className="mt-4 animate-fade-in"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.625rem",
              background:
                selectedOption === current.correct_option ? "#F0FDF4" : "#FFF1F2",
              border: `1px solid ${selectedOption === current.correct_option ? "#BBF7D0" : "#FECDD3"}`,
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              color:
                selectedOption === current.correct_option ? "#15803D" : "#B91C1C",
              fontStyle: "italic",
            }}
          >
            {selectedOption === current.correct_option
              ? "✓ Correct — well done!"
              : `✗ Incorrect. The correct answer is shown above.`}
          </div>
        )}
      </div>

      {/* Next button */}
      {alreadyAnswered && (
        <button
          type="button"
          className="btn-primary w-full justify-center animate-fade-in"
          onClick={next}
          disabled={saving}
        >
          {saving ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : currentIndex < total - 1 ? (
            "Next Question →"
          ) : (
            "View Results ✦"
          )}
        </button>
      )}
    </div>
  );
}
