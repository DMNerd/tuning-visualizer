import React from "react";

import SafeSection from "@/components/UI/SafeSection";

export default function SafeLazyModal({ isOpen, resetKeys, label, children }) {
  if (!isOpen) return null;

  return (
    <SafeSection resetKeys={resetKeys}>
      <React.Suspense
        fallback={
          <div className="tv-modal-suspense" role="status" aria-live="polite">
            Loading {label}...
          </div>
        }
      >
        {children}
      </React.Suspense>
    </SafeSection>
  );
}
