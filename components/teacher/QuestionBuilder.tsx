"use client";

import { AnswerOption } from "@/lib/types";

export interface QuestionDraft {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: AnswerOption;
}

interface QuestionBuilderProps {
  questions: QuestionDraft[];
  onChange: (questions: QuestionDraft[]) => void;
}

const OPTIONS: AnswerOption[] = ["a", "b", "c", "d"];
const LABELS: Record<AnswerOption, string> = { a: "١", b: "٢", c: "٣", d: "٤" };

function emptyQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "a",
  };
}

export default function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  function update(index: number, patch: Partial<QuestionDraft>) {
    const updated = questions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    onChange(updated);
  }

  function remove(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...questions, emptyQuestion()]);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-navy)",
          }}
        >
          Questions
        </h3>
        <span className="badge-blue">{questions.length} added</span>
      </div>

      <div className="flex flex-col gap-5">
        {questions.map((q, qi) => (
          <div
            key={q.id}
            className="animate-fade-in"
            style={{
              background: "white",
              border: "1px solid var(--color-border)",
              borderRadius: "0.875rem",
              padding: "1.25rem",
              boxShadow: "0 2px 8px rgba(10,22,40,0.06)",
            }}
          >
            {/* Question header */}
            <div className="flex items-center justify-between mb-3">
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "0.8125rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-muted)",
                }}
              >
                Question {qi + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(qi)}
                className="btn-danger"
                style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
              >
                Remove
              </button>
            </div>

            {/* Question text (Arabic) */}
            <div className="mb-4">
              <label className="madrasa-label">Question Text (Lisan ud Dawat)</label>
              <textarea
                rows={2}
                className="madrasa-input madrasa-input-arabic"
                style={{ resize: "vertical" }}
                placeholder="سوال لکھیں..."
                value={q.question_text}
                onChange={(e) => update(qi, { question_text: e.target.value })}
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {OPTIONS.map((opt) => {
                const field = `option_${opt}` as keyof QuestionDraft;
                const isCorrect = q.correct_option === opt;
                return (
                  <div
                    key={opt}
                    style={{
                      border: `2px solid ${isCorrect ? "var(--color-gold)" : "var(--color-border)"}`,
                      borderRadius: "0.625rem",
                      padding: "0.75rem",
                      background: isCorrect ? "var(--color-gold-mist)" : "white",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={isCorrect}
                        onChange={() => update(qi, { correct_option: opt })}
                        style={{ accentColor: "var(--color-gold)", width: 16, height: 16 }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-alkanz)",
                          fontSize: "1.1rem",
                          color: isCorrect ? "#7A5A10" : "var(--color-muted)",
                          fontWeight: isCorrect ? 700 : 400,
                        }}
                      >
                        {LABELS[opt]}
                      </span>
                      {isCorrect && (
                        <span className="badge-gold" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>
                          Correct
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      className="madrasa-input madrasa-input-arabic"
                      style={{ fontSize: "1.2rem", padding: "0.375rem 0.625rem" }}
                      placeholder="جواب..."
                      value={q[field] as string}
                      onChange={(e) => update(qi, { [field]: e.target.value } as Partial<QuestionDraft>)}
                    />
                  </div>
                );
              })}
            </div>

            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.8125rem",
                color: "var(--color-muted)",
                fontStyle: "italic",
              }}
            >
              Select the radio button next to the correct answer option.
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="btn-ghost mt-4 w-full justify-center"
        style={{ borderStyle: "dashed" }}
      >
        + Add Question
      </button>
    </div>
  );
}
