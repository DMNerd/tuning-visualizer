function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const base64 = btoa(bytesToBinaryString(bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeBase64Url(input: string): string | null {
  if (typeof input !== "string" || !input) return null;

  try {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const paddingNeeded = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + "=".repeat(paddingNeeded);
    const binary = atob(padded);
    const bytes = binaryStringToBytes(binary);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
