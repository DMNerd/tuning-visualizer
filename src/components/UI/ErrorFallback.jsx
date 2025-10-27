import React, { useMemo } from "react";
import { toast } from "react-hot-toast";
import { withToastPromise } from "@/utils/toast";
import { useCopyToClipboard, useToggle } from "react-use";
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
  const [open, toggleOpen] = useToggle(false);
  const [, copy] = useCopyToClipboard();

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

  const copyDetails = () =>
    withToastPromise(
      async () => {
        const success = await copy(details);
        if (!success) {
          throw new Error("Copy failed");
        }
      },
      {
        loading: "Copying error details…",
        success: "Error details copied.",
        error: "Could not copy to clipboard.",
      },
      "error-details-copy",
    );

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
    <div role="alert" className="tv-fallback">
      <div className="tv-fallback__header">
        <FiAlertTriangle size={20} aria-hidden="true" />
        <span>Something went wrong</span>
      </div>

      <div className="tv-fallback__summary" title={summary}>
        {summary}
      </div>

      <button
        type="button"
        className="tv-button tv-button--block"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="error-details"
        title={open ? "Hide technical details" : "Show technical details"}
      >
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        {open ? "Hide details" : "Show details"}
      </button>

      {open && (
        <pre id="error-details" className="tv-fallback__details">
          {details}
        </pre>
      )}

      <div className="tv-fallback__actions">
        <button
          type="button"
          className="tv-button tv-button--block"
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
          className="tv-button tv-button--block"
          onClick={hardReload}
          title="Reload the whole app"
        >
          <FiRotateCcw size={16} />
          Reload app
        </button>

        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={copyDetails}
          title="Copy error details to clipboard"
        >
          <FiClipboard size={16} />
          Copy details
        </button>

        <a
          className="tv-button tv-button--block"
          href="https://github.com/DMNerd/tuning-visualizer/issues"
          target="_blank"
          rel="noreferrer"
          title="Open your issue tracker to paste details"
        >
          <FiExternalLink size={16} />
          Report issue
        </a>

        <button
          type="button"
          className="tv-button tv-button--block"
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
