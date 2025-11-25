export function buildStringPreview(strings = []) {
  if (!Array.isArray(strings)) return "";

  return strings
    .map((string) => string?.note || string?.label || "")
    .filter(Boolean)
    .join(" · ");
}

export function normalizePack(pack) {
  if (!pack || typeof pack !== "object") return null;
  const edo = Number(pack?.system?.edo);
  const metaSystemId =
    typeof pack?.meta?.systemId === "string" ? pack.meta.systemId : null;
  const rawName = typeof pack?.name === "string" ? pack.name : "";
  const displayName = rawName.trim().length ? rawName : "Untitled pack";
  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];
  const stringsCount = strings.length;
  const stringPreview = buildStringPreview(strings);
  return {
    raw: pack,
    rawName,
    displayName,
    edo: Number.isFinite(edo) ? edo : null,
    metaSystemId,
    strings,
    stringsCount,
    stringPreview,
  };
}

export function formatStringsCount(stringsCount) {
  if (!Number.isFinite(stringsCount) || stringsCount <= 0) {
    return "Unknown string count";
  }
  return `${stringsCount} string${stringsCount === 1 ? "" : "s"}`;
}

export function packMatchesQuery({
  normalizedPack,
  systemLabel,
  normalizedQuery,
  formattedStringsCount,
}) {
  const searchString =
    typeof normalizedQuery === "string" ? normalizedQuery : "";
  const countLabel =
    formattedStringsCount ?? formatStringsCount(normalizedPack?.stringsCount);

  if (searchString.length === 0) return true;

  return [
    normalizedPack?.displayName,
    normalizedPack?.rawName,
    String(normalizedPack?.stringsCount ?? ""),
    countLabel,
    systemLabel,
    normalizedPack?.stringPreview,
  ].some(
    (value) =>
      typeof value === "string" && value.toLowerCase().includes(searchString),
  );
}
