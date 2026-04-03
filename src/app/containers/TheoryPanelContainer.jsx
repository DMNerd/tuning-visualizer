import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import ScaleControls from "@/components/UI/controls/ScaleControls";
import ChordControls from "@/components/UI/controls/ChordControls";

export default function TheoryPanelContainer({
  system,
  scale,
  chord,
  randomize,
  reset,
}) {
  const scaleTones = React.useMemo(() => {
    const divisions = Number(system.system?.divisions) || system.sysNames.length || 12;
    const intervals = Array.isArray(scale.intervals) ? scale.intervals : [];

    return intervals.map((interval) => {
      const absolutePc = ((system.rootIx + interval) % divisions + divisions) % divisions;
      return {
        pc: absolutePc,
        label: system.nameForPc(absolutePc),
      };
    });
  }, [
    system,
    scale.intervals,
  ]);

  const chordFit = React.useMemo(() => {
    const scaleToneSet = new Set(scaleTones.map((tone) => tone.pc));
    const chordTonePcs = chord.chordPCs instanceof Set ? [...chord.chordPCs] : [];
    const total = chordTonePcs.length;
    const inScale = chordTonePcs.filter((pc) => scaleToneSet.has(pc)).length;
    const outside = Math.max(total - inScale, 0);
    const text = total > 0 ? `Chord fit: ${inScale}/${total} tones in scale` : null;

    return {
      inScale,
      total,
      outside,
      text,
      kind: outside > 0 ? "warning" : "success",
    };
  }, [chord.chordPCs, scaleTones]);

  return (
    <>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[system.systemId, scale.root, scale.scale]}
        onReset={reset.resetMusicalState}
      >
        <ScaleControls
          root={scale.root}
          setRoot={scale.setRoot}
          scale={scale.scale}
          setScale={scale.setScale}
          sysNames={system.sysNames}
          scaleOptions={scale.scaleOptions}
          defaultScale={scale.defaultScale}
          scaleTonePcs={scaleTones.map((tone) => tone.pc)}
          scaleToneLabels={scaleTones.map((tone) => tone.label)}
          chordTonePcs={chord.chordPCs}
          randomizeMode={randomize.randomizeMode}
          setRandomizeMode={randomize.setRandomizeMode}
          onRandomize={randomize.onRandomize}
        />
      </ErrorBoundary>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[
          chord.chordRoot,
          chord.chordType,
          chord.showChord,
          chord.hideNonChord,
        ]}
        onReset={reset.resetMusicalState}
      >
        <ChordControls
          root={chord.chordRoot}
          onRootChange={chord.setChordRoot}
          sysNames={system.sysNames}
          nameForPc={system.nameForPc}
          type={chord.chordType}
          onTypeChange={chord.setChordType}
          showChord={chord.showChord}
          setShowChord={chord.setShowChord}
          hideNonChord={chord.hideNonChord}
          setHideNonChord={chord.setHideNonChord}
          supportsMicrotonal={Number(system.system?.divisions) > 12}
          system={system.system}
          rootIx={system.rootIx}
          intervals={scale.intervals}
          chordPCs={chord.chordTonePCs}
          chordRootPc={chord.chordRootIx}
          chordFit={chordFit}
        />
      </ErrorBoundary>
    </>
  );
}
