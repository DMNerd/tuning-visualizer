import ShareQrCode from "@features/share/components/ShareQrCode";

// Link text + QR preview for the encoded routine.
export default function RoutineSharePreview({ shareModel }) {
  return (
    <div className="tv-share-modal__grid">
      <section
        className="tv-share-modal__panel"
        aria-label="Routine link preview"
      >
        <label className="tv-field">
          <span className="tv-field__label">Routine link</span>
          <pre className="tv-textarea" aria-label="Routine link preview">
            {shareModel.presentableUrl}
          </pre>
          <span
            className="tv-field__help"
            data-warn={shareModel.sizeEvaluation.warn ? "true" : "false"}
          >
            Length: {shareModel.sizeEvaluation.length}
            {shareModel.sizeEvaluation.reasonCode === "warning-threshold"
              ? " (Long URL warning)"
              : ""}
            {shareModel.sizeEvaluation.reasonCode === "qr-hard-limit"
              ? " (Too long for QR)"
              : ""}
          </span>
        </label>
      </section>

      <section
        className="tv-share-modal__panel tv-share-modal__panel--qr"
        aria-label="Routine QR preview"
      >
        <span className="tv-field__label">QR preview</span>
        {shareModel.sizeEvaluation.allowQr ? (
          <div className="tv-share-modal__qr-wrap" aria-live="polite">
            <ShareQrCode value={shareModel.canonicalUrl} size={176} />
          </div>
        ) : (
          <p className="tv-field__help tv-field__help--error" role="status">
            Routine is too long for QR generation. Try fewer blocks or use link
            copy instead.
          </p>
        )}
      </section>
    </div>
  );
}
