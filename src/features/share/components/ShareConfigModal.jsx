import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import ModalFrame from "@shared/ui/ModalFrame";
import { copyTextWithFallback } from "@shared/lib/clipboard";
import { buildShareConfigModalModel } from "@features/share/model/shareConfigModalModel";
import ShareQrCode from "@features/share/components/ShareQrCode";

export default function ShareConfigModal({ isOpen, onClose, appShareState }) {
  const { t } = useTranslation();
  const model = buildShareConfigModalModel({
    isOpen,
    appShareState,
    locationLike: typeof window === "undefined" ? null : window.location,
  });
  if (!model) return null;
  const { canonicalUrl, sizeEvaluation, presentableUrl } = model;

  const copyLink = async () => {
    try {
      await copyTextWithFallback(canonicalUrl);
      toast.success(t("share.copied"), { id: "quickshare-copy" });
    } catch {
      toast.error(t("share.copyFailed"), { id: "quickshare-copy" });
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t("share.title")}
      cardClassName="tv-modal__card"
    >
      <header className="tv-modal__header">
        <h2>{t("share.title")}</h2>
        <p className="tv-modal__summary">{t("share.summary")}</p>
      </header>

      <div className="tv-modal__body tv-share-modal__body">
        <section aria-label={t("share.contents")}>
          <p className="tv-field__help">{t("share.contentsHelp")}</p>
        </section>

        <div className="tv-share-modal__grid">
          <section
            className="tv-share-modal__panel"
            aria-label={t("share.urlPreview")}
          >
            <label className="tv-field">
              <span className="tv-field__label">{t("share.url")}</span>
              <pre className="tv-textarea" aria-label={t("share.urlPreview")}>
                {presentableUrl}
              </pre>
              <span className="tv-field__help">{t("share.urlHelp")}</span>
              <span
                className="tv-field__help"
                data-warn={sizeEvaluation.warn ? "true" : "false"}
              >
                {t("training.length", { length: sizeEvaluation.length })}
                {sizeEvaluation.reasonCode === "warning-threshold"
                  ? t("training.longUrl")
                  : ""}
                {sizeEvaluation.reasonCode === "qr-hard-limit"
                  ? t("training.tooLongForQr")
                  : ""}
              </span>
            </label>
          </section>

          <section
            className="tv-share-modal__panel tv-share-modal__panel--qr"
            aria-label={t("share.qrPreviewAria")}
          >
            <span className="tv-field__label">{t("training.qrPreview")}</span>
            {sizeEvaluation.allowQr ? (
              <div className="tv-share-modal__qr-wrap" aria-live="polite">
                <ShareQrCode value={canonicalUrl} size={176} />
              </div>
            ) : (
              <p className="tv-field__help tv-field__help--error" role="status">
                {t("share.qrTooLong")}
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={onClose}>
          {t("common.close")}
        </button>
        <button
          type="button"
          className="tv-button tv-button--primary"
          onClick={() => void copyLink()}
        >
          {t("share.copy")}
        </button>
      </footer>
    </ModalFrame>
  );
}
