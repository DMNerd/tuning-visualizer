import { isObjectLike } from "@shared/lib/object";
import { trimmedString } from "@shared/lib/strings";

type PackLike = { name?: unknown; meta?: { id?: unknown } | null };

// A pack's trimmed meta.id, or "" when missing.
export function getPackId(pack: unknown): string {
  return trimmedString((pack as PackLike | null | undefined)?.meta?.id);
}

// The one rule for "is this the pack being referred to": same trimmed meta.id,
// or same trimmed name. Empty wanted values never match.
export function matchesPack(
  candidate: unknown,
  { id, name }: { id?: unknown; name?: unknown },
): boolean {
  if (!isObjectLike(candidate)) return false;
  const wantedId = trimmedString(id);
  if (wantedId && getPackId(candidate) === wantedId) return true;
  const wantedName = trimmedString(name);
  return (
    !!wantedName && trimmedString((candidate as PackLike).name) === wantedName
  );
}
