import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClipboard,
  FiCheck,
  FiX,
  FiChevronRight,
  FiRefreshCcw,
} from "react-icons/fi";

// json-edit-react theme for the tuning pack editor.
export function buildPackEditorTheme(isDark) {
  const baseBoolean = "#0f766e";
  const baseNumber = "#2563eb";
  const baseNull = "#b91c1c";
  const baseBooleanDark = "#34d399";
  const baseNumberDark = "#38bdf8";
  const baseNullDark = "#fca5a5";

  return {
    rootFontSize: 11,
    styles: {
      container: {
        backgroundColor: "transparent",
        color: "var(--fg)",
        fontFamily:
          'var(--font-mono, "JetBrains Mono", "Fira Code", "IBM Plex Mono", "ui-monospace", monospace)',
      },
      collection: { backgroundColor: "transparent" },
      collectionInner: { backgroundColor: "transparent" },
      collectionElement: { borderRadius: "6px", paddingBlock: "2px" },
      property: { color: "var(--muted)" },
      bracket: {
        color: isDark ? "rgba(226, 232, 240, 0.85)" : "rgba(17, 24, 39, 0.75)",
        fontWeight: 600,
      },
      itemCount: { color: "var(--muted)", fontStyle: "italic" },
      string: "var(--accent)",
      number: isDark ? baseNumberDark : baseNumber,
      boolean: isDark ? baseBooleanDark : baseBoolean,
      null: isDark ? baseNullDark : baseNull,
      input: [
        "var(--fg)",
        {
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.95)",
          border: isDark
            ? "1px solid rgba(148, 163, 184, 0.35)"
            : "1px solid rgba(148, 163, 184, 0.45)",
          borderRadius: "6px",
          padding: "2px 4px",
        },
      ],
      inputHighlight: isDark
        ? "rgba(59, 130, 246, 0.35)"
        : "rgba(59, 130, 246, 0.2)",
      error: {
        color: isDark ? "#f87171" : "#b91c1c",
        fontWeight: 600,
      },
    },
  };
}

export function buildPackEditorIcons(isDark) {
  const base = {
    size: 18,
    style: { verticalAlign: "middle" },
  };

  const accent = { color: "var(--accent)" };
  const muted = { color: "var(--muted)" };
  const danger = { color: isDark ? "#f87171" : "#dc2626" };

  return {
    add: <FiPlus {...base} style={{ ...base.style, ...accent }} />,
    edit: <FiEdit2 {...base} style={{ ...base.style, ...accent }} />,
    delete: <FiTrash2 {...base} style={{ ...base.style, ...danger }} />,
    copy: <FiClipboard {...base} style={{ ...base.style, ...accent }} />,
    ok: <FiCheck {...base} style={{ ...base.style, ...accent }} />,
    cancel: <FiX {...base} style={{ ...base.style, ...muted }} />,
    chevron: <FiChevronRight {...base} style={{ ...base.style, ...muted }} />,
    reset: <FiRefreshCcw {...base} style={{ ...base.style, ...accent }} />,
  };
}
