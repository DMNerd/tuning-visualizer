import { useTranslation } from "react-i18next";
import ShareQrCode from "@features/share/components/ShareQrCode";

// Link text + QR preview for the encoded routine.
export default function RoutineSharePreview({ shareModel }) {
  const { t } = useTranslation();
  return (
    <div className="tv-share-modal__grid">
      <section
        className="tv-share-modal__panel"
        aria-label={t("training.linkPreview")}
      >
        <label className="tv-field">
          <span className="tv-field__label">{t("training.link")}</span>
          <pre className="tv-textarea" aria-label={t("training.linkPreview")}>
            {shareModel.presentableUrl}
          </pre>
          <span
            className="tv-field__help"
            data-warn={shareModel.sizeEvaluation.warn ? "true" : "false"}
          >
            {t("training.length", {
              length: shareModel.sizeEvaluation.length,
            })}
            {shareModel.sizeEvaluation.reasonCode === "warning-threshold"
              ? t("training.longUrl")
              : ""}
            {shareModel.sizeEvaluation.reasonCode === "qr-hard-limit"
              ? t("training.tooLongForQr")
              : ""}
          </span>
        </label>
      </section>

      <section
        className="tv-share-modal__panel tv-share-modal__panel--qr"
        aria-label={t("training.qrPreviewAria")}
      >
        <span className="tv-field__label">{t("training.qrPreview")}</span>
        {shareModel.sizeEvaluation.allowQr ? (
          <div className="tv-share-modal__qr-wrap" aria-live="polite">
            <ShareQrCode value={shareModel.canonicalUrl} size={176} />
          </div>
        ) : (
          <p className="tv-field__help tv-field__help--error" role="status">
            {t("training.qrTooLong")}
          </p>
        )}
      </section>
    </div>
  );
}
