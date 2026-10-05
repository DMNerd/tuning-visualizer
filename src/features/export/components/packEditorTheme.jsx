import {
  FiPlus,
  FiCheck,
  FiX,
  FiChevronRight,
  FiRefreshCcw,
} from "react-icons/fi";

// json-edit-react v2 takes inner SVG markup, so the editor's glyphs repeat
// the Feather paths that react-icons/fi renders in the helper panel.
const featherSvgProps = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function featherIcon(content) {
  return { content, viewBox: "0 0 24 24", svgProps: featherSvgProps };
}

const editorIcons = {
  add: featherIcon(
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>,
  ),
  edit: featherIcon(
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  ),
  delete: featherIcon(
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>,
  ),
  copy: featherIcon(
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </>,
  ),
  ok: featherIcon(<polyline points="20 6 9 17 4 12" />),
  cancel: featherIcon(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
  ),
  collection: featherIcon(<polyline points="9 18 15 12 9 6" />),
};

// json-edit-react theme for the tuning pack editor.
export function buildPackEditorTheme(isDark) {
  const baseBoolean = "#0f766e";
  const baseNumber = "#2563eb";
  const baseNull = "#b91c1c";
  const baseBooleanDark = "#34d399";
  const baseNumberDark = "#38bdf8";
  const baseNullDark = "#fca5a5";
  const iconStyle = (color) => ({ color, verticalAlign: "middle" });

  return {
    icons: editorIcons,
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
      iconAdd: iconStyle("var(--accent)"),
      iconEdit: iconStyle("var(--accent)"),
      iconDelete: iconStyle(isDark ? "#f87171" : "#dc2626"),
      iconCopy: iconStyle("var(--accent)"),
      iconOk: iconStyle("var(--accent)"),
      iconCancel: iconStyle("var(--muted)"),
      iconCollection: iconStyle("var(--muted)"),
    },
  };
}

// Icons for the helper panel beside the editor.
export function buildPackEditorIcons() {
  const base = {
    size: 18,
    style: { verticalAlign: "middle" },
  };

  const accent = { color: "var(--accent)" };
  const muted = { color: "var(--muted)" };

  return {
    add: <FiPlus {...base} style={{ ...base.style, ...accent }} />,
    ok: <FiCheck {...base} style={{ ...base.style, ...accent }} />,
    cancel: <FiX {...base} style={{ ...base.style, ...muted }} />,
    chevron: <FiChevronRight {...base} style={{ ...base.style, ...muted }} />,
    reset: <FiRefreshCcw {...base} style={{ ...base.style, ...accent }} />,
  };
}
