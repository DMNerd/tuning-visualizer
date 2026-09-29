import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import ModalFrame from "@shared/ui/ModalFrame";
import { copyTextWithFallback } from "@shared/lib/clipboard";
import { buildShareConfigModalModel } from "@features/share/model/shareConfigModalModel";
import SharePreview from "@features/share/components/SharePreview";

export default function ShareConfigModal({ isOpen, onClose, appShareState }) {
  const { t } = useTranslation();
  const model = buildShareConfigModalModel({
    isOpen,
    appShareState,
    locationLike: typeof window === "undefined" ? null : window.location,
  });
  if (!model) return null;
  const { canonicalUrl } = model;

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

      <div className="tv-modal__body">
        <SharePreview
          shareModel={model}
          linkLabel={t("share.url")}
          linkAriaLabel={t("share.urlPreview")}
          qrAriaLabel={t("share.qrPreviewAria")}
          qrTooLongText={t("share.qrTooLong")}
        />
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
