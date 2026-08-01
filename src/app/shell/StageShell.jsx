import { useCallback } from "react";
import clsx from "clsx";

import StageHudContainer from "@app/shell/StageHudContainer";
import { Fretboard } from "@features/fretboard";
import { RoutineHudContainer } from "@features/training";
import { SafeSection } from "@shared/ui";

export default function StageShell({
  boardRef,
  stageRef,
  isFs,
  toggleFs,
  resetAll,
  showPracticeHud,
  displayPrefs,
  theoryDomain,
  theoryPanel,
  instrumentState,
  drawFrets,
  boardMeta,
  capo,
  onResetCapo,
  routinePlayback,
}) {
  const { strings, tuning } = instrumentState;
  const { capoFret, toggleCapoAt, effectiveStringMeta } = capo;
  const { handleSelectNote: handleTheorySelectNote } = theoryDomain.handlers;
  const {
    show,
    showOpen,
    showFretNums,
    dotSize,
    lefty,
    openOnlyInScale,
    colorByDegree,
    colorByShape,
    accidental,
    microLabelStyle,
    noteNaming,
  } = displayPrefs;

  const handleSelectNote = useCallback(
    (pc, providedName, event) => {
      handleTheorySelectNote(pc, providedName, event, {
        capoFret,
      });
    },
    [capoFret, handleTheorySelectNote],
  );

  return (
    <div className="tv-stage" ref={stageRef}>
      <div
        className={clsx("tv-stage__surface", { "is-lefty": lefty })}
        onDoubleClick={() => toggleFs()}
      >
        <StageHudContainer
          isFs={isFs}
          onToggleFs={toggleFs}
          onResetAll={() => resetAll({ confirm: true })}
          showPracticeHud={showPracticeHud}
        />
        <RoutineHudContainer routinePlayback={routinePlayback} />
        <SafeSection onReset={onResetCapo}>
          <Fretboard
            ref={boardRef}
            strings={strings}
            frets={drawFrets}
            tuning={tuning}
            rootIx={theoryDomain.system.rootIx}
            intervals={theoryDomain.scale.intervals}
            accidental={accidental}
            noteNaming={noteNaming}
            microLabelStyle={microLabelStyle}
            show={show}
            showOpen={showOpen}
            showFretNums={showFretNums}
            dotSize={dotSize}
            lefty={lefty}
            system={theoryDomain.system.system}
            chordPCs={theoryPanel.controlModel.meta.chordOverlayPcs}
            chordRootPc={theoryPanel.controlModel.meta.chordRootPc}
            openOnlyInScale={openOnlyInScale}
            colorByDegree={colorByDegree}
            colorByShape={colorByShape}
            hideNonChord={theoryDomain.chord.hideNonChord}
            stringMeta={effectiveStringMeta}
            boardMeta={boardMeta}
            onSelectNote={handleSelectNote}
            capoFret={capoFret}
            onSetCapo={toggleCapoAt}
          />
        </SafeSection>
      </div>
    </div>
  );
}
