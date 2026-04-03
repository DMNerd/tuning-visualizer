import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import ScaleControls from "@/components/UI/controls/ScaleControls";
import ChordBuilder from "@/components/UI/ChordBuilder";

export default function TheoryPanelContainer({
  system,
  scale,
  chord,
  randomize,
  reset,
}) {
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
        <ChordBuilder
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
          chordPCs={chord.chordPCs}
          chordRootPc={chord.chordRootIx}
        />
      </ErrorBoundary>
    </>
  );
}
