import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

import ModalFrame from "@/components/UI/modals/ModalFrame";
import { buildSharePayload, serializeSharePayload } from "@/lib/url/shareCodec";
import { evaluateShareUrlSize } from "@/lib/url/shareLimits";
import ShareQrCode from "@/components/UI/qr/ShareQrCode";

async function copyTextWithFallback(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

export default function ShareConfigModal({ isOpen, onClose, appShareState }) {
  const canonicalUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = buildSharePayload(appShareState);
    const query = serializeSharePayload(payload).toString();
    const base = `${window.location.origin}${window.location.pathname}`;
    return query ? `${base}?${query}` : base;
  }, [appShareState]);

  const sizeEvaluation = useMemo(
    () => evaluateShareUrlSize(canonicalUrl),
    [canonicalUrl],
  );

  const copyLink = useCallback(async () => {
    try {
      await copyTextWithFallback(canonicalUrl);
      toast.success("Quickshare link copied.", { id: "quickshare-copy" });
    } catch {
      toast.error("Could not copy quickshare link.", { id: "quickshare-copy" });
    }
  }, [canonicalUrl]);

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Quickshare"
      cardClassName="tv-modal__card"
    >
      <header className="tv-modal__header">
        <h2>Quickshare</h2>
        <p className="tv-modal__summary">
          Share instrument configuration and system settings with one link.
        </p>
      </header>

      <div className="tv-modal__body tv-share-modal__body">
        <section aria-label="Quickshare contents">
          <p className="tv-field__help">
            This quickshare includes instrument configuration and system
            settings.
          </p>
        </section>

        <div className="tv-share-modal__grid">
          <section
            className="tv-share-modal__panel"
            aria-label="Quickshare URL preview"
          >
            <label className="tv-field">
              <span className="tv-field__label">Quickshare URL</span>
              <textarea
                className="tv-textarea"
                readOnly
                rows={4}
                value={canonicalUrl}
              />
              <span
                className="tv-field__help"
                data-warn={sizeEvaluation.warn ? "true" : "false"}
              >
                Length: {sizeEvaluation.length}
                {sizeEvaluation.reasonCode === "warning-threshold"
                  ? " (Long URL warning)"
                  : ""}
                {sizeEvaluation.reasonCode === "qr-hard-limit"
                  ? " (Too long for QR)"
                  : ""}
              </span>
            </label>
          </section>

          <section
            className="tv-share-modal__panel tv-share-modal__panel--qr"
            aria-label="Quickshare QR preview"
          >
            <span className="tv-field__label">QR preview</span>
            {sizeEvaluation.allowQr ? (
              <div className="tv-share-modal__qr-wrap" aria-live="polite">
                <ShareQrCode value={canonicalUrl} size={176} />
              </div>
            ) : (
              <p className="tv-field__help tv-field__help--error" role="status">
                URL is too long for QR generation. Try reducing custom pack
                metadata or using link copy instead of QR.
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="tv-button tv-button--primary"
          onClick={() => void copyLink()}
        >
          Copy quickshare link
        </button>
      </footer>
    </ModalFrame>
  );
}
