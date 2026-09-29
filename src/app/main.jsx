import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
// Sets up translations; must load before any component renders
import "@shared/i18n";
import App from "./App.jsx";
import "@styles/index.css";
import ErrorFallback from "@shared/ui/ErrorFallback";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
          scope="app"
        />
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
