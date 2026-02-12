import { useState } from "react";

export default function QuestionnaireCard({
  title = "Question",
  prompt,
  type,              // "mcq" | "text" | "number"
  options = [],      // for mcq
  onSubmit,          // function(answerStringOrNumber)
  loading = false,
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value) return;
    onSubmit?.(value);
    setValue("");
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <div
        style={{
          borderRadius: 16,
          padding: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#e6eef8",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: 8 }}>{title}</h2>
        <p style={{ marginTop: 0, opacity: 0.9 }}>{prompt}</p>

        <form onSubmit={handleSubmit}>
          {/* Multiple choice */}
          {type === "mcq" && (
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {options.map((opt) => (
                <label
                  key={opt}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="mcq"
                    value={opt}
                    checked={value === opt}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Text / number input */}
          {(type === "text" || type === "number") && (
            <input
              style={{
                width: "100%",
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "#e6eef8",
                outline: "none",
              }}
              placeholder={type === "number" ? "Enter a number…" : "Type your answer…"}
              type={type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          <button
            type="submit"
            disabled={loading || !value}
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: loading ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)",
              color: "#e6eef8",
              cursor: loading || !value ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
