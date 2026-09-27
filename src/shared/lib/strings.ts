// The trimmed value when given a string, otherwise "".
export function trimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
