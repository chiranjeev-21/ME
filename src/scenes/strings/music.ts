import { TUNING } from './physics.ts';

/** MIDI note numbers of the open strings in standard tuning, low E to high E. */
export const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const;
export const STRING_NAMES = ['Low E', 'A', 'D', 'G', 'B', 'High E'] as const;
export const STRINGS = OPEN_MIDI.length;
export const MAX_FRET = 12;

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;

/** One fret per string, low E first; `null` is a muted (unplayed) string. */
export type Frets = readonly (number | null)[];
export type StrumDirection = 'down' | 'up';

export function isFret(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_FRET;
}

/** Equal temperament from the open-string pitch: every fret is a semitone. */
export function fretHz(string: number, fret: number) {
  return TUNING[string].hz * 2 ** (fret / 12);
}

export function fretMidi(string: number, fret: number) {
  return OPEN_MIDI[string] + fret;
}

export function pitchName(midi: number) {
  return NAMES[((midi % 12) + 12) % 12];
}

/** Scientific pitch notation, e.g. 48 → "C3". */
export function noteName(midi: number) {
  return `${pitchName(midi)}${Math.floor(midi / 12) - 1}`;
}

/** Accessible name of a fretboard position, e.g. "A string, fret 3, C3". */
export function positionLabel(string: number, fret: number) {
  const where = fret === 0 ? 'open' : `fret ${fret}`;
  return `${STRING_NAMES[string]} string, ${where}, ${noteName(fretMidi(string, fret))}`;
}

export function chordNotes(frets: Frets) {
  const notes: { string: number; fret: number; midi: number; name: string }[] = [];
  frets.forEach((fret, string) => {
    if (fret === null || !isFret(fret) || string >= STRINGS) return;
    const midi = fretMidi(string, fret);
    notes.push({ string, fret, midi, name: noteName(midi) });
  });
  return notes;
}

/** Compact chord code, e.g. C major → "x32010"; frets above 9 are bracketed. */
export function fretCode(frets: Frets) {
  return frets.map(fret => (fret === null ? 'x' : fret > 9 ? `(${fret})` : String(fret))).join('');
}

const QUALITIES: { suffix: string; intervals: number[] }[] = [
  { suffix: '', intervals: [0, 4, 7] },
  { suffix: 'm', intervals: [0, 3, 7] },
  { suffix: '7', intervals: [0, 4, 7, 10] },
  { suffix: 'maj7', intervals: [0, 4, 7, 11] },
  { suffix: 'm7', intervals: [0, 3, 7, 10] },
  { suffix: 'sus2', intervals: [0, 2, 7] },
  { suffix: 'sus4', intervals: [0, 5, 7] },
  { suffix: 'dim', intervals: [0, 3, 6] },
  { suffix: 'aug', intervals: [0, 4, 8] },
  { suffix: '5', intervals: [0, 7] },
  // Guitar sevenths often drop the fifth (open C7 is x32310).
  { suffix: '7', intervals: [0, 4, 10] },
  { suffix: 'maj7', intervals: [0, 4, 11] },
  { suffix: 'm7', intervals: [0, 3, 10] },
];

/**
 * Names a set of sounding notes when it is unambiguously one of the common
 * triads or sevenths. Inversions get a slash bass ("G/B"). Anything else —
 * clusters, extensions, symmetric shapes without a deciding bass — returns
 * undefined rather than a guess.
 */
export function recogniseChord(midis: readonly number[]): string | undefined {
  if (!midis.length) return undefined;
  const bass = Math.min(...midis);
  const classes = [...new Set(midis.map(midi => ((midi % 12) + 12) % 12))];
  if (classes.length < 2) return undefined;
  const bassClass = ((bass % 12) + 12) % 12;
  const matches: { root: number; suffix: string }[] = [];
  for (const root of classes) {
    const intervals = classes.map(pc => (pc - root + 12) % 12).sort((a, b) => a - b);
    const quality = QUALITIES.find(
      candidate =>
        candidate.intervals.length === intervals.length &&
        candidate.intervals.every((interval, index) => interval === intervals[index])
    );
    if (quality) matches.push({ root, suffix: quality.suffix });
  }
  let match = matches.length === 1 ? matches[0] : undefined;
  if (matches.length > 1) {
    const onBass = matches.filter(candidate => candidate.root === bassClass);
    match = onBass.length === 1 ? onBass[0] : undefined;
  }
  if (!match) return undefined;
  const name = `${NAMES[match.root]}${match.suffix}`;
  return match.root === bassClass ? name : `${name}/${NAMES[bassClass]}`;
}

export function chordName(frets: Frets) {
  return recogniseChord(chordNotes(frets).map(note => note.midi));
}

export const PRESETS: { name: string; label: string; frets: Frets }[] = [
  { name: 'Em', label: 'E minor', frets: [0, 2, 2, 0, 0, 0] },
  { name: 'G', label: 'G major', frets: [3, 2, 0, 0, 0, 3] },
  { name: 'C', label: 'C major', frets: [null, 3, 2, 0, 1, 0] },
  { name: 'D', label: 'D major', frets: [null, null, 0, 2, 3, 2] },
  { name: 'Am', label: 'A minor', frets: [null, 0, 2, 2, 1, 0] },
  { name: 'E', label: 'E major', frets: [0, 2, 2, 1, 0, 0] },
  { name: 'A', label: 'A major', frets: [null, 0, 2, 2, 2, 0] },
  { name: 'Dm', label: 'D minor', frets: [null, null, 0, 2, 3, 1] },
  { name: 'F', label: 'F major, barre at the first fret', frets: [1, 3, 3, 2, 1, 1] },
  { name: 'Open', label: 'Open strings', frets: [0, 0, 0, 0, 0, 0] },
];

export const STRUM_SPREAD = { down: 24, up: 18 } as const;

export interface StrumNote {
  string: number;
  fret: number;
  hz: number;
  /** Seconds, on the clock passed in as `when`. */
  time: number;
  velocity: number;
}

/**
 * Orders a strum as a pick crosses the strings: down strokes travel from the
 * low E to the high E, up strokes the other way. Successive strings are
 * `spread` ms apart (clamped to 8–60 ms); later strings and up strokes are a
 * little softer, as they are under a real pick.
 */
export function planStrum(
  frets: Frets,
  options: { direction?: StrumDirection; spread?: number; velocity?: number; when?: number } = {}
): StrumNote[] {
  const direction = options.direction ?? 'down';
  const spread = Math.min(60, Math.max(8, options.spread ?? STRUM_SPREAD[direction])) / 1000;
  const velocity = Math.min(1, Math.max(0, options.velocity ?? 0.8));
  const when = options.when ?? 0;
  const notes = chordNotes(frets);
  if (direction === 'up') notes.reverse();
  return notes.map((note, order) => ({
    string: note.string,
    fret: note.fret,
    hz: fretHz(note.string, note.fret),
    time: when + order * spread,
    velocity: velocity * (direction === 'up' ? 0.86 : 1) * (1 - order * 0.035),
  }));
}
