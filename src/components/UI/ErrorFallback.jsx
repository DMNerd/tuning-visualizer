import React from "react";

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div
      role="alert"
      style={{
        padding: "1rem",
        background: "var(--card-bg)",
        color: "var(--root)",
        border: "1px solid var(--card-border)",
        borderRadius: 8,
      }}
    >
      <p>
        <strong>Something went wrong:</strong>
      </p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
      <button className="btn" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}
