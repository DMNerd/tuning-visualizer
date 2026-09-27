import clsx from "clsx";
import {
  NOTE_FONT_MAX,
  SPLIT_NOTE_FONT_MIN,
} from "@features/fretboard/model/labelFit";

const CHORD_ROOT_STROKE_WIDTH = 2.4;
const CHORD_NOTE_STROKE_WIDTH = 1.8;

const deriveLowerFill = (baseFill) =>
  `color-mix(in oklab, ${baseFill} 58%, var(--bg))`;

function resolveChordStroke(n) {
  if (!n.inChord) return { stroke: "none", strokeWidth: 0 };
  const stroke = n.isChordOutsideScale
    ? "var(--chord-outside-stroke)"
    : "var(--fg)";
  if (n.isChordRoot) return { stroke, strokeWidth: CHORD_ROOT_STROKE_WIDTH };
  return {
    stroke,
    strokeWidth: n.isChordOutsideScale
      ? CHORD_NOTE_STROKE_WIDTH * 0.7
      : CHORD_NOTE_STROKE_WIDTH,
  };
}

// Clip regions for a split note: enharmonic + shape → four quadrants,
// shape only → left/right halves, enharmonic only → top/bottom halves.
function buildSplitRegions(n) {
  const { cx, cy, r } = n;
  const left = cx - r;
  const top = cy - r;

  if (n.splitEnharmonic && n.splitByShape) {
    const leftFill = n.shapeSplitFills?.[0] ?? n.fill;
    const rightFill = n.shapeSplitFills?.[1] ?? n.fill;
    return [
      ["top-left", left, top, r, r, leftFill],
      ["top-right", cx, top, r, r, rightFill],
      ["bottom-left", left, cy, r, r, deriveLowerFill(leftFill)],
      ["bottom-right", cx, cy, r, r, deriveLowerFill(rightFill)],
    ];
  }

  if (n.splitByShape) {
    const leftFill = n.shapeSplitFills?.[0] ?? n.fill;
    const rightFill = n.shapeSplitFills?.[1] ?? deriveLowerFill(leftFill);
    return [
      ["left", left, top, r, r * 2, leftFill],
      ["right", cx, top, r, r * 2, rightFill],
    ];
  }

  return [
    ["top", left, top, r * 2, r, n.fill],
    ["bottom", left, cy, r * 2, r, deriveLowerFill(n.fill)],
  ];
}

export function NoteCircle({ note: n }) {
  const { stroke, strokeWidth } = resolveChordStroke(n);

  if (!n.splitEnharmonic && !n.splitByShape) {
    return (
      <circle
        data-note-pc={n.pc}
        cx={n.cx}
        cy={n.cy}
        r={n.r}
        fill={n.fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }

  const regions = buildSplitRegions(n).map(
    ([name, x, y, width, height, fill]) => ({
      id: `note-${name}-${n.key}`,
      x,
      y,
      width,
      height,
      fill,
    }),
  );

  return (
    <g data-note-pc={n.pc}>
      <defs>
        {regions.map(({ id, x, y, width, height }) => (
          <clipPath key={id} id={id}>
            <rect x={x} y={y} width={width} height={height} />
          </clipPath>
        ))}
      </defs>
      {regions.map(({ id, fill }) => (
        <circle
          key={id}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill={fill}
          clipPath={`url(#${id})`}
        />
      ))}
      <circle
        cx={n.cx}
        cy={n.cy}
        r={n.r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

export function NoteLabel({ note: n, x }) {
  if (!n.renderedLabel && !n.renderedLabelLines) return null;
  const className = clsx("tv-fretboard__note", {
    "tv-fretboard__note--root": n.isRoot,
  });

  if (!n.renderedLabelLines) {
    return (
      <text
        data-note-pc={n.pc}
        className={className}
        x={x}
        y={n.cy + (n.noteFontSize ?? NOTE_FONT_MAX) * 0.33}
        textAnchor="middle"
        fontSize={n.noteFontSize ?? undefined}
      >
        {n.renderedLabel}
      </text>
    );
  }

  const [upper = "", lower = ""] = n.renderedLabelLines;
  const fontSize = n.noteFontSize ?? SPLIT_NOTE_FONT_MIN;
  return (
    <g>
      {[
        ["upper", upper, n.cy - fontSize * 0.15],
        ["lower", lower, n.cy + fontSize * 0.9],
      ].map(([line, text, y]) => (
        <text
          key={line}
          data-note-pc={n.pc}
          className={className}
          x={x}
          y={y}
          textAnchor="middle"
          fontSize={fontSize}
        >
          {text}
        </text>
      ))}
    </g>
  );
}
