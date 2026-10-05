// A small synth for playing notes in any tuning: plain Web Audio oscillators,
// so any frequency (any EDO) sounds exactly.

let context = null;

function audioContext() {
  if (!context) {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return null;
    context = new Ctx();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/**
 * Plays frequencies one after another (a scale) or together (a chord).
 */
export function playTones(
  frequencies,
  { together = false, step = 0.3, length = 0.6 } = {},
) {
  const ctx = audioContext();
  const freqs = frequencies.filter((f) => Number.isFinite(f) && f > 0);
  if (!ctx || freqs.length === 0) return;
  const start = ctx.currentTime + 0.02;
  const peak = together ? 0.3 / freqs.length : 0.25;
  const hold = together ? length * 2 : length;
  freqs.forEach((freq, index) => {
    const at = together ? start : start + index * step;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peak, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + hold);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + hold + 0.05);
  });
}
