import React, { forwardRef, useMemo, useLayoutEffect, useRef } from "react";

// fallback names for 12-TET when accidentals need forcing
const NOTES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NOTES_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

const Fretboard = forwardRef(function Fretboard(
  {
    strings = 6,
    frets = 22,
    tuning = ["E","A","D","G","B","E"], // names in active system
    rootIx = 0,
    intervals = [0,2,4,5,7,9,11],
    accidental = "sharp",
    show = "names", // 'names' | 'degrees' | 'off'
    showOpen = true,
    mirrorInlays = false,
    showFretNums = true,
    dotSize = 14,
    lefty = false,
    system, // { divisions, nameForPc, ... }
  },
  ref
) {
  const svgRef = useRef(null);

  // --- Geometry ---
  const nutW = 16;
  const stringGap = 56;
  const fretGap = 56;
  const padX = 24;
  const padY = 28;

  const { width, height } = useMemo(() => {
    const w = padX * 2 + nutW + fretGap * frets;
    const h = padY * 2 + stringGap * (strings - 1);
    return { width: w, height: h };
  }, [frets, strings]);

  // expose <svg> to parent via ref
  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const xForFret = (f) => padX + nutW + f * fretGap;
  const yForString = (s) => padY + s * stringGap;

  // pc from system name
  const sysNames = useMemo(
    () => Array.from({ length: system.divisions }, (_, pc) => system.nameForPc(pc)),
    [system]
  );
  const pcForName = (name) => {
    const ix = sysNames.indexOf(name);
    return ix >= 0 ? ix : 0;
  };

  // name for pc honoring accidentals for 12-TET
  const nameForPc = (pc) => {
    if (system.divisions === 12) {
      const arr = accidental === "flat" ? NOTES_FLAT : NOTES_SHARP;
      return arr[pc % 12];
    }
    return system.nameForPc(pc);
  };

  const scaleSet = useMemo(() => new Set(intervals.map((v) => (v + rootIx) % system.divisions)), [
    intervals,
    rootIx,
    system.divisions,
  ]);

  const degreeForPc = (pc) => {
    const rel = (pc - rootIx + system.divisions) % system.divisions;
    const ix = intervals.indexOf(rel);
    return ix >= 0 ? ix + 1 : null;
  };

  const inlaySingles = [3, 5, 7, 9, 15, 17, 19, 21].filter((f) => f <= frets);
  const inlayDoubles = [12, 24].filter((f) => f <= frets);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      className={lefty ? "lefty" : ""}
    >
      {/* board background */}
      <rect x="0" y="0" width={width} height={height} rx="14" fill="var(--panel)" />

      {/* nut */}
      <rect
        className="nut"
        x={padX}
        y={padY - 8}
        width={nutW}
        height={height - padY * 2 + 16}
        rx="2"
      />

      {/* strings */}
      {Array.from({ length: strings }).map((_, s) => (
        <line
          key={`string-${s}`}
          x1={padX}
          y1={yForString(s)}
          x2={padX + nutW + frets * fretGap}
          y2={yForString(s)}
          className="stringLine"
        />
      ))}

      {/* frets */}
      {Array.from({ length: frets + 1 }).map((_, f) => (
        <line
          key={`fret-${f}`}
          x1={xForFret(f)}
          y1={padY}
          x2={xForFret(f)}
          y2={height - padY}
          className={`fretLine ${f % 12 === 0 ? "strong" : ""}`}
        />
      ))}

      {/* Inlays – center */}
      {inlaySingles.map((f) => {
        const cx = xForFret(f) + fretGap / 2;
        const cy = padY + (height - padY * 2) / 2;
        return <circle key={`inlay-s-${f}`} className="inlay" cx={cx} cy={cy} r="6.5" />;
      })}
      {inlayDoubles.map((f) => {
        const cx = xForFret(f) + fretGap / 2;
        const cy1 = padY + (height - padY * 2) / 2 - 14;
        const cy2 = padY + (height - padY * 2) / 2 + 14;
        return (
          <g key={`inlay-d-${f}`}>
            <circle className="inlay" cx={cx} cy={cy1} r="6.5" />
            <circle className="inlay" cx={cx} cy={cy2} r="6.5" />
          </g>
        );
      })}

      {/* Side inlays (mirrored optional) */}
      {Array.from({ length: frets + 1 }).map((_, f) => {
        const isSingle = inlaySingles.includes(f);
        const isDouble = inlayDoubles.includes(f);
        if (!isSingle && !isDouble) return null;

        const cx = xForFret(f);
        const topY = padY - 10;
        const botY = height - padY + 10;

        return (
          <g key={`side-${f}`}>
            {isDouble ? (
              <>
                <circle className="inlay small" cx={cx} cy={botY} />
                <circle className="inlay small" cx={cx + 10} cy={botY} />
                {mirrorInlays && (
                  <>
                    <circle className="inlay small" cx={cx} cy={topY} />
                    <circle className="inlay small" cx={cx + 10} cy={topY} />
                  </>
                )}
              </>
            ) : (
              <>
                <circle className="inlay small" cx={cx + 5} cy={botY} />
                {mirrorInlays && <circle className="inlay small" cx={cx + 5} cy={topY} />}
              </>
            )}
          </g>
        );
      })}

      {/* notes (including open if enabled) */}
      {tuning.map((openName, s) => {
        const openPc = pcForName(openName);
        return Array.from({ length: frets + 1 }).map((_, f) => {
          const pc = (openPc + f) % system.divisions;
          if (!scaleSet.has(pc)) {
            // still draw open markers when showOpen is true?
            if (!(showOpen && f === 0)) return null;
          }

          const cx = f === 0 ? padX + nutW / 2 : xForFret(f - 1) + fretGap / 2;
          const cy = yForString(s);

          const isRoot = pc === rootIx;
          const label =
            show === "off"
              ? ""
              : show === "degrees"
              ? degreeForPc(pc) ?? ""
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
                  <text className={`noteText ${isRoot ? "big" : ""}`} x={cx} y={cy + 4} textAnchor="middle">
                    {label}
                  </text>
                )}
              </g>
            )
          );
        });
      })}

      {/* fret numbers */}
      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const x = xForFret(f);
          const y = height - 6;
          return (
            <text key={`num-${f}`} className="fretNum" x={x} y={y} textAnchor="middle">
              {f}
            </text>
          );
        })}
    </svg>
  );
});

export default Fretboard;
