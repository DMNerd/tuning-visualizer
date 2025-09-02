import React, { forwardRef, useMemo, useLayoutEffect, useRef } from "react";
import { buildFrets } from "@/components/Fretboard/geometry";

const Fretboard = forwardRef(function Fretboard(
  {
    strings = 6,
    frets = 22,
    tuning = ["E", "A", "D", "G", "B", "E"],
    rootIx = 0,
    intervals = [0, 2, 4, 5, 7, 9, 11],
    accidental = "sharp", // 'sharp' | 'flat'
    show = "names", // 'names' | 'degrees' | 'off'
    showOpen = true,
    showFretNums = true,
    dotSize = 14,
    lefty = false,
    system, // { divisions, nameForPc(pc, accidental?) }
  },
  ref,
) {
  const svgRef = useRef(null);

  // --- Layout (virtual drawing size) ---
  const nutW = 16;
  const stringGap = 56;
  const padRight = 12;
  const padTop = 28;
  const padBottom = 36; // extra room for numbers

  const openNoteMargin = dotSize * 3;
  const padLeft = 24 + openNoteMargin;

  const fullScaleLen = useMemo(() => 56 * frets, [frets]);
  const fretXs = useMemo(
    () => buildFrets(fullScaleLen, frets, system),
    [fullScaleLen, frets, system],
  );

  const lastWire = fretXs[fretXs.length - 1] ?? 0;
  const prevWire = fretXs[fretXs.length - 2] ?? lastWire - fullScaleLen * 0.03;
  const lastGap = Math.max(8, lastWire - prevWire);
  const drawScaleLen = lastWire + lastGap * 1.1;

  const width = padLeft + nutW + drawScaleLen + padRight;
  const height = padTop + padBottom + stringGap * (strings - 1);

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const wireX = (f) => padLeft + nutW + (f === 0 ? 0 : fretXs[f - 1]);

  // Center between frets (labels / fret numbers)
  const betweenFretsX = (f) => {
    if (f === 0) return padLeft + nutW / 2; // "0" on the nut area
    const prev = f === 1 ? 0 : fretXs[f - 2];
    const curr = fretXs[f - 1];
    return padLeft + nutW + (prev + curr) / 2;
  };

  const noteCenterX = (f) => {
    if (f === 0) return padLeft - dotSize * 1.5;
    const prev = f === 1 ? 0 : fretXs[f - 2];
    const curr = fretXs[f - 1];
    return padLeft + nutW + (prev + curr) / 2;
  };

  const boardEndX = padLeft + nutW + drawScaleLen;
  const yForString = (s) => padTop + s * stringGap;

  // Build name→pc map for BOTH accidentals
  const nameToPc = useMemo(() => {
    const map = new Map();
    for (let pc = 0; pc < system.divisions; pc++) {
      map.set(system.nameForPc(pc, "sharp"), pc);
      map.set(system.nameForPc(pc, "flat"), pc);
    }
    return map;
  }, [system]);

  const pcForName = (name) => {
    const pc = nameToPc.get(name);
    return typeof pc === "number" ? pc : 0;
  };

  const nameForPc = (pc) => system.nameForPc(pc, accidental);

  // Scale membership
  const scaleSet = useMemo(
    () => new Set(intervals.map((v) => (v + rootIx) % system.divisions)),
    [intervals, rootIx, system.divisions],
  );

  const degreeForPc = (pc) => {
    const rel = (pc - rootIx + system.divisions) % system.divisions;
    const ix = intervals.indexOf(rel);
    return ix >= 0 ? ix + 1 : null;
  };

  // Inlays
  const inlaySingles = [3, 5, 7, 9, 15, 17, 19, 21].filter((f) => f <= frets);
  const inlayDoubles = [12, 24].filter((f) => f <= frets);

  if (!Array.isArray(intervals) || intervals.length === 0) {
    return (
      <svg
        ref={svgRef}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        className={lefty ? "lefty" : ""}
        style={{ display: "block" }}
      >
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          No scale selected
        </text>
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className={lefty ? "lefty" : ""}
      style={{ display: "block" }}
    >
      {/* board */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="14"
        fill="var(--panel)"
      />

      {/* nut */}
      <rect
        className="nut"
        x={padLeft}
        y={padTop - 8}
        width={nutW}
        height={height - padTop - padBottom + 16}
        rx="2"
      />

      {/* strings */}
      {Array.from({ length: strings }).map((_, s) => (
        <line
          key={`string-${s}`}
          x1={padLeft}
          y1={yForString(s)}
          x2={boardEndX}
          y2={yForString(s)}
          className="stringLine"
        />
      ))}

      {/* frets */}
      {Array.from({ length: frets + 1 }).map((_, f) => {
        const isOctave = f % system.divisions === 0;
        const isStandard = (f * 12) % system.divisions === 0;
        const isMicro = !isStandard;

        return (
          <line
            key={`fret-${f}`}
            x1={wireX(f)}
            y1={padTop}
            x2={wireX(f)}
            y2={height - padBottom}
            className={[
              "fretLine",
              isOctave ? "strong" : "",
              isStandard ? "standard" : "",
              isMicro ? "micro" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        );
      })}

      {/* center inlays */}
      {inlaySingles.map((f) => {
        const prev = f === 1 ? 0 : fretXs[f - 2];
        const curr = fretXs[f - 1];
        const cx = padLeft + nutW + (prev + curr) / 2;
        const cy = padTop + (height - padTop - padBottom) / 2;
        return (
          <circle
            key={`inlay-s-${f}`}
            className="inlay"
            cx={cx}
            cy={cy}
            r="6.5"
          />
        );
      })}
      {inlayDoubles.map((f) => {
        const prev = f === 1 ? 0 : fretXs[f - 2];
        const curr = fretXs[f - 1];
        const cx = padLeft + nutW + (prev + curr) / 2;
        const cy1 = padTop + (height - padTop - padBottom) / 2 - 14;
        const cy2 = padTop + (height - padTop - padBottom) / 2 + 14;
        return (
          <g key={`inlay-d-${f}`}>
            <circle className="inlay" cx={cx} cy={cy1} r="6.5" />
            <circle className="inlay" cx={cx} cy={cy2} r="6.5" />
          </g>
        );
      })}

      {/* side inlays (TOP EDGE ONLY to avoid number collisions) */}
      {Array.from({ length: frets + 1 }).map((_, f) => {
        const isSingle = inlaySingles.includes(f);
        const isDouble = inlayDoubles.includes(f);
        if (!isSingle && !isDouble) return null;

        const cx = wireX(f); // on the wire
        const topY = padTop - 10; // top edge
        const rSide = 3.5;

        return (
          <g key={`side-${f}`}>
            {isDouble ? (
              <>
                <circle className="inlay small" cx={cx} cy={topY} r={rSide} />
                <circle
                  className="inlay small"
                  cx={cx + 10}
                  cy={topY}
                  r={rSide}
                />
              </>
            ) : (
              <circle className="inlay small" cx={cx + 5} cy={topY} r={rSide} />
            )}
          </g>
        );
      })}

      {/* notes */}
      {tuning.map((openName, s) => {
        const openPc = pcForName(openName);
        return Array.from({ length: frets + 1 }).map((_, f) => {
          const pc = (openPc + f) % system.divisions;
          if (!scaleSet.has(pc)) {
            if (!(showOpen && f === 0)) return null;
          }
          const cx = noteCenterX(f);
          const cy = yForString(s);

          const isRoot = pc === rootIx;
          const label =
            show === "off"
              ? ""
              : show === "degrees"
                ? (degreeForPc(pc) ?? "")
                : nameForPc(pc);

          const r = (isRoot ? 1.1 : 1) * dotSize;
          const visible = f > 0 || (f === 0 && showOpen);

          return (
            visible && (
              <g key={`note-${s}-${f}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={isRoot ? "var(--root)" : "var(--accent)"}
                />
                {label !== "" && (
                  <text
                    className={`noteText ${isRoot ? "big" : ""}`}
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                )}
              </g>
            )
          );
        });
      })}

      {/* fret numbers (centered between frets, bottom) */}
      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const isStandard = (f * 12) % system.divisions === 0;
          return (
            <text
              key={`num-${f}`}
              className={`fretNum ${isStandard ? "" : "microNum"}`}
              x={betweenFretsX(f)}
              y={height - 8}
              textAnchor="middle"
              pointerEvents="none"
            >
              {f}
            </text>
          );
        })}
    </svg>
  );
});

export default Fretboard;
