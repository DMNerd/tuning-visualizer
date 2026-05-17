import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@shared/ui/ErrorFallback";
import ScaleControls from "@features/theory/components/ScaleControls";
import ChordControls from "@features/theory/components/ChordControls";
import { buildChordFit } from "@features/theory/model/theoryPanelModel";

export default function TheoryPanelContainer({ controlModel, reset }) {
  const state = controlModel?.state ?? {};
  const actions = controlModel?.actions ?? {};
  const meta = controlModel?.meta ?? {};
  const chordFit = buildChordFit(meta.scaleTonePcs, meta.chordTonePcs);

  return (
    <>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[state.root, state.scale]}
        onReset={reset.resetMusicalState}
      >
        <ScaleControls
          state={{
            root: state.root,
            scale: state.scale,
            randomizeMode: state.randomizeMode,
            defaultRoot: state.defaultRoot,
            defaultScale: state.defaultScale,
          }}
          actions={{
            setRoot: actions.setRoot,
            setScale: actions.setScale,
            setRandomizeMode: actions.setRandomizeMode,
            onRandomize: actions.onRandomize,
          }}
          meta={{
            sysNames: meta.sysNames,
            scaleOptions: meta.scaleOptions,
            scaleTonePcs: meta.scaleTonePcs,
            scaleToneLabels: meta.scaleToneLabels,
            chordTonePcs: meta.chordTonePcs,
          }}
        />
      </ErrorBoundary>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[
          state.chordRoot,
          state.chordType,
          state.showChord,
          state.hideNonChord,
          state.chordCapoRelative,
        ]}
        onReset={reset.resetMusicalState}
      >
        <ChordControls
          state={{
            root: state.chordRoot,
            type: state.chordType,
            showChord: state.showChord,
            hideNonChord: state.hideNonChord,
            chordCapoRelative: state.chordCapoRelative,
            defaultRoot: state.defaultChordRoot,
            defaultType: state.defaultChordType,
          }}
          actions={{
            onRootChange: actions.onRootChange,
            onTypeChange: actions.onTypeChange,
            setShowChord: actions.setShowChord,
            setHideNonChord: actions.setHideNonChord,
            setChordCapoRelative: actions.setChordCapoRelative,
          }}
          meta={{
            sysNames: meta.sysNames,
            nameForPc: meta.nameForPc,
            supportsMicrotonal: meta.supportsMicrotonal,
            system: meta.system,
            rootIx: meta.rootIx,
            intervals: state.intervals,
            chordTonePcs: meta.chordTonePcs,
            chordOverlayPcs: meta.chordOverlayPcs,
            chordRootPc: meta.chordRootPc,
            capoFret: meta.capoFret,
            originalChordRoot: meta.originalChordRoot,
            transposedChordRoot: meta.transposedChordRoot,
            isChordTransposed: meta.isChordTransposed,
            chordFit,
          }}
        />
      </ErrorBoundary>
    </>
  );
}
