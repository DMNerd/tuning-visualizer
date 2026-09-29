import { Suspense } from "react";
import { useTranslation } from "react-i18next";

import SafeSection from "@shared/ui/SafeSection";

export default function SafeLazyModal({ isOpen, resetKeys, label, children }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <SafeSection resetKeys={resetKeys}>
      <Suspense
        fallback={
          <div className="tv-modal-suspense" role="status" aria-live="polite">
            {t("common.loading", { what: label })}
          </div>
        }
      >
        {children}
      </Suspense>
    </SafeSection>
  );
}
