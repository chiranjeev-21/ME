/**
 * Modal model of plucked strings. A string plucked at position p with amplitude a
 * takes a triangular shape whose Fourier modes are
 *   A_n = 2a · sin(nπp) / (n²π² · p(1 − p)),
 * each oscillating at n·f and decaying faster than the fundamental. Visual
 * frequencies are slowed (a high-speed-camera view); audio uses the real pitch.
 */
export const TUNING = [
  { name: 'E', octave: 2, hz: 82.41, gauge: 2.2, wound: true },
  { name: 'A', octave: 2, hz: 110.0, gauge: 1.85, wound: true },
  { name: 'D', octave: 3, hz: 146.83, gauge: 1.55, wound: true },
  { name: 'G', octave: 3, hz: 196.0, gauge: 1.2, wound: false },
  { name: 'B', octave: 3, hz: 246.94, gauge: 0.95, wound: false },
  { name: 'E', octave: 4, hz: 329.63, gauge: 0.8, wound: false },
] as const;

export const MODES = 8;

export interface StringState {
  /** Per-mode amplitude, in pixels. */
  amplitude: Float32Array;
  /** Per-mode phase offset. */
  phase: Float32Array;
  /** Seconds since the last pluck. */
  age: number;
  /** Visual fundamental, Hz. */
  visualHz: number;
}

export function createString(index: number): StringState {
  return {
    amplitude: new Float32Array(MODES),
    phase: new Float32Array(MODES),
    age: 0,
    visualHz: 5.2 + index * 1.15,
  };
}

/** Adds a pluck at normalised position `p` (0–1) with peak displacement `a` pixels. */
export function pluck(state: StringState, p: number, a: number) {
  const pos = Math.min(0.95, Math.max(0.05, p));
  // Carry existing energy forward so re-plucking a ringing string stays continuous.
  const carry = Math.exp(-state.age / 1.6);
  for (let n = 1; n <= MODES; n++) {
    const coefficient =
      (2 * a * Math.sin(n * Math.PI * pos)) / (n * n * Math.PI * Math.PI * pos * (1 - pos));
    state.amplitude[n - 1] = state.amplitude[n - 1] * carry * 0.5 + coefficient;
    state.phase[n - 1] = 0;
  }
  state.age = 0;
}

/** Mode decay time constant: higher harmonics die away first. */
export function decay(n: number) {
  return 1.9 / Math.pow(n, 0.85);
}

/** Displacement at normalised position x (0–1). */
export function displacement(state: StringState, x: number) {
  let y = 0;
  for (let n = 1; n <= MODES; n++) {
    const amplitude = state.amplitude[n - 1];
    if (!amplitude) continue;
    const envelope = Math.exp(-state.age / decay(n));
    y +=
      amplitude *
      envelope *
      Math.sin(n * Math.PI * x) *
      Math.cos(2 * Math.PI * n * state.visualHz * state.age + state.phase[n - 1]);
  }
  return y;
}

/** Peak excursion envelope at x, used for the long-exposure blur band. */
export function envelopeAt(state: StringState, x: number) {
  let e = 0;
  for (let n = 1; n <= MODES; n++) {
    const amplitude = state.amplitude[n - 1];
    if (!amplitude) continue;
    e += Math.abs(amplitude * Math.exp(-state.age / decay(n)) * Math.sin(n * Math.PI * x));
  }
  return e;
}

export function energy(state: StringState) {
  let total = 0;
  for (let n = 1; n <= MODES; n++)
    total += Math.abs(state.amplitude[n - 1] * Math.exp(-state.age / decay(n)));
  return total;
}

/** Karplus–Strong plucked string, rendered offline into a sample buffer. */
export function karplusStrong(hz: number, sampleRate: number, seconds = 2.8, brightness = 0.5) {
  const length = Math.round(sampleRate * seconds);
  const out = new Float32Array(length);
  const period = Math.max(2, Math.round(sampleRate / hz));
  const line = new Float32Array(period);
  let seed = Math.round(hz * 1000);
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Excitation: band-limited noise burst (a pick, not a hammer).
  let previous = 0;
  for (let i = 0; i < period; i++) {
    const noise = random() * 2 - 1;
    previous = previous + brightness * (noise - previous);
    line[i] = previous;
  }
  const damping = 0.996;
  let index = 0;
  for (let i = 0; i < length; i++) {
    const next = (index + 1) % period;
    const value = damping * 0.5 * (line[index] + line[next]);
    out[i] = line[index];
    line[index] = value;
    index = next;
  }
  // Gentle attack to avoid a click, then normalise.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak ? 0.9 / peak : 0;
  for (let i = 0; i < length; i++) out[i] *= gain * Math.min(1, i / 64);
  return out;
}
