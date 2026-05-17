import { FiAlertTriangle, FiCheckCircle, FiInfo, FiLoader } from "react-icons/fi";
import { Toaster, ToastBar } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 2800,
        className: "tv-toast",
      }}
      containerClassName="tv-toast-container"
    >
      {(t) => {
        const icon =
          t.type === "success" ? (
            <FiCheckCircle size={18} color="var(--accent)" />
          ) : t.type === "error" ? (
            <FiAlertTriangle size={18} color="var(--root)" />
          ) : t.type === "loading" ? (
            <FiLoader size={18} className="tv-u-spin" />
          ) : (
            <FiInfo size={18} color="var(--fg)" />
          );
        return (
          <ToastBar toast={t}>
            {({ message, action }) => (
              <div className="tv-toast-bar">
                <span className="tv-toast-icon">{icon}</span>
                <div>{message}</div>
                {action}
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
