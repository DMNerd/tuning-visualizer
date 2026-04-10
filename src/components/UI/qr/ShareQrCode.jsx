import * as ReactQrCodeModule from "react-qr-code";

function resolveQrComponent(candidate) {
  let current = candidate;

  // Handle nested transpiled default wrappers (`{ default: { default: fn } }`).
  for (let i = 0; i < 3; i += 1) {
    if (
      current &&
      typeof current === "object" &&
      "default" in current &&
      current.default
    ) {
      current = current.default;
      continue;
    }
    break;
  }

  if (typeof current === "function") {
    return current;
  }

  if (current && typeof current === "object" && "$$typeof" in current) {
    return current;
  }

  return null;
}

const QRCodeComponent =
  resolveQrComponent(ReactQrCodeModule?.default) ||
  resolveQrComponent(ReactQrCodeModule?.QRCode) ||
  resolveQrComponent(ReactQrCodeModule);

/**
 * Thin adapter for the QR dependency so share UI does not directly couple
 * to third-party API details.
 */
export default function ShareQrCode({ value, size = 160 }) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  if (!QRCodeComponent) {
    return null;
  }

  return <QRCodeComponent value={value} size={size} />;
}
