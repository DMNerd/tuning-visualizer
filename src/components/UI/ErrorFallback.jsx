import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiClipboard,
  FiRefreshCcw,
  FiRotateCcw,
  FiExternalLink,
  FiTrash2,
} from "react-icons/fi";

export default function ErrorFallback({ error, resetErrorBoundary }) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    const name = error?.name || "Error";
    const msg = error?.message || "Unknown error";
    return `${name}: ${msg}`;
  }, [error]);

  const details = useMemo(() => {
    const info = {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      time: new Date().toISOString(),
    };
    return JSON.stringify(info, null, 2);
  }, [error]);

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(details);
      toast.success("Error details copied.");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const hardReload = () => {
    window.location.reload();
  };

  const factoryReset = () => {
    const ok = window.confirm(
      "This will clear saved settings and custom tunings in this browser for this app. Continue?",
    );
    if (!ok) return;
    try {
      localStorage.clear();
      toast.success("Saved settings cleared.");
      window.location.reload();
    } catch {
      toast.error("Failed to clear saved settings.");
    }
  };

  return (
    <div role="alert" className="error-fallback">
      <div className="header">
        <FiAlertTriangle size={20} aria-hidden="true" />
        <span>Something went wrong</span>
      </div>

      <div className="summary" title={summary}>
        {summary}
      </div>

      <button
        type="button"
        className="btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="error-details"
        title={open ? "Hide technical details" : "Show technical details"}
      >
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        {open ? "Hide details" : "Show details"}
      </button>

      {open && (
        <pre id="error-details" className="details">
          {details}
        </pre>
      )}

      <div className="btn-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            resetErrorBoundary?.();
            toast.success("Trying again…");
          }}
          title="Reset the failed UI section"
        >
          <FiRefreshCcw size={16} />
          Try again
        </button>

        <button
          type="button"
          className="btn"
          onClick={hardReload}
          title="Reload the whole app"
        >
          <FiRotateCcw size={16} />
          Reload app
        </button>

        <button
          type="button"
          className="btn"
          onClick={copyDetails}
          title="Copy error details to clipboard"
        >
          <FiClipboard size={16} />
          Copy details
        </button>

        <a
          className="btn"
          href="https://github.com/new"
          target="_blank"
          rel="noreferrer"
          title="Open your issue tracker to paste details"
        >
          <FiExternalLink size={16} />
          Report issue
        </a>

        <button
          type="button"
          className="btn"
          onClick={factoryReset}
          title="Clear saved settings and custom tunings"
        >
          <FiTrash2 size={16} />
          Factory reset
        </button>
      </div>
    </div>
  );
}
