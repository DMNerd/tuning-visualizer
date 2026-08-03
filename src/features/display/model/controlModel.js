export function buildDisplayControlModel({
  displayPrefs,
  displaySetters,
  degreeCount,
}) {
  return {
    state: {
      show: displayPrefs.show,
      showOpen: displayPrefs.showOpen,
      showFretNums: displayPrefs.showFretNums,
      dotSize: displayPrefs.dotSize,
      openOnlyInScale: displayPrefs.openOnlyInScale,
      openOnlyInChord: displayPrefs.openOnlyInChord,
      accidental: displayPrefs.accidental,
      noteNaming: displayPrefs.noteNaming,
      microLabelStyle: displayPrefs.microLabelStyle,
      colorByDegree: displayPrefs.colorByDegree,
      colorByShape: displayPrefs.colorByShape,
      lefty: displayPrefs.lefty,
    },
    actions: {
      setShow: displaySetters.setShow,
      setShowOpen: displaySetters.setShowOpen,
      setShowFretNums: displaySetters.setShowFretNums,
      setDotSize: displaySetters.setDotSize,
      setOpenOnlyInScale: displaySetters.setOpenOnlyInScale,
      setOpenOnlyInChord: displaySetters.setOpenOnlyInChord,
      setAccidental: displaySetters.setAccidental,
      setNoteNaming: displaySetters.setNoteNaming,
      setMicroLabelStyle: displaySetters.setMicroLabelStyle,
      setColorByDegree: displaySetters.setColorByDegree,
      setColorByShape: displaySetters.setColorByShape,
      setLefty: displaySetters.setLefty,
    },
    meta: {
      degreeCount,
    },
  };
}
