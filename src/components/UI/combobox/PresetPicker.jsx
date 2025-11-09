import { useMemo } from "react";
import clsx from "clsx";
import { normalizeStringList } from "@/utils/normalizeStringList";
import BaseCombobox from "@/components/UI/combobox/BaseCombobox";

function toBadges({ name, customPresetSet, presetMetaMap }) {
  const badges = [];
  if (customPresetSet.has(name)) {
    badges.push({ key: "custom", label: "Custom", variant: "accent" });
  }

  const meta = presetMetaMap?.[name];
  if (meta) {
    const stringMeta = meta?.stringMeta;
    let stringMetaCount = 0;
    if (stringMeta instanceof Map) {
      stringMetaCount = stringMeta.size;
    } else if (Array.isArray(stringMeta)) {
      stringMetaCount = stringMeta.length;
    }
    if (stringMetaCount > 0) {
      badges.push({ key: "string-meta", label: "String markers" });
    }

    const boardMeta = meta?.board;
    if (boardMeta) {
      const boardLabels = [];
      if (boardMeta.notePlacement === "onFret") {
        boardLabels.push("On-fret notes");
      } else if (boardMeta.notePlacement === "between") {
        boardLabels.push("Between frets");
      }

      if (boardMeta.fretStyle === "dotted") {
        boardLabels.push("Dotted frets");
      } else if (boardMeta.fretStyle === "solid") {
        boardLabels.push("Solid frets");
      }

      if (!boardLabels.length) {
        boardLabels.push("Board styling");
      }

      boardLabels.forEach((label, idx) => {
        badges.push({ key: `board-${idx}-${label}`, label });
      });
    }
  }

  return badges;
}

export default function PresetPicker({
  id,
  presetNames,
  selectedPreset,
  onSelect,
  customPresetNames,
  presetMetaMap,
  placeholder = "Search presets…",
  ariaLabelledBy,
}) {
  const allPresetNames = useMemo(
    () => normalizeStringList(presetNames),
    [presetNames],
  );
  const customPresetSet = useMemo(
    () => new Set(normalizeStringList(customPresetNames)),
    [customPresetNames],
  );

  const badgesByName = useMemo(() => {
    const map = new Map();
    allPresetNames.forEach((name) => {
      map.set(
        name,
        toBadges({
          name,
          customPresetSet,
          presetMetaMap: presetMetaMap ?? {},
        }),
      );
    });
    return map;
  }, [allPresetNames, customPresetSet, presetMetaMap]);

  return (
    <BaseCombobox
      id={id}
      value={selectedPreset ?? ""}
      onSelect={(option) => {
        if (typeof option?.value !== "string") return;
        onSelect?.(option.value);
      }}
      options={allPresetNames.map((name) => ({
        value: name,
        label: name,
      }))}
      getOptionKey={(opt) => opt.value}
      getOptionLabel={(opt) => opt.label}
      getFilterTerms={(opt) => {
        const badges = badgesByName.get(opt.value) ?? [];
        return [opt.label, opt.value, ...badges.map((badge) => badge.label)];
      }}
      renderOption={(opt, { isActive }) => {
        const badges = badgesByName.get(opt.value) ?? [];
        return (
          <div
            className={clsx("tv-preset-picker__option", {
              "is-active": isActive,
              "is-custom": customPresetSet.has(opt.value),
            })}
          >
            <span className="tv-combobox__option-title">{opt.label}</span>
            {badges.length > 0 && (
              <span className="tv-preset-picker__option-meta">
                {badges.map((badge) => (
                  <span
                    key={badge.key}
                    className={clsx("tv-preset-picker__meta-badge", {
                      "tv-preset-picker__meta-badge--accent":
                        badge.variant === "accent",
                    })}
                  >
                    {badge.label}
                  </span>
                ))}
              </span>
            )}
          </div>
        );
      }}
      placeholder={placeholder}
      aria-labelledby={ariaLabelledBy}
      className="tv-preset-picker"
    />
  );
}
