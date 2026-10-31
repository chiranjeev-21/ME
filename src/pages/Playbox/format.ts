import { chordName, fretCode } from '../../scenes/strings/music.ts';
import type { Frets } from '../../scenes/strings/music.ts';
import { stepSeconds } from './song.ts';
import type { Step } from './song.ts';

const HALF = '½';

/** 0.5 → "½ beat", 1 → "1 beat", 2.5 → "2½ beats". */
export function formatBeats(beats: number) {
  const whole = Math.floor(beats);
  const half = beats - whole >= 0.5;
  const figure = whole ? `${whole}${half ? HALF : ''}` : HALF;
  return `${figure} ${beats <= 1 ? 'beat' : 'beats'}`;
}

/** Seconds as m:ss. */
export function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Short lengths to the hundredth ("8.25 s"); longer ones as m:ss. */
export function formatSeconds(seconds: number) {
  return seconds < 60 ? `${seconds.toFixed(2)} s` : formatClock(seconds);
}

export function formatBytes(bytes: number) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** cj-playbox-YYYYMMDD-HHMM.<extension>, in local time. */
export function takeFilename(date: Date, extension = 'wav') {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `cj-playbox-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}.${extension}`;
}

export function stepTitle(frets: Frets) {
  if (frets.every(fret => fret === null)) return 'Rest';
  return chordName(frets) ?? fretCode(frets);
}

export interface TimelineGeometry {
  pxPerSecond: number;
  lefts: number[];
  widths: number[];
  width: number;
  beat: number;
}

/**
 * Step widths are proportional to their length. The scale shows about nine
 * seconds across the available width and keeps the shortest step legible.
 */
export function timelineGeometry(
  steps: readonly Step[],
  bpm: number,
  available = 0
): TimelineGeometry {
  const seconds = steps.map(step => stepSeconds(step.beats, bpm));
  const shortest = seconds.length ? Math.min(...seconds) : 1;
  const pxPerSecond = Math.min(280, Math.max(128, 64 / shortest, available / 9));
  const lefts: number[] = [];
  const widths: number[] = [];
  let x = 0;
  for (const value of seconds) {
    lefts.push(x);
    widths.push(value * pxPerSecond);
    x += value * pxPerSecond;
  }
  return { pxPerSecond, lefts, widths, width: x, beat: (60 / bpm) * pxPerSecond };
}
