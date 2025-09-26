// src/components/Fretboard/Fretboard.jsx
import React, { forwardRef, useLayoutEffect, useRef } from "react";

import { useFretboardLayout } from "@/hooks/useFretboardLayout";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useScaleAndChord } from "@/hooks/useScaleAndChord";
import { useInlays } from "@/hooks/useInlays";
import { useLabels } from "@/hooks/useLabels";
import { getDegreeColor } from "@/utils/degreeColors";

import { makeDisplayX } from "@/utils/displayX";
import { buildFretLabel, MICRO_LABEL_STYLES } from "@/utils/fretLabels";

const Fretboard = forwardRef(function Fretboard(
  {
    strings = 6,
    frets = 22,
    tuning = ["E", "A", "D", "G", "B", "E"],
    rootIx = 0,
    intervals = [0, 2, 4, 5, 7, 9, 11],
    accidental = "sharp",
    microLabelStyle = MICRO_LABEL_STYLES.Letters,
    show = "names",
    showOpen = true,
    showFretNums = true,
    dotSize = 14,
    lefty = false,
    system,
    chordPCs = null,
    chordRootPc = null,
    openOnlyInScale = false,
    colorByDegree = false,
    hideNonChord = false,
    stringMeta = null,
    capoFret = 0,
    onSetCapo = () => {},
  },
  ref,
) {
  const svgRef = useRef(null);

  const {
    width,
    height,
    nutW,
    padTop,
    padBottom,
    padLeft,
    boardEndX,
    fretXs,
    FRETNUM_TOP_GAP,
    FRETNUM_BOTTOM_GAP,
    wireX,
    betweenFretsX,
    yForString,
    startFretFor,
    stringStartX,
    openXForString,
    noteX,
  } = useFretboardLayout({ frets, strings, dotSize, stringMeta });

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const displayX = makeDisplayX(lefty, width);

  const { pcFromName } = useSystemNoteNames(system, accidental);
  const pcForName = pcFromName;
  const nameForPc = (pc) => system.nameForPc(pc, accidental);

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx,
    intervals,
    chordPCs,
    chordRootPc,
  });

  const { inlaySingles, inlayDoubles } = useInlays({
    frets,
    divisions: system.divisions,
  });

  const { labelFor } = useLabels({
    mode: show,
    system,
    rootIx,
    degreeForPc,
    nameForPc,
    accidental,
  });

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

  const getMetaFor = (s) =>
    Array.isArray(stringMeta) ? stringMeta.find((m) => m.index === s) : null;

  const microLabelOpts = { microStyle: microLabelStyle, accidental };

  return (
    <svg
      ref={svgRef}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Geometry (mirrored as one group for left-handed) */}
      <g transform={lefty ? `scale(-1,1) translate(-${width},0)` : undefined}>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="14"
          fill="var(--panel)"
        />

        {/* nut — moved to capo position */}
        <rect
          className="nut"
          x={wireX(capoFret)}
          y={padTop - 8}
          width={nutW}
          height={height - padTop - padBottom + 16}
          rx="2"
        />

        {/* strings: optional grey pre-start stub + active segment */}
        {Array.from({ length: strings }).map((_, s) => {
          const y = yForString(s);
          const startX = stringStartX(s);
          const meta = getMetaFor(s);
          const hasGreyStub = !!meta?.greyBefore && startFretFor(s) > 0;

          return (
            <g key={`string-${s}`}>
              {hasGreyStub && (
                <line
                  x1={padLeft}
                  y1={y}
                  x2={startX}
                  y2={y}
                  className="stringLine greyBefore"
                />
              )}
              <line
                x1={startX}
                y1={y}
                x2={boardEndX}
                y2={y}
                className="stringLine"
              />
            </g>
          );
        })}

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

        {/* double inlays */}
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
          const sf = startFretFor(s);
          const openPc = (pcForName(openName) + sf) % system.divisions;
          return Array.from({ length: frets + 1 }).map((_, f) => {
            const isOpen = f === 0;
            const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
            if (!isPlayable) return null;

            const step = isOpen ? 0 : sf === 0 ? f : f - sf;
            const pc = (openPc + step) % system.divisions;

            const inScale = scaleSet.has(pc);
            const inChord = chordPCs ? chordPCs.has(pc) : false;

            let visible;
            if (hideNonChord && chordPCs) {
              const baselineVisible = isOpen ? showOpen : true;
              visible = baselineVisible && inChord;
            } else {
              const baselineVisible = isOpen
                ? showOpen && (!openOnlyInScale || inScale)
                : inScale;
              visible = baselineVisible;
            }
            if (!visible) return null;

            const cx = isOpen ? openXForString(s) : noteX(f, s);
            const cy = yForString(s);

            const isRoot = pc === rootIx;
            const isStandard = (f * 12) % system.divisions === 0;
            const isMicro = !isStandard;

            const rBase = (isRoot ? 1.1 : 1) * dotSize;
            const r = inChord ? rBase * 1.05 : rBase;

            let fill;
            if (colorByDegree) {
              const deg = degreeForPc(pc);
              if (deg != null) {
                fill = getDegreeColor(deg, intervals.length);
              } else {
                fill = isMicro ? "var(--note-micro)" : "var(--note)";
              }
            } else {
              fill = isRoot
                ? "var(--root)"
                : isMicro
                  ? "var(--note-micro)"
                  : "var(--note)";
            }

            const isChordRoot = inChord && chordRootPc === pc;

            return (
              <circle
                key={`noteCirc-${s}-${f}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                stroke={inChord ? "var(--fg)" : "none"}
                strokeWidth={isChordRoot ? 2.4 : inChord ? 1.8 : 0}
              />
            );
          });
        })}
      </g>

      {/* note labels (kept out of the mirrored group; use displayX for lefty) */}
      {tuning.map((openName, s) => {
        const sf = startFretFor(s);
        const openPc = (pcForName(openName) + sf) % system.divisions;
        return Array.from({ length: frets + 1 }).map((_, f) => {
          const isOpen = f === 0;
          const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
          if (!isPlayable) return null;

          const step = isOpen ? 0 : sf === 0 ? f : f - sf;
          const pc = (openPc + step) % system.divisions;

          const inScale = scaleSet.has(pc);
          const inChord = chordPCs ? chordPCs.has(pc) : false;

          let visible;
          if (hideNonChord && chordPCs) {
            const baselineVisible = isOpen ? showOpen : true;
            visible = baselineVisible && inChord;
          } else {
            const baselineVisible = isOpen
              ? showOpen && (!openOnlyInScale || inScale)
              : inScale;
            visible = baselineVisible;
          }
          if (!visible) return null;

          const cx = isOpen ? openXForString(s) : noteX(f, s);
          const cy = yForString(s);
          const isRoot = pc === rootIx;

          const globalFretForLabel = isOpen ? sf : f;
          const raw = labelFor(pc, f);
          const label =
            show === "fret"
              ? buildFretLabel(
                  globalFretForLabel,
                  system.divisions,
                  microLabelOpts,
                )
              : raw;

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

      {/* fret numbers — clickable to set capo */}
      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const labelNum = buildFretLabel(f, system.divisions, microLabelOpts);
          const bottomY = height - padBottom + FRETNUM_BOTTOM_GAP;
          const topY = padTop - FRETNUM_TOP_GAP;
          const isStandard = (f * 12) % system.divisions === 0;

          const commonProps = {
            role: "button",
            tabIndex: 0,
            onClick: () => onSetCapo(f),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSetCapo(f);
              }
            },
            className: `fretNum ${f === capoFret ? "capo" : ""} ${isStandard ? "" : "microNum"}`,
          };

          return (
            <text
              key={`num-${f}`}
              x={displayX(betweenFretsX(f))}
              y={isStandard ? bottomY : topY}
              textAnchor="middle"
              {...commonProps}
            >
              {labelNum}
            </text>
          );
        })}
    </svg>
  );
});

/* =========================
   Custom memo comparator
   - Primitives compared by ===
   - Arrays shallow-compared
   - Sets shallow-compared
   - stringMeta compared shallowly by item keys/values
========================= */

function shallowEqArray(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function shallowEqSet(a, b) {
  if (a === b) return true;
  if (!a || !b || a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function shallowEqArrayObj(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (!x || !y) return false;
    const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
    for (const k of keys) if (x[k] !== y[k]) return false;
  }
  return true;
}

function propsAreEqual(prev, next) {
  return (
    prev.strings === next.strings &&
    prev.frets === next.frets &&
    prev.rootIx === next.rootIx &&
    prev.accidental === next.accidental &&
    prev.microLabelStyle === next.microLabelStyle &&
    prev.show === next.show &&
    prev.showOpen === next.showOpen &&
    prev.showFretNums === next.showFretNums &&
    prev.dotSize === next.dotSize &&
    prev.lefty === next.lefty &&
    prev.openOnlyInScale === next.openOnlyInScale &&
    prev.colorByDegree === next.colorByDegree &&
    prev.hideNonChord === next.hideNonChord &&
    prev.capoFret === next.capoFret &&
    prev.system === next.system && // assumes stable identity from caller
    shallowEqArray(prev.tuning, next.tuning) &&
    shallowEqArray(prev.intervals, next.intervals) &&
    (prev.chordPCs === next.chordPCs ||
      (prev.chordPCs && next.chordPCs && shallowEqSet(prev.chordPCs, next.chordPCs))) &&
    (prev.stringMeta === next.stringMeta ||
      (prev.stringMeta && next.stringMeta && shallowEqArrayObj(prev.stringMeta, next.stringMeta)))
  );
}

export default React.memo(Fretboard, propsAreEqual);
