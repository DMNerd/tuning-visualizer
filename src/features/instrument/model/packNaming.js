import i18n from "@shared/i18n";
import { generatePackId, getPackId, normalizePackName } from "@features/export";
import { trimmedString } from "@shared/lib/strings";

function getTakenValues(existing, pluck, { exclude } = {}) {
  return new Set(
    existing.map(pluck).filter((value) => value && value !== exclude),
  );
}

export function getTakenNames(existing, options) {
  return getTakenValues(
    existing,
    (item) => normalizePackName(item?.name),
    options,
  );
}

export function getTakenIds(existing) {
  return getTakenValues(existing, getPackId);
}

// Re-importing a pack that was previously exported carries its original
// meta.id, which ensurePackHasId leaves untouched since it's already
// present. If that id still belongs to a pack in the local list (or to
// another pack in this same import batch), removePackByIdentifier would
// later delete every pack sharing the id when just one of them is deleted
// — so give the newcomer a fresh id instead of letting them collide.
export function ensureUniquePackId(pack, takenIds) {
  const currentId = getPackId(pack);
  if (!currentId || takenIds.has(currentId)) {
    const nextPack = { ...pack, meta: { ...pack.meta, id: generatePackId() } };
    takenIds.add(nextPack.meta.id);
    return nextPack;
  }
  takenIds.add(currentId);
  return pack;
}

export function ensureUniqueName(desiredName, takenNames) {
  const base = normalizePackName(desiredName);
  if (!base) return "";

  if (!takenNames.has(base)) {
    takenNames.add(base);
    return base;
  }

  let suffix = 2;
  while (takenNames.has(`${base} (${suffix})`)) suffix += 1;
  const candidate = `${base} (${suffix})`;
  takenNames.add(candidate);
  return candidate;
}

// Human label for a pack (object or name string) used in toasts/confirms.
export function resolvePackLabel(target) {
  if (target && typeof target === "object") {
    const name = trimmedString(target.name);
    const displayName =
      typeof target?.displayName === "string"
        ? target.displayName.trim()
        : name
          ? ""
          : i18n.t("manager.untitledPack");
    return name || displayName;
  }

  if (typeof target === "string") {
    return target.trim();
  }

  return "";
}

export function resolvePackKey(target) {
  if (target && typeof target === "object") {
    const id = getPackId(target);
    if (id) return id;
  }

  const label = resolvePackLabel(target);
  return label || "custom-tuning";
}
