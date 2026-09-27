// Pure metronome timing: tempo/meter parsing, beat-grid positions, and the
// Web Audio click voice.

export const METRONOME_BPM_MIN = 20;
export const METRONOME_BPM_MAX = 300;

const CLICK_DURATION_SEC = 0.03;

export const SUBDIVISION_STEPS = {
  Quarter: 1,
  Eighth: 2,
  Triplet: 3,
  Sixteenth: 4,
};

export function parseBeatsPerBar(timeSig) {
  const beats = Number.parseInt(String(timeSig).split("/")[0], 10);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

export function clampBpm(value) {
  const bpm = Number(value);
  if (!Number.isFinite(bpm)) return 80;
  return Math.max(
    METRONOME_BPM_MIN,
    Math.min(METRONOME_BPM_MAX, Math.round(bpm)),
  );
}

export function scheduleClick(
  ctx,
  when,
  { accent = false, subdivision = false } = {},
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const baseFreq = accent ? 1480 : subdivision ? 900 : 1180;
  const peak = accent ? 0.26 : subdivision ? 0.08 : 0.14;

  osc.type = "square";
  osc.frequency.setValueAtTime(baseFreq, when);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + CLICK_DURATION_SEC);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + CLICK_DURATION_SEC + 0.01);
}

// Where sub-step `cursor` falls on the beat grid (1-based beat and bar).
export function resolveStepPosition(cursor, stepsPerBeat, beatsPerBar) {
  const stepInBeat = cursor % stepsPerBeat;
  const beatIndex = Math.floor(cursor / stepsPerBeat);
  return {
    stepInBeat,
    beatNumber: (beatIndex % beatsPerBar) + 1,
    barNumber: Math.floor(beatIndex / beatsPerBar) + 1,
  };
}
