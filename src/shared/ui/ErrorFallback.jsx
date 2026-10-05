import React, { useMemo } from "react";
import { toast } from "react-hot-toast";
import { withToastPromise } from "@shared/lib/toast";
import { useToggle } from "@shared/hooks/stateHooks";
import { useTranslation } from "react-i18next";
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
import { confirm } from "@shared/ui/confirm";
import { performFactoryReset } from "@shared/ui/errorFallbackReset";

export default function ErrorFallback({
  error,
  resetErrorBoundary,
  scope = "section",
}) {
  const { t } = useTranslation();
  const [open, toggleOpen] = useToggle(false);

  const summary = useMemo(() => {
    const name = error?.name || "Error";
    const msg = error?.message || t("errorFallback.unknownError");
    return `${name}: ${msg}`;
  }, [error, t]);

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
        await navigator.clipboard.writeText(details);
      },
      {
        loading: t("errorFallback.copyLoading"),
        success: t("errorFallback.copySuccess"),
        error: t("errorFallback.copyError"),
      },
      "error-details-copy",
    );

  const hardReload = () => {
    window.location.reload();
  };

  const factoryReset = async () => {
    await performFactoryReset({
      confirm,
      onSuccess: () => {
        toast.success(t("errorFallback.storageCleared"));
      },
      onError: () => {
        toast.error(t("errorFallback.storageClearFailed"));
      },
    });
  };

  const isAppFallback = scope === "app";

  return (
    <div
      role="alert"
      className={isAppFallback ? "tv-fallback tv-fallback--app" : "tv-fallback"}
    >
      <div className="tv-fallback__header">
        <FiAlertTriangle size={20} aria-hidden="true" />
        <span>{t("errorFallback.heading")}</span>
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
        title={
          open
            ? t("errorFallback.hideDetailsTitle")
            : t("errorFallback.showDetailsTitle")
        }
      >
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        {open ? t("errorFallback.hideDetails") : t("errorFallback.showDetails")}
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
            toast.success(t("errorFallback.tryingAgain"));
          }}
          title={t("errorFallback.tryAgainTitle")}
        >
          <FiRefreshCcw size={16} />
          {t("errorFallback.tryAgain")}
        </button>

        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={hardReload}
          title={t("errorFallback.reloadTitle")}
        >
          <FiRotateCcw size={16} />
          {t("errorFallback.reload")}
        </button>

        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={copyDetails}
          title={t("errorFallback.copyDetailsTitle")}
        >
          <FiClipboard size={16} />
          {t("errorFallback.copyDetails")}
        </button>

        <a
          className="tv-button tv-button--block"
          href="https://github.com/DMNerd/tuning-visualizer/issues"
          target="_blank"
          rel="noreferrer"
          title={t("errorFallback.reportTitle")}
        >
          <FiExternalLink size={16} />
          {t("errorFallback.report")}
        </a>

        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={() => {
            void factoryReset();
          }}
          title={t("errorFallback.factoryResetTitle")}
        >
          <FiTrash2 size={16} />
          {t("errorFallback.factoryReset")}
        </button>
      </div>
    </div>
  );
}
