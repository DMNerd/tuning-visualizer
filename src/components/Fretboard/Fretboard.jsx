import React from "react";
import { namesFor } from "@/lib/theory/utils";

const Fretboard = React.forwardRef(function Fretboard({
  strings, frets, tuning, rootIx, intervals = [],
  accidental, show, showOpen, mirrorInlays,
  showFretNums = true, dotSize = 14, lefty = false
}, ref) {
  const extraBottom = 28;
  const openNoteMargin = dotSize * 3;

  const baseWidth  = Math.max(1100, 50 * frets + 140);
  const width      = baseWidth + openNoteMargin;
  const height     = 70 + strings * 68 + extraBottom;

  const nutW = 14, padL = 44 + openNoteMargin, padR = 32, padT = 28, padB = 34 + extraBottom;
  const fretW = (width - padL - padR - nutW) / frets;
  const stringGap = (height - padT - padB) / (strings - 1);

  const openX = padL - (dotSize * 1.5);

  const names = namesFor(accidental);

  const scaleSet = React.useMemo(() => {
    if (!Array.isArray(intervals)) return new Set();
    return new Set(intervals.map(n => (rootIx + n) % 12));
  }, [rootIx, intervals]);

  if (!Array.isArray(intervals) || intervals.length === 0) {
    return (
      <svg viewBox="0 0 600 200" width="600" height="200">
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          No scale selected
        </text>
      </svg>
    );
  }

  const inlayFrets = [3,5,7,9,12,15,17,19,21,24].filter(f => f <= frets);

  const noteIndex = (name) => {
    const S = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const F = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
    return Math.max(S.indexOf(name), F.indexOf(name));
  };

  const DEG = ["1","b2","2","b3","3","4","#4","5","b6","6","b7","7"];

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="Fretboard"
    >
      {/* background */}
      <rect x={padL} y={padT-22} width={width-padL-padR} height={height-padT-padB+44} fill="var(--board)" />

      {/* frets */}
      {Array.from({ length: frets }).map((_, idx) => {
        const F = idx + 1;
        const x = padL + nutW + F * fretW;
        return <line key={F} x1={x} y1={padT-22} x2={x} y2={height-padB+22} className="fretLine strong" />;
      })}

      {/* nut */}
      <rect x={padL} y={padT-22} width={nutW} height={height-padT-padB+44} className="nut" />

      {/* fret numbers */}
      {showFretNums && (
        <>
          <text x={padL + nutW/2} y={height - 6} textAnchor="middle" className="fretNum">0</text>
          {Array.from({ length: frets }).map((_, idx) => {
            const F = idx + 1;
            const x = padL + nutW + F * fretW;
            return <text key={F} x={x} y={height - 6} textAnchor="middle" className="fretNum">{F}</text>;
          })}
        </>
      )}

      {/* strings */}
      {Array.from({ length: strings }).map((_, s) => (
        <line key={s} x1={padL} y1={padT + s*stringGap} x2={width - padR} y2={padT + s*stringGap} className="stringLine" />
      ))}

      {/* inlays */}
      {inlayFrets.map(f => {
        const x = padL + nutW + (f - 0.5) * fretW;
        const mid = padT + (strings - 1) * stringGap / 2;
        return <circle key={f} cx={x} cy={mid} className="inlay small" />;
      })}

      {/* notes */}
      {tuning.map((openName, s) => {
        const openIx = noteIndex(openName);
        const cy = padT + s * stringGap;
        const pieces = [];

        if (showOpen && scaleSet.has(openIx)) {
          const label = show === "degrees" ? "1" : names[openIx];
          pieces.push(
            <g key={`open-${s}`}>
              <circle cx={openX} cy={cy} r={dotSize} fill="var(--accent)" />
              {show !== "off" && <text x={openX} y={cy+4} textAnchor="middle" className="noteText">{label}</text>}
            </g>
          );
        }

        for (let F = 1; F <= frets; F++) {
          const ix = (openIx + F) % 12;
          if (!scaleSet.has(ix)) continue;
          const cx = padL + nutW + (F - 0.5) * fretW;
          const label = show === "degrees" ? DEG[ix] : names[ix];
          pieces.push(
            <g key={`p${s}-${F}`}>
              <circle cx={cx} cy={cy} r={dotSize} fill="var(--accent)" />
              {show !== "off" && <text x={cx} y={cy+4} textAnchor="middle" className="noteText">{label}</text>}
            </g>
          );
        }

        return pieces;
      })}
    </svg>
  );
});

export default Fretboard;
