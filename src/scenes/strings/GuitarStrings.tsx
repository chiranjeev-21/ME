import { useEffect, useRef } from 'react';
import {
  TUNING,
  createString,
  displacement,
  energy,
  envelopeAt,
  karplusStrong,
  pluck,
} from './physics.ts';
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
    let audio: AudioContext | null = null;
    const buffers = new Map<number, AudioBuffer>();
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
      // Rosewood: dark warm base, long grain streaks, light falling off toward the edges.
      const wood = b.createLinearGradient(0, boardTop, 0, boardBottom);
      wood.addColorStop(0, '#1a110b');
      wood.addColorStop(0.5, '#24170e');
      wood.addColorStop(1, '#140d08');
      b.fillStyle = wood;
      b.fillRect(x0, boardTop, width - x0, boardHeight);
      let seed = 7;
      const rand = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 140; i++) {
        const y = boardTop + rand() * boardHeight;
        const length = width * (0.15 + rand() * 0.6);
        const start = x0 + rand() * (width - x0);
        b.strokeStyle = rand() > 0.5 ? 'rgba(60, 38, 22, 0.35)' : 'rgba(8, 5, 3, 0.45)';
        b.lineWidth = 0.5 + rand() * 1.4;
        b.beginPath();
        b.moveTo(start, y);
        b.bezierCurveTo(
          start + length * 0.33,
          y + (rand() - 0.5) * 3,
          start + length * 0.66,
          y + (rand() - 0.5) * 3,
          start + length,
          y + (rand() - 0.5) * 2
        );
        b.stroke();
      }
      const pool = b.createRadialGradient(
        width * 0.42,
        boardTop + boardHeight * 0.3,
        10,
        width * 0.42,
        boardTop + boardHeight * 0.3,
        width * 0.6
      );
      pool.addColorStop(0, 'rgba(255, 196, 128, 0.10)');
      pool.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      b.fillStyle = pool;
      b.fillRect(x0, boardTop, width - x0, boardHeight);
      // Nut: bone.
      b.fillStyle = '#d8cfbf';
      b.fillRect(x0 - 7, boardTop - 2, 7, boardHeight + 4);
      b.fillStyle = 'rgba(0,0,0,0.35)';
      b.fillRect(x0, boardTop, 3, boardHeight);
      // Frets at equal-tempered positions; narrow screens show the first five.
      const frets = width < 640 ? 5 : 12;
      const scale = (x1 - x0) / (1 - Math.pow(2, -(frets + 0.6) / 12));
      const fretX = (n: number) => x0 + scale * (1 - Math.pow(2, -n / 12));
      for (let n = 1; n <= frets; n++) {
        const x = fretX(n);
        const fret = b.createLinearGradient(x - 2, 0, x + 2, 0);
        fret.addColorStop(0, '#5a564f');
        fret.addColorStop(0.45, '#d9d4c9');
        fret.addColorStop(1, '#3d3a35');
        b.fillStyle = 'rgba(0,0,0,0.45)';
        b.fillRect(x + 1.5, boardTop, 3, boardHeight);
        b.fillStyle = fret;
        b.fillRect(x - 1.5, boardTop - 1, 3, boardHeight + 2);
      }
      // Pearl inlays at 3, 5, 7, 9 and a pair at 12.
      const inlay = (x: number, y: number) => {
        const r = Math.min(spacing * 0.22, 9);
        const pearl = b.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
        pearl.addColorStop(0, '#f1ece2');
        pearl.addColorStop(1, '#a9a196');
        b.fillStyle = pearl;
        b.beginPath();
        b.arc(x, y, r, 0, Math.PI * 2);
        b.fill();
      };
      const middle = boardTop + boardHeight / 2;
      [3, 5, 7, 9]
        .filter(n => n <= frets)
        .forEach(n => inlay((fretX(n - 1) + fretX(n)) / 2, middle));
      if (frets >= 12) {
        const twelve = (fretX(11) + fretX(12)) / 2;
        inlay(twelve, middle - spacing * 1.05);
        inlay(twelve, middle + spacing * 1.05);
      }
      // Fade the far end into darkness so the neck feels lit, not boxed.
      const fade = b.createLinearGradient(width * 0.82, 0, width, 0);
      fade.addColorStop(0, 'rgba(15, 11, 8, 0)');
      fade.addColorStop(1, 'rgba(15, 11, 8, 0.85)');
      b.fillStyle = fade;
      b.fillRect(width * 0.82, boardTop - 2, width * 0.18, boardHeight + 4);
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

        if (live) {
          // Long-exposure band: the blur a camera sees on a fast-moving string.
          ctx.beginPath();
          points.forEach(([x], i) =>
            i ? ctx.lineTo(x, y0 - envelope[i]) : ctx.moveTo(x, y0 - envelope[i])
          );
          for (let i = SAMPLES; i >= 0; i--) ctx.lineTo(points[i][0], y0 + envelope[i]);
          ctx.closePath();
          ctx.fillStyle = `rgba(220, 157, 87, ${Math.min(0.13, energy(state) * 0.006)})`;
          ctx.fill();
        }

        const path = new Path2D();
        points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 6;
        ctx.lineWidth = tuning.gauge;
        ctx.strokeStyle = tuning.wound ? '#9a7e5c' : '#b9b4aa';
        ctx.stroke(path);
        ctx.restore();

        if (tuning.wound) {
          ctx.save();
          ctx.setLineDash([0.9, 1.5]);
          ctx.lineWidth = tuning.gauge;
          ctx.strokeStyle = 'rgba(20, 12, 6, 0.45)';
          ctx.stroke(path);
          ctx.restore();
        }

        // Specular line: tungsten light catching the top of the string.
        ctx.save();
        ctx.translate(0, -tuning.gauge * 0.32);
        ctx.lineWidth = Math.max(0.5, tuning.gauge * 0.32);
        ctx.strokeStyle = live ? 'rgba(255, 228, 190, 0.85)' : 'rgba(255, 236, 210, 0.5)';
        ctx.stroke(path);
        ctx.restore();
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
      if (!soundRef.current) return;
      try {
        audio ??= new AudioContext();
        if (audio.state === 'suspended') void audio.resume();
        let buffer = buffers.get(index);
        if (!buffer) {
          const data = karplusStrong(TUNING[index].hz, audio.sampleRate);
          buffer = audio.createBuffer(1, data.length, audio.sampleRate);
          buffer.copyToChannel(data, 0);
          buffers.set(index, buffer);
        }
        const source = audio.createBufferSource();
        source.buffer = buffer;
        const filter = audio.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800 + amplitude * 110;
        const gain = audio.createGain();
        gain.gain.value = Math.min(0.55, 0.12 + amplitude / 60);
        source.connect(filter).connect(gain).connect(audio.destination);
        source.start();
      } catch {
        // Audio is an enhancement; the visual instrument keeps working without it.
      }
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
      void audio?.close();
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
