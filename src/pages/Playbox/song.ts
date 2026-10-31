import { STRINGS, isFret } from '../../scenes/strings/music.ts';
import type { Frets, StrumDirection } from '../../scenes/strings/music.ts';

export const STORAGE_KEY = 'cj-playbox:v1';
export const MAX_STEPS = 256;
export const TEMPO = { min: 40, max: 200, initial: 60 } as const;
export const BEATS = { min: 0.5, max: 4, step: 0.5, initial: 1 } as const;

export interface Step {
  id: string;
  frets: Frets;
  beats: number;
  direction: StrumDirection;
}

export interface Song {
  bpm: number;
  loop: boolean;
  steps: Step[];
}

let counter = 0;
export function stepId() {
  counter += 1;
  return `step-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function emptySong(): Song {
  return { bpm: TEMPO.initial, loop: true, steps: [] };
}

export function clampTempo(bpm: number) {
  if (!Number.isFinite(bpm)) return TEMPO.initial;
  return Math.min(TEMPO.max, Math.max(TEMPO.min, Math.round(bpm)));
}

/** Step lengths move in half beats between ½ and 4 beats. */
export function clampBeats(beats: number) {
  if (!Number.isFinite(beats)) return BEATS.initial;
  const snapped = Math.round(beats / BEATS.step) * BEATS.step;
  return Math.min(BEATS.max, Math.max(BEATS.min, snapped));
}

/** Seconds from one strum to the next. */
export function stepSeconds(beats: number, bpm: number) {
  return (clampBeats(beats) * 60) / clampTempo(bpm);
}

export function songTimes(steps: readonly Pick<Step, 'beats'>[], bpm: number) {
  const starts: number[] = [];
  let total = 0;
  for (const step of steps) {
    starts.push(total);
    total += stepSeconds(step.beats, bpm);
  }
  return { starts, total };
}

export function serializeSong(song: Song) {
  return JSON.stringify({
    version: 1,
    bpm: song.bpm,
    loop: song.loop,
    steps: song.steps.map(({ frets, beats, direction }) => ({ frets, beats, direction })),
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseStep(value: unknown): Step | null {
  if (!isRecord(value)) return null;
  const { frets, beats, direction } = value;
  if (!Array.isArray(frets) || frets.length !== STRINGS) return null;
  if (!frets.every(fret => fret === null || isFret(fret))) return null;
  if (typeof beats !== 'number' || !(beats >= BEATS.min && beats <= BEATS.max)) return null;
  if (direction !== 'down' && direction !== 'up') return null;
  return { id: stepId(), frets: frets as (number | null)[], beats: clampBeats(beats), direction };
}

/**
 * Reads a stored song. Anything malformed, from another version, or out of
 * range is rejected as a whole, so a visitor never gets half a song.
 */
export function parseSong(text: string | null | undefined): Song | null {
  if (!text) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== 1) return null;
  const { bpm, loop, steps } = data;
  if (typeof bpm !== 'number' || !(bpm >= TEMPO.min && bpm <= TEMPO.max)) return null;
  if (typeof loop !== 'boolean') return null;
  if (!Array.isArray(steps) || steps.length > MAX_STEPS) return null;
  const parsed = steps.map(parseStep);
  if (parsed.some(step => step === null)) return null;
  return { bpm: clampTempo(bpm), loop, steps: parsed as Step[] };
}

export interface Cue {
  index: number;
  time: number;
  seconds: number;
}

export interface SequencerOptions {
  /** The audio clock, in seconds. */
  now: () => number;
  /** Current step lengths in seconds; read on every tick, so edits apply live. */
  durations: () => readonly number[];
  loop: () => boolean;
  /** Schedules step `index` to strum at audio time `time`. */
  play: (index: number, time: number) => void;
  /** How far ahead of the clock steps are handed to Web Audio. */
  lookahead?: number;
}

/**
 * A lookahead scheduler: a coarse timer calls `tick()`, and every step whose
 * start falls inside the lookahead window is scheduled on the audio clock, so
 * timing never depends on timer precision.
 */
export function createSequencer(options: SequencerOptions) {
  const lookahead = options.lookahead ?? 0.15;
  let running = false;
  let nextIndex = 0;
  let nextTime = 0;
  let endTime = Number.POSITIVE_INFINITY;
  const cues: Cue[] = [];

  const tick = () => {
    if (!running) return false;
    const now = options.now();
    let guard = 0;
    while (endTime === Number.POSITIVE_INFINITY && nextTime < now + lookahead && guard < 512) {
      guard += 1;
      const durations = options.durations();
      if (nextIndex >= durations.length) {
        if (options.loop() && durations.length) nextIndex = 0;
        else {
          endTime = nextTime;
          break;
        }
      }
      const seconds = Math.max(0.05, durations[nextIndex]);
      options.play(nextIndex, nextTime);
      cues.push({ index: nextIndex, time: nextTime, seconds });
      nextTime += seconds;
      nextIndex += 1;
    }
    while (cues.length > 1 && cues[1].time <= now) cues.shift();
    if (now >= endTime) {
      running = false;
      cues.length = 0;
    }
    return running;
  };

  return {
    start(at: number, from = 0) {
      running = true;
      nextIndex = Math.max(0, from);
      nextTime = at;
      endTime = Number.POSITIVE_INFINITY;
      cues.length = 0;
      tick();
    },
    stop() {
      running = false;
      cues.length = 0;
    },
    tick,
    get running() {
      return running;
    },
    /** The step sounding at audio time `time`, if any. */
    cueAt(time: number): Cue | null {
      let found: Cue | null = null;
      for (const cue of cues) if (cue.time <= time) found = cue;
      return found;
    },
  };
}
