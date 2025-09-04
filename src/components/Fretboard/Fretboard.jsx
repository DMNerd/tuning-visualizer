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
    chordPCs = null, // Set<number> | null
    chordRootPc = null, // number | null
  },
  ref,
) {
  const svgRef = useRef(null);

  // --- Layout (virtual drawing size) ---
  const nutW = 16;
  const stringGap = 56;
  const padRight = 12;

  // Number offsets react to dotSize
  const FRETNUM_TOP_GAP = Math.max(18, dotSize * 0.9 + 6); // micro numbers above the board
  const FRETNUM_BOTTOM_GAP = Math.max(26, dotSize * 1.1 + 8); // standard numbers below the board

  // Ensure paddings are large enough to accommodate the numbers
  const padTop = Math.max(28, FRETNUM_TOP_GAP + 12);
  const padBottom = Math.max(36, FRETNUM_BOTTOM_GAP + 12);

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

  // Center between frets (used for labels and now fret numbers)
  const betweenFretsX = (f) => {
    if (f === 0) return padLeft + nutW / 2;
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
  const displayX = (x) => (lefty ? width - x : x);

  // Build name→pc map for both accidentals
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

  // --- Inlays (12-TET references mapped to N-TET wires) ---
  const N = system.divisions;
  const maxSemi = Math.floor((frets * 12) / N);

  const singleBases = [3, 5, 7, 9, 15, 17, 19, 21];
  const singleSemis = [];
  for (let k = 0; k <= Math.ceil(maxSemi / 12); k++) {
    for (const b of singleBases) {
      const s = b + 12 * k;
      if (s <= maxSemi) singleSemis.push(s);
    }
  }

  const doubleSemis = [];
  for (let s = 12; s <= maxSemi; s += 12) doubleSemis.push(s);

  const semiToWire = (semi) => Math.round((semi * N) / 12);
  const uniq = (arr) => Array.from(new Set(arr));

  const inlaySingles = uniq(singleSemis.map(semiToWire)).filter(
    (f) => f >= 1 && f <= frets,
  );
  const inlayDoubles = uniq(doubleSemis.map(semiToWire)).filter(
    (f) => f >= 1 && f <= frets,
  );

  if (!Array.isArray(intervals) || intervals.length === 0) {
    return (
      <svg
        ref={svgRef}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          No scale selected
        </text>
      </svg>
    );
  }

  // ---------- Render ----------
  return (
    <svg
      ref={svgRef}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <g transform={lefty ? `scale(-1,1) translate(-${width},0)` : undefined}>
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

        {/* center inlays (single) */}
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

        {/* double inlays at octaves */}
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

        {/* note circles */}
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

            const inChord = chordPCs ? chordPCs.has(pc) : false;
            const isChordRoot = inChord && chordRootPc === pc;
            const isStandard = (f * 12) % system.divisions === 0;
            const isMicro = !isStandard;

            const rBase = (isRoot ? 1.1 : 1) * dotSize;
            const r = inChord ? rBase * 1.05 : rBase;

            const visible = f > 0 || (f === 0 && showOpen);

            return (
              visible && (
                <circle
                  key={`noteCirc-${s}-${f}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={
                    isRoot
                      ? "var(--root)"
                      : isMicro
                        ? "var(--note-micro)"
                        : "var(--note)"
                  }
                  stroke={inChord ? "var(--fg)" : "none"}
                  strokeWidth={isChordRoot ? 2.4 : inChord ? 1.8 : 0}
                />
              )
            );
          });
        })}
      </g>

      {/* note labels */}
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

          if (label === "") return null;

          return (
            <text
              key={`noteText-${s}-${f}`}
              className={`noteText ${isRoot ? "big" : ""}`}
              x={displayX(cx)}
              y={cy + 4}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        });
      })}

      {/* fret numbers (centered between frets) */}
      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const N = system.divisions;
          const rem = (f * 12) % N;
          const semitone = Math.floor((f * 12) / N);

          let labelNum;
          if (rem === 0) {
            labelNum = String(semitone);
          } else if (N % 12 === 0) {
            const perSemi = N / 12;
            const sub = f % perSemi;
            const letters = "abcdefghijklmnopqrstuvwxyz";
            const suffix = letters[sub - 1] ?? `.${sub}`;
            labelNum = `${semitone}${suffix}`;
          } else {
            labelNum = `${semitone}+${rem}/${N}`;
          }

          const isStandard = rem === 0;

          const bottomY = height - padBottom + FRETNUM_BOTTOM_GAP;
          const topY = padTop - FRETNUM_TOP_GAP;

          return isStandard ? (
            <text
              key={`num-${f}`}
              className="fretNum"
              x={displayX(betweenFretsX(f))}
              y={bottomY}
              textAnchor="middle"
              pointerEvents="none"
            >
              {labelNum}
            </text>
          ) : (
            <text
              key={`num-${f}`}
              className="fretNum microNum"
              x={displayX(betweenFretsX(f))}
              y={topY}
              textAnchor="middle"
              pointerEvents="none"
            >
              {labelNum}
            </text>
          );
        })}
    </svg>
  );
});

export default Fretboard;
