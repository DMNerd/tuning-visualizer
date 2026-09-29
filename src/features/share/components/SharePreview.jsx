import { useTranslation } from "react-i18next";
import ShareQrCode from "@features/share/components/ShareQrCode";

// Link text + QR preview for an encoded share URL (quickshare, routines).
export default function SharePreview({
  shareModel,
  linkLabel,
  linkAriaLabel,
  qrAriaLabel,
  qrTooLongText,
}) {
  const { t } = useTranslation();
  const { presentableUrl, canonicalUrl, sizeEvaluation } = shareModel;
  return (
    <div className="tv-share-modal__grid">
      <section className="tv-share-modal__panel" aria-label={linkAriaLabel}>
        <label className="tv-field">
          <span className="tv-field__label">{linkLabel}</span>
          <pre className="tv-textarea" aria-label={linkAriaLabel}>
            {presentableUrl}
          </pre>
          <span
            className="tv-field__help"
            data-warn={sizeEvaluation.warn ? "true" : "false"}
          >
            {t("share.length", { length: sizeEvaluation.length })}
            {sizeEvaluation.reasonCode === "warning-threshold"
              ? t("share.longUrl")
              : ""}
            {sizeEvaluation.reasonCode === "qr-hard-limit"
              ? t("share.tooLongForQr")
              : ""}
          </span>
        </label>
      </section>

      <section
        className="tv-share-modal__panel tv-share-modal__panel--qr"
        aria-label={qrAriaLabel}
      >
        <span className="tv-field__label">{t("share.qrPreview")}</span>
        {sizeEvaluation.allowQr ? (
          <div className="tv-share-modal__qr-wrap" aria-live="polite">
            <ShareQrCode value={canonicalUrl} size={176} />
          </div>
        ) : (
          <p className="tv-field__help tv-field__help--error" role="status">
            {qrTooLongText}
          </p>
        )}
      </section>
    </div>
  );
}
