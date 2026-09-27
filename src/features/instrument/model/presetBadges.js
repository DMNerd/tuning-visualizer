function countStringMeta(stringMeta) {
  if (stringMeta instanceof Map) return stringMeta.size;
  if (Array.isArray(stringMeta)) return stringMeta.length;
  return 0;
}

function boardLabels(boardMeta) {
  const labels = [];
  if (boardMeta.notePlacement === "onFret") {
    labels.push("On-fret notes");
  } else if (boardMeta.notePlacement === "between") {
    labels.push("Between frets");
  }

  if (boardMeta.fretStyle === "dotted") {
    labels.push("Dotted frets");
  } else if (boardMeta.fretStyle === "solid") {
    labels.push("Solid frets");
  }

  return labels.length ? labels : ["Board styling"];
}

export function buildPresetBadges({ isCustom, meta }) {
  const badges = [];
  if (isCustom) {
    badges.push({ key: "custom", label: "Custom", variant: "accent" });
  }
  if (!meta) return badges;

  if (countStringMeta(meta.stringMeta) > 0) {
    badges.push({ key: "string-meta", label: "String markers" });
  }

  if (meta.board) {
    boardLabels(meta.board).forEach((label, idx) => {
      badges.push({ key: `board-${idx}-${label}`, label });
    });
  }

  return badges;
}

export function stringCountLabel(strings) {
  return `${strings} strings`;
}
