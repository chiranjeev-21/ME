import { useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { PRESETS, buildFrame, easeInOut, mixPose } from './camera.ts';
import type { OrbitalPose, OrbitalPresetName } from './camera.ts';
import type { OrbitalRenderer } from './renderer.ts';
import styles from './OrbitalScene.module.css';

export interface OrbitalPoster {
  wide: string;
  tall: string;
}

interface OrbitalSceneProps {
  preset: OrbitalPresetName;
  /** Scroll-driven progress, 0–1, read every frame without React renders. */
  progress: MutableRefObject<number>;
  poster: OrbitalPoster;
  /** Called once the live scene has replaced the poster. */
  onLive?: () => void;
  className?: string;
  /** Load the poster eagerly (above the fold). */
  priority?: boolean;
  /** Minimum delay before the live renderer initialises, ms (lets an entrance play first). */
  startDelay?: number;
}

const POSES: Record<OrbitalPresetName, [OrbitalPose, OrbitalPose]> = {
  dawn: [PRESETS.dawnStart, PRESETS.dawnEnd],
  eclipse: [PRESETS.eclipseStart, PRESETS.eclipseEnd],
};

function chooseQuality(): 'high' | 'low' {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (nav.connection?.saveData) return 'low';
  if (narrow || coarse) return 'low';
  if ((nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4) return 'low';
  return 'high';
}

export function OrbitalScene({
  preset,
  progress,
  poster,
  onLive,
  className,
  priority = false,
  startDelay = 0,
}: OrbitalSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const onLiveRef = useRef(onLive);
  onLiveRef.current = onLive;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let disposed = false;
    let frameId = 0;
    let visible = false;
    let renderer: OrbitalRenderer | null = null;
    let announced = false;
    const quality = chooseQuality();
    let scale = quality === 'high' ? 1 : 0.85;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const frameTimes: number[] = [];
    let last = performance.now();
    const start = last;
    let textureMix = 0;

    const sizeCanvas = () => {
      const rect = root.getBoundingClientRect();
      renderer?.resize(rect.width, rect.height, scale);
    };

    const loop = (now: number) => {
      frameId = 0;
      if (disposed || !renderer || !visible || document.hidden) return;
      if (document.documentElement.dataset.overlay === 'open') return;
      if (renderer.isContextLost()) return;
      const delta = now - last;
      last = now;
      if (delta < 200) {
        frameTimes.push(delta);
        if (frameTimes.length >= 45) {
          const average = frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length;
          frameTimes.length = 0;
          if (average > 26 && scale > 0.55) {
            scale = Math.max(0.55, scale * 0.82);
            sizeCanvas();
          }
        }
      }
      const elapsed = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.035;
      pointer.y += (pointer.ty - pointer.y) * 0.035;
      const [from, to] = POSES[preset];
      const pose = mixPose(from, to, easeInOut(progress.current));
      pose.lon += elapsed * 0.012;
      pose.heading += pointer.x * 1.4;
      pose.pitch += pointer.y * -0.9;
      const rect = canvas.getBoundingClientRect();
      const aspect = rect.width / Math.max(1, rect.height);
      // Off-centre framing is authored for landscape; portrait screens re-centre the subject.
      const framing = Math.min(1, aspect / 1.6);
      pose.shiftX = (pose.shiftX ?? 0) * framing;
      const frame = buildFrame(pose, aspect);
      if (renderer.hasTextures) textureMix = Math.min(1, textureMix + delta / 900);
      renderer.render(frame, elapsed, textureMix, elapsed * 0.00045);
      if (!announced && renderer.hasTextures) {
        announced = true;
        setLive(true);
        onLiveRef.current?.();
      }
      frameId = requestAnimationFrame(loop);
    };

    const schedule = () => {
      const covered = document.documentElement.dataset.overlay === 'open';
      if (!frameId && visible && !document.hidden && !covered && renderer) {
        last = performance.now();
        frameId = requestAnimationFrame(loop);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { rootMargin: '15% 0px' }
    );
    observer.observe(root);
    // The renderer is only created once its scene approaches the viewport.
    let started = false;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        nearObserver.disconnect();
        window.setTimeout(() => idle(init), startDelay);
      },
      { rootMargin: '120% 0px' }
    );
    const resizeObserver = new ResizeObserver(sizeCanvas);
    resizeObserver.observe(root);
    const onVisibility = () => schedule();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('portfolio:overlay', onVisibility);
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });
    const onLost = (event: Event) => {
      event.preventDefault();
      setLive(false);
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) => window.requestIdleCallback(cb, { timeout: 900 })
        : (cb: () => void) => window.setTimeout(cb, 120);

    const init = () => {
      import('./renderer.ts')
        .then(async ({ OrbitalRenderer, QUALITY }) => {
          if (disposed) return;
          let created: OrbitalRenderer;
          try {
            created = new OrbitalRenderer(canvas, QUALITY[quality]);
            await created.ready();
          } catch {
            return; // No WebGL2 or a failed compile: the poster remains the scene.
          }
          if (disposed) {
            created.dispose();
            return;
          }
          renderer = created;
          sizeCanvas();
          const set =
            quality === 'high'
              ? ['/assets/orbit/earth-day-3k.webp', '/assets/orbit/earth-data-2k.webp']
              : ['/assets/orbit/earth-day-1k5.webp', '/assets/orbit/earth-data-1k5.webp'];
          renderer
            .loadTextures(set[0], set[1], '/assets/orbit/lights-southasia-2k.webp')
            .catch(() => undefined);
          schedule();
        })
        .catch(() => undefined);
    };
    nearObserver.observe(root);

    return () => {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      observer.disconnect();
      nearObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('portfolio:overlay', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer?.dispose();
    };
  }, [preset, progress, startDelay]);

  return (
    <div ref={rootRef} className={`${styles.scene} ${className ?? ''}`} data-live={live}>
      <picture className={styles.poster}>
        <source media="(max-aspect-ratio: 4/5)" srcSet={poster.tall} />
        <img
          src={poster.wide}
          alt=""
          aria-hidden="true"
          decoding="async"
          {...{ fetchpriority: priority ? 'high' : 'auto' }}
          loading={priority ? 'eager' : 'lazy'}
        />
      </picture>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
