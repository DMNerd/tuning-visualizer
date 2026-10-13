/**
 * Centralized URL size thresholds for share UX.
 *
 * These limits are intentionally defined here so modal/UI layers can consume
 * shared policy values instead of hardcoding thresholds in components.
 */
export const SHARE_URL_WARNING_THRESHOLD = 1500;
export const SHARE_URL_QR_HARD_LIMIT_THRESHOLD = 2953;

export type ShareUrlSizeReasonCode =
  | "none"
  | "warning-threshold"
  | "qr-hard-limit";

export type ShareUrlSizeEvaluation = {
  length: number;
  warn: boolean;
  allowQr: boolean;
  reasonCode?: ShareUrlSizeReasonCode;
  message?: string;
};

export function evaluateShareUrlSize(url: string): ShareUrlSizeEvaluation {
  const length = typeof url === "string" ? url.length : 0;

  if (length > SHARE_URL_QR_HARD_LIMIT_THRESHOLD) {
    return {
      length,
      warn: true,
      allowQr: false,
      reasonCode: "qr-hard-limit",
      message:
        "URL exceeds the QR hard limit and should not be offered as a QR code.",
    };
  }

  if (length > SHARE_URL_WARNING_THRESHOLD) {
    return {
      length,
      warn: true,
      allowQr: true,
      reasonCode: "warning-threshold",
      message: "URL is long and may be less reliable in some contexts.",
    };
  }

  return {
    length,
    warn: false,
    allowQr: true,
    reasonCode: "none",
  };
}
