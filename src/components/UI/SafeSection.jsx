import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";

export default function SafeSection({ children, resetKeys, onReset }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={resetKeys}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}
