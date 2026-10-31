import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import {
  MAX_FRET,
  STRINGS,
  STRING_NAMES,
  fretMidi,
  noteName,
  positionLabel,
} from '../../scenes/strings/music.ts';
import type { Frets } from '../../scenes/strings/music.ts';
import {
  fretPositions,
  paintBlurBand,
  paintFade,
  paintFret,
  paintInlays,
  paintNut,
  paintRosewood,
  strokeString,
} from '../../scenes/strings/neck.ts';
import {
  TUNING,
  createString,
  displacement,
  energy,
  envelopeAt,
  pluck,
} from '../../scenes/strings/physics.ts';
import styles from './Fretboard.module.css';

/** Share of the board left of the nut, where open strings are chosen. */
const NUT = 0.085;
const TAIL = 0.45;
const fretX = fretPositions(NUT, 1, MAX_FRET, TAIL);
const FRETS = Array.from({ length: MAX_FRET + 1 }, (_, fret) => fret);
const INLAYS = new Set([3, 5, 7, 9, 12]);
const SAMPLES = 72;

/** Horizontal extent of each position, as fractions of the board width. */
const CELLS = FRETS.map(fret =>
  fret === 0
    ? { left: 0, width: NUT - 0.012, centre: 0.5 }
    : { left: fretX(fret - 1), width: fretX(fret) - fretX(fret - 1), centre: 0.56 }
);
const centreOf = (fret: number) => CELLS[fret].left + CELLS[fret].width * CELLS[fret].centre;

export interface RingNote {
  string?: number;
  fret?: number;
  time: number;
  velocity: number;
}

export interface FretboardHandle {
  /** Sets a string ringing at audio time `time`, from the fret it was played at. */
  ring(note: RingNote): void;
}

interface FretboardProps {
  frets: Frets;
  onToggle: (string: number, fret: number) => void;
  onMute: (string: number) => void;
  onHover: (string: number, fret: number) => void;
  /** The audio clock that `ring` times refer to. */
  clock: () => number;
}

export const Fretboard = forwardRef<FretboardHandle, FretboardProps>(function Fretboard(
  { frets, onToggle, onMute, onHover, clock },
  ref
) {
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<(note: RingNote) => void>(() => undefined);
  const clockRef = useRef(clock);
  clockRef.current = clock;
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const [cursor, setCursor] = useState({ string: 0, fret: 0 });

  useImperativeHandle(ref, () => ({ ring: note => ringRef.current(note) }), []);

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!board || !canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const strings = TUNING.map((_, index) => createString(index));
    const sounding: number[] = TUNING.map(() => 0);
    const pending: RingNote[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = 0;

    const neck = document.createElement('canvas');
    const paintNeck = () => {
      neck.width = canvas.width;
      neck.height = canvas.height;
      const b = neck.getContext('2d');
      if (!b) return;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const x0 = NUT * width;
      const spacing = height / STRINGS;
      const at = (n: number) => fretX(n) * width;
      paintRosewood(b, x0, 0, width, height);
      paintNut(b, x0, 0, height);
      for (let n = 1; n <= MAX_FRET; n++) paintFret(b, at(n), 0, height);
      paintInlays(b, at, MAX_FRET, height / 2, spacing);
      paintFade(b, at(MAX_FRET) + 4, width, 0, height);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (neck.width) ctx.drawImage(neck, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const spacing = height / STRINGS;
      TUNING.forEach((tuning, index) => {
        const state = strings[index];
        const y0 = spacing * (index + 0.5);
        const live = energy(state) > 0.05;
        const fret = sounding[index];
        const from = fret === 0 ? NUT * width : fretX(fret) * width;
        const points: [number, number][] = [[0, y0]];
        const envelope: number[] = [0];
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          points.push([from + (width - from) * t, y0 + (live ? displacement(state, t) : 0)]);
          envelope.push(live ? envelopeAt(state, t) : 0);
        }
        if (live) paintBlurBand(ctx, points, envelope, y0, energy(state));
        const path = new Path2D();
        points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
        strokeString(ctx, path, tuning, live);
        if (live) {
          // Where the note is being stopped: a small tungsten ring that fades with the string.
          ctx.beginPath();
          ctx.arc(centreOf(fret) * width, y0, Math.min(9, spacing * 0.2), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(220, 157, 87, ${Math.min(0.9, energy(state) * 0.08)})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const audioNow = clockRef.current();
      for (let i = pending.length - 1; i >= 0; i--) {
        const note = pending[i];
        if (note.time > audioNow + 0.005) continue;
        pending.splice(i, 1);
        const index = note.string ?? 0;
        sounding[index] = note.fret ?? 0;
        const amplitude = 3 + note.velocity * 7;
        pluck(strings[index], 0.62, reduced ? amplitude * 0.45 : amplitude);
      }
      strings.forEach(state => (state.age += dt));
      draw();
      frame =
        pending.length || strings.some(state => energy(state) > 0.05)
          ? requestAnimationFrame(tick)
          : 0;
    };

    ringRef.current = note => {
      if (note.string === undefined || note.string < 0 || note.string >= STRINGS) return;
      pending.push(note);
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      const rect = board.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      paintNeck();
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(board);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      ringRef.current = () => undefined;
    };
  }, []);

  const key = (string: number, fret: number) => `${string}:${fret}`;
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.dataset.string === undefined) return;
    let string = Number(target.dataset.string);
    let fret = Number(target.dataset.fret);
    if (event.key === 'ArrowRight') fret = Math.min(MAX_FRET, fret + 1);
    else if (event.key === 'ArrowLeft') fret = Math.max(-1, fret - 1);
    else if (event.key === 'ArrowUp') string = Math.max(0, string - 1);
    else if (event.key === 'ArrowDown') string = Math.min(STRINGS - 1, string + 1);
    else if (event.key === 'Home') fret = -1;
    else if (event.key === 'End') fret = MAX_FRET;
    else return;
    event.preventDefault();
    setCursor({ string, fret });
    buttons.current.get(key(string, fret))?.focus();
  };
  const register = (string: number, fret: number) => (element: HTMLButtonElement | null) => {
    if (element) buttons.current.set(key(string, fret), element);
    else buttons.current.delete(key(string, fret));
  };
  const tabIndex = (string: number, fret: number) =>
    cursor.string === string && cursor.fret === fret ? 0 : -1;
  const hover = (string: number, fret: number) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse') onHover(string, fret);
  };

  return (
    <div className={styles.scroller}>
      <div
        className={styles.instrument}
        role="group"
        aria-label="Fretboard"
        aria-describedby="fretboard-help"
        onKeyDown={move}
      >
        <p id="fretboard-help" className="u-sr">
          One position per string. Arrow keys move between strings and frets; press a selected
          position again to mute its string.
        </p>
        <div className={styles.ruler} aria-hidden="true">
          {FRETS.map(fret => (
            <span
              key={fret}
              data-inlay={INLAYS.has(fret) || undefined}
              style={{ left: `${centreOf(fret) * 100}%` }}
            >
              {fret}
            </span>
          ))}
        </div>
        <div className={styles.rail}>
          {TUNING.map((tuning, string) => (
            <div key={string} className={styles.railRow}>
              <button
                ref={register(string, -1)}
                type="button"
                className={styles.mute}
                aria-pressed={frets[string] === null}
                aria-label={`Mute the ${STRING_NAMES[string]} string`}
                tabIndex={tabIndex(string, -1)}
                data-string={string}
                data-fret={-1}
                onFocus={() => setCursor({ string, fret: -1 })}
                onClick={() => onMute(string)}
              >
                ×
              </button>
              <span className={styles.stringName} aria-hidden="true">
                {tuning.name}
                <sub>{tuning.octave}</sub>
              </span>
            </div>
          ))}
        </div>
        <div ref={boardRef} className={styles.board}>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
          {TUNING.map((_, string) =>
            FRETS.map(fret => {
              const selected = frets[string] === fret;
              const cell = CELLS[fret];
              return (
                <button
                  key={key(string, fret)}
                  ref={register(string, fret)}
                  type="button"
                  className={styles.cell}
                  data-open={fret === 0 || undefined}
                  data-string={string}
                  data-fret={fret}
                  aria-pressed={selected}
                  aria-label={positionLabel(string, fret)}
                  tabIndex={tabIndex(string, fret)}
                  style={
                    {
                      '--s': string,
                      left: `${cell.left * 100}%`,
                      width: `${cell.width * 100}%`,
                      '--c': `${cell.centre * 100}%`,
                    } as CSSProperties
                  }
                  onFocus={() => setCursor({ string, fret })}
                  onPointerEnter={hover(string, fret)}
                  onClick={() => onToggle(string, fret)}
                >
                  <span className={styles.dot} aria-hidden="true">
                    {noteName(fretMidi(string, fret))}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
      <p className={styles.swipe} aria-hidden="true">
        Swipe along the neck for frets 6–12 →
      </p>
    </div>
  );
});
