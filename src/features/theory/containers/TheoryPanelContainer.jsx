import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";

import ErrorFallback from "@shared/ui/ErrorFallback";
import Section from "@shared/ui/Section";
import ScaleControls from "@features/theory/components/ScaleControls";
import ChordControls from "@features/theory/components/ChordControls";
import ChordFinder from "@features/theory/components/ChordFinder";
import { buildChordFit } from "@features/theory/model/theoryPanelModel";
import { mod } from "@shared/lib/math";

export default function TheoryPanelContainer({ controlModel, reset }) {
  const { t } = useTranslation();
  const state = controlModel?.state ?? {};
  const actions = controlModel?.actions ?? {};
  const meta = controlModel?.meta ?? {};
  const chordFit = buildChordFit(meta.scaleTonePcs, meta.chordTonePcs, t);
  const divisions = meta.system?.divisions ?? 12;
  // Loads a chord of the scale into the chord controls. Its root is a
  // sounding pitch; a capo-relative chord root is a shape root.
  const showChord = (rootPc, type) => {
    actions.onRootChange(
      meta.nameForPc(mod(rootPc - (meta.chordRootOffset ?? 0), divisions)),
    );
    actions.onTypeChange(type);
    actions.setShowChord(true);
  };

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
            showChord,
          }}
          meta={{
            sysNames: meta.sysNames,
            scaleOptions: meta.scaleOptions,
            scaleTonePcs: meta.scaleTonePcs,
            scaleToneLabels: meta.scaleToneLabels,
            chordTonePcs: meta.chordTonePcs,
            scaleChords: meta.scaleChords,
            scaleModes: meta.scaleModes,
            nameForPc: meta.nameForPc,
            divisions,
            refFreq: meta.refFreq,
          }}
        />
      </ErrorBoundary>
      <Section id="chord-controls" title={t("theory.chordTitle")} size="sm">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[
            state.chordRoot,
            state.chordType,
            state.showChord,
            state.hideNonChord,
            state.chordCapoRelative,
            state.chordIgnoresScale,
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
              chordIgnoresScale: state.chordIgnoresScale,
              defaultRoot: state.defaultChordRoot,
              defaultType: state.defaultChordType,
            }}
            actions={{
              onRootChange: actions.onRootChange,
              onTypeChange: actions.onTypeChange,
              setShowChord: actions.setShowChord,
              setHideNonChord: actions.setHideNonChord,
              setChordCapoRelative: actions.setChordCapoRelative,
              setChordIgnoresScale: actions.setChordIgnoresScale,
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
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[state.chordFinderActive, state.pickedPcs]}
          onReset={actions.clearPickedPcs}
        >
          <ChordFinder
            state={{
              chordFinderActive: state.chordFinderActive,
              pickedPcs: state.pickedPcs,
            }}
            actions={{
              setChordFinderActive: actions.setChordFinderActive,
              togglePickedPc: actions.togglePickedPc,
              clearPickedPcs: actions.clearPickedPcs,
              onRootChange: actions.onRootChange,
              onTypeChange: actions.onTypeChange,
              setShowChord: actions.setShowChord,
              setRoot: actions.setRoot,
              setScale: actions.setScale,
            }}
            meta={{
              nameForPc: meta.nameForPc,
              divisions: meta.system?.divisions,
              matches: meta.chordFinderMatches,
              scaleMatches: meta.scaleFinderMatches,
              chordRootOffset: meta.chordRootOffset,
            }}
          />
        </ErrorBoundary>
      </Section>
    </>
  );
}
