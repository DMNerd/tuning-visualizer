const BUILT_IN_PRESET_LABEL_KEYS = {
  "Factory default": "instrument.presetFactoryDefault",
  "Saved default": "instrument.presetSavedDefault",
};

export function isBuiltInPreset(name) {
  return Object.hasOwn(BUILT_IN_PRESET_LABEL_KEYS, name);
}

// Display name for a preset; built-in presets are stored under fixed English
// names, so only their label is translated.
export function presetDisplayName(t, name) {
  const key = BUILT_IN_PRESET_LABEL_KEYS[name];
  return key ? t(key) : name;
}

function countStringMeta(stringMeta) {
  if (stringMeta instanceof Map) return stringMeta.size;
  if (Array.isArray(stringMeta)) return stringMeta.length;
  return 0;
}

// Badge labels are translation keys (`labelKey`); render them with t()
function boardLabelKeys(boardMeta) {
  const labelKeys = [];
  if (boardMeta.notePlacement === "onFret") {
    labelKeys.push("instrument.badgeOnFret");
  } else if (boardMeta.notePlacement === "between") {
    labelKeys.push("instrument.badgeBetweenFrets");
  }

  if (boardMeta.fretStyle === "dotted") {
    labelKeys.push("instrument.badgeDottedFrets");
  } else if (boardMeta.fretStyle === "solid") {
    labelKeys.push("instrument.badgeSolidFrets");
  }

  return labelKeys.length ? labelKeys : ["instrument.badgeBoardStyling"];
}

export function buildPresetBadges({ isCustom, meta }) {
  const badges = [];
  if (isCustom) {
    badges.push({
      key: "custom",
      labelKey: "instrument.badgeCustom",
      variant: "accent",
    });
  }
  if (!meta) return badges;

  if (countStringMeta(meta.stringMeta) > 0) {
    badges.push({
      key: "string-meta",
      labelKey: "instrument.badgeStringMarkers",
    });
  }

  if (meta.board) {
    boardLabelKeys(meta.board).forEach((labelKey, idx) => {
      badges.push({ key: `board-${idx}-${labelKey}`, labelKey });
    });
  }

  return badges;
}
