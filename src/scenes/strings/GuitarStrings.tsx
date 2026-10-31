import { useEffect, useRef } from 'react';
import { createAudioEngine } from './audio.ts';
import {
  fretPositions,
  paintBlurBand,
  paintFade,
  paintFret,
  paintInlays,
  paintNut,
  paintRosewood,
  strokeString,
} from './neck.ts';
import { TUNING, createString, displacement, energy, envelopeAt, pluck } from './physics.ts';
import type { StringState } from './physics.ts';
import styles from './GuitarStrings.module.css';

interface GuitarStringsProps {
  sound: boolean;
  onFirstPluck?: () => void;
}

const SAMPLES = 96;

export function GuitarStrings({ sound, onFirstPluck }: GuitarStringsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const api = useRef<{ pluck: (index: number, p: number, amplitude: number) => void } | null>(null);
  const firstPluck = useRef(onFirstPluck);
  firstPluck.current = onFirstPluck;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const strings: StringState[] = TUNING.map((_, index) => createString(index));
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let last = 0;
    const engine = createAudioEngine();
    let plucked = false;

    const geometry = () => {
      const top = height * 0.2;
      const spacing = (height * 0.6) / (TUNING.length - 1);
      const x0 = width * 0.07;
      const x1 = width * 0.995;
      return { top, spacing, x0, x1 };
    };

    // The neck is static, so it is painted once per size into an offscreen canvas.
    const board = document.createElement('canvas');
    const paintBoard = () => {
      const { top, spacing, x0, x1 } = geometry();
      board.width = canvas.width;
      board.height = canvas.height;
      const b = board.getContext('2d');
      if (!b) return;
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const boardTop = top - spacing * 0.62;
      const boardBottom = top + spacing * (TUNING.length - 1) + spacing * 0.62;
      const boardHeight = boardBottom - boardTop;
      paintRosewood(b, x0, boardTop, width, boardHeight);
      paintNut(b, x0, boardTop, boardHeight);
      // Frets at equal-tempered positions; narrow screens show the first five.
      const frets = width < 640 ? 5 : 12;
      const fretX = fretPositions(x0, x1, frets);
      for (let n = 1; n <= frets; n++) paintFret(b, fretX(n), boardTop, boardHeight);
      paintInlays(b, fretX, frets, boardTop + boardHeight / 2, spacing);
      paintFade(b, width * 0.82, width, boardTop, boardHeight);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      paintBoard();
      draw();
    };

    const draw = () => {
      const { top, spacing, x0, x1 } = geometry();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (board.width) ctx.drawImage(board, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      TUNING.forEach((tuning, index) => {
        const state = strings[index];
        const y0 = top + index * spacing;
        const live = energy(state) > 0.05;
        const points: [number, number][] = [];
        const envelope: number[] = [];
        for (let i = 0; i <= SAMPLES; i++) {
          const t = i / SAMPLES;
          const x = x0 + (x1 - x0) * t;
          points.push([x, y0 + (live ? displacement(state, t) : 0)]);
          envelope.push(live ? envelopeAt(state, t) : 0);
        }

        if (live) paintBlurBand(ctx, points, envelope, y0, energy(state));

        const path = new Path2D();
        points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
        strokeString(ctx, path, tuning, live);
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      strings.forEach(state => (state.age += dt));
      draw();
      frame = strings.some(state => energy(state) > 0.05) ? requestAnimationFrame(tick) : 0;
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const play = (index: number, amplitude: number) => {
      if (soundRef.current) engine.pluckNote(TUNING[index].hz, { velocity: amplitude / 26 });
    };

    const pluckString = (index: number, p: number, amplitude: number) => {
      pluck(strings[index], p, reduced ? amplitude * 0.45 : amplitude);
      play(index, amplitude);
      if (!plucked) {
        plucked = true;
        firstPluck.current?.();
      }
      wake();
    };
    api.current = { pluck: pluckString };

    let previous: { x: number; y: number; t: number } | null = null;
    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, t: event.timeStamp };
    };
    const onMove = (event: PointerEvent) => {
      const point = local(event);
      if (previous) {
        const { top, spacing, x0, x1 } = geometry();
        const dy = point.y - previous.y;
        const velocity = Math.abs(dy) / Math.max(8, point.t - previous.t);
        TUNING.forEach((_, index) => {
          const y0 = top + index * spacing;
          if ((previous!.y - y0) * (point.y - y0) <= 0 && dy !== 0 && point.x > x0 && point.x < x1)
            pluckString(index, (point.x - x0) / (x1 - x0), Math.min(26, 6 + velocity * 14));
        });
      }
      previous = point;
    };
    const onLeave = () => (previous = null);
    const onDown = (event: PointerEvent) => {
      const point = local(event);
      previous = point;
      const { top, spacing, x0, x1 } = geometry();
      const index = Math.round((point.y - top) / spacing);
      if (
        index < 0 ||
        index >= TUNING.length ||
        Math.abs(point.y - (top + index * spacing)) > spacing * 0.5
      )
        return;
      pluckString(index, Math.min(1, Math.max(0, (point.x - x0) / (x1 - x0))), 18);
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);

    // A quiet strum the first time the instrument comes into view — visual only.
    let strummed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || strummed || reduced) return;
        strummed = true;
        TUNING.forEach((_, index) =>
          window.setTimeout(
            () => {
              pluck(strings[index], 0.3, 9 - index * 0.6);
              wake();
            },
            380 + index * 85
          )
        );
      },
      { threshold: 0.6 }
    );
    observer.observe(root);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      engine.dispose();
      api.current = null;
    };
  }, []);

  return (
    <div className={styles.instrument}>
      <div ref={rootRef} className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
        <div className={styles.keys} role="group" aria-label="Pluck a string">
          {TUNING.map((tuning, index) => (
            <button
              key={index}
              type="button"
              className={styles.key}
              style={{ top: `calc(20% + ${index} * (60% / 5))` }}
              onClick={() => api.current?.pluck(index, 0.32, 20)}
              aria-label={`Pluck the ${tuning.name}${tuning.octave} string`}
            >
              {tuning.name}
              <sub>{tuning.octave}</sub>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
