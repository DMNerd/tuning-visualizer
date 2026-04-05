import { Suspense } from "react";

import SafeSection from "@/components/UI/SafeSection";

export default function SafeLazyModal({ isOpen, resetKeys, label, children }) {
  if (!isOpen) return null;

  return (
    <SafeSection resetKeys={resetKeys}>
      <Suspense
        fallback={
          <div className="tv-modal-suspense" role="status" aria-live="polite">
            Loading {label}...
          </div>
        }
      >
        {children}
      </Suspense>
    </SafeSection>
  );
}
